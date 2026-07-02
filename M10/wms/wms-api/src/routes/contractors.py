from typing import List

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel, ValidationError
from sqlalchemy import text

from application import logger
from database import db_engine
from contract.contractor_details import ContractorDetails
from contract.contractor_summary import ContractorSummary
from contract.contractor_status_update import ContractorStatusUpdate
from contract.errors import ErrorResponse

contractors_tag = Tag(name='Contractors', description='Contractor companies')
contractors_bp = APIBlueprint('contractors_bp', __name__, url_prefix='/contractors')


class ContractorSummaryList(RootModel[List[ContractorSummary]]):
    """List of contractors."""


class ContractorPath(BaseModel):
    id: int = Field(description='Contractor ID (party_id)')


class ContractorStatusUpdateResponse(BaseModel):
    message: str = Field(examples=['Contractor 123 status updated successfully to ACTIVE'])


@contractors_bp.get(
    '',
    tags=[contractors_tag],
    summary='Contractor list',
    description='Returns a list of contractors (companies) with basic data.',
    operation_id='getContractors',
    responses={200: ContractorSummaryList, 500: ErrorResponse},
)
def get_contractors():
    query = text('''
        SELECT
            p.party_id AS id,
            p.name,
            p.data->>'status' AS status,
            p.data->>'tax_id_number' AS tax_id_number,
            (
                SELECT json_agg(json_build_object('type', pc.type, 'details', pc.details))
                FROM party_contact pc
                WHERE pc.party_id = p.party_id
            ) AS contacts
        FROM party p
        WHERE p.data->>'type' = 'contractor_company'
        ORDER BY p.party_id;
    ''')
    with db_engine.connect() as conn:
        result = conn.execute(query)
        raw_contractors = result.mappings().all()

    contractors = []
    for raw_contractor in raw_contractors:
        try:
            contractor_data = {
                'id': str(raw_contractor['id']),
                'name': raw_contractor['name'],
                'status': raw_contractor['status'],
                'tax_id_number': raw_contractor['tax_id_number'],
                'contacts': raw_contractor['contacts'] or []
            }
            validated_contractor = ContractorSummary.from_dict(contractor_data)
            contractors.append(validated_contractor.to_dict())
        except ValidationError as e:
            logger.error(f"Data validation error for contractor data: {raw_contractor}. Error: {e}")
            return jsonify({'error': 'Internal server error: data validation failed'}), 500

    logger.info(f"Contractor validation successful for {len(contractors)} contractors")
    logger.info(f"Fetched {len(contractors)} contractors")
    return jsonify(contractors)


@contractors_bp.get(
    '/<int:id>',
    tags=[contractors_tag],
    summary='Contractor details',
    description='Returns full contractor data including addresses and representative employees.',
    operation_id='getContractorDetails',
    responses={200: ContractorDetails, 404: ErrorResponse, 500: ErrorResponse},
)
def get_contractor_details(path: ContractorPath):
    id = path.id
    query = text('''
    WITH contractor_base AS (
        SELECT
            p.party_id,
            p.name AS contractor_name,
            p.data,
            p.created_at,
            p.updated_at
        FROM party p
        WHERE p.party_id = :id AND p.data->>'type' = 'contractor_company'
    ),
    contractor_contacts AS (
        SELECT
            party_id,
            json_agg(json_build_object('type', type, 'details', details)) AS contacts
        FROM party_contact
        WHERE party_id = :id
        GROUP BY party_id
    ),
    contractor_addresses AS (
        SELECT
            party_id,
            json_agg(json_build_object(
                'address_id', address_id,
                'street_address', street_address,
                'city', city,
                'country', country,
                'postal_code', postal_code,
                'address_type', address_type
            )) AS addresses
        FROM address
        WHERE party_id = :id
        GROUP BY party_id
    ),
    employee_parties AS (
        SELECT
            pr.party_id_primary,
            p.party_id AS employee_id,
            p.name AS employee_name,
            p.data AS employee_data,
            (SELECT json_agg(json_build_object('type', pc.type, 'details', pc.details))
             FROM party_contact pc WHERE pc.party_id = p.party_id) AS contacts
        FROM party_relationship pr
        JOIN party p ON pr.party_id_secondary = p.party_id
        WHERE pr.party_id_primary = :id AND pr.relationship_type = 'REPRESENTATIVE'
    ),
    aggregated_employees AS (
        SELECT
            party_id_primary,
            json_agg(json_build_object(
                'employee_id', employee_id,
                'employee_name', employee_name,
                'employee_data', employee_data,
                'contacts', contacts
            )) AS employees
        FROM employee_parties
        GROUP BY party_id_primary
    )
    SELECT
        cb.party_id as id,
        cb.contractor_name as name,
        cb.data->>'status' as status,
        cb.data->>'tax_id_number' as tax_id_number,
        cb.created_at,
        cb.updated_at,
        cc.contacts,
        ca.addresses,
        ae.employees
    FROM contractor_base cb
    LEFT JOIN contractor_contacts cc ON cb.party_id = cc.party_id
    LEFT JOIN contractor_addresses ca ON cb.party_id = ca.party_id
    LEFT JOIN aggregated_employees ae ON cb.party_id = ae.party_id_primary;
    ''')
    with db_engine.connect() as conn:
        result = conn.execute(query, {'id': id})
        raw_contractor = result.mappings().first()
        if not raw_contractor:
            return jsonify({'error': f'Contractor id {id} not found'}), 404

    try:
        response = dict(raw_contractor)
        response['id'] = str(response['id'])
        response['contacts'] = response.get('contacts') or []
        response['employees'] = response.get('employees') or []
        response['addresses'] = response.get('addresses') or []

        for employee in response.get('employees', []):
            if 'employee_id' in employee:
                employee['employee_id'] = str(employee['employee_id'])

        contractor_details = ContractorDetails.from_dict(response).to_dict()
        logger.info(f"Contractor validation successful for {id}")
    except ValidationError as e:
        logger.error(f"Data validation error for contractor {id}: {e}, {response}")
        return jsonify({'error': 'Internal server error: data validation failed'}), 500

    logger.info(f"Fetched contractor details for {id}")
    return jsonify(contractor_details)


@contractors_bp.patch(
    '/<int:id>',
    tags=[contractors_tag],
    summary='Update contractor status',
    description='Updates contractor status (ACTIVE/INACTIVE).',
    operation_id='updateContractorStatus',
    responses={200: ContractorStatusUpdateResponse, 400: ErrorResponse, 404: ErrorResponse},
)
def update_contractor_status(path: ContractorPath, body: ContractorStatusUpdate):
    id = path.id
    new_status = body.status.value

    # IMPORTANT: SQLAlchemy has trouble in combining its own syntax (parameters starting with ":") and jsonb ("::modified")
    # For this reason the "new_status" gets injected into the string
    query = text(f"""
        UPDATE party
        SET data = jsonb_set(data, '{{status}}', to_jsonb('{new_status}'::text), true)
        WHERE party_id = :id AND data->>'type' = 'contractor_company'
        RETURNING party_id;
    """)

    with db_engine.connect() as conn:
        with conn.begin():
            result = conn.execute(query, {'id': id})
            updated_row = result.fetchone()

    if not updated_row:
        return jsonify({'error': f'Contractor with id {id} not found'}), 404

    logger.info(f"Updated status for contractor {id} to {new_status}")
    return jsonify({'message': f'Contractor {id} status updated successfully to {new_status}'}), 200
