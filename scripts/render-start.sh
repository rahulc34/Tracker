#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${TRACKER_API_PORT:-4001}"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$ROOT/backend"
npx prisma migrate deploy
PORT="$API_PORT" node dist/index.js &
API_PID=$!

echo "Waiting for API on 127.0.0.1:${API_PORT}..."
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    echo "API ready."
    break
  fi
  sleep 1
done
if ! curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
  echo "API failed to start on port ${API_PORT}" >&2
  exit 1
fi

cd "$ROOT/frontend"
export TRACKER_API_INTERNAL_URL="http://127.0.0.1:${API_PORT}"
trap - EXIT
exec npm run start
