"use client";

import { useEffect, useMemo, useState } from 'react';
import { Shield, Trophy } from 'lucide-react';
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

    const [{ data: teamData }, { data: captainData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').order('team_name'),
      supabase.from('captains').select('id,captain_name,team_name,team_id,photo_url'),
      supabase.from('players').select('*').or('status.eq.Sold,auction_status.eq.SOLD'),
    ]);

    const captains = (captainData || []) as Captain[];
    const players = (playerData || []) as Player[];

    const grouped = ((teamData || []) as Team[]).map((team) => {
      const captain =
        captains.find((item) => item.id === team.captain_id) ||
        captains.find((item) => item.team_id === team.id) ||
        captains.find((item) => item.team_name === team.team_name) ||
        captains.find((item) => item.captain_name === team.captain_name);

      return {
        ...team,
        captain_photo_url: team.captain_photo_url || captain?.photo_url || null,
        players: players.filter(
          (player) =>
            player.sold_to_captain_id === team.captain_id ||
            player.sold_to_team_id === team.id ||
            player.sold_to_team === team.team_name,
        ),
      };
    });

    setTeams(grouped);
    setLoading(false);
  }

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('apl-teams-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <p className="text-white/70">Loading teams...</p>;
  }

  if (teams.length === 0) {
    return <EmptyState title="No teams created yet" description="Admin-created teams will appear here with logos." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamGroup }) {
  const spent = useMemo(() => team.budget - team.remaining_budget, [team.budget, team.remaining_budget]);

  return (
    <article className="glass-card p-6">
      <div className="flex items-start gap-4">
        <Avatar src={team.logo_url} label={team.team_name} size="xl" icon={<Shield className="h-7 w-7" />} />

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-3xl font-black text-white sm:text-4xl">{team.team_name}</h2>

          <div className="mt-2 flex items-center gap-2 text-white/65">
            <Avatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
            <span>Captain: {team.captain_name}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Info label="Total Budget" value={formatMoney(team.budget)} />
        <Info label="Remaining" value={formatMoney(team.remaining_budget)} />
        <Info label="Players Bought" value={team.players.length} />
        <Info label="Points Spent" value={formatMoney(spent)} />
      </div>

      <div className="mt-5 rounded-3xl bg-white/[0.04] p-4">
        {team.players.length === 0 ? (
          <p className="text-white/55">No bought players yet.</p>
        ) : (
          <div className="space-y-3">
            {team.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={player.photo_url} label={player.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{player.name}</p>
                    <p className="text-xs text-white/55">{player.role}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-apl-gold/15 px-3 py-1 text-xs font-black text-apl-gold">
                  {formatMoney(player.sold_price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Avatar({
  src,
  label,
  size = 'md',
  icon,
}: {
  src?: string | null;
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'xl';
  icon?: React.ReactNode;
}) {
  const [ok, setOk] = useState(Boolean(src));
  const sizes = {
    xs: 'h-8 w-8 rounded-full text-[10px]',
    sm: 'h-11 w-11 rounded-2xl text-xs',
    md: 'h-14 w-14 rounded-2xl text-sm',
    xl: 'h-20 w-20 rounded-3xl text-lg',
  };

  return (
    <div
      className={`${sizes[size]} grid shrink-0 place-items-center overflow-hidden border border-white/10 bg-apl-gold/15 font-black text-apl-gold shadow-glow`}
    >
      {src && ok ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        icon || <span>{initials(label)}</span>
      )}
    </div>
  );
}
