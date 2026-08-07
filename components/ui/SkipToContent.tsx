/** Accessible skip link — first focusable element in the document. */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-amber-400 focus:px-4 focus:py-2.5 focus:text-sm focus:font-extrabold focus:text-slate-950 focus:shadow-2xl focus:outline-none"
    >
      Skip to content
    </a>
  );
}
