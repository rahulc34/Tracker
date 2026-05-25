# Build from Tracker root: docker build -f backend/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace @tracker/backend --include-workspace-root

FROM deps AS builder
COPY backend/prisma backend/prisma
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src backend/src
RUN npm run build --workspace @tracker/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S tracker && adduser -S tracker -G tracker

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/src/generated ./backend/src/generated
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

WORKDIR /app/backend
RUN chmod +x docker-entrypoint.sh && chown -R tracker:tracker /app

USER tracker
EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4001/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
