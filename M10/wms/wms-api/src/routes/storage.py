"""Storage records: event history + write operations (receipt / move / dispatch).

Each operation is a single transaction that mutates `storage_record` and appends
an audit row to `cargo_event_history` (event types RECEIVED / MOVED / DISPATCHED).
"""

import json
from enum import Enum
from typing import Any, Dict, List, Optional

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.storage_operation import (
    ReceiptCreate, ReservationFulfill, MoveRequest, DispatchRequest,
    ConditionReport, StorageRecord,
)
from contract.errors import ErrorResponse

storage_tag = Tag(name='Storage', description='Storage-record event history')
storage_ops_tag = Tag(name='StorageOperations', description='Goods receipt / move / dispatch / write-off')

storage_bp = APIBlueprint('storage_bp', __name__, url_prefix='/storage')


class StorageRecordPath(BaseModel):
    record_id: int = Field(description='Storage record ID (storage_record_id)')


class ReservationPath(BaseModel):
    reservation_id: int


class RecordStatus(str, Enum):
    STORED = 'STORED'
    DISPATCHED = 'DISPATCHED'
    DAMAGED = 'DAMAGED'
    LOST = 'LOST'


class StorageRecordQuery(BaseModel):
    partyId: Optional[int] = None
    warehouseId: Optional[int] = None
    shelfId: Optional[int] = None
    status: Optional[RecordStatus] = None


class StorageEvent(BaseModel):
    event_id: int
    storage_record_id: int
    event_type_id: int
    event_time: Optional[str] = None
    party_id: int
    details: Optional[Dict[str, Any]] = None


class StorageEventList(RootModel[List[StorageEvent]]):
    """Event history for a storage record."""


class StorageRecordList(RootModel[List[StorageRecord]]):
    """List of storage records."""


# Full record incl. exit date + condition + derived status + location code.
# Status precedence: LOST (written off) > DISPATCHED (left) > DAMAGED (flagged,
# still on stock) > STORED.
_RECORD_SELECT = '''
    SELECT sr.storage_record_id AS record_id, sr.request_id, sr.party_id, p.name AS party_name,
           sr.shelf_id, z.warehouse_id,
           z.name || '-' || a.label || '-' || r.label || '-' || s.level AS location_code,
           sr.cargo_description, sr.cargo_weight, sr.cargo_volume,
           sr.actual_entry_date, sr.actual_exit_date, sr.condition,
           CASE
               WHEN sr.condition = 'LOST' THEN 'LOST'
               WHEN sr.actual_exit_date IS NOT NULL THEN 'DISPATCHED'
               WHEN sr.condition = 'DAMAGED' THEN 'DAMAGED'
               ELSE 'STORED'
           END AS status
    FROM storage_record sr
    JOIN party p ON p.party_id = sr.party_id
    JOIN shelf s ON s.shelf_id = sr.shelf_id
    JOIN rack r ON r.rack_id = s.rack_id
    JOIN aisle a ON a.aisle_id = r.aisle_id
    JOIN zone z ON z.zone_id = a.zone_id
'''


def _record_dict(row):
    entry = row['actual_entry_date']
    exit_ = row['actual_exit_date']
    return StorageRecord(
        record_id=str(row['record_id']), request_id=str(row['request_id']),
        party_id=str(row['party_id']), party_name=row['party_name'],
        shelf_id=str(row['shelf_id']), location_code=row['location_code'],
        cargo_description=row['cargo_description'],
        cargo_weight=float(row['cargo_weight']), cargo_volume=float(row['cargo_volume']),
        entry_date=entry.isoformat() if entry else None,
        exit_date=exit_.isoformat() if exit_ else None,
        condition=row['condition'], status=row['status'],
    ).to_dict()


def _fetch_record(conn, record_id):
    return conn.execute(text(_RECORD_SELECT + ' WHERE sr.storage_record_id = :id;'),
                        {'id': record_id}).mappings().first()


