'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

export type CoachTip = {
  id: string;
  title: string;
  body: string;
};

type Props = {
  /** Storage namespace, e.g. captain / admin */
  scope: string;
  tips: CoachTip[];
  /** Optional delay before first tip (ms) */
  delayMs?: number;
};

/**
 * Non-blocking first-visit tips. Never blocks bidding or critical actions.
 */
export function CoachMarks({ scope, tips, delayMs = 900 }: Props) {
  const storageKey = `apl_coach_${scope}`;
  const [queue, setQueue] = useState<CoachTip[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || tips.length === 0) return;

    let seen: string[] = [];
    try {
      seen = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as string[];
      if (!Array.isArray(seen)) seen = [];
    } catch {
      seen = [];
    }

    const pending = tips.filter((tip) => !seen.includes(tip.id));
    if (pending.length === 0) return;

    const timer = window.setTimeout(() => {
      setQueue(pending);
      setIndex(0);
      setVisible(true);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [scope, storageKey, tips, delayMs]);

  function markSeen(tipId: string) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const seen = raw ? (JSON.parse(raw) as string[]) : [];
      const next = Array.from(new Set([...(Array.isArray(seen) ? seen : []), tipId]));
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function dismissAll() {
    queue.forEach((tip) => markSeen(tip.id));
    setVisible(false);
    setQueue([]);
  }

  function next() {
    const current = queue[index];
    if (current) markSeen(current.id);
    if (index + 1 >= queue.length) {
      setVisible(false);
      setQueue([]);
      return;
    }
    setIndex((i) => i + 1);
  }

  if (!visible || queue.length === 0) return null;

  const tip = queue[index];
  if (!tip) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[5.5rem] left-3 right-3 z-[180] flex justify-center sm:bottom-8 sm:left-auto sm:right-6 sm:justify-end"
      role="dialog"
      aria-label="Quick tip"
    >
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300">
            <Lightbulb className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                  Tip {index + 1}/{queue.length}
                </p>
                <h3 className="mt-0.5 text-sm font-extrabold text-white">{tip.title}</h3>
              </div>
              <button
                type="button"
                onClick={dismissAll}
                className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss all tips"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{tip.body}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismissAll}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:text-white"
              >
                Don&apos;t show again
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-amber-400 px-3.5 py-1.5 text-[11px] font-extrabold text-slate-950 transition hover:bg-amber-300"
              >
                {index + 1 >= queue.length ? 'Got it' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
