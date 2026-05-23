FROM node:22.16-bullseye-slim AS base
WORKDIR /app
COPY package.json .npmrc ./
RUN --mount=type=cache,id=npm-customer-portal,target=/root/.npm \
    npm install && chown -R node:node /app

FROM base AS development
COPY --chown=node:node . .
ENV NODE_ENV=development
USER node
EXPOSE 3002
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY --chown=node:node . .
ENV NODE_ENV=production
RUN --mount=type=cache,id=vite-customer-portal,target=/app/node_modules/.vite \
    --mount=type=cache,id=nuxt-customer-portal,target=/app/node_modules/.cache \
    npm run build

FROM alpine:3.21 AS production
RUN apk add --no-cache libstdc++ libgcc
COPY --from=node:22.16-alpine3.21 /usr/local/bin/node /usr/local/bin/node
RUN addgroup -S node && adduser -S -G node node
WORKDIR /app
COPY --from=builder --chown=node:node /app/.output ./.output
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
