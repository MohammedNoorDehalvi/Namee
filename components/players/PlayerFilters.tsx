"use client";

import { playerRoles } from '@/lib/constants';
import type { PlayerRole } from '@/lib/types';

export function PlayerFilters({ search, setSearch, role, setRole }: { search: string; setSearch: (v: string) => void; role: PlayerRole | 'All'; setRole: (v: PlayerRole | 'All') => void }) {
  return (
    <div className="glass-card mx-auto mt-8 grid max-w-5xl gap-4 rounded-[2rem] p-4 sm:grid-cols-[1fr_220px]">
      <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search player name..." />
      <select className="input" value={role} onChange={(e) => setRole(e.target.value as PlayerRole | 'All')}>
        <option value="All">All Roles</option>
        {playerRoles.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}
