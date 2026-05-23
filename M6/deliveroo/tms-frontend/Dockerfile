FROM node:22.16-alpine3.21 AS base
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,id=npm-tms-frontend,target=/root/.npm \
    npm ci && chown -R node:node /app

FROM base AS development
COPY --chown=node:node . .
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS builder
COPY --chown=node:node . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
EXPOSE 8080