def _shelf_state(conn, shelf_id):
    """Shelf status + capacity + currently occupied weight/volume, or None."""
    return conn.execute(text('''
        SELECT s.shelf_id, s.status, s.max_weight, s.max_volume,
               z.warehouse_id,
               z.name || '-' || a.label || '-' || r.label || '-' || s.level AS location_code,
               COALESCE((SELECT SUM(cargo_weight) FROM storage_record
                         WHERE shelf_id = s.shelf_id AND actual_exit_date IS NULL), 0) AS occupied_weight,
               COALESCE((SELECT SUM(cargo_volume) FROM storage_record
                         WHERE shelf_id = s.shelf_id AND actual_exit_date IS NULL), 0) AS occupied_volume
        FROM shelf s
        JOIN rack r ON r.rack_id = s.rack_id
        JOIN aisle a ON a.aisle_id = r.aisle_id
        JOIN zone z ON z.zone_id = a.zone_id
        WHERE s.shelf_id = :id;
    '''), {'id': shelf_id}).mappings().first()


def _capacity_error(shelf, add_weight, add_volume):
    """Return an error string if the cargo would not fit, else None."""
    if float(shelf['occupied_weight']) + add_weight > float(shelf['max_weight']):
        return 'weight capacity exceeded'
    if float(shelf['occupied_volume']) + add_volume > float(shelf['max_volume']):
        return 'volume capacity exceeded'
    return None


def _log_event(conn, party_id, record_id, type_name, details):
    conn.execute(text('''
        INSERT INTO cargo_event_history (party_id, storage_record_id, event_type_id, details)
        VALUES (:pid, :rid,
                (SELECT event_type_id FROM cargo_event_type WHERE name = :tname),
                CAST(:details AS JSONB));
    '''), {'pid': party_id, 'rid': record_id, 'tname': type_name,
           'details': json.dumps(details)})


@storage_bp.get(
    '/<int:record_id>', tags=[storage_ops_tag], summary='Storage record details',
    operation_id='getStorageRecord', responses={200: StorageRecord, 404: ErrorResponse},
)
def get_storage_record(path: StorageRecordPath):
    with db_engine.connect() as conn:
        row = _fetch_record(conn, path.record_id)
    if row is None:
        return jsonify({'error': f'Storage record {path.record_id} not found'}), 404
    return jsonify(_record_dict(row))


@storage_bp.get(
    '/records', tags=[storage_ops_tag], summary='Storage-record register (open + closed), filterable',
    description='Every storage record with its derived status. Unlike /inventory (current stock only), '
                'this includes dispatched/lost records. Filters: partyId, warehouseId, shelfId, status.',
    operation_id='listStorageRecords', responses={200: StorageRecordList, 400: ErrorResponse},
)
def list_storage_records(query: StorageRecordQuery):
    """Full storage-record register (open + closed), filterable.

    Unlike /inventory (current stock only), this returns every record with its
    derived status. Filters: partyId, warehouseId, shelfId, status
    (STORED / DISPATCHED / DAMAGED / LOST).
    """
    filters = []
    params = {}
    for param, column, value in (('partyId', 'party_id', query.partyId),
                                 ('warehouseId', 'warehouse_id', query.warehouseId),
                                 ('shelfId', 'shelf_id', query.shelfId)):
        if value is not None:
            filters.append(f'{column} = :{param}')
            params[param] = value
    if query.status is not None:
        filters.append('status = :status')
        params['status'] = query.status.value

    sql = 'SELECT * FROM (' + _RECORD_SELECT + ') rec'
    if filters:
        sql += ' WHERE ' + ' AND '.join(filters)
    sql += ' ORDER BY record_id;'
    with db_engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()
    logger.info(f"Fetched {len(rows)} storage record(s) with filters {params}")
    return jsonify([_record_dict(r) for r in rows])


@storage_bp.get(
    '/<int:record_id>/events', tags=[storage_tag], summary='Storage record event history',
    description='Returns cargo event history for the given storage record.',
    operation_id='getStorageEventHistory', responses={200: StorageEventList},
)
def get_storage_event_history(path: StorageRecordPath):
    """Return the event history for a given storage record."""
    query = text('''
        SELECT
            event_id,
            storage_record_id,
            event_type_id,
            event_time,
            party_id,
            details
        FROM
            cargo_event_history
        WHERE
            storage_record_id = :record_id
        ORDER BY
            event_time;
    ''')

    with db_engine.connect() as conn:
        result = conn.execute(query, {'record_id': path.record_id})
        events = [dict(row) for row in result.mappings()]

    logger.info(
        "Fetched %s storage event(s) for storage_record_id=%s", len(events), path.record_id
    )
    return jsonify(events)


