'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { battingStyles, bowlingStyles, playerRoles } from '@/lib/constants';
import { normalizePhoneNumber } from '@/lib/auction-utils';
import { toast } from '@/components/ui/AppToaster';

const initialForm = {
  name: '',
  phone: '',
  role: 'Batter',
  batting_style: 'Right Hand',
  bowling_style: 'None',
};

export function PlayerRegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const body = new FormData();
      body.set('name', form.name.trim());
      body.set('phone', normalizePhoneNumber(form.phone));
      body.set('role', form.role);
      body.set('batting_style', form.batting_style);
      body.set('bowling_style', form.bowling_style);
      if (file) body.set('photo', file);

      const res = await fetch('/api/players/register', {
        method: 'POST',
        body,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Registration failed');

      toast('Player registered. Waiting for admin approval.');
      setForm(initialForm);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-2xl shadow-lime-500/10 backdrop-blur-xl md:p-8"
    >
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-300">Join the auction</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Player Registration</h1>
        <p className="mt-2 text-sm text-white/60">One phone number can register maximum 2 players.</p>
      </div>

      <div className="grid gap-5">
        <Field label="Player Name">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-lime-300"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Kabir"
            required
          />
        </Field>

        <Field label="Phone Number">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-lime-300"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            inputMode="tel"
            placeholder="9999999999"
            required
          />
        </Field>

        <Field label="Role">
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-lime-300"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
          >
            {playerRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </Field>

        <Field label="Batting Style">
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-lime-300"
            value={form.batting_style}
            onChange={(e) => update('batting_style', e.target.value)}
          >
            {battingStyles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </Field>

        <Field label="Bowling Style">
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-lime-300"
            value={form.bowling_style}
            onChange={(e) => update('bowling_style', e.target.value)}
          >
            {bowlingStyles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </Field>

        <Field label="Photo">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white transition hover:border-lime-300/70">
            <span className="flex min-w-0 items-center gap-3">
              <ImagePlus className="h-5 w-5 shrink-0 text-lime-300" />
              <span className="truncate text-white/80">{file ? file.name : 'Choose photo from gallery'}</span>
            </span>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">Gallery</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <p className="mt-2 text-xs text-white/45">Old photos from your gallery are allowed. Max recommended size: 5 MB.</p>
        </Field>
      </div>

      <button
        disabled={loading}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-yellow-300 via-lime-300 to-emerald-400 px-6 py-4 text-lg font-black text-black shadow-xl shadow-lime-400/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-5 w-5" />
        {loading ? 'Submitting...' : 'Submit Player Registration'}
      </button>

      <p className="mt-5 text-center text-sm text-white/50">Base price is set by admin only after approval.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">{label}</span>
      {children}
    </label>
  );
}
