/**
 * Global SFX mute preference (localStorage + window event).
 * Used by bid ticks, sold celebration, and any future UI sounds.
 */

const STORAGE_KEY = 'apl_sfx_muted';
const EVENT = 'apl-sfx-mute-change';

export function isSfxMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { muted } }));
}

export function toggleSfxMuted(): boolean {
  const next = !isSfxMuted();
  setSfxMuted(next);
  return next;
}

export function subscribeSfxMute(listener: (muted: boolean) => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ muted: boolean }>).detail;
    listener(detail?.muted ?? isSfxMuted());
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
