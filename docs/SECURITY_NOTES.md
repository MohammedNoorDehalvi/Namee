# Security Architecture, Audit & Hardening Notes

**Last updated:** 2026-08-03  
**Related:** Full audit report in `docs/SECURITY_AUDIT_AND_HARDENING.md`

The Ashoka Premier League (APL) platform follows strict server-side security standards to protect admin credentials, captain authentication, player data, and bidding integrity. This document maps the platform to the 10 structured security enhancement steps.

## Core Security Policies (Already Present + Hardened)

1. **Server-Side API Authentication**  
   Authentication for captains and admins is handled exclusively via server API routes (`/api/captain/login`, `/api/admin/login`). Passwords are validated with `bcryptjs` (cost 12). Plaintext passwords are never stored or sent to the client.

2. **Supabase Service Role Key Isolation**  
   `SUPABASE_SERVICE_ROLE_KEY` is restricted to server-side API routes only and is never embedded in browser bundles.

3. **Row Level Security (RLS)**  
   Public read access is limited to approved auction data. `captains` and `admin` tables block direct public SELECT; all sensitive operations go through the service-role client.

4. **Data Integrity & Zero Fabrication**  
   UI displays only real data from Supabase. Server validation enforces purse limits (₹50,000) and squad caps.

5. **Session Security**  
   Sessions use HMAC-SHA256 signed tokens with expiry and timing-safe comparison. `AUTH_SECRET` is now **required** (min 32 chars) and no longer falls back to the service-role key.

## Mapping to the 10 Enhancement Steps

### 1. Thorough Security Audit
Completed. Critical findings (filter string interpolation, weak password policy, missing rate limits, missing security headers, secret reuse) have been remediated. See the full report.

### 2. Robust Validation & Sanitization
- Zod schemas on registration.
- Central helpers in `lib/security/sanitize.ts` (`sanitizeText`, `sanitizeIdentifier`, `isStrongPassword`).
- All user input that previously entered PostgREST `.or()` / filter strings is now sanitized or queried via safe methods.

### 3. Web Application Firewall (WAF)
**Platform recommendation:** Put the deployment behind Cloudflare (or equivalent). Enable OWASP managed rules, bot protection, and path-specific rate limiting. Application-level rate limiting is a second line of defence, not a replacement for a WAF.

### 4 & 5. Concurrent Connections / Rate Limiting
Application-level rate limiting is implemented in `lib/security/rate-limit.ts` and applied to:
- Admin login (5 / 15 min)
- Captain login (8 / 15 min)
- (Recommended) bids, registration, and other mutating endpoints

For multi-instance production move the store to Upstash Redis or a Supabase-backed limiter.

### 6. Encryption in Transit
HTTPS is terminated by the host (Render / Vercel). `Strict-Transport-Security` (HSTS) header is now set. Force HTTPS at the platform level and consider HSTS preload.

### 7. Strong Password Policy
Captain passwords must now be ≥ 8 characters and contain at least one letter and one number (`isStrongPassword`). Apply the same policy to any admin password creation path. Password recovery (if added later) must use single-use, time-limited, hashed tokens and be rate-limited.

### 8. Software & Plugin Updates
Keep Next.js, `@supabase/supabase-js`, `bcryptjs`, `zod` and all other dependencies patched. Run `npm audit` regularly. Prefer removing `ignoreBuildErrors` / `ignoreDuringBuilds` once the codebase is clean.

### 9. User Security Guidelines
Advise users / captains:
- Never share credentials.
- Use strong unique passwords.
- Report unexpected behaviour, locked accounts, or suspicious bids immediately through official channels only.
- Prefer the official site and never enter credentials on third-party pages.

### 10. Security Report / Alert Format
All security events are emitted as structured JSON (see `lib/security/logger.ts`):

```json
{
  "ts": "2026-08-03T16:22:11.123Z",
  "level": "warn",
  "type": "security",
  "event": "login_failed" | "rate_limit_exceeded" | "suspicious_bid" | "admin_action" | ...,
  "ip": "203.0.113.42",
  "user_agent": "...",
  "role": "captain" | "admin" | "anonymous",
  "user_id": "uuid-or-null",
  "path": "/api/captain/login",
  "details": { "reason": "invalid_password", "attempts": 4 },
  "request_id": null
}
```

Immediate alerts (email / Slack / Discord webhook) are recommended for repeated failed logins, rate-limit hits on admin paths, and unexpected auction state changes.

## Remaining Operational Recommendations

1. Cloudflare (or equivalent WAF) in front of the app.
2. Redis-backed rate limiting for horizontal scaling.
3. Monitor Supabase connection counts and CPU; set alerts.
4. Periodic penetration testing focused on the live bidding path and admin panel.
5. Rotate `AUTH_SECRET` and service-role key after any suspected compromise.
6. Prefer httpOnly + Secure + SameSite cookies for session tokens in a future iteration for stronger XSS resistance.

---

Following the 10 steps substantially reduces the risk of compromise, automated abuse, and database overload while preserving the live auction experience.
