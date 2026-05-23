FROM node:22.16-bullseye-slim AS base
WORKDIR /app
COPY package.json .npmrc ./
RUN npm install

FROM base AS development
COPY . .
ENV NODE_ENV=development
EXPOSE 3002
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22.16-alpine3.21 AS production
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
