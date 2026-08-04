'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Scrolls to top when `scrollKey` changes (e.g. new bid id). */
export function AutoScrollList({
  scrollKey,
  className,
  children,
}: {
  scrollKey: string | number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollKey]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
