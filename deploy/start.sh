#!/bin/sh
# Runs the generation worker and the web server in one container (Render free tier).
# If either process exits, the container exits so Render restarts it.
set -e

(cd /app/apps/worker && exec ./node_modules/.bin/tsx src/index.ts) &
WORKER_PID=$!

PORT="${PORT:-3000}" HOSTNAME=0.0.0.0 node /app/web/apps/web/server.js &
WEB_PID=$!

trap 'kill -TERM $WORKER_PID $WEB_PID 2>/dev/null' TERM INT

# Exit as soon as either process stops.
while kill -0 $WORKER_PID 2>/dev/null && kill -0 $WEB_PID 2>/dev/null; do
  sleep 2
done

kill -TERM $WORKER_PID $WEB_PID 2>/dev/null || true
wait
exit 1
