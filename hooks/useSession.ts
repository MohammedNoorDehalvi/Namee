"use client";

import { useEffect, useState } from 'react';
import type { AppSession } from '@/lib/types';

const KEY = 'apl_session';

export function readSession(): AppSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed.expires_at || parsed.expires_at < Date.now()) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(KEY);
    return null;
  }
}

export function saveSession(session: AppSession) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('apl-session-change'));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('apl-session-change'));
}

export function useSession() {
  const [session, setSession] = useState<AppSession | null>(null);
  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener('apl-session-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('apl-session-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { session, clearSession };
}
