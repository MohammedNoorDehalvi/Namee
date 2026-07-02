import { SearchX } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="glass-card rounded-[2rem] p-8 text-center">
      <SearchX className="mx-auto text-apl-gold" size={42} />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      {description && <p className="mt-2 text-white/60">{description}</p>}
    </div>
  );
}
