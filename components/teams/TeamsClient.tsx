"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

import type { Player, Season, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

type TeamGroup = Team & {
  players: Player[];
  captain_photo_url?: string | null;
};

type TeamsResponse = {
  season: Season | null;
  teams: TeamGroup[];
  error?: string;
};

export function TeamsClient() {
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(silent = false) {
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/teams?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const json = (await res.json().catch(() => ({ teams: [] }))) as TeamsResponse;

      if (!res.ok) {
        throw new Error(json.error || 'Could not load teams.');
      }

      setSeason(json.season || null);
      setTeams(json.teams || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load teams.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => void load(true), 2500);

    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-white/70">Loading teams...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-300/20 bg-red-500/10 p-8 text-center">
        <p className="font-black text-red-200">{error}</p>
        <button type="button" onClick={() => void load()} className="btn-ghost mt-4">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!season) {
    return <EmptyState title="No current season going" description="Teams will appear when admin starts a new season." />;
  }

  if (teams.length === 0) {
    return <EmptyState title="No teams yet" description="Teams will appear here after admin adds them in the current season." />;
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-apl-gold">Current Season</p>
          <h2 className="mt-1 text-2xl font-black text-white">{season.name}</h2>
        </div>

        <button type="button" onClick={() => void load()} className="btn-ghost">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamGroup }) {
  const spent = Math.max(0, Number(team.budget || 0) - Number(team.remaining_budget || 0));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <LogoAvatar src={team.logo_url} label={team.team_name} size="xl" />

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-4xl font-black text-white md:text-5xl">{team.team_name}</h2>

          <div className="mt-3 flex items-center gap-3 text-lg text-white/65">
            <LogoAvatar src={team.captain_photo_url} label={team.captain_name} size="sm" />
            <span>Captain: {team.captain_name}</span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4">
        <Info label="Total Budget" value={formatMoney(team.budget)} />
        <Info label="Remaining" value={formatMoney(team.remaining_budget)} />
        <Info label="Players Bought" value={team.players.length} />
        <Info label="Points Spent" value={formatMoney(spent)} />
      </div>

      <div className="mt-6 rounded-3xl bg-black/15 p-4">
        {team.players.length === 0 ? (
          <p className="text-white/55">No bought players yet.</p>
        ) : (
          <div className="grid gap-3">
            {team.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <LogoAvatar src={player.photo_url} label={player.name} size="md" />

                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{player.name}</p>
                  <p className="text-sm text-white/55">
                    {player.role} • {formatMoney(player.sold_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function LogoAvatar({
  src,
  label,
  size = 'md',
}: {
  src?: string | null;
  label: string;
  size?: 'sm' | 'md' | 'xl';
}) {
  const sizes = {
    sm: 'h-9 w-9 rounded-full text-xs',
    md: 'h-12 w-12 rounded-2xl text-sm',
    xl: 'h-28 w-28 rounded-[1.6rem] text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`${sizes[size]} shrink-0 border border-white/10 object-cover shadow-lg shadow-black/30`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center border border-yellow-300/20 bg-yellow-300/15 font-black text-yellow-300`}
    >
      {size === 'xl' ? <Shield /> : initials(label)}
    </div>
  );
}
