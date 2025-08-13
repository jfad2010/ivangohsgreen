# **Ivan Goh’s Green — Belt-Scroller Action Game Monorepo**

## **Project Purpose**

This repository contains the full source for *Ivan Goh’s Green*, an upgraded re-implementation of the original **Corporate Lettuce Run** into a modern, modular game and web application architecture. The goal is to evolve the gameplay into a **Little Fighter-style belt-scroller** with **back/forward lane movement**, **multiple bosses**, **AI-driven enemy formations**, and **persistent online player progression**.

---

## **High-Level Objectives**

### **Gameplay**

* Preserve the *power-trip* feel — player is strong, enemies are many.
* Expand from one-dimensional left-right into **multi-lane belt-scroller combat**.
* Implement **vertical positioning** with sprite depth sorting.
* Include **multiple bosses** with multi-phase attacks and AI logic.
* Retain original beam attack, shield, and ally recruitment (Grads) systems.
* Increase on-screen entity count (hundreds concurrently) with smooth performance.
* Provide **configurable difficulty scaling** and **adaptive enemy AI**.

### **Technical**

* Port from monolithic HTML5 canvas into **Phaser 3 + TypeScript** with modular code.
* Integrate with **Next.js** frontend for hosting and embedding the game.
* Use **Neon serverless PostgreSQL** for:

  * Persistent player data (profiles, unlocks, upgrades).
  * Leaderboards and run history.
* CI/CD pipelines via **GitHub Actions** and **Vercel** deploys.
* Structure to allow AI-assisted development with GPT-5/Codex.

---

## **Repository Layout**

```
lf-starter/
├── game/               # Phaser 3 + TS client
│   ├── src/            # Game scenes, entities, systems
│   ├── index.html      # Dev entrypoint
│   ├── vite.config.ts  # Vite build config
│   └── tsconfig.json
│
├── web/                # Next.js app (App Router)
│   ├── app/            # Pages and API routes
│   ├── lib/db.ts       # Neon DB connection
│   ├── db/init.sql     # Initial schema
│   └── public/game/    # Game build gets synced here
│
├── scripts/
│   └── sync-game.mjs   # Copies game/dist → web/public/game
│
├── .github/workflows/ci.yml  # CI build checks
└── package.json              # Root workspace config
```

---

## **Game Architecture (`game/`)**

### **Core Systems**

* **Scenes:** Boot → Game → UI.
* **Entities:** Player, Allies, Enemies, Bosses, Projectiles, Pickups.
* **Physics:** Arcade physics with custom lane and collision handling.
* **Rendering:** Pixel-art, nearest-neighbour scaling, depth by `y` coordinate.
* **Controls:**

  * `W/A/S/D` — Move/lane shift
  * `Space` — Beam charge/release
  * `E` — Shield
  * `Q` — Recruit Grad
  * `1/2/3` — Command allies (Retreat/Hold/Advance)

---

## **Web Architecture (`web/`)**

### **Frontend**

* **Framework:** Next.js (App Router, TS).
* **Pages:**

  * `/` — Info + game link.
  * `/play` — Embedded `<iframe>` for game.
* **Game Hosting:** `sync:game` script copies Phaser build into `/web/public/game`.

### **Backend (API Routes)**

* `/api/run`:

  * `POST` save completed run.
  * `GET` fetch leaderboard.
* `/api/profile`:

  * `POST` save/update player profile.
  * `GET` fetch profile.
* `/api/health`: Simple OK check.

### **Database**

* **Provider:** Neon (serverless PostgreSQL).
* **Tables:**

  * `users`: Player accounts.
  * `runs`: Individual play sessions.
  * `profiles`: Persistent unlocks, upgrades.

---

## **Dev Workflow**

```bash
# Install deps
npm install

# Run Next.js
npm -w web run dev

# Run Phaser dev server
npm -w game run dev

# Build Phaser game (hashed assets) and sync into web/public/game
npm run build:game && npm run sync:game

# Build Next.js for prod
npm -w web run build && npm -w web run start
```

The `sync:game` script copies the entire `game/dist` output, including hashed filenames, into `web/public/game`.

---

## **Deployment on Vercel**

* **Framework preset:** Next.js.
* **Root directory:** `web`.
* **Build command:** `npm run build`.
* **Output directory:** `.next` (auto-detected).
* **Env Vars:**

  * `NEON_DATABASE_URL` — Neon connection string.

---

## **Planned Features**

* Co-op multiplayer via WebSockets.
* Config-driven enemy formations and wave pacing.
* Boss AI with phase changes and telegraphed attacks.
* Replay export/import.
* Live balance updates from JSON config.
* OAuth login and cloud-saved progression.
* Analytics for run completion and drop rates.

---

## **AI/Codex Collaboration Notes**

### **Code Style**

* TypeScript strict mode on.
* Modular systems — avoid monolithic `GameScene`.
* Entities in their own files with typed configs.
* All tunable values in `config.ts`.

### **Codex Task Prompts**

Include these in pull requests or issues to instruct GPT-5/Codex:

**Porting original HTML mechanics to Phaser**

```
Convert original beam, shield, and grad recruit logic from index.html to Phaser 3 TS in GameScene.
Maintain mechanic parity, but refactor to ECS-like services where possible.
```

**Adding new boss**

```
Create a new Boss entity with state machine phases:
- Idle, Engage, Attack1, Attack2, Rage.
Spawned at defined X coordinate.
Integrate with GameScene spawn system.
```

**Implement leaderboard UI**

```
In Next.js /play page, add a leaderboard overlay.
Fetch from /api/run GET, display top 20 scores.
Style to match pixel-art aesthetic.
```

---

## **Status**

* ✅ Monorepo scaffolded.
* ✅ Phaser base with lane movement, shooting, depth sorting.
* ✅ Next.js + Neon skeleton APIs.
* ⏳ Porting original game logic.
* ⏳ Adding persistent leaderboards and progression.
* ⏳ Boss AI and formations.

---

Do you want me to extend this even further into a **“Feature Backlog”** section so Codex knows *exactly* which systems to build next and in what priority? That would turn the README into a lightweight dev roadmap.
