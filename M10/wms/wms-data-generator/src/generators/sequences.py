"""Sequence resync for the generated dump.

Every table is seeded with explicit primary-key values, which does NOT advance
the owning SERIAL sequence. Without this, the first INSERT through the API
collides on the primary key (duplicate key on *_pkey). Emitting setval at the
end of the dump (pg_dump style) keeps the seed self-sufficient.

`pg_get_serial_sequence` resolves the sequence by table+column, so we don't
hard-code sequence names. Tables with UUID or composite primary keys (address,
party_role, employee_warehouse) have no SERIAL sequence and are skipped.
"""

# (table, serial primary-key column)
_SERIAL_TABLES = [
    ("location", "location_id"),
    ("warehouse", "warehouse_id"),
    ("zone", "zone_id"),
    ("aisle", "aisle_id"),
    ("rack", "rack_id"),
    ("shelf", "shelf_id"),
    ("capacity", "capacity_id"),
    ("party", "party_id"),
    ("party_contact", "contact_id"),
    ("party_relationship", "relationship_id"),
    ("role", "role_id"),
    ("storage_request", "request_id"),
    ("storage_reservation", "reservation_id"),
    ("storage_record", "storage_record_id"),
    ("payment", "payment_id"),
    ("cargo_event_type", "event_type_id"),
    ("cargo_event_history", "event_id"),
]


def sequence_resync_sql():
    """Return SQL that realigns each SERIAL sequence with MAX(id)."""
    lines = ["\n-- Resync SERIAL sequences with seeded data (so API inserts don't collide)"]
    for table, column in _SERIAL_TABLES:
        lines.append(
            f"SELECT setval(pg_get_serial_sequence('{table}', '{column}'), "
            f"(SELECT COALESCE(MAX({column}), 1) FROM {table}));"
        )
    return "\n".join(lines)
