#!/usr/bin/env bash
# Deploy homologação — rodar na VM Lightsail a partir da raiz do repo
# Uso: bash scripts/deploy-homolog.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="${PM2_APP_NAME:-pricer-homolog}"
BRANCH="${DEPLOY_BRANCH:-master}"

echo "==> Pull ($BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Install deps"
npm install --prefix client
npm install --prefix server

echo "==> Build client (mode homologation)"
# Use .env.homologation no client se existir; senão production build com VITE_API_URL=/api
if [[ -f client/.env.homologation ]]; then
  cp client/.env.homologation client/.env.production.local
fi
npm run build --prefix client
rm -f client/.env.production.local

echo "==> Build server"
npm run build --prefix server

echo "==> PM2 reload"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  APP_ENV=homologation NODE_ENV=production pm2 reload ecosystem.config.cjs --only "$APP_NAME" --update-env
else
  APP_ENV=homologation NODE_ENV=production pm2 start ecosystem.config.cjs --only "$APP_NAME"
fi

pm2 save

echo "==> Nginx reload (se config mudou)"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "==> OK — $APP_NAME atualizado"
pm2 status "$APP_NAME"
