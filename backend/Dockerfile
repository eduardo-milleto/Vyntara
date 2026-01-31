# Multi-stage build for Node.js backend
FROM node:18.19.0-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies with production flag
RUN npm ci && npm ci --prefix backend

# Copy source code
COPY backend ./backend

# Build backend (if needed)
RUN npm run build --prefix backend 2>/dev/null || true

# Production image
FROM node:18.19.0-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend ./backend

COPY --chown=nodejs:nodejs backend ./backend

# Create necessary directories
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${PORT:-3000}

# Environment
ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "backend/services/index.js"]
