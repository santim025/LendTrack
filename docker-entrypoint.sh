#!/bin/sh
set -e

echo "[entrypoint] Sincronizando schema con la base de datos..."
node /app/prisma-cli/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "[entrypoint] Asegurando superusuario (si ADMIN_EMAIL está definido)..."
node /app/scripts/seed-admin.mjs || echo "[entrypoint] seed-admin falló; continuo igual."

echo "[entrypoint] Arrancando la app..."
exec "$@"
