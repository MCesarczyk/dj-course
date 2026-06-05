# Docker Best Practices — Dockerfile & Docker Compose

> Source: Developer Jutra M06 — Tomasz Ducin (11 lectures + practical tasks)

---

## Table of Contents

1. [Dockerfile — Base Image](#1-dockerfile--base-image)
2. [Dockerfile — Layer Caching & Instruction Order](#2-dockerfile--layer-caching--instruction-order)
3. [Dockerfile — RUN, COPY, ADD](#3-dockerfile--run-copy-add)
4. [Dockerfile — Security](#4-dockerfile--security)
5. [Dockerfile — .dockerignore](#5-dockerfile--dockerignore)
6. [Dockerfile — Multi-Stage Builds](#6-dockerfile--multi-stage-builds)
7. [Dockerfile — Image Size & Monitoring](#7-dockerfile--image-size--monitoring)
8. [Docker Compose — Services & Configuration](#8-docker-compose--services--configuration)
9. [Docker Compose — Networks](#9-docker-compose--networks)
10. [Docker Compose — Volumes](#10-docker-compose--volumes)
11. [Docker Compose — Environment Variables & Secrets](#11-docker-compose--environment-variables--secrets)
12. [Docker Compose — Resource Limits](#12-docker-compose--resource-limits)
13. [Docker Compose — Restart Policy & Health Checks](#13-docker-compose--restart-policy--health-checks)
14. [Docker Compose — Profiles](#14-docker-compose--profiles)
15. [Cloud Native & 12-Factor Compliance](#15-cloud-native--12-factor-compliance)
16. [Development Workflows](#16-development-workflows)

---

## 1. Dockerfile — Base Image

### Pin to exact versions — never use `latest`

```dockerfile
# BAD — non-deterministic, can break between builds
FROM node:latest
FROM node:20

# GOOD — pinned major.minor.patch + OS version
FROM node:22.19-alpine3.20

# BEST — pinned by digest (immutable)
FROM node:22.19-alpine3.20@sha256:<digest>
```

**Why:** Tags are mutable. The same tag can point to a different image tomorrow (security patches, new packages). Without pinning, two builds of the same Dockerfile may produce different results.

### Choose the smallest viable base image

| Variant | Size example (Python 3.13) | Notes |
|---|---|---|
| Full Debian (trixie) | ~400 MB | Most packages, largest attack surface |
| Slim | ~45 MB | Stripped of unnecessary tools |
| Alpine | ~18 MB | Minimal Linux, best default for most apps |
| Distroless | ~5–15 MB | No shell, no package manager — max security |

```dockerfile
# Heavy — includes hundreds of packages you likely don't use
FROM python:3.13

# Good default
FROM python:3.13-slim

# Better — Alpine is often 2× smaller than Slim
FROM python:3.13-alpine

# For production security-critical workloads
FROM gcr.io/distroless/python3
```

**Rule:** Don't pull in packages you don't need. Every extra package is a potential CVE.

### Understand the image composition

Dockerfile implements the Composite pattern. Your image inherits all layers from the base image. `node:24` builds on Debian Bookworm, which itself has hundreds of packages. Use `dive` to inspect what you're actually inheriting.

---

## 2. Dockerfile — Layer Caching & Instruction Order

### Which instructions create filesystem layers (add size)

- `FROM`, `RUN`, `COPY`, `ADD` → create new layers, change filesystem state

### Which instructions only modify metadata (zero size)

- `ARG`, `EXPOSE`, `USER`, `CMD`, `ENTRYPOINT`, `ENV`, `LABEL`, `WORKDIR` → metadata only, add no meaningful weight

### Ordering rule: least-changing → most-changing (top to bottom)

```dockerfile
# BAD — copying all source first invalidates cache on every code change
FROM node:22-alpine
WORKDIR /app
COPY . .                  # ← changes every time
RUN npm install           # ← re-runs every time even if deps didn't change

# GOOD — copy manifest first, install, then copy source
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./     # ← changes rarely
RUN npm install           # ← cached until package.json changes
COPY . .                  # ← changes often, but deps are already cached
```

**Why:** Docker caches layers sequentially. Once a layer is invalidated (its checksum changes), all subsequent layers are also invalidated. A single wrong ordering forces `npm install` / `pip install` / `mvn install` to re-run on every code change.

Apply the same principle in language-specific equivalents:

| Language | Dependency manifest |
|---|---|
| Node.js | `package.json` + `package-lock.json` |
| Python | `requirements.txt` or `pyproject.toml` |
| Java | `pom.xml` or `build.gradle` |
| Go | `go.mod` + `go.sum` |

---

## 3. Dockerfile — RUN, COPY, ADD

### Combine RUN commands to reduce layers

```dockerfile
# BAD — creates 3 layers, intermediate files may linger
RUN apt-get update
RUN apt-get install -y curl git
RUN rm -rf /var/lib/apt/lists/*

# GOOD — single layer, cache cleaned in the same step
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl git && \
    rm -rf /var/lib/apt/lists/*
```

### Don't confuse RUN and CMD

| Instruction | When it runs | Purpose |
|---|---|---|
| `RUN` | During image **build** | Install deps, compile, configure |
| `CMD` | When **container starts** | Launch the application |
| `ENTRYPOINT` | When **container starts** | Define the main executable |

```dockerfile
RUN npm run build          # compiles TypeScript at build time
CMD ["node", "dist/index.js"]  # starts the app at runtime
```

### COPY vs ADD

- Use `COPY` for straightforward file/directory copying
- `ADD` has extra features (URL fetching, auto-extraction of tarballs) — only use when those are needed
- Prefer `COPY` for clarity and predictability

### EXPOSE — document, don't assume

```dockerfile
EXPOSE 3000
```

- Documents which port the service listens on
- Does **not** publish the port to the host — that's done in `docker run -p` or Compose `ports:`
- Only expose ports the service actually uses

---

## 4. Dockerfile — Security

### Never run processes as root

Docker runs commands as `root` by default. A compromised container running as root has escalated access to the host kernel (shared via namespaces).

```dockerfile
# For Node.js — a non-root user is pre-created in official images
USER node

# For other images — create a dedicated user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Minimize attack surface

- Fewer packages → fewer CVEs
- No shell in production images (distroless) → no interactive exploitation
- Each removed tool is a removed attack vector

### Don't hardcode secrets in Dockerfile

```dockerfile
# CATASTROPHIC — leaks into image layers and git history
ENV DB_PASSWORD=supersecret
ARG API_KEY=abc123
```

Pass secrets at runtime via environment variables, Docker Secrets, or a secrets manager.

### Supply chain awareness

Docker Hub lists known vulnerabilities (CVEs) for every image version. Check them when choosing a base image. Pinning to a digest ensures you get exactly the image that was scanned.

---

## 5. Dockerfile — .dockerignore

Create `.dockerignore` alongside your Dockerfile. It works like `.gitignore` — files listed are excluded from the build context sent to the Docker daemon.

```dockerignore
# Dependencies (rebuild in the image, not copied from host)
node_modules/
vendor/
__pycache__/
*.pyc

# Version control
.git/
.gitignore

# Environment & secrets
.env
.env.*
*.pem
*.key
secrets/

# Test & dev artifacts
*.test.ts
*.spec.ts
coverage/
.pytest_cache/

# Build output (will be regenerated)
dist/
build/
target/

# IDE & OS
.vscode/
.DS_Store
*.swp
```

**Why this matters:**
- Prevents secrets from accidentally leaking into the image
- Reduces build context size → faster builds and CI/CD pipelines
- Prevents host-specific binaries (e.g., macOS `node_modules`) from polluting the image

**Rule:** Load into the image only what is necessary for the application to run.

---

## 6. Dockerfile — Multi-Stage Builds

Multi-stage builds solve the fundamental dilemma: some packages are needed to *build* the app but not to *run* it.

### Basic pattern (TypeScript Node.js)

```dockerfile
# Stage 1: install all dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: production — only the compiled output
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
```

### UI/Frontend pattern (React/Svelte/Vue → NGINX)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final image has no Node.js at all
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Development + Production in one Dockerfile

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS development
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

Build a specific stage:
```bash
docker build --target development -t myapp:dev .
docker build --target production -t myapp:prod .
```

### Benefits of multi-stage builds

| Benefit | Why it matters |
|---|---|
| Smaller image | Dev dependencies, compilers, build tools stay in builder stage |
| Smaller attack surface | No TypeScript compiler, no `npm` in production |
| Faster CI/CD | Smaller images → faster push/pull |
| Cleaner separation | Dev and prod concerns are explicit |

**Rule:** For any compiled language or UI app, multi-stage builds are the default, not the exception.

---

## 7. Dockerfile — Image Size & Monitoring

### Inspect images with `dive`

`dive` is a CLI tool that lets you inspect each layer of an image to see exactly what files were added, modified, or deleted.

```bash
# Install
brew install dive  # macOS

# Inspect an image
dive myapp:latest
dive python:3.13-slim
```

Use it to:
- Find unexpectedly large files committed to an image
- Discover devcontainer or build artifacts that shouldn't be in production
- Identify which RUN instruction caused a size spike

### Monitor image size over time

```bash
docker image ls --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

Set up size checks in CI/CD to catch regressions:
```bash
SIZE=$(docker image inspect myapp:latest --format='{{.Size}}')
MAX_SIZE=104857600  # 100MB in bytes
if [ "$SIZE" -gt "$MAX_SIZE" ]; then
  echo "Image too large: $SIZE bytes"
  exit 1
fi
```

**Rule:** A sudden jump in image size warrants investigation. With git history you can bisect which commit caused it.

### Image size hierarchy

```
distroless  ≈ 5–20 MB
alpine      ≈ 5–50 MB   ← best default
slim        ≈ 30–100 MB
full debian ≈ 100–500 MB
```

---

## 8. Docker Compose — Services & Configuration

### One entry in `services:` = one container

```yaml
services:
  api:           # Compose service name (used for internal DNS)
    container_name: my-api    # Docker Engine name (used in docker ps, logs)
    image: myapp:1.2.3        # pull from registry
    # OR
    build:
      context: ./api
      dockerfile: Dockerfile
      target: production      # multi-stage target
```

Use `image:` OR `build:` — not both simultaneously.

### Port mapping

```yaml
ports:
  - "8080:3000"   # HOST_PORT:CONTAINER_PORT
```

- Right side = port inside the container
- Left side = port on the Docker host (your machine or server)
- **Only map ports that external clients need to reach**
- Databases, caches, admin UIs → should NOT be mapped to host in production

### Labels and naming

Keep service names consistent and meaningful. The service name becomes the hostname on the Docker network — other services connect to it by name.

```yaml
services:
  postgres:
    image: postgres:17.2-alpine3.21
  redis:
    image: redis:7.4-alpine3.21
  api:
    environment:
      DB_HOST: postgres   # resolves via Docker internal DNS
      CACHE_HOST: redis
```

---

## 9. Docker Compose — Networks

Docker Compose creates a default network for all services in the file. Services on the same network can reach each other by service name.

### Limit visibility with custom networks

```yaml
services:
  nginx:
    networks: [frontend, internal]

  api:
    networks: [internal, backend]

  postgres:
    networks: [backend]  # only api can reach postgres

  redis:
    networks: [backend]

networks:
  frontend:   {}
  internal:   {}
  backend:    {}
```

**Rule:** Databases and admin UIs should only be reachable through internal networks, not from the public-facing network. If a service can't reach postgres by name, check network assignments first.

### Reverse proxy for external exposure

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    networks: [frontend, internal]

  api:
    networks: [internal, backend]
    # no ports: — not directly accessible from outside

  postgres:
    networks: [backend]
    # no ports: — only reachable by api
```

Only `nginx` is exposed. Everything else communicates through internal Docker networks.

---

## 10. Docker Compose — Volumes

### Named volumes (persistent, survive container destruction)

```yaml
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Use for: databases, stateful services where data must survive restarts.

### Bind mounts (map host path into container)

```yaml
services:
  api:
    volumes:
      - ./src:/app/src   # host path : container path
```

Use for: development hot-reload, injecting config files, sharing code.

### Clean up volumes when tearing down

```bash
# Removes containers AND named volumes defined in the file
docker compose down -v
```

Without `-v`, named volumes persist. This is intentional for databases in production, but in development it causes stale data to accumulate.

### Don't use bind mounts in production images

Source code bind mounts make sense in development (instant code changes without rebuild). In production, the code should be baked into the image — any code outside the image is not version-controlled.

---

## 11. Docker Compose — Environment Variables & Secrets

### Hierarchy from worst to best

```
Hardcoded in Dockerfile ENV     ← never, leaks into image layers
Hardcoded in docker-compose.yml ← never, commits to git
.env file (gitignored)          ← ok for dev, never commit
Environment variables at runtime← ok
Docker Secrets                  ← good for production
HashiCorp Vault / cloud secrets ← best practice for production
```

### Using .env files

```yaml
# docker-compose.yml
services:
  api:
    env_file:
      - .env
```

```bash
# .env (gitignored)
DB_PASSWORD=localdevpassword
API_KEY=devapikey123
```

### Docker Secrets (production)

```yaml
services:
  api:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password  # path, not value

secrets:
  db_password:
    file: ./secrets/db_password.txt  # encrypted at rest
```

In the application, read from the file path, not from env var directly. Secrets are:
- Encrypted at rest
- Only accessible to containers that declare them
- Not visible in `docker inspect` environment output

### Never log environment variables

Env vars can accidentally end up in application logs. Use structured logging that explicitly excludes sensitive keys.

---

## 12. Docker Compose — Resource Limits

Without limits, a single runaway container can starve all others on the same host.

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: '0.5'
        reservations:
          memory: 256m
          cpus: '0.25'
```

**How limits work (Linux cgroups):**
- `memory` limit → OOM killer terminates the container if exceeded (not the host)
- `cpus` → proportional share of CPU cycles (default 1024 shares)

**Set limits even in development** to:
- Understand actual resource consumption before deploying to production
- Prevent a misconfigured dev service from locking up your laptop
- Establish a baseline for production sizing

**Rule:** Don't pick limits from thin air — measure during development and load testing first.

---

## 13. Docker Compose — Restart Policy & Health Checks

### Restart policies

```yaml
services:
  api:
    restart: unless-stopped   # restart unless explicitly stopped — good default

  postgres:
    restart: always           # always restart — careful with misconfigured containers
                              # can cause infinite crash-loop

  worker:
    restart: on-failure       # only restart on non-zero exit code
```

**Warning:** `restart: always` on a misconfigured container creates an infinite restart loop. Use `unless-stopped` or `on-failure` with a backoff strategy where possible.

### Health checks

```yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  api:
    depends_on:
      postgres:
        condition: service_healthy  # wait for postgres to be truly ready
```

**Why `depends_on` alone is not enough:** `depends_on` without `condition: service_healthy` only waits for the container to *start*, not for the service inside to be *ready*. PostgreSQL needs time to initialize — without health checks, the API starts before the database accepts connections.

---

## 14. Docker Compose — Profiles

Profiles let you selectively start services depending on the use case without maintaining multiple Compose files.

```yaml
services:
  api:
    # no profile — always starts
    image: myapp:latest

  postgres:
    # no profile — always starts
    image: postgres:17-alpine

  pgadmin:
    image: dpage/pgadmin4:8.6
    profiles: [dev, debug]   # only starts when profile is active

  load-test:
    image: grafana/k6
    profiles: [perf]
```

```bash
# Default: starts api + postgres
docker compose up

# Dev mode: starts api + postgres + pgadmin
docker compose --profile dev up

# Performance test: starts api + postgres + load-test
docker compose --profile perf up
```

**Use profiles for:**
- Admin UIs (pgAdmin, Mongo Express, Redis Commander) — dev only
- Load testing tools — CI/perf only
- Debug sidecars — troubleshooting only
- Different server types — dev vs prod application server

---

## 15. Cloud Native & 12-Factor Compliance

These principles (from 12factor.net) directly influence how you design containers:

### Config stored outside the container

```dockerfile
# BAD — hardcoded config requires image rebuild to change
ENV DB_HOST=192.168.1.10
ENV DB_NAME=myapp_prod
```

```yaml
# GOOD — injected at runtime, same image for all environments
environment:
  DB_HOST: ${DB_HOST}
  DB_NAME: ${DB_NAME}
```

**Rule:** Never hardcode environment-specific values. The same image should run in dev, staging, and production — only configuration differs.

### Stateless application processes

Application containers (servers, APIs) must not write to local disk in ways that affect their state. If a container is killed and replaced by a new one, the new one must work identically.

```
Stateless (correct):  reads/writes go to external database, cache, object storage
Stateful (wrong):     writes session files to local /tmp, uploads to local /data
```

Kubernetes Deployments enforce this by potentially running the same service on different nodes. Local disk state is lost on reschedule.

### Build → Release → Run as separate stages

```
Build:   docker build -t myapp:1.2.3 .
Release: tag image + inject environment-specific config
Run:     docker run / docker compose up / kubectl apply
```

- One image, multiple releases (same image + different env vars = different release)
- Never rebuild the image just to change a config value
- CI builds the image once; CD deploys it to multiple environments

### Treat external services as attached resources

Database, cache, message queue — all accessed via URL/credentials injected at runtime. If the database host changes (failover, migration), no image rebuild should be required.

---

## 16. Development Workflows

### When to rebuild the image

Rebuild when:
- Dockerfile changes
- Dependencies change (`package.json`, `requirements.txt`, etc.)
- Base image is updated

Do NOT rebuild when:
- Only application source code changes (if using bind mounts in dev)

**Common mistake:** Stopping and restarting a container without rebuilding — it uses the old image. Always rebuild after dependency changes.

```bash
# Force rebuild and restart
docker compose up --build
```

### Dev Containers (VS Code)

Dev Containers run VS Code's language server *inside* the container, giving you:
- Correct language runtime for IntelliSense (matches production)
- Ability to install/uninstall dependencies live without rebuilding
- Direct terminal access inside the running container

**How it differs from normal Docker:** The container's `CMD` is NOT started automatically. You control the process manually — kill it, modify deps, restart it without destroying the container.

**Trade-offs:**
- First build is slow (VS Code server layers added to image)
- Can be resource-heavy on older machines
- Complex multi-container setups add friction

### Compose Watch (lighter alternative to Dev Containers)

```yaml
services:
  api:
    develop:
      watch:
        - action: sync+restart
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```

- `sync` — copy changed files into running container
- `sync+restart` — copy + restart the process (no container rebuild)
- `rebuild` — full image rebuild (needed for dependency changes)

```bash
docker compose watch
```

### exec into a running container for debugging

```bash
# Interactive shell
docker exec -it my-container sh

# Run a one-off command
docker exec my-container cat /etc/hosts

# Connect to PostgreSQL directly
docker exec -it postgres-container psql -U admin -d mydb
```

### Clean up

```bash
# Stop and remove containers + networks
docker compose down

# Also remove named volumes (data!)
docker compose down -v

# Remove all unused images, containers, volumes, networks
docker system prune -a
```

---

## Quick Reference Checklist

### Dockerfile

- [ ] Base image pinned to exact version (major.minor.patch + OS)
- [ ] Smallest viable base image (Alpine > Slim > full)
- [ ] `.dockerignore` present and comprehensive
- [ ] Dependency manifest copied and installed BEFORE source code
- [ ] Multiple shell commands combined in single `RUN` with `&&`
- [ ] Cache cleaned in same `RUN` step (`rm -rf /var/lib/apt/lists/*`)
- [ ] No secrets in `ENV` or `ARG`
- [ ] `USER` set to non-root before `CMD`
- [ ] Only necessary ports `EXPOSE`d
- [ ] Multi-stage build used (for compiled/built apps)
- [ ] Image size monitored (baseline + CI check)

### Docker Compose

- [ ] No `latest` tags on any image
- [ ] No hardcoded secrets (use env vars, `.env` files, or Docker Secrets)
- [ ] Database and admin UI ports NOT mapped to host in production
- [ ] Custom networks used to limit service visibility
- [ ] Resource limits set (`memory`, `cpus`)
- [ ] Restart policy explicitly defined
- [ ] Health checks configured for stateful services
- [ ] `depends_on` uses `condition: service_healthy` (not just started)
- [ ] `docker compose down -v` used during dev to avoid stale volumes
- [ ] Profiles used to separate dev/debug/prod services
- [ ] Application containers are stateless (no local state on disk)
- [ ] Config injected via environment (no hardcoded hosts, ports, names)
