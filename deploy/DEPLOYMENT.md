# Takaful Events - Shared Hosting Deployment Guide

## What You Get

After running `bash deploy/package.sh`, you'll find in `deploy/dist/`:
- **takaful_app.zip** — Laravel application files (goes OUTSIDE document root)
- **takaful_public.zip** — Document root files (CSS/JS build, .htaccess, index.php)
- **takaful_media.zip** — Uploaded media images (goes into storage/app/public/)
- **deploy/database/takaful-events.sql** — Database dump

---

## Step-by-Step Deployment (Subdomain on cPanel)

### STEP 1: Create Subdomain in cPanel

1. Log into cPanel
2. Go to **Domains** → **Subdomains**
3. Create subdomain (e.g., `events.yourdomain.com`)
4. Note the document root path (e.g., `/home/username/public_html/events`)

---

### STEP 2: Create MySQL Database

1. cPanel → **MySQL® Databases**
2. Create new database: `username_takaful` (note the full name with prefix)
3. Create new user: `username_tkuser` with a strong password
4. **Add user to database** with **ALL PRIVILEGES**
5. Note down:
   - Database name: `username_takaful`
   - Username: `username_tkuser`
   - Password: (what you set)
   - Host: `localhost`

---

### STEP 3: Import Database

1. cPanel → **phpMyAdmin**
2. Select your database (`username_takaful`) from left sidebar
3. Click **Import** tab
4. Choose file: `takaful-events.sql`
5. Click **Import** button at bottom
6. Wait for success message

---

### STEP 4: Upload Application Files

Via **cPanel File Manager**:

#### A. Upload Laravel App (OUTSIDE document root)

1. Navigate to your home directory (`/home/username/`)
2. Create new folder: `takaful_app` (at same level as `public_html`)
3. Upload `takaful_app.zip` to `takaful_app/`
4. Right-click → **Extract**
5. Delete the zip file after extraction

#### B. Upload Public Files (INTO subdomain document root)

1. Navigate to your subdomain's document root (e.g., `/home/username/public_html/events/`)
2. **Delete all existing files** in this folder
3. Upload `takaful_public.zip`
4. Right-click → **Extract**
5. Delete the zip file
6. **Rename** `index_server.php` to `index.php`

#### C. Upload Media Files

1. Navigate to `/home/username/takaful_app/storage/app/public/`
2. Upload `takaful_media.zip`
3. Right-click → **Extract**
4. Delete the zip file
5. You should now see a `media/` folder with year/month subfolders

---

### STEP 5: Configure index.php

1. Open `index.php` (in document root) with **Code Editor**
2. Find this line:
   ```php
   $app_path = dirname(dirname(__FILE__)) . '/takaful_app';
   ```
3. Verify the path is correct. If your structure is:
   ```
   /home/username/
   ├── takaful_app/          ← Laravel files here
   └── public_html/
       └── events/           ← index.php is here
   ```
   Then change to:
   ```php
   $app_path = '/home/username/takaful_app';
   ```
   (Replace `username` with your actual cPanel username)

4. **Save** the file

---

### STEP 6: Configure .env File

1. Copy `deploy/.env.production` content
2. In File Manager, navigate to `/home/username/takaful_app/`
3. Create new file: `.env`
4. Paste the content and update these values:

   ```env
   APP_NAME="Takaful Events"
   APP_ENV=production
   APP_KEY=base64:oZLAltykilPY+3Lu9DiBQw8ZpUHKnSx04yori29cyOI=
   APP_DEBUG=false
   APP_URL=https://events.yourdomain.com

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=username_takaful
   DB_USERNAME=username_tkuser
   DB_PASSWORD=your_actual_password

   SESSION_DRIVER=file
   ```

5. **Save** the file

---

### STEP 7: Set File Permissions

In File Manager, navigate to `/home/username/takaful_app/` and set:

1. Right-click `storage` folder → **Change Permissions** → `755` → ✓ Recurse → **Change**
2. Right-click `bootstrap/cache` → **Change Permissions** → `755` → ✓ Recurse → **Change**

---

### STEP 8: Run Migrations & Create Storage Link

1. Upload `deploy/run-migrations.php` to your document root
2. Edit the file and change `SECRET` to a random string
3. Also edit `$app_path` if needed (same as index.php)
4. Visit: `https://events.yourdomain.com/run-migrations.php?token=YOUR_SECRET`
5. Verify all commands show success
6. **DELETE `run-migrations.php` immediately after**

---

### STEP 9: Test the Site

Visit: `https://events.yourdomain.com`

**If you see a 500 error:**
1. Temporarily set `APP_DEBUG=true` in `.env` to see the error
2. Check common issues below
3. Set `APP_DEBUG=false` after fixing

---

## Common Issues & Fixes

### 500 Internal Server Error

1. **Wrong app path** → Check `$app_path` in `index.php`, use absolute path
2. **Missing .env** → Ensure `.env` exists in `/home/username/takaful_app/`
3. **Wrong permissions** → Set `storage/` and `bootstrap/cache/` to 755
4. **PHP version** → Ensure PHP 8.2 or 8.3 (cPanel → **Select PHP Version**)

### CSS/JS not loading

1. Check `APP_URL` in `.env` matches your actual domain
2. Clear browser cache (Ctrl+Shift+R)
3. Check if `/build/` folder exists in document root

### Database connection error

1. Verify database credentials in `.env`
2. Ensure user has ALL PRIVILEGES on the database
3. Check database host (usually `localhost`)

### Images not showing

1. Verify storage link was created (Step 8)
2. Check `/home/username/takaful_app/storage/app/public/media/` has files
3. Try visiting an image URL directly in the browser
4. If symlink doesn't work, the app's built-in `/storage/{path}` route will serve files as fallback

### "No input file specified"

1. Check `.htaccess` exists in document root
2. Ensure `mod_rewrite` is enabled (ask hosting support)

---

## How to Update the Site Later

1. Make changes locally
2. Run `bash deploy/package.sh`
3. Upload and extract the new zip files (overwrite existing)
4. Upload `run-migrations.php` to document root (change SECRET)
5. Visit the migration URL to run new migrations and clear caches
6. **DELETE `run-migrations.php`**

Alternatively, if you have cPanel Terminal access:
```bash
cd ~/takaful_app && php artisan migrate --force && php artisan optimize
```

---

## Diagnostics

**Before asking for help, check:**
1. Upload [deploy/check.php](check.php) to document root
2. Change its `SECRET` token
3. Visit `https://events.yourdomain.com/check.php?token=YOUR_SECRET`
4. It will show exactly what's failing (✓/✗ for each check)
5. **DELETE check.php after diagnosing**

---

## Build & Deploy

```bash
bash deploy/package.sh
```

Then follow the steps above.
