from flask import request
from flask_openapi3 import OpenAPI, Info, Server
from flask_cors import CORS
import os
import re
from env import assert_env_var
from logger import logger

# register blueprints
from routes.health import health_bp
from routes.payments import payments_bp
from routes.storage import storage_bp
from routes.employees import employees_bp
from routes.contractors import contractors_bp
# warehouse-structure CRUD
from routes.warehouses import warehouses_bp
from routes.zones import zones_bp
from routes.aisles import aisles_bp
from routes.racks import racks_bp
from routes.shelves import shelves_bp
from routes.inventory import inventory_bp

assert_env_var('SERVICE_NAME')
SERVICE_NAME = os.environ.get('SERVICE_NAME')

# Code-first OpenAPI: the contract is derived from the typed routes below.
# flask-openapi3 serves the interactive docs (Swagger UI at /openapi/swagger)
# and exposes the generated spec dict as `app.api_doc` for offline regeneration.
_info = Info(
    title='WMS API (Warehouse Management System)',
    version=os.environ.get('VERSION', '1.0.0'),
    description='API for warehouse management - employees, contractors, '
                'payments, storage event history, inventory state.',
)
app = OpenAPI(SERVICE_NAME, info=_info, servers=[Server(url='/', description='Base API URL')])

_cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:4200')
CORS(app, origins=[o.strip() for o in _cors_origins.split(',') if o.strip()])

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.url}")
    # logger.info(f"Request: {request.method} {request.url} {request.headers}")

# Typed APIBlueprints (code-first contract). Each declares its own url_prefix;
# register via register_api so every route contributes to the generated spec.
app.register_api(health_bp)
app.register_api(payments_bp)
app.register_api(storage_bp)
app.register_api(employees_bp)
app.register_api(contractors_bp)
# warehouse-structure CRUD (plural collections; '/warehouse/<id>' employees route is kept as-is)
app.register_api(warehouses_bp)
app.register_api(zones_bp)
app.register_api(aisles_bp)
app.register_api(racks_bp)
app.register_api(shelves_bp)
app.register_api(inventory_bp)
