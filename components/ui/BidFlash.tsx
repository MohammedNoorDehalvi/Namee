'use client';

import { useEffect, useState } from 'react';

/** Brief flash overlay when a new highest bid arrives. */
export function BidFlash({ triggerKey }: { triggerKey: string | number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!triggerKey) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 700);
    return () => window.clearTimeout(t);
  }, [triggerKey]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-2 border-amber-400/80 bg-amber-400/10"
      style={{ animation: 'bidFlash 0.7s ease-out forwards' }}
    />
  );
}
