#!/bin/bash

# ============================================================
# Fix Laravel Permissions on Shared Hosting
# ============================================================
# Run this in cPanel Terminal after uploading your files
#
# Usage: bash fix-permissions.sh
# ============================================================

APP_PATH="/home/takaful/takaful_app"

echo "============================================================"
echo "  Fixing Laravel Permissions"
echo "============================================================"
echo ""

# Change to app directory
cd "$APP_PATH" || exit

echo "Setting base permissions..."
# Set directories to 755 and files to 644
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

echo "Setting storage directories to 755..."
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

echo "Making artisan executable..."
chmod +x artisan

echo ""
echo "============================================================"
echo "  ✓ Permissions Fixed!"
echo "============================================================"
echo ""
echo "Current permissions:"
ls -la storage/ | head -10
echo ""
ls -la bootstrap/cache/
echo ""
echo "If you still get errors, check ownership with:"
echo "  ls -la $APP_PATH"
echo ""
