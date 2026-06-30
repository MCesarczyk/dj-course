"""Warehouse (Magazyn) CRUD + nested zone create/list.

Hybrid REST nesting: collections that only make sense under a parent are nested
one level (``/warehouses/{id}/zones``); single-item operations are flat
(``/zones/{id}``, handled by the zones blueprint).
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.warehouse import Warehouse, WarehouseCreate, WarehouseUpdate, LocationInfo
from contract.zone import Zone, ZoneCreate
from routes.structure_util import parse_body, update_fields, soft_delete

warehouses_bp = Blueprint('warehouses_bp', __name__)


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


@warehouses_bp.route('/', methods=['GET'], strict_slashes=False)
def list_warehouses():
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    query = _WAREHOUSE_SELECT
    if not include_inactive:
        query += " WHERE w.status <> 'INACTIVE'"
    query += ' ORDER BY w.warehouse_id;'
    with db_engine.connect() as conn:
        rows = conn.execute(text(query)).mappings().all()
    logger.info(f"Fetched {len(rows)} warehouses (includeInactive={include_inactive})")
    return jsonify([_warehouse_dict(r) for r in rows])


@warehouses_bp.route('/', methods=['POST'], strict_slashes=False)
def create_warehouse():
    body, err = parse_body(WarehouseCreate)
    if err:
        return err
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


@warehouses_bp.route('/<int:warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    with db_engine.connect() as conn:
        row = conn.execute(text(_WAREHOUSE_SELECT + ' WHERE w.warehouse_id = :id;'),
                           {'id': warehouse_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Warehouse {warehouse_id} not found'}), 404
    return jsonify(_warehouse_dict(row))


@warehouses_bp.route('/<int:warehouse_id>', methods=['PATCH'])
def update_warehouse(warehouse_id):
    body, err = parse_body(WarehouseUpdate)
    if err:
        return err
    fields = update_fields(body, {'name': 'name', 'description': 'description', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE warehouse SET {set_clause} WHERE warehouse_id = :id RETURNING warehouse_id;'),
                {**fields, 'id': warehouse_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Warehouse {warehouse_id} not found'}), 404
            row = conn.execute(text(_WAREHOUSE_SELECT + ' WHERE w.warehouse_id = :id;'),
                               {'id': warehouse_id}).mappings().first()
    logger.info(f"Updated warehouse {warehouse_id}: {list(fields)}")
    return jsonify(_warehouse_dict(row))


@warehouses_bp.route('/<int:warehouse_id>', methods=['DELETE'])
def delete_warehouse(warehouse_id):
    outcome = soft_delete(
        'warehouse', 'warehouse_id', warehouse_id,
        child_guard_sql="SELECT 1 FROM zone WHERE warehouse_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Warehouse {warehouse_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Warehouse {warehouse_id} has active zones; deactivate them first'}), 409
    logger.info(f"Soft-deleted warehouse {warehouse_id} (outcome={outcome})")
    return '', 204


# --- Nested: zones of a warehouse ---

@warehouses_bp.route('/<int:warehouse_id>/zones', methods=['GET'])
def list_warehouse_zones(warehouse_id):
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    query = '''
        SELECT z.zone_id AS id, z.warehouse_id, z.name, z.description, z.status,
               (SELECT COUNT(*) FROM aisle a
                WHERE a.zone_id = z.zone_id AND a.status <> 'INACTIVE') AS aisle_count
        FROM zone z
        WHERE z.warehouse_id = :id
    '''
    if not include_inactive:
        query += " AND z.status <> 'INACTIVE'"
    query += ' ORDER BY z.zone_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                        {'id': warehouse_id}).first() is None:
            return jsonify({'error': f'Warehouse {warehouse_id} not found'}), 404
        rows = conn.execute(text(query), {'id': warehouse_id}).mappings().all()
    zones = [Zone(id=str(r['id']), warehouse_id=str(r['warehouse_id']), name=r['name'],
                  description=r['description'], status=r['status'],
                  aisle_count=r['aisle_count']).to_dict() for r in rows]
    return jsonify(zones)


@warehouses_bp.route('/<int:warehouse_id>/zones', methods=['POST'])
def create_warehouse_zone(warehouse_id):
    body, err = parse_body(ZoneCreate)
    if err:
        return err
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM warehouse WHERE warehouse_id = :id;'),
                            {'id': warehouse_id}).first() is None:
                return jsonify({'error': f'Warehouse {warehouse_id} not found'}), 404
            zone_id = conn.execute(text('''
                INSERT INTO zone (warehouse_id, name, description)
                VALUES (:warehouse_id, :name, :description)
                RETURNING zone_id;
            '''), {'warehouse_id': warehouse_id, 'name': body.name,
                   'description': body.description}).scalar_one()
    logger.info(f"Created zone {zone_id} in warehouse {warehouse_id}")
    return jsonify(Zone(id=str(zone_id), warehouse_id=str(warehouse_id), name=body.name,
                        description=body.description, status='ACTIVE', aisle_count=0).to_dict()), 201
