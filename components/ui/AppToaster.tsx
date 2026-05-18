"use client";

export function AppToaster() {
  return <div id="toast-root" />;
}

export function toast(message: string) {
  if (typeof window === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'fixed right-4 top-20 z-[100] max-w-sm rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm font-semibold text-white shadow-glow backdrop-blur-xl';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
