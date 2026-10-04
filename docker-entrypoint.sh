#!/bin/sh
set -e

echo "Starting Healthcare Platform container..."

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  node apps/api/dist/migrate.js
fi

if [ "$RUN_SEED" = "true" ]; then
  echo "Demo seeding is disabled in production; refusing to start."
  exit 1
fi

echo "Starting Healthcare Platform Server on port ${PORT:-3000}..."
exec node apps/api/dist/server.js
