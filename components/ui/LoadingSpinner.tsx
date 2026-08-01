export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="grid min-h-[240px] place-items-center text-center text-white/70">
      <div>
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-apl-gold" />
        <p className="mt-4 text-sm font-semibold">{label}</p>
      </div>
    </div>
  );
}
