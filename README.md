# APL Online Auction Website

APL means **Ashoka Premier League**. This is a responsive mini IPL-style cricket auction web app built with:

- Next.js / React
- Tailwind CSS
- Supabase Database, Storage, and Realtime
- Framer Motion
- CSS 3D scroll effects, parallax-style hero, glassmorphism cards
- Server API routes for secure admin/captain login and auction actions

## Main Features

### Normal users
- View approved players
- View live auction dashboard
- View team-wise player lists
- Cannot bid

### Players
- Register from phone
- Add name, phone, role, batting style, bowling style
- Upload/capture photo
- Registration goes to admin as pending
- Player cannot set base price

### Captains
- Login using captain name and password
- See current auction player
- Place bids only while auction is live
- Cannot bid above remaining budget
- Cannot start/stop auction
- See team budget and bought players

### Admin
- Secure login through API route
- Approve, reject, approve/edit players
- Set base price
- Start auction for selected player
- Mark player sold or unsold
- Reset auction
- Move to next player
- Add captains and teams
- View teams and bid history

## Test Logins

After running `supabase/schema.sql`:

Captain:
- Name: `Faiz`
- Password: `apl123`

Admin:
- Name/email: `admin@apl.com`
- Password: `admin123`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

3. Add your Supabase values inside `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=make-a-long-random-secret
```

4. Create Supabase tables:
   - Open Supabase dashboard
   - Go to SQL Editor
   - Paste and run `supabase/schema.sql`

5. Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supabase Setup Guide

### Where to add Supabase URL
Supabase Dashboard → Project Settings → API → Project URL  
Paste it into:

```env
NEXT_PUBLIC_SUPABASE_URL=
```

### Where to add Supabase anon key
Supabase Dashboard → Project Settings → API → Project API keys → anon/public  
Paste it into:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Where to add service role key
Supabase Dashboard → Project Settings → API → service_role key  
Paste it into:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Important: never expose the service role key in client-side code. This project only uses it inside server API routes.

### Storage bucket
The SQL creates a public bucket named:

```text
player-photos
```

It also adds policies for reading and uploading player photos.

### Realtime
The SQL adds these tables to Supabase Realtime:

- players
- auction
- bids
- teams

## Render Deployment

1. Push this project to GitHub.
2. Go to Render.
3. Create New → Web Service.
4. Connect your GitHub repository.
5. Use:

```bash
Build Command: npm install && npm run build
Start Command: npm run start
```

6. Add environment variables in Render:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://your-render-url.onrender.com
AUTH_SECRET=make-a-long-random-secret
```

7. Deploy.

## Folder Structure

```text
app/
  api/
    admin/
    bids/
    captain/
  admin-dashboard/
  admin-login/
  auction/
  captain-dashboard/
  captain-login/
  player-registration/
  players/
  teams/
components/
  admin/
  auction/
  captain/
  forms/
  home/
  layout/
  players/
  teams/
  ui/
hooks/
lib/
  auth/
  supabase/
supabase/
  schema.sql
```

## Security Notes

- Password hashes are stored in Supabase, not plain text.
- Passwords are verified through server API routes using `bcryptjs`.
- Frontend does not read `password_hash`.
- Captains/admin receive a signed session token stored in localStorage.
- Auction data is stored only in Supabase.
- localStorage is used only for session token, not for auction data.
- Supabase Row Level Security is enabled.
- Public can only insert pending players and read approved players.
- Admin/captain actions use server API routes with `SUPABASE_SERVICE_ROLE_KEY`.

## Important Production Improvement

For a large real-money or official auction, convert sold/bid actions into Supabase Postgres RPC functions so updates are fully atomic. This school-league version is structured and secure enough for normal APL testing, but RPC transactions are stronger for high-traffic production.
