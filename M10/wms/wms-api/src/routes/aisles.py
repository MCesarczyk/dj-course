"""Aisle (Rząd) item operations + nested rack create/list."""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.aisle import Aisle, AisleUpdate
from contract.rack import Rack, RackCreate
from routes.structure_util import parse_body, update_fields, soft_delete

aisles_bp = Blueprint('aisles_bp', __name__)


def _aisle_dict(row):
    return Aisle(id=str(row['id']), zone_id=str(row['zone_id']), label=row['label'],
                 width=row['width'], width_unit=row['width_unit'], status=row['status'],
                 rack_count=row.get('rack_count')).to_dict()


_AISLE_SELECT = '''
    SELECT a.aisle_id AS id, a.zone_id, a.label, a.width, a.width_unit, a.status,
           (SELECT COUNT(*) FROM rack r
            WHERE r.aisle_id = a.aisle_id AND r.status <> 'INACTIVE') AS rack_count
    FROM aisle a
'''


@aisles_bp.route('/<int:aisle_id>', methods=['GET'])
def get_aisle(aisle_id):
    with db_engine.connect() as conn:
        row = conn.execute(text(_AISLE_SELECT + ' WHERE a.aisle_id = :id;'),
                           {'id': aisle_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Aisle {aisle_id} not found'}), 404
    return jsonify(_aisle_dict(row))


@aisles_bp.route('/<int:aisle_id>', methods=['PATCH'])
def update_aisle(aisle_id):
    body, err = parse_body(AisleUpdate)
    if err:
        return err
    fields = update_fields(body, {'label': 'label', 'width': 'width',
                                  'width_unit': 'width_unit', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE aisle SET {set_clause} WHERE aisle_id = :id RETURNING aisle_id;'),
                {**fields, 'id': aisle_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Aisle {aisle_id} not found'}), 404
            row = conn.execute(text(_AISLE_SELECT + ' WHERE a.aisle_id = :id;'),
                               {'id': aisle_id}).mappings().first()
    logger.info(f"Updated aisle {aisle_id}: {list(fields)}")
    return jsonify(_aisle_dict(row))


@aisles_bp.route('/<int:aisle_id>', methods=['DELETE'])
def delete_aisle(aisle_id):
    outcome = soft_delete(
        'aisle', 'aisle_id', aisle_id,
        child_guard_sql="SELECT 1 FROM rack WHERE aisle_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Aisle {aisle_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Aisle {aisle_id} has active racks; deactivate them first'}), 409
    logger.info(f"Soft-deleted aisle {aisle_id} (outcome={outcome})")
    return '', 204


# --- Nested: racks of an aisle ---

@aisles_bp.route('/<int:aisle_id>/racks', methods=['GET'])
def list_aisle_racks(aisle_id):
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    query = '''
        SELECT r.rack_id AS id, r.aisle_id, r.label, r.max_height, r.height_unit, r.status,
               (SELECT COUNT(*) FROM shelf s
                WHERE s.rack_id = r.rack_id AND s.status <> 'INACTIVE') AS shelf_count
        FROM rack r
        WHERE r.aisle_id = :id
    '''
    if not include_inactive:
        query += " AND r.status <> 'INACTIVE'"
    query += ' ORDER BY r.rack_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM aisle WHERE aisle_id = :id;'),
                        {'id': aisle_id}).first() is None:
            return jsonify({'error': f'Aisle {aisle_id} not found'}), 404
        rows = conn.execute(text(query), {'id': aisle_id}).mappings().all()
    racks = [Rack(id=str(r['id']), aisle_id=str(r['aisle_id']), label=r['label'],
                  max_height=r['max_height'], height_unit=r['height_unit'], status=r['status'],
                  shelf_count=r['shelf_count']).to_dict() for r in rows]
    return jsonify(racks)


@aisles_bp.route('/<int:aisle_id>/racks', methods=['POST'])
def create_aisle_rack(aisle_id):
    body, err = parse_body(RackCreate)
    if err:
        return err
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM aisle WHERE aisle_id = :id;'),
                            {'id': aisle_id}).first() is None:
                return jsonify({'error': f'Aisle {aisle_id} not found'}), 404
            rack_id = conn.execute(text('''
                INSERT INTO rack (aisle_id, label, max_height, height_unit)
                VALUES (:aisle_id, :label, :max_height, :height_unit)
                RETURNING rack_id;
            '''), {'aisle_id': aisle_id, 'label': body.label, 'max_height': body.max_height,
                   'height_unit': body.height_unit}).scalar_one()
    logger.info(f"Created rack {rack_id} in aisle {aisle_id}")
    return jsonify(Rack(id=str(rack_id), aisle_id=str(aisle_id), label=body.label,
                        max_height=body.max_height, height_unit=body.height_unit,
                        status='ACTIVE', shelf_count=0).to_dict()), 201
