import time
import os
from typing import Dict

from flask import jsonify
from flask_openapi3 import APIBlueprint, Tag
from pydantic import BaseModel, Field
from sqlalchemy import text

from application import logger
from database import db_engine

health_tag = Tag(name='Health', description='Service liveness / readiness')
health_bp = APIBlueprint('health_bp', __name__, url_prefix='/health')
START_TIME = time.time()


class HealthStatus(BaseModel):
    """Service status, uptime and dependency health."""

    status: str = Field(description='Overall service status: UP or DOWN')
    timestamp: float = Field(description='Unix timestamp')
    uptime_seconds: int = Field(description='Service uptime in seconds')
    version: str = Field(description='Application version (from VERSION env var)')
    dependencies: Dict[str, str] = Field(
        description='Per-dependency status (e.g. {"postgres": "UP"})')


@health_bp.get(
    '',
    tags=[health_tag],
    summary='Service health check',
    description='Returns service status, uptime, version, and dependency status (PostgreSQL).',
    operation_id='health',
    responses={200: HealthStatus, 503: HealthStatus},
)
def health():
    logger.debug('Health check requested')

    health_status = {
        "status": "UP",
        "timestamp": time.time(),
        "uptime_seconds": int(time.time() - START_TIME),
        "version": os.environ.get("VERSION", "1.0.0"),
        "dependencies": {},
    }
    code = 200

    # Check PostgreSQL
    try:
        with db_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_status["dependencies"]["postgres"] = "UP"
    except Exception:
        health_status["dependencies"]["postgres"] = "DOWN"
        health_status["status"] = "DOWN"
        code = 503

    return jsonify(health_status), code
