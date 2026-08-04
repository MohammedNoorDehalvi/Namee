/**
 * Structured security event logger.
 * Emits JSON lines to stdout so they can be collected by the host (Render logs,
 * Vercel, CloudWatch, etc.) and optionally forwarded to email / Slack / Discord.
 *
 * Desired alert format (step 10):
 * {
 *   "ts": "ISO-8601",
 *   "level": "info" | "warn" | "error",
 *   "type": "security",
 *   "event": string,
 *   "ip": string,
 *   "user_agent": string | null,
 *   "role": string | null,
 *   "user_id": string | null,
 *   "path": string,
 *   "details": object,
 *   "request_id": string | null
 * }
 */

export type SecurityEvent =
  | 'login_success'
  | 'login_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_bid'
  | 'admin_action'
  | 'registration_attempt'
  | 'password_policy_violation'
  | 'auth_secret_missing'
  | string;

export type SecurityLogPayload = {
  level?: 'info' | 'warn' | 'error';
  event: SecurityEvent;
  ip?: string | null;
  user_agent?: string | null;
  role?: string | null;
  user_id?: string | null;
  path?: string | null;
  details?: Record<string, unknown>;
  request_id?: string | null;
};

export function logSecurityEvent(payload: SecurityLogPayload) {
  const entry = {
    ts: new Date().toISOString(),
    level: payload.level || 'info',
    type: 'security',
    event: payload.event,
    ip: payload.ip ?? null,
    user_agent: payload.user_agent ?? null,
    role: payload.role ?? null,
    user_id: payload.user_id ?? null,
    path: payload.path ?? null,
    details: payload.details || {},
    request_id: payload.request_id ?? null,
  };

  // Structured JSON so log aggregators can parse easily
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));

  // Optional: in production you can also POST this to a webhook / email service
  // if (process.env.SECURITY_ALERT_WEBHOOK) { ... }
}

export function getRequestMeta(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown',
    user_agent: request.headers.get('user-agent'),
    path: new URL(request.url).pathname,
  };
}
