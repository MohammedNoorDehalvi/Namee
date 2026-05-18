"use client";

import { useState } from 'react';
import { Camera, Send } from 'lucide-react';
import { battingStyles, bowlingStyles, playerRoles } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/AppToaster';

export function PlayerRegistrationForm() {
  const [form, setForm] = useState({ name: '', phone: '', role: 'Batter', batting_style: 'Right Hand', bowling_style: 'None' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) { setForm((old) => ({ ...old, [key]: value })); }

  async function uploadPhoto() {
    if (!file) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `players/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('player-photos').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const photo_url = await uploadPhoto();
      const { error } = await supabase.from('players').insert({
        ...form,
        photo_url,
        approval_status: 'Pending',
        status: 'Available',
        base_price: null,
        current_bid: 0
      });
      if (error) throw error;
      toast('Player registered. Waiting for admin approval.');
      setForm({ name: '', phone: '', role: 'Batter', batting_style: 'Right Hand', bowling_style: 'None' });
      setFile(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card mx-auto max-w-3xl rounded-[2rem] p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Player Name"><input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Kabir" /></Field>
        <Field label="Phone Number"><input className="input" required value={form.phone} onChange={(e) => update('phone', e.target.value)} inputMode="tel" placeholder="9999999999" /></Field>
        <Field label="Player Role"><select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>{playerRoles.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Batting Style"><select className="input" value={form.batting_style} onChange={(e) => update('batting_style', e.target.value)}>{battingStyles.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Bowling Style"><select className="input" value={form.bowling_style} onChange={(e) => update('bowling_style', e.target.value)}>{bowlingStyles.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Upload Photo or Click Photo"><label className="input flex cursor-pointer items-center gap-3"><Camera className="text-apl-gold" /> <span className="truncate">{file ? file.name : 'Choose or capture photo'}</span><input className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label></Field>
      </div>
      <button disabled={loading} className="btn-primary mt-7 w-full disabled:opacity-50"><Send size={18} />{loading ? 'Submitting...' : 'Submit Player Registration'}</button>
      <p className="mt-4 text-center text-sm text-white/50">Base price is set by admin only after approval.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-white/80">{label}{children}</label>;
}
