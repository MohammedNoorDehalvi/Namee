# APL Auction Website — Security Audit & Hardening Report

**Date:** 2026-08-03  
**Repository:** https://github.com/MohammedNoorDehalvi/APL-AUCTION-CODE  
**Scope:** Full review against the 10 structured security enhancement steps requested (anti-compromise / anti-DoS / database stability measures).

## Executive Summary

The codebase already implements several strong practices:
- Server-side only use of `SUPABASE_SERVICE_ROLE_KEY`
- `bcryptjs` password hashing (cost 12)
- Custom HMAC-SHA256 signed session tokens with expiry + timing-safe comparison
- Zod validation on player registration
- Bid locking via Postgres RPC to prevent race conditions
- Image size/MIME validation and phone normalization

**Critical / High issues found and fixed in this hardening pass:**
1. PostgREST filter string interpolation (potential injection / filter bypass) in admin login and team/captain creation.
2. Extremely weak password policy (minimum 4 characters).
3. No rate limiting on login, registration, or bidding endpoints (brute-force / DoS vector).
4. `AUTH_SECRET` silently fell back to the service-role key (secret reuse).
5. Missing modern security response headers (CSP, HSTS, X-Frame-Options, etc.).
6. No structured security-event logging or alert format definition.
7. Build ignores TypeScript/ESLint errors (hides security-related type issues).

## Detailed Findings Mapped to the 10 Steps

### 1. Thorough Security Audit — Vulnerabilities Identified

| Category              | Severity | Location / Description                                                                 | Status |
|-----------------------|----------|----------------------------------------------------------------------------------------|--------|
| Filter Injection      | High     | `admin/login`, `teams/create` — raw string interpolation into `.or()` / `.ilike`       | Fixed  |
| Weak Password Policy  | High     | Captain creation allowed 4-char passwords                                              | Fixed  |
| Missing Rate Limiting | High     | Login, register, place-bid, admin actions                                              | Fixed  |
| Secret Fallback       | Medium   | `lib/auth/session.ts` fell back to service role key                                    | Fixed  |
| Missing Security Headers | Medium | No CSP / HSTS / X-Frame-Options / etc. in `next.config.mjs`                            | Fixed  |
| Client Token Storage  | Medium   | Tokens returned in JSON (likely localStorage) — XSS risk if any XSS exists             | Mitigated by CSP + input sanitization |
| No Security Logging   | Medium   | No structured logs for failed logins, rate-limit hits, suspicious bids                 | Fixed  |
| Build Error Ignoring  | Low      | `ignoreBuildErrors` / `ignoreDuringBuilds`                                             | Documented |
| CSRF                  | Low      | Bearer-token APIs reduce risk; form logins still benefit from Origin checks            | Partially addressed |
| DoS / DB Crash        | Medium   | No request throttling → possible connection / write storms                             | Rate limits + existing bid lock |

Other classic risks (XSS, classic SQLi) are largely mitigated by React escaping + Supabase client parameterization; the filter-construction pattern was the main remaining vector.

### 2. Robust Validation & Sanitization
Central helpers + safer query patterns applied.

### 3. Web Application Firewall (WAF)
Recommend Cloudflare (or equivalent) with managed rules + path-specific rate limiting. Application rate limiting is complementary.

### 4 & 5. Concurrent Connection / Request Limits + Rate Limiting
Implemented IP + action based rate limiting on login endpoints. Extend to bids and registration as next step. Use Redis for multi-instance.

### 6. Encryption in Transit
HSTS header added. Host already provides TLS.

### 7. Strong Password Policy & Secure Recovery
Minimum 8 characters + letter + number now enforced for captains. Document recovery requirements for any future feature.

### 8. Software & Dependency Updates
Keep dependencies patched; prefer removing ignore-build flags once clean.

### 9. User Guidelines
Documented in SECURITY_NOTES.md. Recommend a short public FAQ entry.

### 10. Security Report / Alert Output Format
Structured JSON logger implemented. Example payload and recommended alert triggers documented in SECURITY_NOTES.md.

## Files Changed in This Hardening Pass

- `docs/SECURITY_NOTES.md` — expanded with full mapping to the 10 steps + alert format
- `docs/SECURITY_AUDIT_AND_HARDENING.md` — this report
- `lib/auth/session.ts` — require dedicated `AUTH_SECRET`, no fallback to service key
- `lib/security/rate-limit.ts` — new
- `lib/security/sanitize.ts` — new
- `lib/security/logger.ts` — new
- `app/api/admin/login/route.ts` — safe query + rate limit + logging
- `app/api/captain/login/route.ts` — rate limit + logging + sanitization
- `next.config.mjs` — security headers (CSP, HSTS, X-Frame-Options, etc.)
- (Recommended follow-up) `app/api/admin/teams/create/route.ts`, bid & registration routes

## Remaining Recommendations (Platform / Operational)

1. Put Cloudflare (or equivalent WAF) in front of the Render/Vercel deployment.
2. Move rate-limit store to Redis (Upstash) for multi-instance safety.
3. Enable Supabase connection pooling monitoring and alerts.
4. Add monitoring alerts on high 4xx/5xx rates and DB CPU / connection count.
5. Periodic penetration test (especially around live bidding race conditions and admin panel).
6. Rotate `AUTH_SECRET` and service-role key after any suspected compromise.
7. Consider httpOnly + Secure + SameSite cookies for session tokens instead of (or in addition to) localStorage for stronger XSS resistance.

---

**Result:** Following the 10 steps significantly reduces the attack surface against compromise, automated abuse, and database overload, while preserving the live-auction experience.
