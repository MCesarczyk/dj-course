# Docker Best Practices

> Source: Developer Jutra M06 — Tomasz Ducin

---

## Images

**Pin versions — never trust `:latest`.**
Tags are mutable. The same tag can point to a different image tomorrow. Pin to `major.minor.patch+OS` (e.g. `node:22.19-alpine3.20`). Use digest pinning for maximum reproducibility.

**Use the smallest viable base image.**
Every extra package is a potential vulnerability. Prefer Alpine over Slim over full Debian. For production security-critical workloads, consider distroless — no shell, no package manager, minimal attack surface.

**Never run as root.**
Docker containers share the host kernel. A compromised root container has escalated access. Use `USER node` in Node.js images or create a dedicated non-root user. Root is a default, not a requirement.

**Never put secrets in the image.**
`ENV DB_PASSWORD=…` and `ARG API_KEY=…` bake secrets into image layers permanently — visible in `docker history`, leaked to anyone who pulls the image. Inject secrets at runtime.

**One image, many environments.**
Build once, deploy everywhere. The same image should run in dev, staging, and production. If you're rebuilding the image to change a config value, something is wrong.

---

## Dockerfile

**Order instructions from least-changing to most-changing.**
Docker invalidates all layers below a changed layer. Copy dependency manifests first, install, then copy source code. A misplaced `COPY . .` forces dependency reinstall on every code change.

**Clean up in the same `RUN` step.**
Files deleted in a later `RUN` still exist in the previous layer and bloat the image. Update, install, and clean the package cache in one chained command.

**Always include `.dockerignore`.**
Without it, the entire build context (including `.git`, `node_modules`, `.env`, secrets) is sent to the Docker daemon. `.dockerignore` is not optional — it's a security boundary.

**Use multi-stage builds for anything that has a build step.**
Dev dependencies, compilers, and build tools have no place in production images. Build in one stage, copy only the output to the final stage. A TypeScript compiler should never ship to production.

---

## Images & Dockerfile (advanced)

**Use Exec Form for signals.**  
Always use `CMD ["node", "app.js"]`. The shell form (`CMD node app.js`) prevents your app from receiving `SIGTERM`, leading to "hard kills" instead of graceful shutdowns.  


**Leverage BuildKit Cache Mounts.**  
Use `RUN --mount=type=cache,target=/root/.npm npm install`. This persists package manager caches between builds without adding layers to the final image.  


**Adopt "Allow-list" `.dockerignore`.**  
Start with `*` (ignore all), then use `!src/` to explicitly allow files. This is safer than blacklisting and prevents accidental secret leaks.

**Multi-platform builds.**  
Use `docker buildx` to build for both `arm64` and `amd64`. This prevents `exec format error` when moving between M-series Macs and Linux servers.

---

## Docker Compose

**Only expose ports that external clients actually need.**
Databases, caches, and admin UIs should not be mapped to the host in production. Use internal Docker networks for service-to-service communication — services reach each other by name, not by port.

**Use custom networks to limit who can talk to whom.**
The default network lets every service reach every other service. Define explicit networks so your database is only reachable by the API, not by the public-facing frontend.

**Health checks are not optional for stateful services.**
`depends_on` without `condition: service_healthy` only waits for the container to start, not for the service inside to be ready. A database container running does not mean the database accepts connections.

**Set resource limits — even in development.**
Without limits, one runaway container starves all others. Limits also force you to understand actual resource consumption before production, where surprises are expensive.

**Choose restart policy deliberately.**
`always` can create an infinite crash loop on a misconfigured container. `unless-stopped` is the safer default. `on-failure` makes sense for workers and batch jobs.

**Application containers must be stateless.**
If a container is killed and replaced, the new instance must work identically. Writes go to external databases, object storage, or caches — never to the container's local filesystem.

**Config is not part of the image — it is injected at runtime.**
Hardcoded hostnames, ports, and credentials make images environment-specific. Environment variables are the contract between the image and its deployment context.

---

## Docker Compose & Runtime (advanced)

**Read-only Filesystems.**  
Use `read_only: true` in Compose. Combine with `tmpfs` for directories requiring writes (e.g., `/tmp`). It prevents attackers from modifying code or installing scripts at runtime.

**Reap zombies with `init: true`.**  
Containers lack a full init system. Adding `init: true` uses a tiny init binary (like `tini`) to correctly manage signals and clean up orphaned (zombie) processes.

**Modular Compose with `include`.**  
Avoid monolith files. Use `include: [db.yml, app.yml]` to split configurations into logical, reusable stacks.

**12-Factor Logging.**  
Log strictly to `stdout` and `stderr`. Let the Docker logging driver (Loki, ELK, GELF) handle persistence. Never write logs to files inside the container.

---

## General

**Understand what you inherit.**
Your image is not just your Dockerfile — it's every layer from the base image down. Use `dive` to inspect what you're actually shipping. A sudden size increase warrants investigation.

**Secrets have a hierarchy. Respect it.**
From worst to best: hardcoded in image → hardcoded in Compose file → `.env` file → runtime env vars → Docker Secrets → dedicated secrets manager. Move up the hierarchy as the deployment gets closer to production.

**Containers are cattle, not pets.**
Any container should be replaceable at any time without data loss or behavior change. If losing a container causes a problem, the problem is in the architecture, not the container.

## Advanced Checklist

- [ ] **Signal Handling:** `CMD`/`ENTRYPOINT` use `["JSON", "array"]` format.
- [ ] **Process Management:** `init: true` is enabled for apps with child processes.
- [ ] **Filesystem:** `read_only: true` is enabled where possible.
- [ ] **Build Speed:** BuildKit `--mount=type=cache` is used for dependencies.
- [ ] **Security:** Image scanning (Trivy/Snyk) is integrated into CI.
- [ ] **Architecture:** Build targets the correct CPU architecture (Buildx).
- [ ] **Logs:** App writes exclusively to `stdout`/`stderr`.
