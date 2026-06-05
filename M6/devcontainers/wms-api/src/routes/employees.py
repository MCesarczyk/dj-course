import json
from flask import Blueprint, jsonify, request
from application import logger
from sqlalchemy import text
from database import db_engine

employees_bp = Blueprint('employees_bp', __name__)

_SELECT_EMPLOYEES = text('''
    SELECT
        p.party_id AS employee_id,
        p.name AS employee_name,
        MAX(CASE WHEN pc.type = 'EMAIL' THEN pc.details END) AS email,
        MAX(CASE WHEN pc.type = 'PHONE' THEN pc.details END) AS phone,
        p.created_at AS hire_date,
        STRING_AGG(DISTINCT r.name, ', ') AS roles
    FROM
        party p
    JOIN
        party_role pr ON p.party_id = pr.party_id
    JOIN
        role r ON pr.role_id = r.role_id
    LEFT JOIN
        party_contact pc ON p.party_id = pc.party_id
    WHERE
        p.data->>'type' = 'employee'
    GROUP BY
        p.party_id, p.name, p.created_at
    ORDER BY
        p.name
''')

_SELECT_EMPLOYEE_BY_ID = text('''
    SELECT
        p.party_id AS employee_id,
        p.name AS employee_name,
        MAX(CASE WHEN pc.type = 'EMAIL' THEN pc.details END) AS email,
        MAX(CASE WHEN pc.type = 'PHONE' THEN pc.details END) AS phone,
        p.created_at AS hire_date,
        STRING_AGG(DISTINCT r.name, ', ') AS roles
    FROM
        party p
    JOIN
        party_role pr ON p.party_id = pr.party_id
    JOIN
        role r ON pr.role_id = r.role_id
    LEFT JOIN
        party_contact pc ON p.party_id = pc.party_id
    WHERE
        p.data->>'type' = 'employee'
        AND p.party_id = :employee_id
    GROUP BY
        p.party_id, p.name, p.created_at
    ORDER BY
        p.name
''')


@employees_bp.route('/', methods=['GET'])
def get_employees():
    with db_engine.connect() as conn:
        result = conn.execute(_SELECT_EMPLOYEES)
        employees = [dict(row) for row in result.mappings()]
    logger.info(f"Fetched {len(employees)} employees")
    return jsonify(employees)


@employees_bp.route('/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    with db_engine.connect() as conn:
        result = conn.execute(_SELECT_EMPLOYEE_BY_ID, {'employee_id': employee_id})
        rows = [dict(row) for row in result.mappings()]
    if not rows:
        return jsonify({'error': f'Employee {employee_id} not found'}), 404
    logger.info(f"Fetched employee {employee_id}")
    return jsonify(rows[0])


@employees_bp.route('/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    with db_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM party WHERE party_id = :id AND data->>'type' = 'employee'"),
            {'id': employee_id}
        ).fetchone()
        if exists is None:
            return jsonify({'error': f'Employee {employee_id} not found'}), 404
        conn.execute(text("DELETE FROM party WHERE party_id = :id"), {'id': employee_id})
        conn.commit()
    logger.info(f"Deleted employee {employee_id}")
    return '', 204


@employees_bp.route('/<int:employee_id>', methods=['PATCH'])
def patch_employee(employee_id):
    payload = request.get_json(silent=True) or {}

    with db_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM party WHERE party_id = :id AND data->>'type' = 'employee'"),
            {'id': employee_id}
        ).fetchone()
        if exists is None:
            return jsonify({'error': f'Employee {employee_id} not found'}), 404

        if 'name' in payload:
            conn.execute(
                text("UPDATE party SET name = :name, updated_at = NOW() WHERE party_id = :id"),
                {'name': payload['name'], 'id': employee_id}
            )

        if 'status' in payload:
            conn.execute(
                text("UPDATE party SET data = data || CAST(:patch AS jsonb), updated_at = NOW() WHERE party_id = :id"),
                {'patch': json.dumps({'status': payload['status']}), 'id': employee_id}
            )

        for contact_type, key in [('EMAIL', 'email'), ('PHONE', 'phone')]:
            if key in payload:
                updated = conn.execute(
                    text("UPDATE party_contact SET details = :val WHERE party_id = :id AND type = :type"),
                    {'val': payload[key], 'id': employee_id, 'type': contact_type}
                )
                if updated.rowcount == 0:
                    conn.execute(
                        text("INSERT INTO party_contact (party_id, type, details) VALUES (:id, :type, :val)"),
                        {'id': employee_id, 'type': contact_type, 'val': payload[key]}
                    )

        conn.commit()

    with db_engine.connect() as conn:
        result = conn.execute(_SELECT_EMPLOYEE_BY_ID, {'employee_id': employee_id})
        employee = dict(result.mappings().first())
    logger.info(f"Patched employee {employee_id}")
    return jsonify(employee)
