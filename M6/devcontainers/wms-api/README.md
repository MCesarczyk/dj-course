# wms-api

Python/Flask REST API for the WMS (Warehouse Management System) service.

## Running the app

### Dev (Flask dev server + compose watch)

```bash
docker compose -f ../docker-compose-wms.yml --profile dev up
docker compose -f ../docker-compose-wms.yml --profile dev watch
```

### Prod (Gunicorn, 4 workers)

```bash
docker compose -f ../docker-compose-wms.yml --profile prod up
```

API is available at `http://localhost:3001` directly, or via nginx at `http://localhost:8080`.

---

## Running tests

Tests use **Testcontainers** — each run spins up a fresh PostgreSQL container, loads the full schema + seed data, runs all tests, then tears the container down.

### Prerequisites

- Docker running (Colima, Docker Desktop, or OrbStack)
- Python 3.12+
- Test dependencies installed

```bash
pip install -r requirements-test.txt
```

### Option A — inside the dev container (recommended)

The dev container has the Docker socket mounted, so Testcontainers works out of the box:

```bash
# exec into the running dev container
docker exec -it wms-api-container bash

cd /app
pytest -v
```

Or in one line:

```bash
docker exec -it wms-api-container bash -c "cd /app && pytest -v"
```

### Option B — on the host (macOS)

Python's Docker SDK does not read Docker CLI contexts, so `DOCKER_HOST` must be set explicitly.

**Colima:**
```bash
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
pytest -v
```

**Docker Desktop:**
```bash
export DOCKER_HOST="unix://${HOME}/.docker/run/docker.sock"
pytest -v
```

**OrbStack:**
```bash
export DOCKER_HOST="unix://${HOME}/.orbstack/run/docker.sock"
pytest -v
```

The `conftest.py` also auto-detects the socket if `DOCKER_HOST` is not set, checking the paths above in order.

### Useful pytest flags

```bash
pytest -v                                          # verbose — shows each test name
pytest -x                                          # stop on first failure
pytest -s                                          # show stdout / Flask logs
pytest tests/test_employees.py::TestDeleteEmployee # single class
pytest tests/test_employees.py::TestPatchEmployee::test_patch_name  # single test
```

---

## How it works

```
tests/
  conftest.py       # starts PostgresContainer, seeds DB, provides fixtures
  test_employees.py # CRUD tests: GET /employees, DELETE /employees/<id>, PATCH /employees/<id>
pytest.ini          # pythonpath = src, testpaths = tests
requirements-test.txt
```

`conftest.py` lifecycle:

1. `pytest_configure` — detects Docker socket, starts `postgres:17-alpine` container
2. Loads `../postgres/init-scripts/wms-latest.sql` via raw psycopg2 connection
3. Resets SERIAL sequences (init script uses explicit IDs)
4. Sets `POSTGRES_URL`, `SERVICE_NAME`, `PORT` env vars before Flask is imported
5. `pytest_unconfigure` — stops and removes the container

Each test uses the `make_employee` factory fixture to insert isolated test data and clean up after itself.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/employees/` | List all employees |
| GET | `/employees/<id>` | Get single employee |
| DELETE | `/employees/<id>` | Delete employee (cascades contacts & roles) |
| PATCH | `/employees/<id>` | Update `name`, `status`, `email`, `phone` |
| GET | `/warehouse/` | List warehouses |
| GET | `/contractors/` | List contractors |
| GET | `/storage/` | Storage requests |
| GET | `/payments/` | Payments |
