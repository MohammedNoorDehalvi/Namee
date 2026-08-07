# Ashoka Premier League (APL) — Live Digital Cricket Auction

**Ashoka Premier League (APL)** is a responsive digital cricket auction platform inspired by IPL-style auctions. It includes real-time bidding, protected franchise purses, player registration with photo upload, captain and admin desks, sold-player celebrations, and a glass / 3D marketing landing experience.

---

## Core features

- **Live public auction arena** — Real-time lot card, bid history, team purses, and sold celebrations via Supabase Realtime
- **Captain bidding desk** — Quick-increment bidding, remaining budget bar, mobile sticky bid CTA, squad sidebar
- **Player registration** — Photo upload, role/style fields, client validation, success confirmation flow
- **Admin command center** — Franchises, approvals, auction start/pause/end/reset, sold/unsold, manual fixes — with in-app confirm dialogs
- **Protected purses** — Server-side bid validation (budget + squad size)
- **Squad rosters** — Teams page with spend, remaining budget, and bought players
- **Polish UX** — Typed toasts, confirm/prompt modals, app shell chrome (nav + dock clearance), reduced-friction mobile dock

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| UI | React 18, TypeScript, Tailwind CSS, Framer Motion |
| 3D / motion | `@splinetool/react-spline`, `three` |
| Smooth scroll | `lenis` |
| Backend data | Supabase (PostgreSQL, Realtime, Storage) |
| Auth | Custom signed sessions + `bcryptjs` |
| Icons | `lucide-react` |

---

## Project layout (summary)

```text
app/                 # Routes + API handlers
components/          # UI by domain (auction, admin, captain, home, ui)
hooks/               # Realtime, session, celebrations
lib/                 # Types, formatters, auction server utils, SFX/config
docs/                # Deployment, security, Supabase, sold animation
public/              # Static assets
```

See **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** for the full tree.

---

## Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AUTH_SECRET=your_secret_auth_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the same keys in Render / Vercel for production.

---

## Local development

```bash
git clone <your-repo-url>
cd <repo>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run typecheck   # TypeScript
npm run build       # Production build
npm run start       # Serve production build
```

---

## Database (Supabase)

1. Supabase project → **SQL Editor**
2. Run [`supabase/schema.sql`](./supabase/schema.sql) (or follow [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md))
3. Ensure storage buckets for `player-photos` and `team-logos`
4. RLS: public reads for approved auction data; credentials protected

---

## Deployment (Render)

- **Build:** `npm install && npm run build`
- **Start:** `npm run start`
- **Env:** same as `.env.local`, with `NEXT_PUBLIC_APP_URL` set to the public URL

Details: [`docs/RENDER_DEPLOYMENT.md`](./docs/RENDER_DEPLOYMENT.md)

---

## Key product UX notes

| Area | Behavior |
| --- | --- |
| Toasts | `toast` / `toast.success` / `toast.error` — stacked, dismissible, accessible |
| Admin confirms | In-app dialogs (no native `confirm` / `prompt` for critical ops) |
| Money | `formatMoney` always shows `₹` (compact `k` above 1000) |
| Chrome | Fixed navbar + bottom dock with `.app-shell` padding; dock hides on admin/captain/login |
| Sold animation | 5s gavel + shatter overlay — see [`docs/PLAYER_SOLD_ANIMATION.md`](./docs/PLAYER_SOLD_ANIMATION.md) |

---

## Documentation index

| Doc | Purpose |
| --- | --- |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Directory & component map |
| [docs/RENDER_DEPLOYMENT.md](./docs/RENDER_DEPLOYMENT.md) | Render hosting |
| [docs/SECURITY_NOTES.md](./docs/SECURITY_NOTES.md) | Auth & API security |
| [docs/SECURITY_AUDIT_AND_HARDENING.md](./docs/SECURITY_AUDIT_AND_HARDENING.md) | Hardening notes |
| [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) | Schema & RLS |
| [docs/PLAYER_SOLD_ANIMATION.md](./docs/PLAYER_SOLD_ANIMATION.md) | Sold celebration design |

---

© Ashoka Premier League (APL). All rights reserved.
