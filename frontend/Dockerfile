# Build from Tracker root: docker build -f frontend/Dockerfile .
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci --workspace @tracker/frontend --include-workspace-root

FROM deps AS builder
COPY frontend frontend

ARG NEXT_PUBLIC_TRACKER_API_URL
ARG NEXT_PUBLIC_DEFAULT_USER_ID=00000000-0000-4000-8000-000000000001
ENV NEXT_PUBLIC_TRACKER_API_URL=$NEXT_PUBLIC_TRACKER_API_URL
ENV NEXT_PUBLIC_DEFAULT_USER_ID=$NEXT_PUBLIC_DEFAULT_USER_ID
ENV NODE_ENV=production

RUN npm run build --workspace @tracker/frontend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup -S tracker && adduser -S tracker -G tracker

COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

USER tracker
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/ || exit 1

CMD ["node", "frontend/server.js"]
