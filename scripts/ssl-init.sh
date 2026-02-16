#!/bin/bash
set -euo pipefail

# ─── Configuration ───
DOMAIN="${DOMAIN:-api.yourdomain.com}"
EMAIL="${EMAIL:-admin@yourdomain.com}"
STAGING="${STAGING:-0}" # Set to 1 for Let's Encrypt staging (testing)

echo "═══════════════════════════════════"
echo "  SSL Certificate Init"
echo "  Domain: $DOMAIN"
echo "═══════════════════════════════════"

# Create required directories
mkdir -p certbot/www certbot/conf

# Create a temporary nginx config (HTTP only, for ACME challenge)
echo "→ Creating temporary nginx config (HTTP only)..."
cat > nginx/conf.d/default.conf.tmp <<'TMPEOF'
server {
    listen 80;
    server_name _DOMAIN_;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'waiting for ssl';
    }
}
TMPEOF
sed -i "s/_DOMAIN_/$DOMAIN/g" nginx/conf.d/default.conf.tmp

# Backup real config and use temp
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
mv nginx/conf.d/default.conf.tmp nginx/conf.d/default.conf

# Start nginx (HTTP only)
echo "→ Starting nginx (HTTP only)..."
docker compose up -d nginx

sleep 3

# Request certificate
echo "→ Requesting SSL certificate from Let's Encrypt..."
STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
fi

docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  $STAGING_FLAG

# Restore real nginx config with actual domain
echo "→ Restoring full nginx config with SSL..."
mv nginx/conf.d/default.conf.bak nginx/conf.d/default.conf
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/conf.d/default.conf

# Restart nginx with SSL
echo "→ Restarting nginx with SSL..."
docker compose restart nginx

echo ""
echo "✓ SSL certificate obtained for $DOMAIN"
echo "═══════════════════════════════════"
