'use client';

import { Search, X } from 'lucide-react';
import { playerRoles } from '@/lib/constants';
import type { PlayerRole } from '@/lib/types';

export function PlayerFilters({
  search,
  setSearch,
  role,
  setRole,
}: {
  search: string;
  setSearch: (v: string) => void;
  role: PlayerRole | 'All';
  setRole: (v: PlayerRole | 'All') => void;
}) {
  const hasFilters = Boolean(search.trim()) || role !== 'All';

  return (
    <div className="mx-auto mt-8 max-w-5xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-xl backdrop-blur-xl sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name…"
              aria-label="Search players by name"
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</span>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as PlayerRole | 'All')}
            aria-label="Filter by role"
          >
            <option value="All">All roles</option>
            {playerRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setSearch('');
            setRole('All');
          }}
          className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
