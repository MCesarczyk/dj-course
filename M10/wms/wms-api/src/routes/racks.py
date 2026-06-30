"""Rack (Szafa) item operations + nested shelf create/list (incl. bulk provisioning)."""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.rack import Rack, RackUpdate
from contract.shelf import ShelfCreate, ShelfBulkCreate
from routes.structure_util import parse_body, update_fields, soft_delete
from routes.shelves import SHELF_SELECT, shelf_dict

racks_bp = Blueprint('racks_bp', __name__)


def _rack_dict(row):
    return Rack(id=str(row['id']), aisle_id=str(row['aisle_id']), label=row['label'],
                max_height=row['max_height'], height_unit=row['height_unit'], status=row['status'],
                shelf_count=row.get('shelf_count')).to_dict()


_RACK_SELECT = '''
    SELECT r.rack_id AS id, r.aisle_id, r.label, r.max_height, r.height_unit, r.status,
           (SELECT COUNT(*) FROM shelf s
            WHERE s.rack_id = r.rack_id AND s.status <> 'INACTIVE') AS shelf_count
    FROM rack r
'''


@racks_bp.route('/<int:rack_id>', methods=['GET'])
def get_rack(rack_id):
    with db_engine.connect() as conn:
        row = conn.execute(text(_RACK_SELECT + ' WHERE r.rack_id = :id;'),
                           {'id': rack_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Rack {rack_id} not found'}), 404
    return jsonify(_rack_dict(row))


@racks_bp.route('/<int:rack_id>', methods=['PATCH'])
def update_rack(rack_id):
    body, err = parse_body(RackUpdate)
    if err:
        return err
    fields = update_fields(body, {'label': 'label', 'max_height': 'max_height',
                                  'height_unit': 'height_unit', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE rack SET {set_clause} WHERE rack_id = :id RETURNING rack_id;'),
                {**fields, 'id': rack_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Rack {rack_id} not found'}), 404
            row = conn.execute(text(_RACK_SELECT + ' WHERE r.rack_id = :id;'),
                               {'id': rack_id}).mappings().first()
    logger.info(f"Updated rack {rack_id}: {list(fields)}")
    return jsonify(_rack_dict(row))


@racks_bp.route('/<int:rack_id>', methods=['DELETE'])
def delete_rack(rack_id):
    outcome = soft_delete(
        'rack', 'rack_id', rack_id,
        child_guard_sql="SELECT 1 FROM shelf WHERE rack_id = :id AND status <> 'INACTIVE' LIMIT 1;",
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Rack {rack_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Rack {rack_id} has active shelves; deactivate them first'}), 409
    logger.info(f"Soft-deleted rack {rack_id} (outcome={outcome})")
    return '', 204


# --- Nested: shelves of a rack ---

@racks_bp.route('/<int:rack_id>/shelves', methods=['GET'])
def list_rack_shelves(rack_id):
    include_inactive = request.args.get('includeInactive', 'false').lower() == 'true'
    query = SHELF_SELECT + ' WHERE s.rack_id = :id'
    if not include_inactive:
        query += " AND s.status <> 'INACTIVE'"
    query += ' ORDER BY s.shelf_id;'
    with db_engine.connect() as conn:
        if conn.execute(text('SELECT 1 FROM rack WHERE rack_id = :id;'),
                        {'id': rack_id}).first() is None:
            return jsonify({'error': f'Rack {rack_id} not found'}), 404
        rows = conn.execute(text(query), {'id': rack_id}).mappings().all()
    return jsonify([shelf_dict(r) for r in rows])


@racks_bp.route('/<int:rack_id>/shelves', methods=['POST'])
def create_rack_shelf(rack_id):
    body, err = parse_body(ShelfCreate)
    if err:
        return err
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM rack WHERE rack_id = :id;'),
                            {'id': rack_id}).first() is None:
                return jsonify({'error': f'Rack {rack_id} not found'}), 404
            shelf_id = conn.execute(text('''
                INSERT INTO shelf (rack_id, level, max_weight, max_volume)
                VALUES (:rack_id, :level, :max_weight, :max_volume)
                RETURNING shelf_id;
            '''), {'rack_id': rack_id, 'level': body.level, 'max_weight': body.max_weight,
                   'max_volume': body.max_volume}).scalar_one()
            row = conn.execute(text(SHELF_SELECT + ' WHERE s.shelf_id = :id;'),
                               {'id': shelf_id}).mappings().first()
    logger.info(f"Created shelf {shelf_id} in rack {rack_id}")
    return jsonify(shelf_dict(row)), 201


@racks_bp.route('/<int:rack_id>/shelves:bulk', methods=['POST'])
def bulk_create_rack_shelves(rack_id):
    body, err = parse_body(ShelfBulkCreate)
    if err:
        return err
    levels = [f'{body.level_prefix}{i}' for i in range(1, body.count + 1)]
    with db_engine.connect() as conn:
        with conn.begin():
            if conn.execute(text('SELECT 1 FROM rack WHERE rack_id = :id;'),
                            {'id': rack_id}).first() is None:
                return jsonify({'error': f'Rack {rack_id} not found'}), 404
            created_ids = conn.execute(text('''
                INSERT INTO shelf (rack_id, level, max_weight, max_volume)
                SELECT :rack_id, lvl, :max_weight, :max_volume
                FROM unnest(CAST(:levels AS TEXT[])) AS lvl
                RETURNING shelf_id;
            '''), {'rack_id': rack_id, 'levels': levels,
                   'max_weight': body.max_weight, 'max_volume': body.max_volume}
            ).scalars().all()
            rows = conn.execute(
                text(SHELF_SELECT + ' WHERE s.shelf_id = ANY(:ids) ORDER BY s.shelf_id;'),
                {'ids': created_ids},
            ).mappings().all()
    logger.info(f"Bulk-created {len(created_ids)} shelves in rack {rack_id}")
    return jsonify([shelf_dict(r) for r in rows]), 201
