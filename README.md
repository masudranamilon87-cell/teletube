# TeleTube — Telegram Mini App (Next.js)

Generic video platform for Telegram with tokens, unlocks, and admin panel.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- SQLite (`better-sqlite3`) — data in `data/teletube.sqlite`
- Telegram WebApp SDK + `initData` validation

## Quick start

```bash
cd teletube
cp .env.example .env.local
# Set TELEGRAM_BOT_TOKEN and ADMIN_TELEGRAM_IDS in .env.local
npm install
npm run dev
```

Open http://localhost:3000 (dev auth enabled when `ALLOW_DEV_AUTH=true`).

## Telegram setup

1. Set Mini App URL in [@BotFather](https://t.me/BotFather) to your HTTPS URL (e.g. ngrok → `https://xxx.ngrok.app`).
2. Add your Telegram user ID to `ADMIN_TELEGRAM_IDS` for `/admin` access.

## Features

| Feature | Route / API |
|---------|-------------|
| Video home feed | `/` |
| Watch / unlock | `/watch/[id]` |
| Admin CRUD | `/admin` |
| Telegram auth | `POST /api/auth/telegram` |
| Rewarded ad (simulated) | `POST /api/rewards/complete` |
| Unlock video | `POST /api/videos/[id]/unlock` |

## Ads placeholders

- `src/lib/ads.ts` — `onRewardComplete()`, `onMidrollTrigger()`, `onBannerMount()`
- Banner slots in `AppShell`
- Mid-roll every `MIDROLL_INTERVAL_MIN` minutes during playback

## Production

```bash
npm run build
npm start
```

Set `ALLOW_DEV_AUTH=false` in production.
