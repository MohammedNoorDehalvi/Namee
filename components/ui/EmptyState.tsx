'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { GlassCard } from '@/components/ui/liquid-glass';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = SearchX,
}: EmptyStateProps) {
  return (
    <GlassCard className="rounded-[2.5rem] p-10 text-center max-w-xl mx-auto space-y-5 border-white/15">
      <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/10">
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-extrabold text-white font-display">{title}</h3>
        {description && (
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionHref && actionLabel && (
        <div className="pt-2">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
