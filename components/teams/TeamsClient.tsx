"use client";

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Captain, Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

type TeamGroup = Team & {
  players: Player[];
  captain_photo_url?: string | null;
};

export function TeamsClient() {
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [{ data: teamData }, { data: playerData }, { data: captainData }] = await Promise.all([
      supabase.from('teams').select('*').order('team_name'),
      supabase.from('players').select('*').eq('status', 'Sold'),
      supabase.from('captains').select('id,captain_name,team_name,team_id,photo_url,budget,remaining_budget,created_at'),
    ]);

    const players = (playerData || []) as Player[];
    const captains = (captainData || []) as Captain[];

    const grouped = ((teamData || []) as Team[]).map((team) => {
      const captain =
        captains.find((item) => item.id === team.captain_id) ||
        captains.find((item) => item.team_id === team.id) ||
        captains.find((item) => item.team_name === team.team_name);

      return {
        ...team,
        captain_name: team.captain_name || captain?.captain_name || 'Captain',
        captain_photo_url: captain?.photo_url || team.captain_photo_url || null,
        players: players.filter((p) => p.sold_to_captain_id === team.captain_id || p.sold_to_team === team.team_name),
      };
    });

    setTeams(grouped);
    setLoading(false);
  }

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('apl-teams-images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-white/70">Loading teams...</div>;
  }

  if (teams.length === 0) {
    return <EmptyState title="No teams yet" description="Teams will appear here after admin adds them." />;
  }

  return (
    <div className="grid gap-8">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamGroup }) {
  const spent = Number(team.budget || 0) - Number(team.remaining_budget || 0);

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
            {team.players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <LogoAvatar src={p.photo_url} label={p.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{p.name}</p>
                  <p className="text-sm text-white/55">
                    {p.role} • {formatMoney(p.sold_price)}
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
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
