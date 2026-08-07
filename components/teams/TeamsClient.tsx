"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { RefreshCw, Shield, Zap } from 'lucide-react';

import type { Player, Season, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { CardSkeleton } from '@/components/ui/Skeleton';

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
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
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
      <div className="flex flex-col gap-3 rounded-[2rem] border border-white/15 bg-slate-900/80 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between shadow-2xl">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">Current Season</p>
          <h2 className="mt-1 text-2xl font-black text-white font-display">{season.name}</h2>
        </div>

        <button type="button" onClick={() => void load()} className="btn-ghost rounded-full px-5 py-2.5 bg-white/10 text-xs font-bold hover:bg-white/20">
          <RefreshCw size={16} /> Refresh Teams
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
    <TiltCard tiltMaxAngle={6} glareOpacity={0.1}>
      <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)" className="rounded-[2.5rem] border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl md:p-8 space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <LogoAvatar src={team.logo_url} label={team.team_name} size="xl" />

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-4xl font-extrabold text-white md:text-5xl font-display">{team.team_name}</h2>

            <div className="mt-3 flex items-center gap-3 text-base text-slate-300 font-medium">
              <LogoAvatar src={team.captain_photo_url} label={team.captain_name} size="sm" />
              <span>Captain: <b className="text-amber-300 font-bold">{team.captain_name}</b></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Info label="Total Budget" value={<AnimatedNumber value={Number(team.budget || 0)} prefix="₹" />} />
          <Info label="Remaining Purse" value={<AnimatedNumber value={Number(team.remaining_budget || 0)} prefix="₹" />} highlight />
          <Info label="Players Bought" value={<AnimatedNumber value={team.players.length} suffix={`/${team.max_players || 4}`} />} />
          <Info label="Points Spent" value={<AnimatedNumber value={spent} prefix="₹" />} />
        </div>

        <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-5">
          <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Squad Roster ({team.players.length})
          </h4>
          {team.players.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No bought players yet in auction.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {team.players.map((player) => (
                <div key={player.id} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:border-amber-400/30 transition-colors">
                  <LogoAvatar src={player.photo_url} label={player.name} size="md" />

                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-white text-sm">{player.name}</p>
                    <p className="text-xs text-amber-300 font-semibold mt-0.5">
                      {player.role} • {formatMoney(player.sold_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SpotlightCard>
    </TiltCard>
  );
}

function Info({ label, value, highlight = false }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-extrabold font-display ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
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
    xl: 'h-28 w-28 rounded-[1.8rem] text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`${sizes[size]} shrink-0 border border-white/15 object-cover shadow-lg shadow-black/40`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center border border-amber-400/30 bg-amber-400/15 font-extrabold text-amber-300 shadow-lg`}
    >
      {size === 'xl' ? <Shield className="w-10 h-10" /> : initials(label)}
    </div>
  );
}
