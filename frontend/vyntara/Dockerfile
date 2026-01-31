# Multi-stage build for React frontend
FROM node:18.19.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/vyntara/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/vyntara ./

# Build application
RUN npm run build

# Production image - Nginx
FROM nginx:1.25-alpine

WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist ./

# Copy nginx configuration
COPY frontend/vyntara/nginx.conf /etc/nginx/nginx.conf

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx_user && adduser -S nginx_user -u 1001 && \
    chown -R nginx_user:nginx_user /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx_user:nginx_user /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Switch to non-root user
USER nginx_user

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
