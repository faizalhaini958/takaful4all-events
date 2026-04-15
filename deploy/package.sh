#!/bin/bash

# ============================================================
# Takaful Events - Shared Hosting Deployment Packager
# ============================================================
# Run from the project root:  bash deploy/package.sh
# This creates zip files ready to upload via cPanel File Manager:
#   1. takaful_app.zip     -> upload & extract OUTSIDE document root
#   2. takaful_public.zip  -> upload & extract INTO document root
#   3. takaful_media.zip   -> upload & extract into storage/app/public/
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/deploy/dist"

echo "==> Cleaning dist folder..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ---------- 0. Export database ----------
echo "==> Exporting database..."
mkdir -p "$ROOT_DIR/deploy/database"

MYSQLDUMP=""
if [[ -x "/Applications/XAMPP/xamppfiles/bin/mysqldump" ]]; then
    MYSQLDUMP="/Applications/XAMPP/xamppfiles/bin/mysqldump"
    DB_EXTRA="--socket=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
elif command -v mysqldump &>/dev/null; then
    MYSQLDUMP="mysqldump"
    DB_EXTRA=""
fi

if [[ -n "$MYSQLDUMP" ]]; then
    $MYSQLDUMP \
      --user=root \
      --password= \
      --host=127.0.0.1 \
      $DB_EXTRA \
      takaful-events > "$ROOT_DIR/deploy/database/takaful-events.sql" 2>/dev/null \
    && echo "   Database exported: deploy/database/takaful-events.sql" \
    || echo "   (Database export skipped or failed)"
else
    echo "   (No mysqldump found - skipping database export)"
fi

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
zip -rq "$DIST_DIR/takaful_app.zip" \
  app/ \
  bootstrap/ \
  config/ \
  database/ \
  lang/ \
  resources/views/ \
  routes/ \
  storage/framework/.gitignore \
  storage/framework/cache/.gitignore \
  storage/framework/sessions/.gitignore \
  storage/framework/views/.gitignore \
  storage/logs/.gitignore \
  storage/app/.gitignore \
  storage/app/public/.gitignore \
  vendor/ \
  artisan \
  composer.json \
  composer.lock \
  -x "storage/logs/*.log" \
  -x "storage/framework/cache/data/*" \
  -x "storage/framework/sessions/*" \
  -x "storage/framework/views/*.php" \
  -x "storage/app/public/media/*" \
  -x "bootstrap/cache/*.php" \
  -x "resources/views/.DS_Store"

echo "   Created: takaful_app.zip ($(du -h "$DIST_DIR/takaful_app.zip" | awk '{print $1}'))"

# ---------- 4. Package public files (goes INTO document root) ----------
echo "==> Creating takaful_public.zip (document root files)..."
cd "$ROOT_DIR/public"
cp "$ROOT_DIR/deploy/server-index.php" ./index_server.php
zip -rq "$DIST_DIR/takaful_public.zip" \
  .htaccess \
  index_server.php \
  robots.txt \
  build/ \
  images/ \
  favicon.ico 2>/dev/null || true
rm ./index_server.php
echo "   Created: takaful_public.zip ($(du -h "$DIST_DIR/takaful_public.zip" | awk '{print $1}'))"

# ---------- 5. Package media files separately ----------
if [[ -d "$ROOT_DIR/storage/app/public/media" ]]; then
    echo "==> Creating takaful_media.zip (uploaded media files)..."
    cd "$ROOT_DIR/storage/app/public"
    zip -rq "$DIST_DIR/takaful_media.zip" media/
    echo "   Created: takaful_media.zip ($(du -h "$DIST_DIR/takaful_media.zip" | awk '{print $1}'))"
else
    echo "==> No media files to package"
fi

# ---------- 6. Restore dev dependencies for local development ----------
echo "==> Restoring dev dependencies..."
cd "$ROOT_DIR"
composer install --no-interaction 2>&1

# ---------- 7. Report ----------
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
echo "  - deploy/run-migrations.php (migration runner)"
echo "  - deploy/fix-permissions.sh (permission fixer)"
echo ""
echo "SEE deploy/DEPLOYMENT.md FOR STEP-BY-STEP INSTRUCTIONS"
echo "============================================================"
