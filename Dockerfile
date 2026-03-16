# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lockb* package-lock.json* yarn.lock* ./

# Use npm since the server uses standard Docker tooling
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copy source and build
COPY . .

# Build with production API URL pointing to same-origin /api (proxied by nginx)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA nginx config
COPY nginx.react.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
