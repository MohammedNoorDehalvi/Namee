'use client';

import { Crown } from 'lucide-react';

export function HighestBidderBadge({ visible, teamName }: { visible: boolean; teamName?: string | null }) {
  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/20 px-4 py-2 text-sm font-black text-amber-200 shadow-lg shadow-amber-500/20 animate-pulse">
      <Crown className="h-4 w-4 text-amber-300" />
      You are the highest bidder{teamName ? ` · ${teamName}` : ''}
    </div>
  );
}
