# CutTrack

A premium full-stack calorie-deficit tracking app — BMR/TDEE targets, daily food logging, weight trends with 7-day rolling averages, workout tracking, cut progress analytics, and an AI cut-status review. Black/white/gray design with dark mode.

Built with **Node.js + Express (ESM)** and **React + Vite**, monorepo via npm workspaces.

## Quick start (no database needed)

```bash
npm install
npm run dev
```

- API: http://localhost:4000 (auto-seeds demo data)
- Client: http://localhost:5173

**Demo account:** `dev@cuttrack.app` / `Password123!` (27 y/o male, 170 cm, 71.9 → 65 kg, 5×/week training, 0.5 kg/week loss)

```bash
npm test              # server test suite (57 tests)
npm run build -w client
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs API (port 4000) + client (port 5173) together |
| `npm run dev -w server` | API only |
| `npm run dev -w client` | Client only (proxies `/api` → 4000) |
| `npm test` | Server tests (vitest) |
| `npm run build -w client` | Production client build |

## Storage engines

The app is storage-agnostic through a thin store adapter (`server/src/lib/db/index.js`).

### `memory` (default, recommended for dev/demo)

In-memory store with realistic seeded data. No database, works out of the box. Optionally persist to a JSON file between restarts via `DATA_FILE` in `server/.env`.

### `mysql` (production)

1. Install MySQL and create the database and user:

```sql
CREATE DATABASE cuttrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cuttrack'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON cuttrack.* TO 'cuttrack'@'localhost';
FLUSH PRIVILEGES;
```

2. In `server/.env` set `STORAGE_ENGINE=mysql` and your `DATABASE_URL`.
3. Create the schema and seed it:

```bash
npm run db:migrate -w server   # prisma db push
npm run db:seed -w server      # seed demo data
```

4. Restart the API. `GET /api/health` should report `"engine": "mysql"`.

Schema lives in `server/prisma/schema.prisma`. `server/prisma/seed.js` mirrors the memory seed so both engines expose identical demo data.

## Environment

Copy `.env.example` → `server/.env`. Key variables:

| Var | Purpose |
| --- | --- |
| `PORT`, `CLIENT_ORIGIN` | Server port and client origin (for password-reset links) |
| `STORAGE_ENGINE` | `memory` or `mysql` |
| `DATABASE_URL` | Prisma/MySQL connection string (when `mysql`) |
| `JWT_SECRET` | Signing secret — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `COOKIE_SECURE` | Set `true` behind HTTPS |
| `GROQ_API_KEY` | Enables AI cut-status messages. Without it the feature falls back to a static analysis (still fully functional) |
| `SMTP_*` | Optional password-reset email. Unset in dev → reset link is logged to the server console |

## Features

- **Auth**: register/login with bcrypt, HttpOnly JWT cookie, server-side logout revocation (token version), forgot/reset password (dev console link or SMTP).
- **Calculator**: Mifflin-St Jeor BMR, activity-adjusted TDEE, calorie target with macros that sum exactly to the target, and a safety guard against deficits above ~1% body weight/week.
- **Food logging**: global + personal food library, per-meal entries with quantity scaling, daily totals vs. targets.
- **Weight**: fast logging, history, 7-day rolling-average trend chart, weekly loss rate, cut classification (on track / too slow / too fast).
- **Workouts**: sessions with exercises (sets/reps/weight/rest/notes), volume per week.
- **Progress**: 30-day calorie/protein charts, weight trend, weekly workout frequency, estimated weeks to goal.
- **AI review**: `POST /api/analysis/cut-status` returns a rule-based status + a Groq-generated message, cached per day and invalidated when new data arrives.
- **Dark mode**, mobile bottom nav + desktop sidebar, all data scoped per user.

## Project structure

```
server/
  prisma/            MySQL schema, seed, convenience views
  src/
    app.js           Express app (routing, middleware, error handling)
    config.js        Environment config
    lib/calc.js      BMR/TDEE/calories/macros (pure, tested)
    lib/trends.js    Rolling averages, loss rate, cut classification
    lib/ai.js        Groq proxy + static fallback
    lib/db/          Store adapters (memory + mysql via Prisma)
    routes/          auth, profile, calculator, foods, food-entries,
                     weight-entries, workouts, analysis, dashboard, progress
    services/        cutAnalysis + dashboard/progress builders
  test/              vitest suites (calc, trends, analysis, full API)
client/
  src/
    pages/           Landing, auth, onboarding, and /app pages
    components/      UI kit + page components
    context/         Theme + Auth providers
    api/client.js    Fetch wrapper (cookies, error normalization)
    lib/             Client-side calculators/formatting
```

## API overview

All authenticated routes require the `cuttrack_token` cookie and are scoped to the logged-in user.

| Method & path | Purpose |
| --- | --- |
| `POST /api/auth/register` `/login` `/logout` | Auth (sets/clears HttpOnly cookie) |
| `GET /api/auth/me` | Current user + onboarding status |
| `POST /api/auth/forgot-password` `/reset-password` | Password reset |
| `POST /api/profile/onboarding` | Create profile + compute targets |
| `GET/PUT /api/profile` | Read / update profile |
| `POST /api/calculator/estimate` | Public calorie/macro estimate |
| `GET/POST /api/foods` | Food library |
| `GET/POST/PUT/DELETE /api/food-entries` | Daily food entries |
| `GET/POST/PUT/DELETE /api/weight-entries` | Weight entries |
| `GET/POST/PUT/DELETE /api/workouts` | Workouts (incl. exercises) |
| `GET /api/dashboard` `/api/progress` | Day + long-term summaries |
| `POST /api/analysis/cut-status` | AI cut review |

## Testing

`npm test` runs vitest against the server: pure-calc correctness, trend math, AI fallback paths, and a full in-process API suite (auth, onboarding, CRUD, dashboard/progress, and per-user data isolation).
