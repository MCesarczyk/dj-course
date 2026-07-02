"""Warehouse (Magazyn) CRUD + nested zone create/list.

Hybrid REST nesting: collections that only make sense under a parent are nested
one level (``/warehouses/{id}/zones``); single-item operations are flat
(``/zones/{id}``, handled by the zones blueprint).
"""

from typing import List

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.warehouse import Warehouse, WarehouseCreate, WarehouseUpdate, LocationInfo
from contract.zone import Zone, ZoneCreate
from contract.inventory import WarehouseInventory, ZoneInventory
from contract.errors import ErrorResponse
from routes.structure_util import update_fields, soft_delete
from routes.employees import EmployeeList

structure_tag = Tag(name='WarehouseStructure', description='Warehouse / zone / aisle / rack / shelf CRUD')
inventory_tag = Tag(name='Inventory', description='Current stored-goods state')

warehouses_bp = APIBlueprint('warehouses_bp', __name__, url_prefix='/warehouses')


class WarehousePath(BaseModel):
    warehouse_id: int


class IncludeInactiveQuery(BaseModel):
    includeInactive: bool = Field(default=False, description='Include soft-deleted (INACTIVE) rows')


class WarehouseList(RootModel[List[Warehouse]]):
    """List of warehouses."""


class ZoneList(RootModel[List[Zone]]):
    """List of zones."""


def _warehouse_dict(row):
    return Warehouse(
        id=str(row['id']),
        name=row['name'],
        description=row['description'],
        status=row['status'],
        location=LocationInfo(
            address=row['address'], city=row['city'],
            postal_code=row['postal_code'], country=row['country'],
        ),
        zone_count=row.get('zone_count'),
    ).to_dict()


_WAREHOUSE_SELECT = '''
    SELECT w.warehouse_id AS id, w.name, w.description, w.status,
           l.address, l.city, l.postal_code, l.country,
           (SELECT COUNT(*) FROM zone z
            WHERE z.warehouse_id = w.warehouse_id AND z.status <> 'INACTIVE') AS zone_count
    FROM warehouse w
    JOIN location l ON w.location_id = l.location_id
'''


@warehouses_bp.get(
    '', tags=[structure_tag], summary='List warehouses',
    operation_id='listWarehouses', responses={200: WarehouseList},
)
def list_warehouses(query: IncludeInactiveQuery):
    sql = _WAREHOUSE_SELECT
    if not query.includeInactive:
        sql += " WHERE w.status <> 'INACTIVE'"
    sql += ' ORDER BY w.warehouse_id;'
    with db_engine.connect() as conn:
        rows = conn.execute(text(sql)).mappings().all()
    logger.info(f"Fetched {len(rows)} warehouses (includeInactive={query.includeInactive})")
    return jsonify([_warehouse_dict(r) for r in rows])


@warehouses_bp.post(
    '', tags=[structure_tag], summary='Create warehouse (with its location)',
    operation_id='createWarehouse', responses={201: Warehouse, 400: ErrorResponse},
)
def create_warehouse(body: WarehouseCreate):
    with db_engine.connect() as conn:
        with conn.begin():
            location_id = conn.execute(text('''
                INSERT INTO location (address, city, postal_code, country)
                VALUES (:address, :city, :postal_code, :country)
                RETURNING location_id;
            '''), {
                'address': body.location.address, 'city': body.location.city,
                'postal_code': body.location.postal_code, 'country': body.location.country,
            }).scalar_one()
            warehouse_id = conn.execute(text('''
                INSERT INTO warehouse (location_id, name, description)
                VALUES (:location_id, :name, :description)
                RETURNING warehouse_id;
            '''), {
                'location_id': location_id, 'name': body.name, 'description': body.description,
            }).scalar_one()
            row = conn.execute(text(_WAREHOUSE_SELECT + ' WHERE w.warehouse_id = :id;'),
                               {'id': warehouse_id}).mappings().first()
    logger.info(f"Created warehouse {warehouse_id}")
    return jsonify(_warehouse_dict(row)), 201


