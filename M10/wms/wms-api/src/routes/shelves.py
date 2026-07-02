"""Shelf (Półka) item operations — capacity, occupancy and location code.

A shelf is the actual storage location. GET returns nominal capacity plus live
occupancy (sum of ACTIVE reservations) and a human-readable `locationCode`.
DELETE is blocked (409) while the shelf still holds active reservations or open
storage records.
"""

from flask import Blueprint, jsonify
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.shelf import Shelf, ShelfUpdate
from routes.structure_util import parse_body, update_fields, soft_delete

shelves_bp = Blueprint('shelves_bp', __name__)

# Shelf + location code (zone-aisle-rack-level) + two distinct occupancy views:
#   reserved  = booked capacity (ACTIVE reservations)
#   occupied  = goods physically stored (open storage records)
# Shared with the racks blueprint (nested list/create).
SHELF_SELECT = '''
    SELECT s.shelf_id AS id, s.rack_id, s.level, s.max_weight, s.max_volume, s.status,
           z.name || '-' || a.label || '-' || r.label || '-' || s.level AS location_code,
           COALESCE(res.reserved_weight, 0) AS reserved_weight,
           COALESCE(res.reserved_volume, 0) AS reserved_volume,
           COALESCE(occ.occupied_weight, 0) AS occupied_weight,
           COALESCE(occ.occupied_volume, 0) AS occupied_volume,
           COALESCE(occ.record_count, 0) AS stored_record_count
    FROM shelf s
    JOIN rack r ON s.rack_id = r.rack_id
    JOIN aisle a ON r.aisle_id = a.aisle_id
    JOIN zone z ON a.zone_id = z.zone_id
    LEFT JOIN (
        SELECT shelf_id,
               SUM(reserved_weight) AS reserved_weight,
               SUM(reserved_volume) AS reserved_volume
        FROM storage_reservation
        WHERE UPPER(status) = 'ACTIVE'  -- seed data uses lowercase; match case-insensitively
        GROUP BY shelf_id
    ) res ON res.shelf_id = s.shelf_id
    LEFT JOIN (
        SELECT shelf_id,
               SUM(cargo_weight) AS occupied_weight,
               SUM(cargo_volume) AS occupied_volume,
               COUNT(*) AS record_count
        FROM storage_record
        WHERE actual_exit_date IS NULL  -- still stored
        GROUP BY shelf_id
    ) occ ON occ.shelf_id = s.shelf_id
'''


def shelf_dict(row):
    max_weight = float(row['max_weight'])
    max_volume = float(row['max_volume'])
    reserved_weight = float(row['reserved_weight'])
    reserved_volume = float(row['reserved_volume'])
    return Shelf(
        id=str(row['id']), rack_id=str(row['rack_id']), level=row['level'],
        location_code=row['location_code'], status=row['status'],
        max_weight=max_weight, max_volume=max_volume,
        reserved_weight=reserved_weight, reserved_volume=reserved_volume,
        available_weight=max_weight - reserved_weight,
        available_volume=max_volume - reserved_volume,
        occupied_weight=float(row['occupied_weight']),
        occupied_volume=float(row['occupied_volume']),
        stored_record_count=int(row['stored_record_count']),
    ).to_dict()


@shelves_bp.route('/<int:shelf_id>', methods=['GET'])
def get_shelf(shelf_id):
    with db_engine.connect() as conn:
        row = conn.execute(text(SHELF_SELECT + ' WHERE s.shelf_id = :id;'),
                           {'id': shelf_id}).mappings().first()
    if row is None:
        return jsonify({'error': f'Shelf {shelf_id} not found'}), 404
    return jsonify(shelf_dict(row))


@shelves_bp.route('/<int:shelf_id>', methods=['PATCH'])
def update_shelf(shelf_id):
    body, err = parse_body(ShelfUpdate)
    if err:
        return err
    fields = update_fields(body, {'level': 'level', 'max_weight': 'max_weight',
                                  'max_volume': 'max_volume', 'status': 'status'})
    if not fields:
        return jsonify({'error': 'No updatable fields provided'}), 400
    set_clause = ', '.join(f'{col} = :{col}' for col in fields)
    with db_engine.connect() as conn:
        with conn.begin():
            updated = conn.execute(
                text(f'UPDATE shelf SET {set_clause} WHERE shelf_id = :id RETURNING shelf_id;'),
                {**fields, 'id': shelf_id},
            ).first()
            if updated is None:
                return jsonify({'error': f'Shelf {shelf_id} not found'}), 404
            row = conn.execute(text(SHELF_SELECT + ' WHERE s.shelf_id = :id;'),
                               {'id': shelf_id}).mappings().first()
    logger.info(f"Updated shelf {shelf_id}: {list(fields)}")
    return jsonify(shelf_dict(row))


@shelves_bp.route('/<int:shelf_id>', methods=['DELETE'])
def delete_shelf(shelf_id):
    outcome = soft_delete(
        'shelf', 'shelf_id', shelf_id,
        child_guard_sql='''
            SELECT 1 FROM storage_reservation
            WHERE shelf_id = :id AND UPPER(status) = 'ACTIVE'
            UNION ALL
            SELECT 1 FROM storage_record
            WHERE shelf_id = :id AND actual_exit_date IS NULL
            LIMIT 1;
        ''',
    )
    if outcome == 'not_found':
        return jsonify({'error': f'Shelf {shelf_id} not found'}), 404
    if outcome == 'conflict':
        return jsonify({'error': f'Shelf {shelf_id} has active reservations or open storage records'}), 409
    logger.info(f"Soft-deleted shelf {shelf_id} (outcome={outcome})")
    return '', 204
