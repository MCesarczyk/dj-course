"""Zone (Strefa) item operations + nested aisle create/list."""

from typing import List

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.zone import Zone, ZoneUpdate
from contract.aisle import Aisle, AisleCreate
from contract.errors import ErrorResponse
from routes.structure_util import update_fields, soft_delete

structure_tag = Tag(name='WarehouseStructure', description='Warehouse / zone / aisle / rack / shelf CRUD')
zones_bp = APIBlueprint('zones_bp', __name__, url_prefix='/zones')


class ZonePath(BaseModel):
    zone_id: int


class IncludeInactiveQuery(BaseModel):
    includeInactive: bool = Field(default=False, description='Include soft-deleted (INACTIVE) rows')


class AisleList(RootModel[List[Aisle]]):
    """List of aisles."""


def _zone_dict(row):
    return Zone(id=str(row['id']), warehouse_id=str(row['warehouse_id']), name=row['name'],
               description=row['description'], status=row['status'],
               aisle_count=row.get('aisle_count')).to_dict()


_ZONE_SELECT = '''
    SELECT z.zone_id AS id, z.warehouse_id, z.name, z.description, z.status,
           (SELECT COUNT(*) FROM aisle a
            WHERE a.zone_id = z.zone_id AND a.status <> 'INACTIVE') AS aisle_count
    FROM zone z
'''


@zones_bp.get(
    '/<int:zone_id>', tags=[structure_tag], summary='Zone details',
    operation_id='getZone', responses={200: Zone, 404: ErrorResponse},
)
def get_zone(path: ZonePath):
    with db_engine.connect() as conn:
        row = conn.execute(text(_ZONE_SELECT + ' WHERE z.zone_id = :id;'),
                           {'id': path.zone_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Zone {path.zone_id} not found'}), 404
    return jsonify(_zone_dict(row))


@zones_bp.patch(
    '/<int:zone_id>', tags=[structure_tag], summary='Update zone',
    operation_id='updateZone', responses={200: Zone, 400: ErrorResponse, 404: ErrorResponse},
)
def update_zone(path: ZonePath, body: ZoneUpdate):
    fields = update_fields(body, {'name': 'name', 'description': 'description', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE zone SET {set_clause} WHERE zone_id = :id RETURNING zone_id;'),
                {**fields, 'id': path.zone_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Zone {path.zone_id} not found'}), 404
            row = conn.execute(text(_ZONE_SELECT + ' WHERE z.zone_id = :id;'),
                               {'id': path.zone_id}).mappings().first()
    logger.info(f"Updated zone {path.zone_id}: {list(fields)}")
    return jsonify(_zone_dict(row))


@zones_bp.delete(
    '/<int:zone_id>', tags=[structure_tag], summary='Soft-delete zone (blocked 409 if active aisles)',
    operation_id='deleteZone', responses={204: None, 404: ErrorResponse, 409: ErrorResponse},
)
def delete_zone(path: ZonePath):
    outcome = soft_delete(
        'zone', 'zone_id', path.zone_id,
        child_guard_sql="SELECT 1 FROM aisle WHERE zone_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Zone {path.zone_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Zone {path.zone_id} has active aisles; deactivate them first'}), 409
    logger.info(f"Soft-deleted zone {path.zone_id} (outcome={outcome})")
    return '', 204


# --- Nested: aisles of a zone ---

@zones_bp.get(
    '/<int:zone_id>/aisles', tags=[structure_tag], summary='List aisles of a zone',
    operation_id='listZoneAisles', responses={200: AisleList, 404: ErrorResponse},
)
def list_zone_aisles(path: ZonePath, query: IncludeInactiveQuery):
    sql = '''
        SELECT a.aisle_id AS id, a.zone_id, a.label, a.width, a.width_unit, a.status,
               (SELECT COUNT(*) FROM rack r
                WHERE r.aisle_id = a.aisle_id AND r.status <> 'INACTIVE') AS rack_count
        FROM aisle a
        WHERE a.zone_id = :id
    '''
    if not query.includeInactive:
        sql += " AND a.status <> 'INACTIVE'"
    sql += ' ORDER BY a.aisle_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM zone WHERE zone_id = :id;'),
                        {'id': path.zone_id}).first() is None:
            return jsonify({'error': f'Zone {path.zone_id} not found'}), 404
        rows = conn.execute(text(sql), {'id': path.zone_id}).mappings().all()
    aisles = [Aisle(id=str(r['id']), zone_id=str(r['zone_id']), label=r['label'],
                    width=r['width'], width_unit=r['width_unit'], status=r['status'],
                    rack_count=r['rack_count']).to_dict() for r in rows]
    return jsonify(aisles)


@zones_bp.post(
    '/<int:zone_id>/aisles', tags=[structure_tag], summary='Create aisle in a zone',
    operation_id='createZoneAisle', responses={201: Aisle, 400: ErrorResponse, 404: ErrorResponse},
)
def create_zone_aisle(path: ZonePath, body: AisleCreate):
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM zone WHERE zone_id = :id;'),
                            {'id': path.zone_id}).first() is None:
                return jsonify({'error': f'Zone {path.zone_id} not found'}), 404
            aisle_id = conn.execute(text('''
                INSERT INTO aisle (zone_id, label, width, width_unit)
                VALUES (:zone_id, :label, :width, :width_unit)
                RETURNING aisle_id;
            '''), {'zone_id': path.zone_id, 'label': body.label, 'width': body.width,
                   'width_unit': body.width_unit}).scalar_one()
    logger.info(f"Created aisle {aisle_id} in zone {path.zone_id}")
    return jsonify(Aisle(id=str(aisle_id), zone_id=str(path.zone_id), label=body.label,
                         width=body.width, width_unit=body.width_unit, status='ACTIVE',
                         rack_count=0).to_dict()), 201
