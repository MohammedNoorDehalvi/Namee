# Security Notes

This project avoids storing passwords in the frontend.

- Captains and admins are authenticated through API routes.
- Passwords are compared with bcrypt hashes.
- Supabase service role key is used only server-side.
- RLS blocks public reads of `captains` and `admin`.
- Auction data is saved in Supabase, not localStorage.
- localStorage only stores a signed session token.

## Recommended Upgrades

For heavy production traffic:
- Use Supabase Auth with custom roles.
- Move bid and sold logic into Postgres RPC functions.
- Add rate limiting on login and bid API routes.
- Add audit logs for admin actions.