@warehouses_bp.get(
    '/<int:warehouse_id>', tags=[structure_tag], summary='Warehouse details',
    operation_id='getWarehouse', responses={200: Warehouse, 404: ErrorResponse},
)
def get_warehouse(path: WarehousePath):
    with db_engine.connect() as conn:
        row = conn.execute(text(_WAREHOUSE_SELECT + ' WHERE w.warehouse_id = :id;'),
                           {'id': path.warehouse_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
    return jsonify(_warehouse_dict(row))


@warehouses_bp.patch(
    '/<int:warehouse_id>', tags=[structure_tag], summary='Update warehouse (name/description/status)',
    operation_id='updateWarehouse', responses={200: Warehouse, 400: ErrorResponse, 404: ErrorResponse},
)
def update_warehouse(path: WarehousePath, body: WarehouseUpdate):
    fields = update_fields(body, {'name': 'name', 'description': 'description', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE warehouse SET {set_clause} WHERE warehouse_id = :id RETURNING warehouse_id;'),
                {**fields, 'id': path.warehouse_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
            row = conn.execute(text(_WAREHOUSE_SELECT + ' WHERE w.warehouse_id = :id;'),
                               {'id': path.warehouse_id}).mappings().first()
    logger.info(f"Updated warehouse {path.warehouse_id}: {list(fields)}")
    return jsonify(_warehouse_dict(row))


@warehouses_bp.delete(
    '/<int:warehouse_id>', tags=[structure_tag],
    summary='Soft-delete warehouse (status -> INACTIVE)',
    description='Blocked with 409 while the warehouse still has active zones.',
    operation_id='deleteWarehouse', responses={204: None, 404: ErrorResponse, 409: ErrorResponse},
)
def delete_warehouse(path: WarehousePath):
    outcome = soft_delete(
        'warehouse', 'warehouse_id', path.warehouse_id,
        child_guard_sql="SELECT 1 FROM zone WHERE warehouse_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Warehouse {path.warehouse_id} has active zones; deactivate them first'}), 409
    logger.info(f"Soft-deleted warehouse {path.warehouse_id} (outcome={outcome})")
    return '', 204


# --- Employees of a warehouse (replaces the old singular /warehouse/{id}) ---

@warehouses_bp.get(
    '/<int:warehouse_id>/employees', tags=[structure_tag],
    summary='Employees assigned to a warehouse',
    operation_id='getWarehouseEmployees', responses={200: EmployeeList, 404: ErrorResponse},
)
def list_warehouse_employees(path: WarehousePath):
    """Employees assigned to a warehouse, with their roles."""
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                        {'id': path.warehouse_id}).first() is None:
            return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
        rows = conn.execute(text('''
            SELECT p.party_id AS employee_id, p.name AS employee_name,
                   p.contact_email AS email, p.contact_phone AS phone,
                   p.created_at AS hire_date, STRING_AGG(r.name, ', ') AS roles
            FROM party p
            JOIN employee_warehouse ew ON p.party_id = ew.party_id
            JOIN party_role pr ON p.party_id = pr.party_id
            JOIN role r ON pr.role_id = r.role_id
            WHERE ew.warehouse_id = :id AND p.data->>'type' = 'employee'
            GROUP BY p.party_id, p.name, p.contact_email, p.contact_phone, p.created_at
            ORDER BY p.name;
        '''), {'id': path.warehouse_id}).mappings().all()
    employees = [dict(row) for row in rows]
    logger.info(f"Fetched {len(employees)} employees for warehouse {path.warehouse_id}")
    return jsonify(employees)


# --- Inventory rollup for a warehouse ---

@warehouses_bp.get(
    '/<int:warehouse_id>/inventory', tags=[inventory_tag],
    summary='Stored-goods rollup per zone for a warehouse',
    operation_id='getWarehouseInventory', responses={200: WarehouseInventory, 404: ErrorResponse},
)
def get_warehouse_inventory(path: WarehousePath):
    """Stored-goods rollup (open storage records) aggregated per active zone."""
    query = '''
        SELECT z.zone_id, z.name AS zone_name,
               COUNT(sr.storage_record_id) AS record_count,
               COALESCE(SUM(sr.cargo_weight), 0) AS total_weight,
               COALESCE(SUM(sr.cargo_volume), 0) AS total_volume
        FROM zone z
        LEFT JOIN aisle a ON a.zone_id = z.zone_id
        LEFT JOIN rack r ON r.aisle_id = a.aisle_id
        LEFT JOIN shelf s ON s.rack_id = r.rack_id
        LEFT JOIN storage_record sr
            ON sr.shelf_id = s.shelf_id AND sr.actual_exit_date IS NULL
        WHERE z.warehouse_id = :id AND z.status <> 'INACTIVE'
        GROUP BY z.zone_id, z.name
        ORDER BY z.zone_id;
    '''
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                        {'id': path.warehouse_id}).first() is None:
            return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
        rows = conn.execute(text(query), {'id': path.warehouse_id}).mappings().all()

    zones = [ZoneInventory(
        zone_id=str(r['zone_id']), zone_name=r['zone_name'],
        record_count=int(r['record_count']),
        total_weight=float(r['total_weight']), total_volume=float(r['total_volume']),
    ) for r in rows]
    result = WarehouseInventory(
        warehouse_id=str(path.warehouse_id),
        record_count=sum(z.record_count for z in zones),
        total_weight=sum(z.total_weight for z in zones),
        total_volume=sum(z.total_volume for z in zones),
        zones=zones,
    ).to_dict()
    logger.info(f"Inventory rollup for warehouse {path.warehouse_id}: {len(zones)} zones")
    return jsonify(result)


# --- Nested: zones of a warehouse ---

@warehouses_bp.get(
    '/<int:warehouse_id>/zones', tags=[structure_tag], summary='List zones of a warehouse',
    operation_id='listWarehouseZones', responses={200: ZoneList, 404: ErrorResponse},
)
def list_warehouse_zones(path: WarehousePath, query: IncludeInactiveQuery):
    sql = '''
        SELECT z.zone_id AS id, z.warehouse_id, z.name, z.description, z.status,
               (SELECT COUNT(*) FROM aisle a
                WHERE a.zone_id = z.zone_id AND a.status <> 'INACTIVE') AS aisle_count
        FROM zone z
        WHERE z.warehouse_id = :id
    '''
    if not query.includeInactive:
        sql += " AND z.status <> 'INACTIVE'"
    sql += ' ORDER BY z.zone_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                        {'id': path.warehouse_id}).first() is None:
            return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
        rows = conn.execute(text(sql), {'id': path.warehouse_id}).mappings().all()
    zones = [Zone(id=str(r['id']), warehouse_id=str(r['warehouse_id']), name=r['name'],
                  description=r['description'], status=r['status'],
                  aisle_count=r['aisle_count']).to_dict() for r in rows]
    return jsonify(zones)


@warehouses_bp.post(
    '/<int:warehouse_id>/zones', tags=[structure_tag], summary='Create zone in a warehouse',
    operation_id='createWarehouseZone', responses={201: Zone, 400: ErrorResponse, 404: ErrorResponse},
)
def create_warehouse_zone(path: WarehousePath, body: ZoneCreate):
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                            {'id': path.warehouse_id}).first() is None:
                return jsonify({'error': f'Warehouse {path.warehouse_id} not found'}), 404
            zone_id = conn.execute(text('''
                INSERT INTO zone (warehouse_id, name, description)
                VALUES (:warehouse_id, :name, :description)
                RETURNING zone_id;
            '''), {'warehouse_id': path.warehouse_id, 'name': body.name,
                   'description': body.description}).scalar_one()
    logger.info(f"Created zone {zone_id} in warehouse {path.warehouse_id}")
    return jsonify(Zone(id=str(zone_id), warehouse_id=str(path.warehouse_id), name=body.name,
                        description=body.description, status='ACTIVE', aisle_count=0).to_dict()), 201
