# Stage 1: Build the React client
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 5011

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5011/api/health || exit 1

WORKDIR /app/server
CMD ["node", "server.js"]
