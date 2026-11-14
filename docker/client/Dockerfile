# syntax=docker/dockerfile:1
# Frontend (React build served by nginx, which also proxies /api and /socket.io
# to the backend). Build context: repository root.

FROM node:24-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# Same-origin API: nginx proxies /api -> backend, so the bundle needs no host name.
ARG REACT_APP_API_URL=/api
# Sub-path the app is served from, e.g. /mangrove-guard (empty = site root).
# Prefixes asset URLs and is the React Router basename.
ARG PUBLIC_URL=
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    PUBLIC_URL=${PUBLIC_URL} \
    GENERATE_SOURCEMAP=false
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
# Backend address (host:port) used by the nginx proxy; override per environment.
ENV API_UPSTREAM=server:5000
COPY docker/client/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
