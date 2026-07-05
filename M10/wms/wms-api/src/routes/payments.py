from typing import List, Optional

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field, RootModel
from sqlalchemy import text

from application import logger
from database import db_engine

payments_tag = Tag(name='Payments', description='Storage payments')
payments_bp = APIBlueprint('payments_bp', __name__, url_prefix='/payments')


class PaymentQuery(BaseModel):
    status: Optional[str] = Field(default=None, description='Filter by payment status')
    party_id: Optional[int] = Field(default=None, description='Filter by party ID (contractor)')


class Payment(BaseModel):
    payment_id: int
    storage_record_id: Optional[int] = None
    party_id: Optional[int] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    payment_date: Optional[str] = None
    external_reference: Optional[str] = None


class PaymentList(RootModel[List[Payment]]):
    """List of payments."""


@payments_bp.get(
    '',
    tags=[payments_tag],
    summary='Payment list',
    description='Returns a list of payments with optional filtering by status and party_id.',
    operation_id='getPaymentsList',
    responses={200: PaymentList},
)
def get_payments_list(query: PaymentQuery):
    base_query = '''
        SELECT
            payment_id,
            storage_record_id,
            party_id,
            amount,
            currency,
            status,
            payment_date,
            external_reference
        FROM
            payment
    '''
    filters = []
    params = {}
    if query.status:
        filters.append('status = :status')
        params['status'] = query.status
    if query.party_id is not None:
        filters.append('party_id = :party_id')
        params['party_id'] = query.party_id
    if filters:
        base_query += ' WHERE ' + ' AND '.join(filters)
    base_query += '\nORDER BY payment_date NULLS LAST, payment_id;'
    with db_engine.connect() as conn:
        result = conn.execute(text(base_query), params)
        payments = [dict(row) for row in result.mappings()]
    logger.info(f"Fetched {len(payments)} payments with filters: "
                f"status={query.status}, party_id={query.party_id}")
    return jsonify(payments)
