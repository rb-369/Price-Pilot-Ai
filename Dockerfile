# ── Stage 1: Build the React client ──
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ──
FROM node:20-alpine AS server
RUN apk add --no-cache tini && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install production deps only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy server source
COPY server/ ./server/

# Copy client build artifacts
COPY --from=client-build /app/client/dist ./client/dist

# Drop privileges
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

# tini reaps zombie processes and forwards signals (SIGTERM, etc.) for graceful shutdown
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /app/server
CMD ["node", "server.js"]
