from flask import Flask, request
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

app = Flask(SERVICE_NAME)

_cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:4200')
CORS(app, origins=[o.strip() for o in _cors_origins.split(',') if o.strip()])

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.url}")
    # logger.info(f"Request: {request.method} {request.url} {request.headers}")

app.register_blueprint(health_bp, url_prefix='/health')
app.register_blueprint(payments_bp, url_prefix='/payments')
app.register_blueprint(storage_bp, url_prefix='/storage')
app.register_blueprint(employees_bp, url_prefix='/employees')
app.register_blueprint(contractors_bp, url_prefix='/contractors')
# warehouse-structure CRUD (plural collections; '/warehouse/<id>' employees route is kept as-is)
app.register_blueprint(warehouses_bp, url_prefix='/warehouses')
app.register_blueprint(zones_bp, url_prefix='/zones')
app.register_blueprint(aisles_bp, url_prefix='/aisles')
app.register_blueprint(racks_bp, url_prefix='/racks')
app.register_blueprint(shelves_bp, url_prefix='/shelves')
app.register_blueprint(inventory_bp, url_prefix='/inventory')
