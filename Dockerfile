# ── Client Build ──
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Server ──
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy server source
COPY server/ ./server/

# Copy client build for static serving
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 5000

WORKDIR /app/server
CMD ["node", "server.js"]
