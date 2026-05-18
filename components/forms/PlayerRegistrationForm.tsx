"use client";

import { useState } from 'react';

import { Camera, Send } from 'lucide-react';

import { battingStyles, bowlingStyles, playerRoles } from '@/lib/constants';

import { normalizePhoneNumber } from '@/lib/auction-utils';
import { supabase } from '@/lib/supabase/client';

import { toast } from '@/components/ui/AppToaster';

export function PlayerRegistrationForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'Batter',
    batting_style: 'Right Hand',
    bowling_style: 'None',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function uploadPhoto() {
    if (!file) return null;

    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose a valid image from your gallery.');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `players/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('player-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('player-photos').getPublicUrl(path);

    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const photo_url = await uploadPhoto();

      const res = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: normalizePhoneNumber(form.phone), photo_url }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || 'Registration failed');

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
    <form onSubmit={onSubmit} className="glass-card mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-apl-gold/15 p-3 text-apl-gold">
          <Camera className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-black">Player Registration</h1>
          <p className="text-sm text-white/60">One phone number can register maximum 2 players.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Player Name">
          <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Kabir" required />
        </Field>

        <Field label="Phone Number">
          <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} inputMode="tel" placeholder="9999999999" required />
        </Field>

        <Field label="Role">
          <select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
            {playerRoles.map((role) => <option key={role}>{role}</option>)}
          </select>
        </Field>

        <Field label="Batting Style">
          <select className="input" value={form.batting_style} onChange={(e) => update('batting_style', e.target.value)}>
            {battingStyles.map((style) => <option key={style}>{style}</option>)}
          </select>
        </Field>

        <Field label="Bowling Style">
          <select className="input" value={form.bowling_style} onChange={(e) => update('bowling_style', e.target.value)}>
            {bowlingStyles.map((style) => <option key={style}>{style}</option>)}
          </select>
        </Field>

        <Field label="Photo">
          <label className="input flex cursor-pointer items-center justify-between gap-3">
            <span className="truncate text-white/70">{file ? file.name : 'Upload photo from gallery'}</span>
            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <p className="mt-2 text-xs font-medium text-white/45">Select any old photo from your phone gallery. Camera is not forced.</p>
        </Field>
      </div>

      <button disabled={loading} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60">
        <Send className="h-4 w-4" />
        {loading ? 'Submitting...' : 'Submit Player Registration'}
      </button>

      <p className="mt-4 text-center text-xs text-white/50">Base price is set by admin only after approval.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-white/80">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
