FROM node:22.16-alpine3.21 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:1.27-alpine3.21 AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
