'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
};

export type PromptOptions = ConfirmOptions & {
  defaultValue?: string;
  inputLabel?: string;
  placeholder?: string;
  inputType?: 'text' | 'number';
};

type PendingConfirm = ConfirmOptions & {
  mode: 'confirm';
  resolve: (value: boolean) => void;
};

type PendingPrompt = PromptOptions & {
  mode: 'prompt';
  resolve: (value: string | null) => void;
};

type Pending = PendingConfirm | PendingPrompt;

const CONFIRM_EVENT = 'apl-confirm-request';

type RequestDetail =
  | { mode: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { mode: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void };

/** In-app confirm (replaces window.confirm). */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<RequestDetail>(CONFIRM_EVENT, {
        detail: { mode: 'confirm', options, resolve },
      }),
    );
  });
}

/** In-app prompt (replaces window.prompt). */
export function promptAction(options: PromptOptions): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<RequestDetail>(CONFIRM_EVENT, {
        detail: { mode: 'prompt', options, resolve },
      }),
    );
  });
}

export function ConfirmDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<RequestDetail>).detail;
      if (!detail) return;
      if (detail.mode === 'confirm') {
        setPending({ mode: 'confirm', ...detail.options, resolve: detail.resolve });
        setInputValue('');
      } else {
        setPending({ mode: 'prompt', ...detail.options, resolve: detail.resolve });
        setInputValue(detail.options.defaultValue ?? '');
      }
    };
    window.addEventListener(CONFIRM_EVENT, onRequest);
    return () => window.removeEventListener(CONFIRM_EVENT, onRequest);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    if (pending.mode === 'prompt') {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function close(result: boolean | string | null) {
    if (!pending) return;
    if (pending.mode === 'confirm') {
      pending.resolve(Boolean(result));
    } else {
      pending.resolve(typeof result === 'string' ? result : null);
    }
    setPending(null);
  }

  if (!mounted) return null;

  const variant = pending?.variant || 'primary';
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/25'
      : variant === 'warning'
        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/25';

  return createPortal(
    <AnimatePresence>
      {pending && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label="Cancel dialog"
            onClick={() => close(pending.mode === 'prompt' ? null : false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={pending.description ? descId : undefined}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                  variant === 'danger'
                    ? 'border-red-400/30 bg-red-500/15 text-red-300'
                    : 'border-amber-400/30 bg-amber-400/15 text-amber-300'
                }`}
              >
                {variant === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-xl font-extrabold text-white font-display leading-tight">
                  {pending.title}
                </h2>
                {pending.description && (
                  <p id={descId} className="mt-2 text-sm leading-relaxed text-slate-300">
                    {pending.description}
                  </p>
                )}
              </div>
            </div>

            {pending.mode === 'prompt' && (
              <label className="mt-5 block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {pending.inputLabel || 'Value'}
                </span>
                <input
                  ref={inputRef}
                  type={pending.inputType || 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={pending.placeholder}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none ring-amber-400/0 transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      close(inputValue);
                    }
                  }}
                />
              </label>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => close(pending.mode === 'prompt' ? null : false)}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {pending.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => close(pending.mode === 'prompt' ? inputValue : true)}
                className={`rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition active:scale-[0.98] ${confirmClass}`}
              >
                {pending.confirmLabel || (pending.mode === 'prompt' ? 'Save' : 'Confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
