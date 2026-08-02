# Security Architecture & Data Integrity Notes

The Ashoka Premier League (APL) platform follows strict server-side security standards to protect admin credentials, captain authentication, player data, and bidding integrity.

## Core Security Policies

1. **Server-Side API Authentication**:
   - Authentication requests for captains and admins are handled exclusively via server API routes (`/api/captain/login`, `/api/admin/login`).
   - Passwords are validated using `bcryptjs` hash comparisons. Plaintext passwords are never stored or exposed to the client.

2. **Supabase Service Role Key Isolation**:
   - `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to server-side API routes and is never sent to or embedded in browser JavaScript bundles.

3. **Row Level Security (RLS)**:
   - `players`, `teams`, `bids`, and `auction` tables permit public read access for approved auction data.
   - `captains` and `admin` tables block direct public SELECT queries, requiring server-side service role authentication.

4. **Data Integrity & Zero Fabrication**:
   - The UI strictly displays real data returned from the Supabase backend. Zero fake or fabricated placeholder statistics are invented.
   - Automated server validation rules prevent invalid bids, enforcing purse limits (₹50,000 max) and team squad caps (4 Players + 1 Captain).

5. **Session Security**:
   - Client sessions store signed tokens with expiration timestamps in local state without exposing sensitive database keys.