@storage_bp.post(
    '/receipts', tags=[storage_ops_tag], summary='Receive goods onto a shelf (przyjęcie)',
    description='Creates a storage record against a request; owner is derived from the request. '
                'Logs a RECEIVED event.',
    operation_id='receiveGoods',
    responses={201: StorageRecord, 400: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse},
)
def receive_goods(body: ReceiptCreate):
    """Przyjęcie: place goods on a shelf against a storage request."""
    with db_engine.connect() as conn:
        with conn.begin():
            request_row = conn.execute(text(
                'SELECT issuing_party_id, warehouse_id FROM storage_request WHERE request_id = :id;'
            ), {'id': body.request_id}).mappings().first()
            if request_row is None:
                return jsonify({'error': f'Storage request {body.request_id} not found'}), 404

            shelf = _shelf_state(conn, body.shelf_id)
            if shelf is None:
                return jsonify({'error': f'Shelf {body.shelf_id} not found'}), 404
            if shelf['status'] != 'ACTIVE':
                return jsonify({'error': f"Shelf {body.shelf_id} is not ACTIVE (status {shelf['status']})"}), 409
            if shelf['warehouse_id'] != request_row['warehouse_id']:
                return jsonify({'error': 'Shelf belongs to a different warehouse than the request'}), 409
            cap_err = _capacity_error(shelf, body.cargo_weight, body.cargo_volume)
            if cap_err:
                return jsonify({'error': f'Cannot receive: {cap_err} on shelf {body.shelf_id}'}), 409

            party_id = request_row['issuing_party_id']
            record_id = conn.execute(text('''
                INSERT INTO storage_record
                    (request_id, party_id, shelf_id, actual_entry_date,
                     cargo_description, cargo_weight, cargo_volume)
                VALUES
                    (:request_id, :party_id, :shelf_id,
                     COALESCE(CAST(:entry_date AS TIMESTAMP), CURRENT_TIMESTAMP),
                     :cargo_description, :cargo_weight, :cargo_volume)
                RETURNING storage_record_id;
            '''), {
                'request_id': body.request_id, 'party_id': party_id, 'shelf_id': body.shelf_id,
                'entry_date': body.entry_date, 'cargo_description': body.cargo_description,
                'cargo_weight': body.cargo_weight, 'cargo_volume': body.cargo_volume,
            }).scalar_one()

            _log_event(conn, party_id, record_id, 'RECEIVED', {
                'shelf_id': body.shelf_id, 'location_code': shelf['location_code'],
                'cargo_weight': body.cargo_weight, 'cargo_volume': body.cargo_volume,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Received goods: record {record_id} on shelf {body.shelf_id}")
    return jsonify(_record_dict(row)), 201


@storage_bp.post(
    '/reservations/<int:reservation_id>/fulfill', tags=[storage_ops_tag],
    summary='Receive goods against a reservation (przyjęcie realizujące rezerwację)',
    description='Converts an ACTIVE reservation into stored goods: creates a storage record on the '
                'reserved shelf (owner/request from the reservation), marks the reservation FULFILLED, '
                'and logs a RECEIVED event. Cargo defaults to the reserved amounts.',
    operation_id='fulfillReservation',
    responses={201: StorageRecord, 400: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse},
)
def fulfill_reservation(path: ReservationPath, body: ReservationFulfill):
    """Przyjęcie realizujące rezerwację: convert booked capacity into stored goods.

    Shelf/request/owner come from the reservation; the reservation moves to
    FULFILLED (so it stops counting as reserved) and a storage record is created
    (counting as occupied). Cargo defaults to the reserved amounts.
    """
    reservation_id = path.reservation_id
    with db_engine.connect() as conn:
        with conn.begin():
            res = conn.execute(text('''
                SELECT reservation_id, request_id, party_id, shelf_id,
                       reserved_weight, reserved_volume, status
                FROM storage_reservation WHERE reservation_id = :id;
            '''), {'id': reservation_id}).mappings().first()
            if res is None:
                return jsonify({'error': f'Reservation {reservation_id} not found'}), 404
            if str(res['status']).upper() != 'ACTIVE':
                return jsonify({'error': f"Reservation {reservation_id} is not ACTIVE (status {res['status']})"}), 409

            shelf = _shelf_state(conn, res['shelf_id'])
            if shelf is None:
                return jsonify({'error': f"Shelf {res['shelf_id']} not found"}), 404
            if shelf['status'] != 'ACTIVE':
                return jsonify({'error': f"Shelf {res['shelf_id']} is not ACTIVE (status {shelf['status']})"}), 409

            reserved_weight = float(res['reserved_weight'])
            reserved_volume = float(res['reserved_volume'])
            cargo_weight = body.cargo_weight if body.cargo_weight is not None else reserved_weight
            cargo_volume = body.cargo_volume if body.cargo_volume is not None else reserved_volume
            if cargo_weight > reserved_weight:
                return jsonify({'error': f'Cargo weight {cargo_weight} exceeds reserved {reserved_weight}'}), 409
            if cargo_volume > reserved_volume:
                return jsonify({'error': f'Cargo volume {cargo_volume} exceeds reserved {reserved_volume}'}), 409
            cap_err = _capacity_error(shelf, cargo_weight, cargo_volume)
            if cap_err:
                return jsonify({'error': f"Cannot fulfil: {cap_err} on shelf {res['shelf_id']}"}), 409

            party_id = res['party_id']
            description = body.cargo_description or f'Fulfilment of reservation {reservation_id}'
            record_id = conn.execute(text('''
                INSERT INTO storage_record
                    (request_id, party_id, shelf_id, actual_entry_date,
                     cargo_description, cargo_weight, cargo_volume)
                VALUES
                    (:request_id, :party_id, :shelf_id,
                     COALESCE(CAST(:entry_date AS TIMESTAMP), CURRENT_TIMESTAMP),
                     :description, :cargo_weight, :cargo_volume)
                RETURNING storage_record_id;
            '''), {
                'request_id': res['request_id'], 'party_id': party_id, 'shelf_id': res['shelf_id'],
                'entry_date': body.entry_date, 'description': description,
                'cargo_weight': cargo_weight, 'cargo_volume': cargo_volume,
            }).scalar_one()

            conn.execute(text(
                "UPDATE storage_reservation SET status = 'FULFILLED' WHERE reservation_id = :id;"
            ), {'id': reservation_id})

            _log_event(conn, party_id, record_id, 'RECEIVED', {
                'reservation_id': reservation_id, 'shelf_id': res['shelf_id'],
                'location_code': shelf['location_code'],
                'cargo_weight': cargo_weight, 'cargo_volume': cargo_volume,
                'fulfilled_reservation': True,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Fulfilled reservation {reservation_id} -> record {record_id}")
    return jsonify(_record_dict(row)), 201


@storage_bp.post(
    '/<int:record_id>/move', tags=[storage_ops_tag], summary='Move stored goods to another shelf (przesunięcie)',
    description='Relocates an open record within the same warehouse. Logs a MOVED event.',
    operation_id='moveGoods',
    responses={200: StorageRecord, 400: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse},
)
def move_goods(path: StorageRecordPath, body: MoveRequest):
    """Przesunięcie: relocate a stored lot to another shelf (same warehouse)."""
    record_id = path.record_id
    with db_engine.connect() as conn:
        with conn.begin():
            record = _fetch_record(conn, record_id)
            if record is None:
                return jsonify({'error': f'Storage record {record_id} not found'}), 404
            if record['actual_exit_date'] is not None:
                return jsonify({'error': f'Storage record {record_id} is already dispatched'}), 409
            if str(record['shelf_id']) == str(body.target_shelf_id):
                return jsonify({'error': 'Target shelf is the same as the current shelf'}), 409

            source = _shelf_state(conn, record['shelf_id'])
            target = _shelf_state(conn, body.target_shelf_id)
            if target is None:
                return jsonify({'error': f'Target shelf {body.target_shelf_id} not found'}), 404
            if target['status'] != 'ACTIVE':
                return jsonify({'error': f"Target shelf {body.target_shelf_id} is not ACTIVE"}), 409
            if target['warehouse_id'] != source['warehouse_id']:
                return jsonify({'error': 'Cross-warehouse move is not supported'}), 409
            cap_err = _capacity_error(target, float(record['cargo_weight']), float(record['cargo_volume']))
            if cap_err:
                return jsonify({'error': f'Cannot move: {cap_err} on shelf {body.target_shelf_id}'}), 409

            conn.execute(text('UPDATE storage_record SET shelf_id = :shelf WHERE storage_record_id = :id;'),
                         {'shelf': body.target_shelf_id, 'id': record_id})
            _log_event(conn, record['party_id'], record_id, 'MOVED', {
                'from_shelf_id': record['shelf_id'], 'to_shelf_id': int(body.target_shelf_id),
                'from_location_code': source['location_code'],
                'to_location_code': target['location_code'],
                'note': body.note,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Moved record {record_id} to shelf {body.target_shelf_id}")
    return jsonify(_record_dict(row))


@storage_bp.post(
    '/<int:record_id>/dispatch', tags=[storage_ops_tag], summary='Dispatch goods from the warehouse (wydanie)',
    description='Closes an open record (sets exit date). Logs a DISPATCHED event.',
    operation_id='dispatchGoods',
    responses={200: StorageRecord, 404: ErrorResponse, 409: ErrorResponse},
)
def dispatch_goods(path: StorageRecordPath, body: DispatchRequest):
    """Wydanie: release goods from the warehouse (close the storage record)."""
    record_id = path.record_id
    with db_engine.connect() as conn:
        with conn.begin():
            record = _fetch_record(conn, record_id)
            if record is None:
                return jsonify({'error': f'Storage record {record_id} not found'}), 404
            if record['actual_exit_date'] is not None:
                return jsonify({'error': f'Storage record {record_id} is already dispatched'}), 409

            conn.execute(text('''
                UPDATE storage_record
                SET actual_exit_date = COALESCE(CAST(:exit_date AS TIMESTAMP), CURRENT_TIMESTAMP)
                WHERE storage_record_id = :id;
            '''), {'exit_date': body.exit_date, 'id': record_id})
            _log_event(conn, record['party_id'], record_id, 'DISPATCHED', {
                'shelf_id': record['shelf_id'],
                'location_code': record['location_code'],
                'note': body.note,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Dispatched record {record_id}")
    return jsonify(_record_dict(row))


@storage_bp.post(
    '/<int:record_id>/damage', tags=[storage_ops_tag], summary='Flag stored goods as damaged (uszkodzenie)',
    description='Sets condition=DAMAGED. Goods stay on the shelf (still occupied). Logs a DAMAGED event.',
    operation_id='reportDamage',
    responses={200: StorageRecord, 404: ErrorResponse, 409: ErrorResponse},
)
def report_damage(path: StorageRecordPath, body: ConditionReport):
    """Uszkodzenie: flag goods as DAMAGED. They stay on the shelf (still occupied)."""
    record_id = path.record_id
    with db_engine.connect() as conn:
        with conn.begin():
            record = _fetch_record(conn, record_id)
            if record is None:
                return jsonify({'error': f'Storage record {record_id} not found'}), 404
            if record['status'] != 'STORED':
                return jsonify({'error': f"Storage record {record_id} is not on stock (status {record['status']})"}), 409

            conn.execute(text(
                "UPDATE storage_record SET condition = 'DAMAGED' WHERE storage_record_id = :id;"
            ), {'id': record_id})
            _log_event(conn, record['party_id'], record_id, 'DAMAGED', {
                'shelf_id': record['shelf_id'],
                'location_code': record['location_code'],
                'note': body.note,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Flagged record {record_id} as DAMAGED")
    return jsonify(_record_dict(row))


@storage_bp.post(
    '/<int:record_id>/loss', tags=[storage_ops_tag], summary='Write off stored goods as lost (zaginięcie)',
    description='Sets condition=LOST and actual_exit_date — removed from stock, distinct from DISPATCHED. '
                'Logs a LOST event.',
    operation_id='reportLoss',
    responses={200: StorageRecord, 404: ErrorResponse, 409: ErrorResponse},
)
def report_loss(path: StorageRecordPath, body: ConditionReport):
    """Zaginięcie: write off goods as LOST — removed from stock (exit date set)."""
    record_id = path.record_id
    with db_engine.connect() as conn:
        with conn.begin():
            record = _fetch_record(conn, record_id)
            if record is None:
                return jsonify({'error': f'Storage record {record_id} not found'}), 404
            if record['actual_exit_date'] is not None or record['condition'] == 'LOST':
                return jsonify({'error': f"Storage record {record_id} is no longer on stock (status {record['status']})"}), 409

            conn.execute(text('''
                UPDATE storage_record
                SET condition = 'LOST', actual_exit_date = CURRENT_TIMESTAMP
                WHERE storage_record_id = :id;
            '''), {'id': record_id})
            _log_event(conn, record['party_id'], record_id, 'LOST', {
                'shelf_id': record['shelf_id'],
                'location_code': record['location_code'],
                'note': body.note,
            })
            row = _fetch_record(conn, record_id)
    logger.info(f"Wrote off record {record_id} as LOST")
    return jsonify(_record_dict(row))
