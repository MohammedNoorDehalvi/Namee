"use client";

import { useEffect, useState } from 'react';
import { Gavel, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import type { Bid, Captain, Player } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';
import { EmptyState } from '@/components/ui/EmptyState';

export function AdminPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [captainForm, setCaptainForm] = useState({ captain_name: '', team_name: '', password: '', budget: '50000' });

  async function api(path: string, options: RequestInit = {}) {
    const session = readSession();
    const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}`, ...(options.headers || {}) } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  async function load() {
    setLoading(true);
    try {
      const json = await api('/api/admin/overview');
      setPlayers(json.players || []);
      setCaptains(json.captains || []);
      setBids(json.bids || []);
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to load admin data'); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function approve(player: Player, edit = false) {
    const base_price = edit ? Number(prompt('Set base price', String(player.base_price || 100))) : Number(player.base_price || 100);
    if (!base_price || base_price < 1) return toast('Base price is required.');
    await api(`/api/admin/players/${player.id}/approve`, { method: 'POST', body: JSON.stringify({ ...player, base_price }) });
    toast('Player approved'); load();
  }
  async function reject(id: string) { await api(`/api/admin/players/${id}/reject`, { method: 'POST' }); toast('Player rejected'); load(); }
  async function remove(id: string) { if (!confirm('Delete this player?')) return; await api(`/api/admin/players/${id}`, { method: 'DELETE' }); toast('Player deleted'); load(); }
  async function start(playerId: string) { await api('/api/admin/auction/start', { method: 'POST', body: JSON.stringify({ player_id: playerId }) }); toast('Auction started'); load(); }
  async function action(name: 'sold' | 'unsold' | 'reset' | 'next') { await api(`/api/admin/auction/${name}`, { method: 'POST' }); toast(`Auction ${name} done`); load(); }
  async function addCaptain(e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/captains', { method: 'POST', body: JSON.stringify({ ...captainForm, budget: Number(captainForm.budget) }) });
    toast('Captain added');
    setCaptainForm({ captain_name: '', team_name: '', password: '', budget: '50000' });
    load();
  }

  if (loading) return <div className="py-20 text-center font-bold text-white/60">Loading admin panel...</div>;
  const pending = players.filter((p) => p.approval_status === 'Pending');
  const approved = players.filter((p) => p.approval_status === 'Approved');

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6">
      <section className="grid gap-4 md:grid-cols-4">
        <AdminStat label="Players" value={players.length} />
        <AdminStat label="Pending" value={pending.length} />
        <AdminStat label="Captains" value={captains.length} />
        <AdminStat label="Bids" value={bids.length} />
      </section>

      <section className="glass-card rounded-[2rem] p-5 sm:p-7">
        <h2 className="text-2xl font-black">Auction Controls</h2>
        <p className="mt-2 text-sm text-white/55">Only admin can start auction, mark sold/unsold, reset, and move to next player.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => action('sold')} className="btn-primary"><Gavel size={18}/>Sold</button>
          <button onClick={() => action('unsold')} className="btn-ghost">Unsold</button>
          <button onClick={() => action('next')} className="btn-ghost">Next Player</button>
          <button onClick={() => action('reset')} className="btn-ghost"><RefreshCw size={18}/>Reset Auction</button>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
          <h2 className="text-2xl font-black">Pending Player Requests</h2>
          <div className="mt-5 grid gap-4">
            {pending.length === 0 && <EmptyState title="No pending players" />}
            {pending.map((p) => <PlayerRow key={p.id} player={p} actions={<><button onClick={() => approve(p)} className="btn-primary !py-2">Approve</button><button onClick={() => approve(p, true)} className="btn-ghost !py-2">Approve & Edit</button><button onClick={() => reject(p.id)} className="btn-ghost !py-2">Reject</button></>} />)}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
          <h2 className="text-2xl font-black">Add Captain / Team</h2>
          <form onSubmit={addCaptain} className="mt-5 grid gap-4">
            <input className="input" required placeholder="Captain name" value={captainForm.captain_name} onChange={(e) => setCaptainForm({ ...captainForm, captain_name: e.target.value })} />
            <input className="input" required placeholder="Team name" value={captainForm.team_name} onChange={(e) => setCaptainForm({ ...captainForm, team_name: e.target.value })} />
            <input className="input" required placeholder="Password" type="password" value={captainForm.password} onChange={(e) => setCaptainForm({ ...captainForm, password: e.target.value })} />
            <input className="input" required placeholder="Budget" type="number" value={captainForm.budget} onChange={(e) => setCaptainForm({ ...captainForm, budget: e.target.value })} />
            <button className="btn-primary"><Plus size={18}/>Add Captain</button>
          </form>
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-5 sm:p-7">
        <h2 className="text-2xl font-black">Approved Players</h2>
        <div className="mt-5 grid gap-4">
          {approved.length === 0 && <EmptyState title="No approved players" />}
          {approved.map((p) => <PlayerRow key={p.id} player={p} actions={<><button onClick={() => start(p.id)} className="btn-primary !py-2">Start Auction</button><button onClick={() => remove(p.id)} className="btn-ghost !py-2"><Trash2 size={16}/>Delete</button></>} />)}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
          <h2 className="text-2xl font-black">Teams</h2>
          <div className="mt-5 grid gap-3">{captains.map((c) => <div key={c.id} className="rounded-2xl bg-white/5 p-4"><b>{c.team_name}</b><p className="text-white/55">Captain: {c.captain_name} • Remaining: {formatMoney(c.remaining_budget)} / {formatMoney(c.budget)}</p></div>)}</div>
        </div>
        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
          <h2 className="text-2xl font-black">Bid History</h2>
          <div className="mt-5 grid gap-3">{bids.map((b) => <div key={b.id} className="rounded-2xl bg-white/5 p-4"><b>{b.team_name}</b><p className="text-white/55">Bid: {formatMoney(b.bid_amount)}</p></div>)}</div>
        </div>
      </section>
    </div>
  );
}
function AdminStat({ label, value }: { label: string; value: React.ReactNode }) { return <div className="glass-card rounded-3xl p-5"><p className="text-white/50">{label}</p><p className="text-3xl font-black text-apl-gold">{value}</p></div>; }
function PlayerRow({ player, actions }: { player: Player; actions: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="text-xl font-black">{player.name}</h3><p className="text-sm text-white/55">{player.role} • {player.batting_style} • {player.bowling_style} • Base: {formatMoney(player.base_price)} • {player.status}</p></div><div className="flex flex-wrap gap-2">{actions}</div></div></div>;
}
