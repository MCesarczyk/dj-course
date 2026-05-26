import os
import pathlib
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy import create_engine, text

def _find_sql_init() -> pathlib.Path:
    here = pathlib.Path(__file__).parent
    candidates = [
        here.parent / "postgres" / "init-scripts" / "wms-latest.sql",         # container: /app/postgres/...
        here.parent.parent / "postgres" / "init-scripts" / "wms-latest.sql",   # host: devcontainers/postgres/...
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"wms-latest.sql not found. Checked:\n" + "\n".join(f"  {p}" for p in candidates)
    )

_SQL_INIT = _find_sql_init()

_SOCKET_CANDIDATES = [
    "/var/run/docker.sock",                                    # standard / devcontainer after rebuild
    os.path.expanduser("~/.colima/default/docker.sock"),       # Colima
    os.path.expanduser("~/.docker/run/docker.sock"),           # Docker Desktop (macOS)
    os.path.expanduser("~/.orbstack/run/docker.sock"),         # OrbStack
]


def _ensure_docker_host() -> None:
    """Set DOCKER_HOST when it's missing — Python docker SDK doesn't read CLI contexts."""
    if os.environ.get("DOCKER_HOST"):
        return
    for path in _SOCKET_CANDIDATES:
        if os.path.exists(path):
            os.environ["DOCKER_HOST"] = f"unix://{path}"
            return
    raise RuntimeError(
        "Docker socket not found. Start Docker and set DOCKER_HOST, "
        "or run: export DOCKER_HOST=unix:///path/to/docker.sock"
    )


def pytest_configure(config):
    _ensure_docker_host()
    pg = PostgresContainer("postgres:17-alpine")
    pg.start()
    config._pg_container = pg

    url = pg.get_connection_url()

    engine = create_engine(url)
    raw = engine.raw_connection()
    try:
        with raw.cursor() as cur:
            cur.execute(_SQL_INIT.read_text())
            # explicit INSERTs don't advance SERIAL sequences — reset to actual max
            cur.execute("SELECT setval('party_party_id_seq', (SELECT MAX(party_id) FROM party))")
        raw.commit()
    finally:
        raw.close()
    engine.dispose()

    os.environ.update({
        "POSTGRES_URL": url,
        "SERVICE_NAME": "wms-api-test",
        "PORT": "3001",
    })


def pytest_unconfigure(config):
    if hasattr(config, "_pg_container"):
        config._pg_container.stop()


@pytest.fixture(scope="session")
def app():
    from application import app as flask_app
    flask_app.config["TESTING"] = True
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(scope="session")
def db_engine():
    from database import db_engine as engine
    return engine


@pytest.fixture
def make_employee(db_engine):
    """
    Factory fixture: inserts an employee, yields a callable that returns party_id,
    and cleans up all created employees after the test.
    """
    created_ids = []

    def _create(name="Test Employee", status="ACTIVE", email=None, phone=None):
        with db_engine.connect() as conn:
            row = conn.execute(text("""
                INSERT INTO party (name, data)
                VALUES (:name, CAST(:data AS jsonb))
                RETURNING party_id
            """), {
                "name": name,
                "data": f'{{"type":"employee","status":"{status}"}}',
            }).fetchone()
            party_id = row[0]

            conn.execute(text(
                "INSERT INTO party_role (party_id, role_id) VALUES (:pid, 5)"
            ), {"pid": party_id})

            if email:
                conn.execute(text(
                    "INSERT INTO party_contact (party_id, type, details) VALUES (:pid, 'EMAIL', :v)"
                ), {"pid": party_id, "v": email})
            if phone:
                conn.execute(text(
                    "INSERT INTO party_contact (party_id, type, details) VALUES (:pid, 'PHONE', :v)"
                ), {"pid": party_id, "v": phone})

            conn.commit()
        created_ids.append(party_id)
        return party_id

    yield _create

    with db_engine.connect() as conn:
        for pid in created_ids:
            conn.execute(text("DELETE FROM party WHERE party_id = :id"), {"id": pid})
        conn.commit()
