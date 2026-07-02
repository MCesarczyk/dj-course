"""Inventory-state read layer over `storage_record`.

Exposes what is *physically stored* (open storage records, actual_exit_date IS
NULL) — as opposed to the shelf's *reserved* capacity. Also provides the shared
record-item SELECT reused by the shelf-contents and warehouse-inventory views.
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.inventory import StorageRecordItem

inventory_bp = Blueprint('inventory_bp', __name__)

# One cargo lot + its owner + its human-readable location. Callers append the
# WHERE clause (always including `sr.actual_exit_date IS NULL` for current stock).
RECORD_ITEM_SELECT = '''
    SELECT sr.storage_record_id AS record_id, sr.party_id, p.name AS party_name,
           w.warehouse_id, sr.shelf_id,
           z.name || '-' || a.label || '-' || r.label || '-' || s.level AS location_code,
           sr.cargo_description, sr.cargo_weight, sr.cargo_volume, sr.actual_entry_date
    FROM storage_record sr
    JOIN party p ON p.party_id = sr.party_id
    JOIN shelf s ON s.shelf_id = sr.shelf_id
    JOIN rack r ON r.rack_id = s.rack_id
    JOIN aisle a ON a.aisle_id = r.aisle_id
    JOIN zone z ON z.zone_id = a.zone_id
    JOIN warehouse w ON w.warehouse_id = z.warehouse_id
'''


def record_item_dict(row):
    entry = row['actual_entry_date']
    return StorageRecordItem(
        record_id=str(row['record_id']),
        party_id=str(row['party_id']),
        party_name=row['party_name'],
        warehouse_id=str(row['warehouse_id']),
        shelf_id=str(row['shelf_id']),
        location_code=row['location_code'],
        cargo_description=row['cargo_description'],
        cargo_weight=float(row['cargo_weight']),
        cargo_volume=float(row['cargo_volume']),
        entry_date=entry.isoformat() if entry else None,
    ).to_dict()


@inventory_bp.route('/', methods=['GET'], strict_slashes=False)
def list_inventory():
    """Currently stored cargo lots, filterable by party / warehouse / zone / shelf.

    Answers "where is customer X's cargo?" (partyId), "what is stored in
    warehouse/zone Y?" and "what is on shelf Z?" (shelfId) — each item carries
    its `locationCode`. Per-shelf occupancy totals live on GET /shelves/{id}.
    """
    filters = ['sr.actual_exit_date IS NULL']
    params = {}
    for param, column in (('partyId', 'sr.party_id'),
                          ('warehouseId', 'w.warehouse_id'),
                          ('zoneId', 'z.zone_id'),
                          ('shelfId', 'sr.shelf_id')):
        value = request.args.get(param)
        if value is not None:
            if not value.isdigit():
                return jsonify({'error': f'{param} must be an integer'}), 400
            filters.append(f'{column} = :{param}')
            params[param] = int(value)

    query = RECORD_ITEM_SELECT + ' WHERE ' + ' AND '.join(filters) + ' ORDER BY location_code;'
    with db_engine.connect() as conn:
        rows = conn.execute(text(query), params).mappings().all()
    logger.info(f"Fetched {len(rows)} inventory item(s) with filters {params}")
    return jsonify([record_item_dict(r) for r in rows])
