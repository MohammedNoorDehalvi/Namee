'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSfxMuted, setSfxMuted, subscribeSfxMute, toggleSfxMuted } from '@/lib/audio-prefs';

export function useSfxMute() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSfxMuted());
    return subscribeSfxMute(setMuted);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleSfxMuted();
    setMuted(next);
    return next;
  }, []);

  const set = useCallback((value: boolean) => {
    setSfxMuted(value);
    setMuted(value);
  }, []);

  return { muted, toggle, setMuted: set };
}
