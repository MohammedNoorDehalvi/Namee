"use client";

import { PlayerCard } from '@/components/players/PlayerCard';
import { PlayerFilters } from '@/components/players/PlayerFilters';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useApprovedPlayers } from '@/hooks/usePlayers';

export default function PlayersPage() {
  const { filteredPlayers, loading, search, setSearch, role, setRole } = useApprovedPlayers();
  return (
    <section className="px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="Approved Players" title="APL Player List" subtitle="Normal users can view approved players and live updates. Only captains can bid after login." />
      <PlayerFilters search={search} setSearch={setSearch} role={role} setRole={setRole} />
      <div className="mx-auto mt-10 max-w-7xl">
        {loading ? <LoadingSpinner label="Loading players..." /> : filteredPlayers.length === 0 ? <EmptyState title="No players found" description="Try changing your search or filter." /> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredPlayers.map((player) => <PlayerCard key={player.id} player={player} />)}</div>}
      </div>
    </section>
  );
}
