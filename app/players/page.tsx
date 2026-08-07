'use client';

import { PlayerCard } from '@/components/players/PlayerCard';
import { PlayerFilters } from '@/components/players/PlayerFilters';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useApprovedPlayers } from '@/hooks/usePlayers';
import { Users } from 'lucide-react';

export default function PlayersPage() {
  const { filteredPlayers, loading, search, setSearch, role, setRole } = useApprovedPlayers();
  const hasFilters = Boolean(search.trim()) || role !== 'All';

  return (
    <section className="px-4 pb-4 sm:px-6">
      <SectionHeading
        eyebrow="Approved Players"
        title="APL Player List"
        subtitle="Browse the approved auction pool. Captains bid live after login; everyone else can follow the action on the public auction floor."
      />
      <PlayerFilters search={search} setSearch={setSearch} role={role} setRole={setRole} />
      <div className="mx-auto mt-10 max-w-7xl">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No players match your filters' : 'No approved players yet'}
            description={
              hasFilters
                ? 'Try clearing search or switching role filters.'
                : 'Players appear here after admin approval.'
            }
            actionHref={hasFilters ? undefined : '/player-registration'}
            actionLabel={hasFilters ? undefined : 'Register a player'}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}

        {hasFilters && !loading && filteredPlayers.length === 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRole('All');
              }}
              className="btn-ghost"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
