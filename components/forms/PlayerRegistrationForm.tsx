"use client";

import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Send, X, CheckCircle2, PartyPopper } from "lucide-react";

import { battingStyles, bowlingStyles, playerRoles } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/auction-utils";
import { toast } from "@/components/ui/AppToaster";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { Meteors } from "@/components/ui/Meteors";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

const initialForm = {
  name: "",
  phone: "",
  role: "Batter",
  batting_style: "Right Hand",
  bowling_style: "None",
};

const fieldClass =
  "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-medium text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60";

const selectClass =
  "w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3.5 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60";

export function PlayerRegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
    setFieldErrors((old) => {
      if (!old[key]) return old;
      const next = { ...old };
      delete next[key];
      return next;
    });
  }

  function onFileChange(nextFile: File | null) {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
    setFieldErrors((old) => {
      if (!old.photo) return old;
      const next = { ...old };
      delete next.photo;
      return next;
    });
  }

  function openPhotoPicker() {
    fileRef.current?.click();
  }

  function removePhoto() {
    onFileChange(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Player name is required.";
    const digits = normalizePhoneNumber(form.phone).replace(/\D/g, "");
    if (digits.length < 10) errors.phone = "Enter a valid 10-digit phone number.";
    if (!file) errors.photo = "Player photo is required.";
    else if (!file.type.startsWith("image/")) errors.photo = "Upload an image file only.";
    else if (file.size > 5 * 1024 * 1024) errors.photo = "Photo must be under 5 MB.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      if (!file) openPhotoPicker();
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.set("name", form.name.trim());
      body.set("phone", normalizePhoneNumber(form.phone));
      body.set("role", form.role);
      body.set("batting_style", form.batting_style);
      body.set("bowling_style", form.bowling_style);
      body.set("photo", file!);

      const res = await fetch("/api/players/register", {
        method: "POST",
        body,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      const name = form.name.trim();
      toast.success("Player registered. Waiting for admin approval.");
      setSubmittedName(name);
      setForm(initialForm);
      removePhoto();
      setFieldErrors({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (submittedName) {
    return (
      <div className="mx-auto max-w-2xl">
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.2)"
          className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/25 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-12"
        >
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-emerald-400/30 bg-emerald-400/15 text-emerald-300">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white font-display">Registration received</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            <strong className="text-white">{submittedName}</strong> is in the approval queue. An admin will review the
            profile and base price before the auction pool goes live.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => setSubmittedName(null)} className="btn-primary justify-center">
              Register another player
            </button>
            <Link href="/players" className="btn-ghost justify-center">
              View player list
            </Link>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl" noValidate>
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.18)"
        className="relative space-y-6 overflow-hidden rounded-[2.5rem] border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-10"
      >
        <BorderBeam lightColor="#F59E0B" lightWidth={280} duration={8} />
        <Meteors number={12} />

        <div className="relative z-10 flex items-center gap-4 border-b border-white/10 pb-4">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/20 p-3.5 text-amber-300 shadow-lg shadow-amber-500/10">
            <ImagePlus className="h-6 w-6" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400 font-display">
              Official draft registration
            </span>
            <h1 className="text-2xl font-extrabold text-white font-display sm:text-3xl">Player Registration</h1>
            <p className="text-xs text-slate-300 sm:text-sm">
              Submit your details and photo to enter the current season auction pool.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid gap-5 sm:grid-cols-2">
          <Field label="Player name *" error={fieldErrors.name}>
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Kabir"
              required
              disabled={loading}
              autoComplete="name"
            />
          </Field>

          <Field label="Phone number *" error={fieldErrors.phone}>
            <input
              className={fieldClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              inputMode="tel"
              placeholder="9999999999"
              required
              disabled={loading}
              autoComplete="tel"
            />
          </Field>

          <Field label="Primary playing role *">
            <select
              className={selectClass}
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              disabled={loading}
            >
              {playerRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Batting style *">
            <select
              className={selectClass}
              value={form.batting_style}
              onChange={(e) => update("batting_style", e.target.value)}
              disabled={loading}
            >
              {battingStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bowling style *">
            <select
              className={selectClass}
              value={form.bowling_style}
              onChange={(e) => update("bowling_style", e.target.value)}
              disabled={loading}
            >
              {bowlingStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Player photo (required) *" error={fieldErrors.photo}>
            <div
              className={`rounded-3xl border bg-white/5 p-4 ${
                fieldErrors.photo ? "border-red-400/40" : "border-white/15"
              }`}
            >
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
                    className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{file?.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Photo selected
                    </p>

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openPhotoPicker}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={removePhoto}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-400/40 bg-amber-400/10 px-4 py-6 text-center font-extrabold text-amber-300 transition-all hover:bg-amber-400/20"
                >
                  <ImagePlus size={24} />
                  <span className="text-xs">Upload player photo</span>
                  <span className="text-[10px] font-normal text-slate-300">Max 5 MB image</span>
                </button>
              )}
            </div>
          </Field>
        </div>

        <div className="relative z-10 pt-2">
          <ShimmerButton type="submit" disabled={loading} shimmerColor="#F59E0B" className="w-full justify-center py-4">
            <Send className="h-5 w-5" />
            <span>{loading ? "Submitting…" : "Submit player registration"}</span>
          </ShimmerButton>
        </div>

        <p className="relative z-10 text-center text-xs text-slate-400">
          Base price and approval are reviewed by admin before the auction.
        </p>
      </SpotlightCard>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block space-y-2 text-xs font-bold uppercase tracking-wider text-slate-300">
      <span className="block">{label}</span>
      {children}
      {error && <span className="block normal-case tracking-normal text-red-300 font-semibold">{error}</span>}
    </label>
  );
}
