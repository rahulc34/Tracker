#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci --include=dev
npm run prisma:generate
npm run build:backend
# Proxy /api and /health to the co-located Express process (see scripts/render-start.sh).
export TRACKER_PROXY_API=true
export NEXT_PUBLIC_TRACKER_PROXY_API=true
npm run build:frontend
