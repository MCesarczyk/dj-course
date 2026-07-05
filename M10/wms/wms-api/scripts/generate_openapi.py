#!/usr/bin/env python3
"""Regenerate the OpenAPI contract from the typed Flask routes (code-first).

The routes + Pydantic models are the single source of truth; this script dumps
the spec that flask-openapi3 builds from them. Run it whenever endpoints change:

    python scripts/generate_openapi.py                 # -> ../openapi.yaml (canonical)
    python scripts/generate_openapi.py path/to/out.yaml

No live database or real configuration is required — SQLAlchemy's create_engine
does not open a connection, so placeholder env vars are enough to import the app.
"""

import os
import sys
from pathlib import Path

# Placeholder config so `import application` succeeds off a developer machine / CI.
os.environ.setdefault('SERVICE_NAME', 'wms-api')
os.environ.setdefault('POSTGRES_URL', 'postgresql+psycopg2://user:pass@localhost:5432/db')
os.environ.setdefault('PORT', '3001')

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'src'))

import yaml  # noqa: E402
from application import app  # noqa: E402


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'openapi.yaml'
    spec = app.api_doc  # dict assembled by flask-openapi3 from the typed routes

    # Drop empty/None container keys (e.g. `securitySchemes: null`, which is
    # invalid per the OpenAPI schema) so the emitted document validates cleanly.
    components = spec.get('components')
    if isinstance(components, dict):
        for key in [k for k, v in components.items() if v in (None, {}, [])]:
            del components[key]
        if not components:
            spec.pop('components', None)
    with out_path.open('w', encoding='utf-8') as fh:
        yaml.safe_dump(spec, fh, sort_keys=False, allow_unicode=True, default_flow_style=False)
    paths = spec.get('paths', {})
    schemas = spec.get('components', {}).get('schemas', {})
    print(f"Wrote {out_path} — {len(paths)} path(s), {len(schemas)} schema(s).")


if __name__ == '__main__':
    main()
