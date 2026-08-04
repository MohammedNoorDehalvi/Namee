/**
 * Central sanitization helpers for user-controlled input.
 * Prevents overly long strings, control characters, and unsafe characters that could
 * break PostgREST filters or cause unexpected behaviour.
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Trim, collapse whitespace, remove control chars, enforce max length. */
export function sanitizeText(value: unknown, maxLength = 200): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

/**
 * Safe identifier for use in filters (names, emails, etc.).
 * Rejects characters that are special in PostgREST filter syntax.
 */
export function sanitizeIdentifier(value: unknown, maxLength = 120): string {
  const cleaned = sanitizeText(value, maxLength);
  // Block characters that can break .or() / .filter constructions
  return cleaned.replace(/[,.()"'\\]/g, '');
}

/** Basic password strength check (letter + number, min length). */
export function isStrongPassword(password: string, minLength = 8): boolean {
  if (typeof password !== 'string' || password.length < minLength) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

export function passwordPolicyMessage(minLength = 8): string {
  return `Password must be at least ${minLength} characters and contain at least one letter and one number.`;
}
