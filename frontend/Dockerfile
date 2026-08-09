# PratiDhwani Frontend — React + Vite, served as a static build via nginx
#
#   docker build -f pratidhwani/Dockerfile -t pratidhwani-frontend ./pratidhwani

# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Note: the frontend calls the backend at the hardcoded URL already baked
# into src/services/api.js (http://127.0.0.1:8000). That code is
# intentionally untouched here — as long as the backend container
# publishes port 8000 to the host (see docker-compose.yml), requests from
# the browser reach it correctly without any build-time configuration.
RUN npm run build

# --- Serve stage -------------------------------------------------------------
FROM nginx:1.27-alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
