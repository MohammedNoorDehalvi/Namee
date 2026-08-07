# APL Online Auction — Project Structure

```text
apl-online-auction/
├── app/
│   ├── admin-dashboard/              # Admin command center (guarded)
│   ├── admin-login/                  # Admin authentication
│   ├── api/
│   │   ├── admin/                    # Admin auth, overview, players, auction, seasons, teams
│   │   ├── auction/live-state/       # Public auction snapshot
│   │   ├── bids/place/               # Captain bid placement
│   │   ├── captain/                  # Captain login + me
│   │   ├── players/                  # Register + list
│   │   ├── season/current/           # Active season
│   │   ├── seasons/                  # Season history
│   │   └── teams/                    # Team rosters + budgets
│   ├── auction/                      # Live arena (public) or ?captain=1 desk
│   ├── captain-dashboard/            # Captain bidding room (guarded)
│   ├── captain-login/                # Captain authentication
│   ├── player-registration/          # Player draft form
│   ├── players/                      # Approved player directory
│   ├── seasons/                      # Season archives (+ [seasonId])
│   ├── teams/                        # Franchise squad rosters
│   ├── globals.css                   # Tokens, buttons, app-shell chrome
│   ├── layout.tsx                    # Navbar, shell, Footer, dock, toasts, confirm host
│   └── page.tsx                      # Marketing home
│
├── components/
│   ├── admin/
│   │   ├── AdminGuard.tsx            # Session gate + loading/ready UX
│   │   ├── AdminPanel.tsx            # Auction control, approvals, reports
│   │   └── AdminChooseNextPlayerPanel.tsx
│   ├── auction/
│   │   ├── LiveAuction.tsx           # Public live arena
│   │   ├── BidControls.tsx           # Shared bid CTA (login / place bid)
│   │   ├── AuctionScreen.tsx
│   │   └── PlayerSoldCelebrationOverlay.tsx  # 5s gavel + shatter
│   ├── captain/
│   │   ├── CaptainGuard.tsx
│   │   └── CaptainDashboardClient.tsx  # Sticky budget + mobile bid bar
│   ├── forms/
│   │   ├── LoginCard.tsx             # Admin/captain login (show password, errors)
│   │   └── PlayerRegistrationForm.tsx
│   ├── home/                         # Landing sections (Hero3D, ScrollShowcase, …)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── players/
│   │   ├── PlayerCard.tsx
│   │   └── PlayerFilters.tsx         # Labeled search/role + clear
│   ├── providers/
│   │   └── SmoothScrollProvider.tsx
│   ├── season/                       # Gates, old seasons, bid-lock guard, season admin
│   ├── teams/
│   │   └── TeamsClient.tsx
│   └── ui/                           # Shared design system
│       ├── AppToaster.tsx            # Stacked success/error/info toasts
│       ├── ConfirmDialog.tsx         # confirmAction / promptAction host
│       ├── FloatingDock.tsx          # Mobile tab bar + desktop magnify dock
│       ├── EmptyState.tsx
│       ├── AuctionSkeleton.tsx
│       ├── ReconnectingBanner.tsx
│       ├── Confetti.tsx
│       ├── liquid-glass.tsx
│       └── … (TiltCard, SpotlightCard, ShimmerButton, Meteors, …)
│
├── docs/
│   ├── PLAYER_SOLD_ANIMATION.md      # Sold celebration timeline & variants
│   ├── RENDER_DEPLOYMENT.md
│   ├── SECURITY_NOTES.md
│   ├── SECURITY_AUDIT_AND_HARDENING.md
│   └── SUPABASE_SETUP.md
│
├── hooks/
│   ├── useAuctionRealtime.ts
│   ├── usePlayers.ts
│   ├── usePlayerSoldCelebration.ts   # 5s sold queue + dismiss
│   └── useSession.ts                 # Session + ready flag
│
├── lib/
│   ├── auction-server.ts
│   ├── auction-utils.ts
│   ├── auction-ui.ts                 # Bid tick SFX, CSV, print
│   ├── sold-celebration-audio.ts     # Procedural smash/glass SFX
│   ├── sold-celebration-config.ts    # Timing + visual variants
│   ├── format.ts                     # formatMoney (₹), status badges
│   ├── constants.ts
│   ├── image-client.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── auth/session.ts
│   ├── security/                     # Logger, rate-limit, sanitize
│   └── supabase/                     # Browser + admin clients
│
├── public/                           # Static assets, optional frame packs
├── supabase/
│   └── schema.sql
│
├── middleware.ts
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── README.md
└── PROJECT_STRUCTURE.md
```

## Route map

| Path | Audience | Notes |
| --- | --- | --- |
| `/` | Public | Marketing + auction gate |
| `/auction` | Public | Live watch floor |
| `/auction?captain=1` | Captain | Full bidding desk (dock hidden) |
| `/captain-dashboard` | Captain | Same desk via guard |
| `/captain-login` | Captain | Login card |
| `/admin-dashboard` | Admin | Command center (dock hidden) |
| `/admin-login` | Admin | Login card |
| `/player-registration` | Public | Registration + success state |
| `/players` | Public | Filters + cards |
| `/teams` | Public | Squads + budgets |
| `/seasons` | Public | Archives |

## UX infrastructure (shared)

- **`.app-shell`** in `layout.tsx` / `globals.css` — top offset for fixed navbar, bottom offset for dock + safe area
- **`data-hide-dock`** — set on admin/captain/login shells so bottom chrome does not cover CTAs
- **Toasts** — `toast()`, `toast.success()`, `toast.error()` via `AppToaster`
- **Dialogs** — `confirmAction()` / `promptAction()` via `ConfirmDialogHost` (replaces browser confirm/prompt for admin ops)
- **Money** — `formatMoney()` / `formatMoneyFull()` always include `₹`

## Related docs

- [README.md](./README.md) — setup and overview  
- [docs/PLAYER_SOLD_ANIMATION.md](./docs/PLAYER_SOLD_ANIMATION.md) — sold overlay design  
- [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) — database  
