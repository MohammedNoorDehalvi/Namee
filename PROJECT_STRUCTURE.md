# APL Online Auction — Comprehensive Project Structure

```text
apl-online-auction/
├── app/
│   ├── admin-dashboard/            # Admin control desk (squad manager, approval, auction state)
│   ├── admin-login/                # Secure admin authentication page
│   ├── api/                        # Next.js Server API Routes
│   │   ├── admin/                  # Admin auth & player approval API endpoints
│   │   ├── auction/                # Real-time auction state & lot transition routes
│   │   ├── bids/                   # Bidding validation & purse deduction handlers
│   │   ├── captain/                # Captain login & authentication endpoints
│   │   ├── players/                # Player registration & photo upload handlers
│   │   ├── season/                 # Season management endpoints
│   │   └── teams/                  # Team roster & budget APIs
│   ├── auction/                    # Live Auction arena page (public & captain mode)
│   ├── captain-dashboard/          # Captain bidding desk & squad wishlist
│   ├── captain-login/              # Captain login page with spotlight glow
│   ├── globals.css                 # Global CSS tokens, keyframes & glassmorphism filters
│   ├── layout.tsx                  # Root layout (Navbar, FloatingDock, SeasonGate, SplineIntro)
│   ├── page.tsx                    # Landing page entry point
│   ├── player-registration/        # Player registration draft page
│   ├── players/                    # Registered player directory
│   ├── seasons/                    # Season history archives
│   └── teams/                      # Official franchise squad rosters
├── components/
│   ├── admin/                      # Admin dashboard cards, player approval table & controls
│   ├── auction/                    # Live auction arena, bid controls, celebration overlays
│   ├── captain/                    # Captain dashboard squad stats & bidding desk
│   ├── forms/                      # Registration & login cards with Spotlight & Meteors
│   ├── home/                       # Landing page sections (Hero3D, LiveBidSimulator, SaaSFeatures, etc.)
│   ├── layout/                     # Navbar, Footer & liquid glass shell
│   ├── players/                    # Player cards with 3D TiltCard & filter bars
│   ├── providers/                  # Smooth scroll provider (Lenis)
│   ├── season/                     # Season public gate wrapper
│   ├── teams/                      # Team squad breakdown cards with budget gauges
│   └── ui/                         # 21st.dev & Magic UI Interactive Component Library
│       ├── AnimatedBeam.tsx        # Traveling pulse connection beam
│       ├── AnimatedNumber.tsx      # Scroll-triggered count-up rolling numbers
│       ├── AppToaster.tsx          # Toast notification provider
│       ├── BorderBeam.tsx          # Glowing border ray highlight
│       ├── Confetti.tsx            # Celebration confetti particle shower
│       ├── EmptyState.tsx          # Glassmorphic empty state graphic card
│       ├── FlipWords.tsx           # Kinetic typography text switcher
│       ├── FloatingDock.tsx        # Glass action navigation dock with hover magnification
│       ├── LetterLoader.tsx        # Animated letter loading indicator
│       ├── LoadingSpinner.tsx      # Standard spinner fallback
│       ├── Marquee3D.tsx           # 3D infinite scrolling ribbon ticker
│       ├── Meteors.tsx             # Shooting meteor particle trails effect
│       ├── OrbitingCircles.tsx     # Concentric SVG orbital path animation
│       ├── RetroGrid.tsx           # 3D perspective animated grid background
│       ├── SectionHeading.tsx      # Standardized section title header
│       ├── ShimmerButton.tsx       # Glowing gradient shimmer border ring button
│       ├── Skeleton.tsx            # Animated shimmer skeleton loader cards
│       ├── SparklesCore.tsx        # Canvas particle sparkles backdrop
│       ├── SplineIntroOverlay.tsx  # 3D Spline introductory overlay
│       ├── SpotlightCard.tsx       # Mouse-tracking radial spotlight card
│       ├── TiltCard.tsx            # 3D perspective mouse tilt card
│       └── liquid-glass.tsx        # Liquid glass backdrop filters & button primitives
├── docs/                           # Documentation guides
│   ├── RENDER_DEPLOYMENT.md        # Render cloud hosting deployment guide
│   ├── SECURITY_NOTES.md           # Security, authentication & service role policies
│   └── SUPABASE_SETUP.md           # Database SQL schema & setup documentation
├── hooks/                          # Custom React Hooks
│   ├── useAuctionRealtime.ts       # Supabase Realtime WebSocket subscription hook
│   ├── usePlayers.ts               # Player list fetching & filtering hook
│   ├── usePlayerSoldCelebration.ts # Sold player celebration overlay trigger hook
│   └── useSession.ts               # Local session token & role hook
├── lib/                            # Core Utilities & Supabase Client
│   ├── auction-server.ts           # Server-side auction database operations
│   ├── auction-utils.ts            # Money formatting & budget calculation helpers
│   ├── constants.ts                # Application constants & category lists
│   ├── format.ts                   # Initial & currency formatters
│   ├── supabase/                   # Supabase browser & service role client initialization
│   ├── types.ts                    # TypeScript type definitions (Player, Team, Bid, Auction)
│   └── utils.ts                    # Classname merge helper (cn)
├── public/                         # Static image assets & icons
├── supabase/                       # SQL Schema files
│   └── schema.sql                  # Main PostgreSQL schema & RLS policies
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Project dependencies & scripts
├── tailwind.config.ts              # Tailwind CSS theme configuration
└── tsconfig.json                   # TypeScript compiler options
```
