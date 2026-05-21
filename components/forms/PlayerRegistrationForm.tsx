"use client";

import type { FormEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { ImagePlus, Send, ShieldCheck, X } from 'lucide-react';

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
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function onFileChange(nextFile: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  function openPhotoPicker() {
    fileRef.current?.click();
  }

  function removePhoto() {
    onFileChange(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      toast('Player photo is required. Please upload a photo from gallery.');
      openPhotoPicker();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Photo is too large. Upload an image under 5 MB.');
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.set('name', form.name.trim());
      body.set('phone', normalizePhoneNumber(form.phone));
      body.set('role', form.role);
      body.set('batting_style', form.batting_style);
      body.set('bowling_style', form.bowling_style);
      body.set('photo', file);

      const res = await fetch('/api/players/register', {
        method: 'POST',
        body,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || 'Registration failed');
      }

      toast('Player registered. Waiting for admin approval.');
      setForm(initialForm);
      removePhoto();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card relative overflow-hidden rounded-[2rem] p-5 sm:p-8">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-green-300/15 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-yellow-300/15 blur-3xl" />

      <div className="relative">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-yellow-300/25 bg-yellow-300/10 text-yellow-300">
              <ImagePlus className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">Join the auction</p>
              <h2 className="text-2xl font-black text-white">Player Registration</h2>
              <p className="text-sm text-white/55">Photo upload is required for every player.</p>
            </div>
          </div>
          <span className="badge border-green-300/20 bg-green-300/10 text-green-200">
            <ShieldCheck size={14} /> Admin approval
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Player Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Kabir"
              required
            />
          </Field>

          <Field label="Phone Number">
            <input
              className="input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              inputMode="tel"
              placeholder="9999999999"
              required
            />
          </Field>

          <Field label="Role">
            <select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
              {playerRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </Field>

          <Field label="Batting Style">
            <select className="input" value={form.batting_style} onChange={(e) => update('batting_style', e.target.value)}>
              {battingStyles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </Field>

          <Field label="Bowling Style">
            <select className="input" value={form.bowling_style} onChange={(e) => update('bowling_style', e.target.value)}>
              {bowlingStyles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </Field>

          <Field label="Photo *">
            <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
              <input
                ref={fileRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />

              {preview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={preview}
                    alt="Selected player"
                    className="h-24 w-24 shrink-0 rounded-2xl border border-white/10 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{file?.name}</p>
                    <p className="mt-1 text-xs text-white/50">Gallery photo selected</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openPhotoPicker}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={removePhoto}
                        className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200"
                      >
                        <X size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-yellow-300/35 bg-yellow-300/10 px-4 py-8 text-center font-black text-yellow-300 transition hover:bg-yellow-300/15"
                >
                  <ImagePlus size={20} />
                  Upload required photo
                </button>
              )}

              <p className="mt-3 text-xs leading-5 text-white/50">Old photos from your gallery are allowed. Max size: 5 MB.</p>
            </div>
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Submitting...' : 'Submit Player Registration'}
        </button>

        <p className="mt-4 text-center text-xs text-white/50">Base price is set by admin only after approval.</p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-white/80">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
