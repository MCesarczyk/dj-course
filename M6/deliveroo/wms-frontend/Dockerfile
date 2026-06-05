FROM node:22.16-alpine3.21 AS base
WORKDIR /app
COPY package*.json .npmrc ./
RUN --mount=type=cache,id=npm-wms-frontend,target=/root/.npm \
    npm ci && chown -R node:node /app

FROM base AS development
COPY --chown=node:node . .
USER node
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]

FROM base AS builder
COPY --chown=node:node . .
RUN --mount=type=cache,id=angular-cache-wms,target=/app/.angular/cache \
    npm run build

FROM builder AS compressor
RUN find /app/dist/wms-frontend/browser -type f \( -name "*.js" -o -name "*.css" \) \
    -exec sh -c 'gzip -9 -c "$1" > "$1.tmp" && mv "$1.tmp" "$1"' _ {} \;

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
COPY --from=compressor --chown=nginx:nginx /app/dist/wms-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
