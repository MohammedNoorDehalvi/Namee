"use client";

import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { ImagePlus, Send, X, CheckCircle2, User, Phone, Shield } from "lucide-react";
import { motion } from "framer-motion";

import { battingStyles, bowlingStyles, playerRoles } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/auction-utils";
import { toast } from "@/components/ui/AppToaster";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BorderBeam } from "@/components/ui/BorderBeam";

const initialForm = {
  name: "",
  phone: "",
  role: "Batter",
  batting_style: "Right Hand",
  bowling_style: "None",
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
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      toast("Player photo is required. Please upload a photo from gallery.");
      openPhotoPicker();
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Photo is too large. Upload an image under 5 MB.");
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
      body.set("photo", file);

      const res = await fetch("/api/players/register", {
        method: "POST",
        body,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      toast("Player registered. Waiting for admin approval.");
      setForm(initialForm);
      removePhoto();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.18)"
        className="rounded-[2.5rem] border border-white/15 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6"
      >
        <BorderBeam lightColor="#F59E0B" lightWidth={280} duration={8} />

        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="rounded-2xl bg-amber-400/20 border border-amber-400/30 p-3.5 text-amber-300 shadow-lg shadow-amber-500/10">
            <ImagePlus className="h-6 w-6" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400 font-display">
              OFFICIAL DRAFT REGISTRATION
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Player Registration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Fill details & upload photo to enter the Season 8 auction pool.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Player Name *">
            <input
              className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm font-medium"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Kabir"
              required
            />
          </Field>

          <Field label="Phone Number *">
            <input
              className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm font-medium"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              inputMode="tel"
              placeholder="9999999999"
              required
            />
          </Field>

          <Field label="Primary Playing Role *">
            <select
              className="w-full rounded-2xl bg-slate-950 border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm font-medium"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              {playerRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Batting Style *">
            <select
              className="w-full rounded-2xl bg-slate-950 border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm font-medium"
              value={form.batting_style}
              onChange={(e) => update("batting_style", e.target.value)}
            >
              {battingStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bowling Style *">
            <select
              className="w-full rounded-2xl bg-slate-950 border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm font-medium"
              value={form.bowling_style}
              onChange={(e) => update("bowling_style", e.target.value)}
            >
              {bowlingStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Player Photo (Required) *">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
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
                    <p className="truncate font-bold text-white text-xs">{file?.name}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Selected
                    </p>

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openPhotoPicker}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                      >
                        Change
                      </button>

                      <button
                        type="button"
                        onClick={removePhoto}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
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
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-400/40 bg-amber-400/10 px-4 py-6 text-center font-extrabold text-amber-300 hover:bg-amber-400/20 transition-all cursor-pointer"
                >
                  <ImagePlus size={24} />
                  <span className="text-xs">Upload Player Photo</span>
                  <span className="text-[10px] text-slate-300 font-normal">Max 5 MB image</span>
                </button>
              )}
            </div>
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
          <span>{loading ? "Submitting..." : "Submit Player Registration"}</span>
        </button>

        <p className="text-center text-xs text-slate-400">
          Base price & approval will be reviewed by admin prior to auction.
        </p>
      </SpotlightCard>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 space-y-2">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}
