export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-sm font-black uppercase tracking-[.35em] text-apl-gold">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-white/65 sm:text-lg">{subtitle}</p>}
    </div>
  );
}
