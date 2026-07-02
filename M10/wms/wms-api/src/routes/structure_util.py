"""Shared helpers for the warehouse-structure CRUD routes.

Keeps the per-resource blueprints focused on SQL by factoring out the
repeated bits: dynamic UPDATE building and soft-delete with child guards.
Request-body validation is handled by flask-openapi3 from the typed route
signatures (``def handler(body: SomeModel)``).
"""

from sqlalchemy import text

from database import db_engine


def update_fields(body, column_map):
    """Map a *Update contract instance to {column: value} for SET, skipping unset keys.

    ``column_map`` maps contract field name (snake_case) -> DB column. Enum
    values are unwrapped to their ``.value``.
    """
    provided = body.model_dump(exclude_none=True)
    fields = {}
    for field, column in column_map.items():
        if field in provided:
            value = provided[field]
            fields[column] = value.value if hasattr(value, 'value') else value
    return fields


def soft_delete(table, id_column, entity_id, child_guard_sql=None, guard_params=None):
    """Soft-delete a structure row (status -> INACTIVE) inside one transaction.

    Returns one of: 'not_found', 'conflict' (active children/dependencies),
    'already_inactive', or 'deleted'.

    ``child_guard_sql`` must select at least one row when deletion should be
    blocked (e.g. an active child or reservation exists).
    """
    with db_engine.connect() as conn:
        with conn.begin():
            row = conn.execute(
                text(f'SELECT status FROM {table} WHERE {id_column} = :id'),
                {'id': entity_id},
            ).mappings().first()
            if row is None:
                return 'not_found'
            if row['status'] == 'INACTIVE':
                return 'already_inactive'

            if child_guard_sql is not None:
                blocked = conn.execute(
                    text(child_guard_sql), guard_params or {'id': entity_id}
                ).first()
                if blocked is not None:
                    return 'conflict'

            conn.execute(
                text(f"UPDATE {table} SET status = 'INACTIVE' WHERE {id_column} = :id"),
                {'id': entity_id},
            )
            return 'deleted'
