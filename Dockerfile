# Build frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build backend
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production runtime
FROM node:22-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
