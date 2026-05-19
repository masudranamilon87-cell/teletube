# Re-create teletube/build — run from project root: .\scripts\pack-deploy.ps1
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dest = Join-Path $root "build"

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "data") -Force | Out-Null
"" | Set-Content (Join-Path $dest "data\.gitkeep")

$items = @(
  "src", "public", "package.json", "package-lock.json",
  "next.config.ts", "tsconfig.json", "postcss.config.mjs",
  "eslint.config.mjs", ".env.example",
  "nixpacks.toml", "railway.toml", "Dockerfile", ".dockerignore", ".node-version", ".gitattributes"
)

foreach ($item in $items) {
  $srcPath = Join-Path $root $item
  if (Test-Path $srcPath) {
    Copy-Item $srcPath -Destination $dest -Recurse -Force
  }
}

$deployTxt = @"
TeleTube — copy ALL files in this folder to your GitHub repo ROOT (not inside a subfolder).

Railway:
  1. Push this folder to GitHub (private repo OK). Do NOT upload node_modules or .next
  2. Railway connects to repo — Root Directory: empty
  3. Builder: Dockerfile (auto if Dockerfile exists)
  4. Variables (required for login/register):
     TELEGRAM_BOT_TOKEN, ADMIN_PASSWORD, JWT_SECRET,
     ADMIN_USERNAME=Masudadmin,
     NEXT_PUBLIC_SITE_URL=https://YOUR-APP.up.railway.app,
     SQLITE_DATABASE_PATH=./data/teletube.sqlite
  5. Volume: mount /app/data (keeps SQLite + users after redeploy)
  6. Check: https://YOUR-APP/api/health — adminPassword and sessionSecret must be "set"/"ok"
  6. Redeploy after changing Variables

BotFather: Mini App URL = your Railway HTTPS URL (no trailing slash).

Do NOT commit: .env, .env.local, data/*.sqlite, node_modules, .next
"@
Set-Content -Path (Join-Path $dest "DEPLOY.txt") -Value $deployTxt -Encoding utf8

$gitignore = @"
.env
.env.local
.env*.local
data/*.sqlite
data/*.txt
data/*.json
!data/.gitkeep
node_modules/
.next/
out/
.vscode/
.cursor/
build/
.git/
"@
Set-Content -Path (Join-Path $dest ".gitignore") -Value $gitignore -Encoding utf8

$checklist = @"
UPLOAD: all files in this folder to GitHub repo ROOT.
SKIP: node_modules, .next, .env, data/*.sqlite, nested build/ folder
"@
Set-Content -Path (Join-Path $dest "CHECKLIST.txt") -Value $checklist -Encoding utf8

$mb = [math]::Round(((Get-ChildItem $dest -Recurse -Force | Measure-Object Length -Sum).Sum / 1MB), 2)
Write-Host "Created $dest ($mb MB)"
