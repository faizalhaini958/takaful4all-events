#!/bin/bash

# ============================================================
# Takaful Events - Shared Hosting Deployment Packager
# ============================================================
# Run from the project root:  bash deploy/package.sh
# This creates two zip files ready to upload via FTP/SFTP:
#   1. takaful_app.zip     -> upload & extract OUTSIDE document root
#   2. takaful_public.zip  -> upload & extract INTO document root
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/deploy/dist"

echo "==> Cleaning dist folder..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ---------- 0. Export database from XAMPP ----------
echo "==> Exporting database from XAMPP..."
mkdir -p "$ROOT_DIR/deploy/database"
/Applications/XAMPP/xamppfiles/bin/mysqldump \
  --user=root \
  --password= \
  --host=127.0.0.1 \
  --socket=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock \
  takaful-events > "$ROOT_DIR/deploy/database/takaful-events.sql" 2>&1 || echo "   (Database export skipped or failed)"

# ---------- 1. Build frontend assets ----------
echo "==> Building frontend assets..."
cd "$ROOT_DIR"
npm run build

# ---------- 2. Optimize Composer autoloader ----------
echo "==> Optimizing Composer autoloader..."
composer install --no-dev --optimize-autoloader --no-interaction 2>&1

# ---------- 3. Package app files (goes OUTSIDE document root) ----------
echo "==> Creating takaful_app.zip (Laravel app files)..."
cd "$ROOT_DIR"
zip -r "$DIST_DIR/takaful_app.zip" \
  app/ \
  bootstrap/ \
  config/ \
  database/ \
  resources/ \
  routes/ \
  storage/ \
  vendor/ \
  artisan \
  composer.json \
  composer.lock \
  -x "storage/logs/*.log" \
  -x "storage/framework/cache/*" \
  -x "storage/framework/sessions/*" \
  -x "storage/framework/views/*" \
  -x "bootstrap/cache/*.php"

echo "   Created: $DIST_DIR/takaful_app.zip"

# ---------- 4. Package public files (goes INTO document root) ----------
echo "==> Creating takaful_public.zip (document root files)..."
cd "$ROOT_DIR/public"
cp "$ROOT_DIR/deploy/server-index.php" ./index_server.php
zip -r "$DIST_DIR/takaful_public.zip" \
  .htaccess \
  index_server.php \
  robots.txt \
  build/ \
  images/ \
  favicon.ico 2>/dev/null || true
rm ./index_server.php
echo "   Created: $DIST_DIR/takaful_public.zip"

# ---------- 5. Report ----------
echo ""
echo "============================================================"
echo "  DONE! Files ready in deploy/dist/"
echo "============================================================"
ls -lh "$DIST_DIR/"
echo ""
echo "Additional Files:"
echo "  - deploy/database/takaful-events.sql (database dump)"
echo "  - deploy/.env.production (production config template)"
echo "  - deploy/check.php (server diagnostic tool)"
echo "  - deploy/run-migrations.php (optional migration runner)"
echo ""
echo "📖 SEE deploy/DEPLOYMENT.md FOR STEP-BY-STEP INSTRUCTIONS"
echo "============================================================"
