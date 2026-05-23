FROM node:22.16-alpine3.21 AS base
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]

FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:1.27-alpine3.21 AS production
COPY --from=builder /app/dist/wms-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
