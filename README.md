# APL Online Auction Website

APL means **Ashoka Premier League**.  
This is a responsive IPL-style cricket auction website with player registration, admin control, captain bidding, live public auction, teams, budgets, and auction reports.

---

## Features

- Player registration with photo upload
- Admin login
- Captain login
- Admin dashboard
- Add teams and captains from admin dashboard
- Captain password is hashed before saving in Supabase
- Approve / Reject / Approve & Edit player requests
- Start / Pause / Resume / End / Reset auction
- Live auction page for public users
- Captain live bidding page
- Realtime auction updates using Supabase Realtime
- Bid history
- Sold / Unsold player system
- Team budget tracking
- Maximum players per team
- Auction summary and reports
- Mobile-friendly dark cricket auction UI

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Realtime
- Render deployment

---

## Required Environment Variables

Add these in `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AUTH_SECRET=your_auth_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Render, add the same variables in:

```text
Render Dashboard → Your Service → Environment
```

Important:

```text
SUPABASE_SERVICE_ROLE_KEY
```

must be written exactly like this.  
Do not use a wrong name like `SUPABASI`.

Never expose the service role key on frontend pages.

---

## Local Setup

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build project:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

---

## Supabase Setup

Run the main schema first:

```text
Supabase Dashboard → SQL Editor → New Query
```

Paste and run:

```text
supabase/schema.sql
```

If team/captain saving gives database column or duplicate errors, also run:

```text
supabase/team_captain_saving_repair.sql
```

If player registration or auction columns are missing, run the latest schema again.

After running SQL, wait 20–30 seconds and refresh the website.

---

## Render Deployment

Recommended Render settings:

```text
Build Command:
npm install && npm run build

Start Command:
npm run start
```

Add environment variables in Render.

After pushing changes to GitHub:

```text
Render Dashboard → Manual Deploy → Deploy latest commit
```

Seeing this in Render logs is normal:

```text
Local: http://localhost:10000
```

That localhost is inside Render’s server.  
Your public website URL will still be:

```text
https://apl-online-auction.onrender.com
```

---

## Admin Flow

1. Login as admin.
2. Add teams and captains from admin dashboard.
3. Captain password is hashed automatically before saving.
4. Approve registered players.
5. Set or edit base price if needed.
6. Start auction only when:
   - Minimum 4 teams exist
   - Minimum 4 captains exist
   - Each team has one captain
   - Approved players are available
7. Select first player manually.
8. After first player, use:
   - Sold to Current Bidder
   - Unsold
   - Next Player Random

---

## Captain Flow

If auction is not live:

```text
Captain login → Captain dashboard
```

If auction is live:

```text
Captain login → Live auction bidding page
```

Captain can only bid if:

- Auction is live
- A current player is selected
- Team is not full
- Team has enough budget
- Captain is not already highest bidder
- Player is not sold or unsold

Bid increment:

```text
Below 1000 → +100
1000 or above → +1000
```

Examples:

```text
100 → 200
900 → 1000
1000 → 2000
5000 → 6000
```

---

## Team Rules

- Captains are not counted as bought players.
- Each team can buy 4 players by default.
- Admin can set max players while creating the team.
- Team budget is tracked live.
- If a team is full, captain cannot bid anymore.
- Admin can manually fix teams after auction.

---

## Player Registration

Players can register with:

- Player name
- Phone number
- Role
- Batting style
- Bowling style
- Gallery photo upload

Photo upload is handled through a server API route.

If registration fails, check:

1. Render environment variables
2. Supabase schema columns
3. Supabase storage bucket/policies
4. `SUPABASE_SERVICE_ROLE_KEY`

---

## Testing Demo Auction

You can add demo teams/captains from the admin dashboard.

Example:

```text
Team Name: Demo 1
Captain Name: Captain 1
Password: captain1
Budget: 50000
Max Players: 4
```

Add four teams:

```text
Demo 1 / Captain 1 / captain1
Demo 2 / Captain 2 / captain2
Demo 3 / Captain 3 / captain3
Demo 4 / Captain 4 / captain4
```

Then register and approve players.

---

## Clean Test Data

To reset test data, use Supabase SQL Editor and clean only:

- players
- teams
- captains
- bids
- auction events
- auction action history

Do not delete:

- admin table
- database schema
- table columns
- policies
- environment variables

Deleting admin rows can break admin login.

---

## Common Errors

### Could not find the auction_status column

Run the updated Supabase schema.

```text
supabase/schema.sql
```

Then wait 20–30 seconds and refresh.

---

### Could not find the max_players column

Run the team/captain repair SQL.

```text
supabase/team_captain_saving_repair.sql
```

---

### duplicate key value violates unique constraint teams_team_name_key

That team already exists.

Use another team name or clean test teams from Supabase.

The latest saving system should update/link existing records instead of crashing.

---

### Registration failed

Check these Render variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
NEXT_PUBLIC_APP_URL
```

Then redeploy Render.

---

## GitHub Push From Termux

If repo folder does not exist:

```bash
cd ~
git clone https://github.com/MohammedNoorDehalvi/Namee.git
cd Namee
```

After copying updated files:

```bash
git status
git add .
git commit -m "Update APL auction system"
git push origin main
```

Then deploy latest commit on Render.

---

## Project Status

The project is ready for:

- Player registration
- Admin team/captain creation
- Admin player approval
- Live auction testing
- Captain bidding
- Public auction viewing
- Auction summary and reports
