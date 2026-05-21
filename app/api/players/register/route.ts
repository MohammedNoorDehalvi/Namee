import { NextResponse } from "next/server";
import { z } from "zod";

import { cleanPhoneInput, jsonError } from "@/lib/auction-server";
import { isValidPhoneNumber } from "@/lib/auction-utils";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PLAYER_PHOTO_BUCKET = "player-photos";
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  name: z.string().trim().min(2, "Player name is required."),
  phone: z.string().trim().min(10, "Phone number is required."),
  role: z.enum(["Batter", "Bowler", "All-rounder", "Wicketkeeper"]),
  batting_style: z.enum(["Right Hand", "Left Hand"]),
  bowling_style: z.enum(["Fast", "Medium", "Spin", "None"]),
});

type PlayerRegistrationInput = z.infer<typeof schema>;

function fileExtension(file: File) {
  const byName = file.name.split(".").pop()?.toLowerCase();

  if (byName && /^[a-z0-9]+$/.test(byName)) return byName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function isStorageBucketMissing(message: string) {
  const safeMessage = message.toLowerCase();

  return safeMessage.includes("bucket") && (safeMessage.includes("not found") || safeMessage.includes("does not exist"));
}

async function ensurePhotoBucket(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const { error } = await supabase.storage.createBucket(PLAYER_PHOTO_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_PHOTO_SIZE_BYTES}`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  const safeMessage = error?.message.toLowerCase() || "";

  if (error && !safeMessage.includes("already exists") && !safeMessage.includes("already exist")) {
    throw new Error(error.message);
  }
}

async function uploadPlayerPhoto(supabase: ReturnType<typeof createSupabaseAdmin>, photo: File) {
  if (!photo || photo.size === 0) {
    throw new Error("Player photo is required.");
  }

  if (!photo.type.startsWith("image/")) {
    throw new Error("Please upload an image file only.");
  }

  if (photo.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Photo is too large. Upload an image under 5 MB.");
  }

  const ext = fileExtension(photo);
  const path = `players/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await photo.arrayBuffer());

  let upload = await supabase.storage.from(PLAYER_PHOTO_BUCKET).upload(path, buffer, {
    contentType: photo.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });

  if (upload.error && isStorageBucketMissing(upload.error.message)) {
    await ensurePhotoBucket(supabase);

    upload = await supabase.storage.from(PLAYER_PHOTO_BUCKET).upload(path, buffer, {
      contentType: photo.type || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });
  }

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const { data } = supabase.storage.from(PLAYER_PHOTO_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

async function parseRegistrationRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Player photo is required. Please submit the form with a photo.");
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  return {
    data: {
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role") || ""),
      batting_style: String(formData.get("batting_style") || ""),
      bowling_style: String(formData.get("bowling_style") || ""),
    },
    photo: photo instanceof File ? photo : null,
  };
}

function removedLimitMessage(message: string) {
  return message.toLowerCase().includes("already registered 2") || message.toLowerCase().includes("phone number has already registered");
}

export async function POST(request: Request) {
  try {
    const { data, photo } = await parseRegistrationRequest(request);
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid registration details.");
    }

    if (!photo || photo.size === 0) {
      return jsonError("Player photo is required. Please upload a photo.", 400);
    }

    const phone = cleanPhoneInput(parsed.data.phone);

    if (!isValidPhoneNumber(phone)) {
      return jsonError("Enter a valid phone number.");
    }

    const supabase = createSupabaseAdmin();
    const photoUrl = await uploadPlayerPhoto(supabase, photo);
    const payload: PlayerRegistrationInput = parsed.data;

    const { error } = await supabase.from("players").insert({
      name: payload.name,
      phone,
      normalized_phone: phone,
      role: payload.role,
      batting_style: payload.batting_style,
      bowling_style: payload.bowling_style,
      photo_url: photoUrl,
      approval_status: "Pending",
      status: "Available",
      auction_status: "PENDING",
      base_price: null,
      current_bid: 0,
    });

    if (error) {
      if (removedLimitMessage(error.message)) {
        return jsonError("Old database phone limit is still active. Run supabase/remove_phone_limit.sql once in Supabase SQL Editor.", 400);
      }

      return jsonError(error.message, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Registration failed.", 500);
  }
}
