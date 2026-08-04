'use client';

import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton';

export function AuctionPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8 space-y-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
        <CardSkeleton />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Skeleton className="h-40 w-full rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <Skeleton className="h-64 w-full rounded-[2rem]" />
    </div>
  );
}
