"""Zone (Strefa) item operations + nested aisle create/list."""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.zone import Zone, ZoneUpdate
from contract.aisle import Aisle, AisleCreate
from routes.structure_util import parse_body, update_fields, soft_delete

zones_bp = Blueprint('zones_bp', __name__)


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


@zones_bp.route('/<int:zone_id>', methods=['GET'])
def get_zone(zone_id):
    with db_engine.connect() as conn:
        row = conn.execute(text(_ZONE_SELECT + ' WHERE z.zone_id = :id;'),
                           {'id': zone_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Zone {zone_id} not found'}), 404
    return jsonify(_zone_dict(row))


@zones_bp.route('/<int:zone_id>', methods=['PATCH'])
def update_zone(zone_id):
    body, err = parse_body(ZoneUpdate)
    if err:
        return err
    fields = update_fields(body, {'name': 'name', 'description': 'description', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE zone SET {set_clause} WHERE zone_id = :id RETURNING zone_id;'),
                {**fields, 'id': zone_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Zone {zone_id} not found'}), 404
            row = conn.execute(text(_ZONE_SELECT + ' WHERE z.zone_id = :id;'),
                               {'id': zone_id}).mappings().first()
    logger.info(f"Updated zone {zone_id}: {list(fields)}")
    return jsonify(_zone_dict(row))


@zones_bp.route('/<int:zone_id>', methods=['DELETE'])
def delete_zone(zone_id):
    outcome = soft_delete(
        'zone', 'zone_id', zone_id,
        child_guard_sql="SELECT 1 FROM aisle WHERE zone_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Zone {zone_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Zone {zone_id} has active aisles; deactivate them first'}), 409
    logger.info(f"Soft-deleted zone {zone_id} (outcome={outcome})")
    return '', 204


# --- Nested: aisles of a zone ---

@zones_bp.route('/<int:zone_id>/aisles', methods=['GET'])
def list_zone_aisles(zone_id):
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    query = '''
        SELECT a.aisle_id AS id, a.zone_id, a.label, a.width, a.width_unit, a.status,
               (SELECT COUNT(*) FROM rack r
                WHERE r.aisle_id = a.aisle_id AND r.status <> 'INACTIVE') AS rack_count
        FROM aisle a
        WHERE a.zone_id = :id
    '''
    if not include_inactive:
        query += " AND a.status <> 'INACTIVE'"
    query += ' ORDER BY a.aisle_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM zone WHERE zone_id = :id;'),
                        {'id': zone_id}).first() is None:
            return jsonify({'error': f'Zone {zone_id} not found'}), 404
        rows = conn.execute(text(query), {'id': zone_id}).mappings().all()
    aisles = [Aisle(id=str(r['id']), zone_id=str(r['zone_id']), label=r['label'],
                    width=r['width'], width_unit=r['width_unit'], status=r['status'],
                    rack_count=r['rack_count']).to_dict() for r in rows]
    return jsonify(aisles)


@zones_bp.route('/<int:zone_id>/aisles', methods=['POST'])
def create_zone_aisle(zone_id):
    body, err = parse_body(AisleCreate)
    if err:
        return err
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM zone WHERE zone_id = :id;'),
                            {'id': zone_id}).first() is None:
                return jsonify({'error': f'Zone {zone_id} not found'}), 404
            aisle_id = conn.execute(text('''
                INSERT INTO aisle (zone_id, label, width, width_unit)
                VALUES (:zone_id, :label, :width, :width_unit)
                RETURNING aisle_id;
            '''), {'zone_id': zone_id, 'label': body.label, 'width': body.width,
                   'width_unit': body.width_unit}).scalar_one()
    logger.info(f"Created aisle {aisle_id} in zone {zone_id}")
    return jsonify(Aisle(id=str(aisle_id), zone_id=str(zone_id), label=body.label,
                         width=body.width, width_unit=body.width_unit, status='ACTIVE',
                         rack_count=0).to_dict()), 201
