param(
  [string]$ProjectRoot = "C:\xampp\htdocs\takaful4all-events"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting package build..." -ForegroundColor Cyan

$DistDir = Join-Path $ProjectRoot "deploy\dist"
$StageRoot = Join-Path $ProjectRoot "deploy\_staging"
$StageApp = Join-Path $StageRoot "app"
$StagePublic = Join-Path $StageRoot "public"
$StageMedia = Join-Path $StageRoot "media"
$PublicIndexServer = Join-Path $ProjectRoot "public\index_server.php"
$ServerIndexSource = Join-Path $ProjectRoot "deploy\server-index.php"

function Assert-Path {
  param([string]$PathToCheck, [string]$Label)
  if (!(Test-Path $PathToCheck)) {
    throw "$Label not found: $PathToCheck"
  }
}

Assert-Path $ProjectRoot "Project root"
Assert-Path $ServerIndexSource "Server index template"
Assert-Path (Join-Path $ProjectRoot "artisan") "Artisan file"
Assert-Path (Join-Path $ProjectRoot "composer.json") "composer.json"
Assert-Path (Join-Path $ProjectRoot "composer.lock") "composer.lock"

if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "npm.cmd not found. Install Node.js or add it to PATH."
}

# Prepare folders
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null
if (Test-Path $StageRoot) {
  Remove-Item $StageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $StageApp, $StagePublic, $StageMedia | Out-Null

# Remove old zips
Get-ChildItem $DistDir -Filter "*.zip" -ErrorAction SilentlyContinue | Remove-Item -Force

# Build frontend
Write-Host "Building frontend assets..." -ForegroundColor Yellow
Set-Location $ProjectRoot
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Frontend build failed."
}

# Create temporary index_server.php in public
Copy-Item $ServerIndexSource $PublicIndexServer -Force

try {
  Write-Host "Preparing app package..." -ForegroundColor Yellow

  # Copy app package content
  Copy-Item (Join-Path $ProjectRoot "app") (Join-Path $StageApp "app") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "bootstrap") (Join-Path $StageApp "bootstrap") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "config") (Join-Path $StageApp "config") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "database") (Join-Path $StageApp "database") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "lang") (Join-Path $StageApp "lang") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "routes") (Join-Path $StageApp "routes") -Recurse -Force
  Copy-Item (Join-Path $ProjectRoot "vendor") (Join-Path $StageApp "vendor") -Recurse -Force

  New-Item -ItemType Directory -Force -Path (Join-Path $StageApp "resources") | Out-Null
  Copy-Item (Join-Path $ProjectRoot "resources\views") (Join-Path $StageApp "resources\views") -Recurse -Force

  Copy-Item (Join-Path $ProjectRoot "artisan") (Join-Path $StageApp "artisan") -Force
  Copy-Item (Join-Path $ProjectRoot "composer.json") (Join-Path $StageApp "composer.json") -Force
  Copy-Item (Join-Path $ProjectRoot "composer.lock") (Join-Path $StageApp "composer.lock") -Force

$AppZip = Join-Path $DistDir "takaful_app.zip"
      Add-Type -AssemblyName System.IO.Compression.FileSystem
      [System.IO.Compression.ZipFile]::CreateFromDirectory($StageApp, $AppZip, 'Optimal', $false)

  Write-Host "Preparing public package..." -ForegroundColor Yellow

  # Copy public package content
  if (Test-Path (Join-Path $ProjectRoot "public\.htaccess")) {
    Copy-Item (Join-Path $ProjectRoot "public\.htaccess") (Join-Path $StagePublic ".htaccess") -Force
  }
  if (Test-Path (Join-Path $ProjectRoot "public\robots.txt")) {
    Copy-Item (Join-Path $ProjectRoot "public\robots.txt") (Join-Path $StagePublic "robots.txt") -Force
  }
  if (Test-Path (Join-Path $ProjectRoot "public\build")) {
    Copy-Item (Join-Path $ProjectRoot "public\build") (Join-Path $StagePublic "build") -Recurse -Force
  }
  if (Test-Path (Join-Path $ProjectRoot "public\images")) {
    Copy-Item (Join-Path $ProjectRoot "public\images") (Join-Path $StagePublic "images") -Recurse -Force
  }
  if (Test-Path (Join-Path $ProjectRoot "public\favicon.ico")) {
    Copy-Item (Join-Path $ProjectRoot "public\favicon.ico") (Join-Path $StagePublic "favicon.ico") -Force
  }
  Copy-Item $PublicIndexServer (Join-Path $StagePublic "index_server.php") -Force

  $PublicZip = Join-Path $DistDir "takaful_public.zip"
      [System.IO.Compression.ZipFile]::CreateFromDirectory($StagePublic, $PublicZip, 'Optimal', $false)

  Write-Host "Preparing media package (if exists)..." -ForegroundColor Yellow

  $MediaSource = Join-Path $ProjectRoot "storage\app\public\media"
  if (Test-Path $MediaSource) {
    Copy-Item $MediaSource (Join-Path $StageMedia "media") -Recurse -Force
    $MediaZip = Join-Path $DistDir "takaful_media.zip"
      [System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $StageMedia "media"), $MediaZip, 'Optimal', $false)
  }

  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host "  DONE! Files ready in deploy/dist/" -ForegroundColor Green
  Write-Host "============================================================" -ForegroundColor Green
  Get-ChildItem $DistDir -Filter "*.zip" |
    Select-Object Name, @{Name="SizeMB";Expression={[Math]::Round($_.Length/1MB,2)}}, LastWriteTime |
    Format-Table -AutoSize

  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "1. Upload takaful_app.zip to ~/takaful_app then extract" -ForegroundColor White
  Write-Host "2. Upload takaful_public.zip to public_html/events-v2.takaful4all.org then extract" -ForegroundColor White
  Write-Host "3. Rename index_server.php to index.php in document root" -ForegroundColor White
  Write-Host "4. Run these commands on server:" -ForegroundColor White
  Write-Host "   cd ~/takaful_app" -ForegroundColor Gray
  Write-Host "   find . -type d -exec chmod 755 {} \;" -ForegroundColor Gray
  Write-Host "   find . -type f -exec chmod 644 {} \;" -ForegroundColor Gray
  Write-Host "   chmod -R 775 storage bootstrap/cache" -ForegroundColor Gray
  Write-Host "   php artisan optimize:clear" -ForegroundColor Gray
  Write-Host "============================================================" -ForegroundColor Green
}
finally {
  # Cleanup temporary files
  if (Test-Path $PublicIndexServer) {
    Remove-Item $PublicIndexServer -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path $StageRoot) {
    Remove-Item $StageRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
