# Supabase Setup

1. Create a new Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. Go to Project Settings → API.
5. Copy:
   - Project URL
   - anon public key
   - service_role key
6. Add these to `.env.local` and Render environment variables.

## Dummy Data

The schema creates:
- Player: Kabir
- Captain: Faiz / apl123
- Admin: admin@apl.com / admin123

## RLS Summary

- `players`: public can insert pending players and select approved players.
- `auction`: public can select.
- `bids`: public can select.
- `teams`: public can select.
- `captains`: no public select policy.
- `admin`: no public select policy.

Admin and captain private actions use Next.js API routes with the Supabase service role key.
