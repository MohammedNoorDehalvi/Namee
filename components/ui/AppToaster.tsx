'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const TOAST_EVENT = 'apl-toast';
const MAX_VISIBLE = 4;
const DEFAULT_DURATION_MS = 3800;

type ToastEventDetail = { message: string; variant: ToastVariant };

function emitToast(message: string, variant: ToastVariant = 'info') {
  if (typeof window === 'undefined') return;
  const text = String(message || '').trim();
  if (!text) return;
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
      detail: { message: text, variant },
    }),
  );
}

type ToastApi = {
  (message: string, variant?: ToastVariant): void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

/** Imperative toast API used across the app. */
export const toast: ToastApi = Object.assign(
  (message: string, variant: ToastVariant = 'info') => {
    emitToast(message, variant);
  },
  {
    success: (message: string) => emitToast(message, 'success'),
    error: (message: string) => emitToast(message, 'error'),
    info: (message: string) => emitToast(message, 'info'),
  },
);

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; icon: typeof Info; iconClass: string; accent: string }
> = {
  success: {
    border: 'border-emerald-400/35',
    icon: CheckCircle2,
    iconClass: 'text-emerald-300',
    accent: 'from-emerald-500/20',
  },
  error: {
    border: 'border-red-400/40',
    icon: XCircle,
    iconClass: 'text-red-300',
    accent: 'from-red-500/20',
  },
  info: {
    border: 'border-white/15',
    icon: Info,
    iconClass: 'text-amber-300',
    accent: 'from-amber-500/15',
  },
};

export function AppToaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => {
        const next = [...prev, { id, message: detail.message, variant: detail.variant || 'info' }];
        return next.slice(-MAX_VISIBLE);
      });
      window.setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [dismiss]);

  return (
    <div
      id="toast-root"
      className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[200] flex flex-col items-end gap-2 px-3 sm:top-20 sm:px-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const style = VARIANT_STYLES[item.variant];
          const Icon = style.icon;
          return (
            <motion.div
              key={item.id}
              role={item.variant === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: -12, x: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${style.border} bg-slate-950/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl bg-gradient-to-r ${style.accent} to-transparent`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} aria-hidden />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
