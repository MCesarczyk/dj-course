"""Shared helpers for the warehouse-structure CRUD routes.

Keeps the per-resource blueprints focused on SQL by factoring out the
repeated bits: request-body validation and dynamic UPDATE building.
"""

from flask import jsonify, request
from pydantic import ValidationError
from sqlalchemy import text

from database import db_engine


def parse_body(model_cls):
    """Validate the JSON request body against a Pydantic contract.

    Returns (instance, None) on success, or (None, flask_response) on failure
    so callers can do: ``body, err = parse_body(X); if err: return err``.
    """
    data = request.get_json(silent=True)
    if data is None:
        return None, (jsonify({'error': 'Request body must be valid JSON'}), 400)
    try:
        return model_cls.from_dict(data), None
    except ValidationError as e:
        return None, (jsonify({'error': f'Invalid request body: {e}'}), 400)


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
