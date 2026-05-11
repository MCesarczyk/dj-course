# Docker Cheatsheet — Dockerfile & Compose Quick Reference
> Source: Developer Jutra M06 — Tomasz Ducin

---

## Dockerfile

### Base Image
```dockerfile
FROM node:22.19-alpine3.20          # pin major.minor.patch + OS — never :latest
FROM node:22.19-alpine3.20@sha256:… # best: pin by digest (immutable)
```
| Variant | Size | Use |
|---|---|---|
| full Debian | ~400 MB | avoid |
| slim | ~45 MB | fallback |
| alpine | ~18 MB | **default** |
| distroless | ~5–15 MB | prod, max security |

### Layer Caching — order: least-changing → most-changing
```dockerfile
COPY package*.json ./   # ← rarely changes → cached
RUN npm ci              # ← re-runs only if manifest changed
COPY . .                # ← changes often, deps already cached
```

### RUN / COPY / ADD
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*   # combine + clean in one layer
```
- `COPY` for files; `ADD` only when you need URL fetch or tarball extraction
- `RUN` = build time; `CMD` = container start; `ENTRYPOINT` = main executable

### Security
```dockerfile
USER node                              # official images: built-in non-root user
RUN addgroup -S app && adduser -S app -G app && USER app  # custom image
# NEVER: ENV DB_PASSWORD=secret / ARG API_KEY=… → leaks into layers
```

### .dockerignore (always include)
```
node_modules/  .git/  .env  .env.*  *.pem  dist/  build/  coverage/  .DS_Store
```

### Multi-Stage Build
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production    # or: FROM nginx:alpine for SPA → no Node.js
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]

# Build specific stage:  docker build --target production -t myapp:prod .
```

### Image Size Check
```bash
dive myapp:latest                                         # inspect layers
docker image inspect myapp:latest --format='{{.Size}}'   # bytes
```

---

## Docker Compose

### Services & Ports
```yaml
services:
  api:
    build: { context: ./api, target: production }
    ports: ["8080:3000"]          # HOST:CONTAINER — only expose what clients need
  postgres:
    image: postgres:17.2-alpine3.21
    # no ports: — internal only; connect by service name (DNS)
```

### Networks — limit visibility
```yaml
services:
  nginx:    { networks: [frontend, internal] }
  api:      { networks: [internal, backend] }
  postgres: { networks: [backend] }           # invisible to nginx/frontend
networks:
  frontend: {}
  internal: {}
  backend: {}
```

### Volumes
```yaml
postgres: { volumes: ["postgres_data:/var/lib/postgresql/data"] }  # named — persists
api:      { volumes: ["./src:/app/src"] }                          # bind — dev only
volumes:
  postgres_data:
# docker compose down -v   → also removes named volumes
```

### Secrets — hierarchy (worst → best)
```
ENV in Dockerfile          ✗ leaks into layers + git
hardcoded in compose.yml   ✗ committed to git
.env file (gitignored)     ✓ dev only
env vars at runtime        ✓ ok
Docker Secrets             ✓ production
Vault / cloud secrets      ✓ best practice
```
```yaml
secrets:
  db_password: { file: ./secrets/db_password.txt }
services:
  api:
    secrets: [db_password]
    environment: { DB_PASSWORD_FILE: /run/secrets/db_password }
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:     { memory: 512m, cpus: '0.5' }
    reservations: { memory: 256m, cpus: '0.25' }
```

### Restart Policy & Health Checks
```yaml
restart: unless-stopped              # good default
restart: on-failure                  # workers
restart: always                      # careful — can loop on misconfigured containers

healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
  interval: 10s  timeout: 5s  retries: 5  start_period: 30s

depends_on:
  postgres: { condition: service_healthy }   # not just "started"
```

### Profiles
```yaml
pgadmin:  { image: dpage/pgadmin4, profiles: [dev] }
load-test: { image: grafana/k6,    profiles: [perf] }
# docker compose --profile dev up
```

### Dev Workflows
```yaml
develop:
  watch:
    - { action: sync+restart, path: ./src,       target: /app/src }
    - { action: rebuild,      path: package.json }
# docker compose watch
```
```bash
docker compose up --build          # force rebuild
docker exec -it <container> sh     # debug shell
docker system prune -a             # clean all unused resources
```

---

## 12-Factor Rules
| Rule | Do | Don't |
|---|---|---|
| Config | inject via env vars (`${DB_HOST}`) | hardcode in image |
| Stateless | write to DB / object storage | write to local disk |
| Build/Release/Run | one image, many envs | rebuild per env |
| Attached resources | connect via URL at runtime | embed connection strings |

---

## Checklist
**Dockerfile** — `[ ]` pin version `[ ]` alpine/distroless `[ ]` .dockerignore `[ ]` deps before src `[ ]` combine RUN+clean `[ ]` no secrets in ENV/ARG `[ ]` USER non-root `[ ]` multi-stage

**Compose** — `[ ]` no :latest `[ ]` no hardcoded secrets `[ ]` DB port not exposed `[ ]` custom networks `[ ]` resource limits `[ ]` restart policy `[ ]` healthchecks `[ ]` service_healthy `[ ]` profiles `[ ]` stateless app
