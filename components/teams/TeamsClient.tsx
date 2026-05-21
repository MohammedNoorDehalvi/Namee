"use client";

import { useEffect, useState } from 'react';
import { Shield, Trophy, Users, WalletCards } from 'lucide-react';
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
        players: players.filter((p) => p.sold_to_team_id === team.id || p.sold_to_captain_id === team.captain_id || p.sold_to_team === team.team_name),
      };
    });

    setTeams(grouped);
    setLoading(false);
  }

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('apl-teams-ui-redesign')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => void load())
      .subscribe();

    const id = window.setInterval(() => void load(), 1500);

    return () => {
      window.clearInterval(id);
      void supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-white/70">Loading premium team cards...</div>;
  }

  if (teams.length === 0) {
    return <EmptyState title="No teams yet" description="Teams will appear here after admin adds them." />;
  }

  return (
    <div className="grid gap-6">
      {teams.map((team, index) => (
        <TeamCard key={team.id} team={team} rank={index + 1} />
      ))}
    </div>
  );
}

function TeamCard({ team, rank }: { team: TeamGroup; rank: number }) {
  const spent = Number(team.budget || 0) - Number(team.remaining_budget || 0);
  const full = team.players.length >= (team.max_players || 4);

  return (
    <section className="premium-card premium-hover overflow-hidden rounded-[2.2rem]">
      <div className="relative p-5 sm:p-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-300/14 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-yellow-300/14 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar src={team.logo_url} label={team.team_name} size="xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge border-yellow-300/20 bg-yellow-300/10 text-yellow-200">Team #{rank}</span>
              {full && <span className="badge border-green-300/20 bg-green-300/10 text-green-200">Full Squad</span>}
            </div>

            <h2 className="mt-3 break-words text-4xl font-black tracking-tight text-white sm:text-5xl">{team.team_name}</h2>

            <div className="mt-3 flex items-center gap-3 text-white/65">
              <Avatar src={team.captain_photo_url} label={team.captain_name} size="sm" />
              <span className="truncate font-bold">Captain: {team.captain_name}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Info icon={<WalletCards size={18} />} label="Budget" value={formatMoney(team.budget)} />
          <Info icon={<Trophy size={18} />} label="Spent" value={formatMoney(spent)} />
          <Info icon={<Shield size={18} />} label="Remaining" value={formatMoney(team.remaining_budget)} />
          <Info icon={<Users size={18} />} label="Players" value={`${team.players.length}/${team.max_players || 4}`} />
        </div>

        <div className="relative mt-6 rounded-[1.7rem] border border-white/10 bg-black/18 p-4">
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white/45">Bought Players</h3>
          {team.players.length === 0 ? (
            <p className="text-white/55">No bought players yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {team.players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <Avatar src={p.photo_url} label={p.name} size="md" />
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
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-yellow-300">{icon}<p className="text-xs font-black uppercase tracking-wider text-white/45">{label}</p></div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Avatar({ src, label, size = 'md' }: { src?: string | null; label: string; size?: 'sm' | 'md' | 'xl' }) {
  const sizes = {
    sm: 'h-10 w-10 rounded-full text-xs',
    md: 'h-12 w-12 rounded-2xl text-sm',
    xl: 'h-28 w-28 rounded-[1.6rem] text-2xl',
  };

  if (src) {
    return <img src={src} alt={label} loading="lazy" className={`${sizes[size]} shrink-0 border border-white/10 object-cover shadow-lg shadow-black/30`} />;
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center border border-yellow-300/20 bg-yellow-300/15 font-black text-yellow-300`}>
      {size === 'xl' ? <Shield /> : initials(label)}
    </div>
  );
}
