# Ashoka Premier League (APL) — Live Digital Cricket Auction Platform

**Ashoka Premier League (APL)** is an award-winning, responsive digital cricket auction platform inspired by official IPL auctions. It features real-time WebSocket bidding, protected franchise purses, automated squad validation, player registration with gallery photo uploads, captain command desks, admin controls, and interactive 3D visual experiences.

---

## 🌟 Core Features

- **Live Public Auction Arena**: Real-time bid stream, active lot card, team purse indicators, and instant sold/unsold celebrations using Supabase Realtime WebSockets.
- **Captain Bidding Desk**: Dedicated portal for franchise captains with quick-increment bidding, remaining budget gauges, and target squad wishlists.
- **Player Registration Draft**: Player sign-up form with gallery photo upload, role selection, batting/bowling style options, and image validation.
- **Admin Command Center**: Complete control to create franchises/captains, approve registered players, set base prices, and manage auction states (Start, Pause, Resume, End, Reset).
- **Protected Team Purses**: Automatic validation prevents invalid bids, enforcing max team budget (₹50,000) and squad size limits (4 Players + 1 Captain).
- **Official Squad Rosters**: Live view of every team's bought players, points spent, remaining budget, and captain details.
- **Interactive 21st.dev Design System**: Integrated 3D perspective tilt cards, kinetic flip typography, floating glass navigation dock, retro grid line animations, shimmer buttons, shooting meteors, particle sparkles, and shimmer skeleton loaders.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Core**: React 18, TypeScript, Tailwind CSS
- **Interactive 3D & Animations**: `@splinetool/react-spline`, `@splinetool/runtime`, `framer-motion`, `three`
- **Smooth Scrolling**: `@studio-freight/lenis`
- **Database & Realtime**: Supabase (PostgreSQL, Supabase Realtime WebSockets, Supabase Storage)
- **Authentication & Security**: Server-side API authentication with `bcryptjs` password hashing and signed session tokens
- **Icons**: `lucide-react`
- **Cloud Hosting**: Render / Vercel

---

## 🎨 21st.dev Interactive Component Suite

The application includes a custom-built 21st.dev & Magic UI interactive component library under `components/ui/`:

| Component | Description |
| :--- | :--- |
| **`TiltCard`** | 3D perspective mouse-tilt card with dynamic specular light sheen. |
| **`FlipWords`** | Kinetic text switcher with vertical slide, motion blur, and spring transitions. |
| **`AnimatedNumber`** | Scroll-triggered rolling count-up counter for stats and budget displays. |
| **`FloatingDock`** | Glass action navigation dock with spring-animated icon magnification on mouse hover. |
| **`RetroGrid`** | 3D perspective animated grid background with horizon light mask. |
| **`ShimmerButton`** | Glowing gradient shimmer border ring button with tactile click physics. |
| **`Meteors`** | Shooting meteor particle trails effect for featured cards and hero banners. |
| **`OrbitingCircles`** | Concentric SVG orbital path animation displaying spinning feature badges. |
| **`SparklesCore`** | Lightweight canvas particle sparkles background component. |
| **`AnimatedBeam`** | Traveling pulse connection beam for visual data flow representation. |
| **`SpotlightCard`** | Mouse-tracking radial spotlight card with dark glassmorphism. |
| **`Skeleton`** | Animated shimmer skeleton loaders for cards, tables, and avatars. |

---

## 🔑 Required Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AUTH_SECRET=your_secret_auth_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** For production deployment on Render or Vercel, add the exact same environment variables in your cloud hosting dashboard.

---

## 🚀 Local Setup & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MohammedNoorDehalvi/Namee.git
   cd Namee
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify TypeScript type safety**:
   ```bash
   npm run typecheck
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🗄 Database Setup (Supabase)

1. Open your Supabase Project → **SQL Editor**.
2. Run the master SQL schema script found in [`supabase/schema.sql`](file:///d:/Downloads/Whole%20new%20Web/supabase/schema.sql).
3. Ensure storage buckets exist for `player-photos` and `team-logos`.
4. The schema automatically configures Row Level Security (RLS) policies allowing public reads for approved players while protecting captain/admin credentials.

---

## 🌐 Deployment (Render)

Recommended Render Node Web Service settings:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.

---

## 📄 Documentation Index

- [`PROJECT_STRUCTURE.md`](file:///d:/Downloads/Whole%20new%20Web/PROJECT_STRUCTURE.md): Detailed directory tree and component layout.
- [`docs/RENDER_DEPLOYMENT.md`](file:///d:/Downloads/Whole%20new%20Web/docs/RENDER_DEPLOYMENT.md): Render cloud deployment instructions.
- [`docs/SECURITY_NOTES.md`](file:///d:/Downloads/Whole%20new%20Web/docs/SECURITY_NOTES.md): Security architecture & API authentication guidelines.
- [`docs/SUPABASE_SETUP.md`](file:///d:/Downloads/Whole%20new%20Web/docs/SUPABASE_SETUP.md): Supabase SQL schema & RLS configuration.

---

© Ashoka Premier League (APL). All rights reserved.
