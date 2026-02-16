#!/bin/bash
set -euo pipefail

REPO_URL="https://github.com/Kmzf777/shadowfeed-back-end.git"
APP_DIR="/opt/shadowfeed-backend"

echo "═══════════════════════════════════"
echo "  ShadowFeed Backend — Deploy"
echo "═══════════════════════════════════"

# Clone or pull
if [ ! -d "$APP_DIR" ]; then
  echo "→ Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "→ Pulling latest changes..."
  cd "$APP_DIR"
  git pull origin main
fi

cd "$APP_DIR"

# Check if .env exists
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    echo "→ Copying .env.production → .env"
    cp .env.production .env
  else
    echo "ERROR: No .env or .env.production found."
    echo "1. Copy .env.production.example → .env.production"
    echo "2. Fill in your production values"
    echo "3. Run this script again"
    exit 1
  fi
fi

# First-time SSL setup
if [ ! -d "certbot/conf/live" ]; then
  echo "→ No SSL certificates found. Running ssl-init.sh first..."
  bash scripts/ssl-init.sh
fi

# Build and start
echo "→ Building and starting containers..."
docker compose up -d --build

# Wait for API to be ready
echo "→ Waiting for API health check..."
sleep 5

MAX_RETRIES=10
RETRY=0
until curl -sf http://localhost:3333/health > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "ERROR: API did not become healthy after $MAX_RETRIES attempts."
    echo "Check logs: docker compose logs api"
    exit 1
  fi
  echo "  Waiting... ($RETRY/$MAX_RETRIES)"
  sleep 3
done

echo ""
echo "✓ ShadowFeed backend is running!"
echo "  API:   http://localhost:3333/health"
echo "  Logs:  docker compose logs -f api"
echo "═══════════════════════════════════"
