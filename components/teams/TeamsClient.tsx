"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

type TeamGroup = Team & { players: Player[] };

export function TeamsClient() {
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: teamData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').order('team_name'),
      supabase.from('players').select('*').eq('status', 'Sold')
    ]);
    const players = (playerData || []) as Player[];
    const grouped = ((teamData || []) as Team[]).map((team) => ({ ...team, players: players.filter((p) => p.sold_to_captain_id === team.captain_id || p.sold_to_team === team.team_name) }));
    setTeams(grouped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('apl-teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <p className="py-20 text-center font-bold text-white/60">Loading teams...</p>;
  if (teams.length === 0) return <EmptyState title="No teams found" description="Admin can add captains and teams from Admin Dashboard." />;
  return <div className="grid gap-6 md:grid-cols-2">{teams.map((team) => <TeamCard key={team.id} team={team} />)}</div>;
}

function TeamCard({ team }: { team: TeamGroup }) {
  const spent = team.budget - team.remaining_budget;
  return (
    <article className="glass-card rounded-[2rem] p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-apl-gold/15 text-apl-gold"><Shield /></div>
        <div>
          <h2 className="text-2xl font-black">{team.team_name}</h2>
          <p className="text-white/60">Captain: {team.captain_name}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Info label="Total Budget" value={formatMoney(team.budget)} />
        <Info label="Remaining" value={formatMoney(team.remaining_budget)} />
        <Info label="Players Bought" value={team.players.length} />
        <Info label="Points Spent" value={formatMoney(spent)} />
      </div>
      <div className="mt-5 grid gap-3">
        {team.players.length === 0 && <p className="rounded-2xl bg-white/5 p-4 text-white/55">No bought players yet.</p>}
        {team.players.map((p) => <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">{p.photo_url ? <Image src={p.photo_url} alt={p.name} width={48} height={48} className="h-12 w-12 rounded-2xl object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-2xl bg-apl-gold/15 text-apl-gold font-black">{initials(p.name)}</div>}<div><b>{p.name}</b><p className="text-sm text-white/55">{p.role} • {formatMoney(p.sold_price)}</p></div></div>)}
      </div>
    </article>
  );
}
function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/45">{label}</p><p className="font-black">{value}</p></div>;
}
