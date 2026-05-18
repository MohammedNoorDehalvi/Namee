"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { battingStyles, bowlingStyles, playerRoles } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/auction-utils";
import { toast } from "@/components/ui/AppToaster";

export function PlayerRegistrationForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "Batter",
    batting_style: "Right Hand",
    bowling_style: "None",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("phone", normalizePhoneNumber(form.phone));
      body.append("role", form.role);
      body.append("batting_style", form.batting_style);
      body.append("bowling_style", form.bowling_style);
      if (file) body.append("photo", file);

      const res = await fetch("/api/players/register", {
        method: "POST",
        body,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Registration failed");

      toast("Player registered. Waiting for admin approval.");
      setForm({
        name: "",
        phone: "",
        role: "Batter",
        batting_style: "Right Hand",
        bowling_style: "None",
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur md:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">APL Registration</p>
        <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Player Registration</h2>
        <p className="mt-3 text-sm text-white/60">Register your player details and upload a photo from your gallery.</p>
      </div>

      <div className="grid gap-5">
        <Field label="Player Name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Kabir"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-base font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/70 focus:bg-white/[0.09]"
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            inputMode="tel"
            placeholder="9999999999"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-base font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/70 focus:bg-white/[0.09]"
          />
        </Field>

        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-base font-semibold text-white outline-none transition focus:border-emerald-300/70 focus:bg-white/[0.09]"
          >
            {playerRoles.map((role) => (
              <option key={role} value={role} className="bg-slate-950 text-white">
                {role}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Batting Style">
          <select
            value={form.batting_style}
            onChange={(e) => update("batting_style", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-base font-semibold text-white outline-none transition focus:border-emerald-300/70 focus:bg-white/[0.09]"
          >
            {battingStyles.map((style) => (
              <option key={style} value={style} className="bg-slate-950 text-white">
                {style}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bowling Style">
          <select
            value={form.bowling_style}
            onChange={(e) => update("bowling_style", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-base font-semibold text-white outline-none transition focus:border-emerald-300/70 focus:bg-white/[0.09]"
          >
            {bowlingStyles.map((style) => (
              <option key={style} value={style} className="bg-slate-950 text-white">
                {style}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Photo">
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {previewUrl ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected player" className="h-28 w-28 rounded-2xl object-cover ring-1 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{file?.name}</p>
                  <p className="mt-1 text-xs text-white/50">Gallery photo selected</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl bg-black/20 px-5 py-8 text-center transition hover:bg-black/30"
              >
                <ImagePlus className="h-9 w-9 text-emerald-300" />
                <span className="mt-3 text-base font-extrabold text-white">Choose Photo From Gallery</span>
                <span className="mt-1 text-xs text-white/45">JPG, PNG, WEBP or GIF under 5 MB</span>
              </button>
            )}
          </div>
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-yellow-300 via-lime-300 to-emerald-400 px-6 py-4 text-base font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-5 w-5" />
        {loading ? "Submitting..." : "Submit Player Registration"}
      </button>

      <p className="mt-5 text-center text-sm text-white/45">Base price is set by admin only after approval.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-white/75">{label}</span>
      {children}
    </label>
  );
}
