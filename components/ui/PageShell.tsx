import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageShellProps = {
  children: ReactNode;
  className?: string;
  /** Wider content (auction arena). Default max-w-7xl. */
  wide?: boolean;
  /** Extra bottom padding for sticky CTAs */
  stickyFooterSafe?: boolean;
};

/** Consistent horizontal padding + max width under the global app shell. */
export function PageShell({ children, className, wide, stickyFooterSafe }: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        wide ? 'max-w-[1600px]' : 'max-w-7xl',
        stickyFooterSafe && 'pb-24 sm:pb-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-400">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-display sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
