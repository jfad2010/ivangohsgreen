# Little-Fighter-Style Starter (Phaser 3 + Next.js + Neon)

Monorepo with two packages:

- `game/` — Phaser 3 + TypeScript + Vite. Belt-scroller skeleton with depth sorting and lanes.
- `web/`  — Next.js (App Router) with Neon serverless driver and minimal APIs for runs and profiles.

## Quick start

```bash
# install once
npm i

# in one terminal: run the Next.js app
npm -w web run dev

# in a second terminal: run the Phaser dev server
npm -w game run dev

# build game then copy static build into web/public/game
npm run build:game && npm run sync:game
```

Deploy the `web/` app to Vercel. The game build will be served from `/game/` in `web/public`.
Provision a Neon database and set `NEON_DATABASE_URL` in Vercel envs.

See `web/db/init.sql` for starter tables.
