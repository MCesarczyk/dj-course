from typing import List, Optional

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.errors import ErrorResponse

employees_tag = Tag(name='Employees', description='Warehouse staff')
employees_bp = APIBlueprint('employees_bp', __name__, url_prefix='/employees')


class EmployeeListItem(BaseModel):
    employee_id: int
    employee_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[str] = None
    roles: Optional[str] = Field(default=None, description='Roles separated by commas')


class EmployeeList(RootModel[List[EmployeeListItem]]):
    """List of employees."""


class EmployeePath(BaseModel):
    employee_id: int = Field(description='Employee ID (party_id)')


_EMPLOYEE_SELECT = '''
    SELECT
        p.party_id AS employee_id,
        p.name AS employee_name,
        p.contact_email AS email,
        p.contact_phone AS phone,
        p.created_at AS hire_date,
        STRING_AGG(r.name, ', ') AS roles
    FROM
        party p
    JOIN
        party_role pr ON p.party_id = pr.party_id
    JOIN
        role r ON pr.role_id = r.role_id
    WHERE
        p.data->>'type' = 'employee'
'''

_EMPLOYEE_GROUP_ORDER = '''
    GROUP BY
        p.party_id, p.name, p.contact_email, p.contact_phone, p.created_at
    ORDER BY
        p.name;
'''


@employees_bp.get(
    '',
    tags=[employees_tag],
    summary='Employee list',
    description='Returns a list of all employees with their contact and role data.',
    operation_id='getEmployees',
    responses={200: EmployeeList},
)
def get_employees():
    query = text(_EMPLOYEE_SELECT + _EMPLOYEE_GROUP_ORDER)
    with db_engine.connect() as conn:
        result = conn.execute(query)
        employees = [dict(row) for row in result.mappings()]
    logger.info(f"Fetched {len(employees)} employees")
    return jsonify(employees)


@employees_bp.get(
    '/<int:employee_id>',
    tags=[employees_tag],
    summary='Employee details',
    description='Returns details of a single employee.',
    operation_id='getEmployee',
    responses={200: EmployeeListItem, 404: ErrorResponse},
)
def get_employee(path: EmployeePath):
    query = text(_EMPLOYEE_SELECT + ' AND p.party_id = :employee_id ' + _EMPLOYEE_GROUP_ORDER)
    with db_engine.connect() as conn:
        result = conn.execute(query, {'employee_id': path.employee_id})
        employees = [dict(row) for row in result.mappings()]
        if len(employees) == 0:
            return jsonify({'error': f'Employee id {path.employee_id} not found'}), 404
        employee = employees[0]
    logger.info(f"Fetched employee {path.employee_id}")
    return jsonify(employee)
