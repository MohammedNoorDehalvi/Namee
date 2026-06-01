import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { createAuctionEvent, jsonError, requireAdminRequest } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

const ASSET_BUCKET = 'apl-assets';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type ParsedRequest = {
  team_name?: string;
  captain_name?: string;
  password?: string;
  budget?: number | string;
  max_players?: number | string;
  team_logo?: File | null;
  captain_photo?: File | null;
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function cleanNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;

  const number = Number(value);

  if (!Number.isFinite(number)) return Number.NaN;

  return Math.round(number);
}

function fileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';

  return 'jpg';
}

function isStorageBucketMissing(message: string) {
  const safe = message.toLowerCase();

  return safe.includes('bucket') && (safe.includes('not found') || safe.includes('does not exist'));
}

async function ensureAssetBucket(supabase: any) {
  const { error } = await supabase.storage.createBucket(ASSET_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  const message = error?.message.toLowerCase() || '';

  if (error && !message.includes('already exists') && !message.includes('already exist')) {
    throw new Error(error.message);
  }
}

async function uploadPublicImage(
  supabase: any,
  file: File | null | undefined,
  folder: 'team-logos' | 'captain-photos',
) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith('image/')) throw new Error('Please upload image files only.');
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Image is too large. Upload an image under 2 MB.');

  const ext = fileExtension(file);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let upload = await supabase.storage.from(ASSET_BUCKET).upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });

  if (upload.error && isStorageBucketMissing(upload.error.message)) {
    await ensureAssetBucket(supabase);

    upload = await supabase.storage.from(ASSET_BUCKET).upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
  }

  if (upload.error) throw new Error(upload.error.message);

  const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const teamLogo = form.get('team_logo');
    const captainPhoto = form.get('captain_photo');

    return {
      team_name: String(form.get('team_name') || ''),
      captain_name: String(form.get('captain_name') || ''),
      password: String(form.get('password') || ''),
      budget: String(form.get('budget') || ''),
      max_players: String(form.get('max_players') || ''),
      team_logo: teamLogo instanceof File ? teamLogo : null,
      captain_photo: captainPhoto instanceof File ? captainPhoto : null,
    };
  }

  return (await request.json().catch(() => ({}))) as ParsedRequest;
}

async function findTeam(supabase: any, seasonId: string, teamName: string) {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)
    .ilike('team_name', teamName)
    .limit(1);

  return data?.[0] || null;
}

async function findCaptain(supabase: any, seasonId: string, captainName: string, teamName: string) {
  const { data } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', seasonId)
    .or(`captain_name.ilike.${captainName},team_name.ilike.${teamName}`)
    .limit(1);

  return data?.[0] || null;
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);

  if (response || !supabase) return response;

  const activeSeason = await getActiveSeason(supabase);

  if (!activeSeason) {
    return jsonError('Start a season before adding teams and captains.', 400);
  }

  const body = await parseRequest(request);
  const teamName = cleanText(body.team_name);
  const captainName = cleanText(body.captain_name);
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  const budget = cleanNumber(body.budget, 50000);
  const maxPlayers = cleanNumber(body.max_players, 4);

  if (teamName.length < 2) return jsonError('Team name must be at least 2 characters.');
  if (captainName.length < 2) return jsonError('Captain name must be at least 2 characters.');
  if (password.length < 4) return jsonError('Captain password must be at least 4 characters.');
  if (!Number.isFinite(budget) || budget <= 0) return jsonError('Budget must be a positive number.');
  if (!Number.isFinite(maxPlayers) || maxPlayers < 1 || maxPlayers > 20) {
    return jsonError('Max players must be between 1 and 20.');
  }

  try {
    const [teamLogoUrl, captainPhotoUrl] = await Promise.all([
      uploadPublicImage(supabase, body.team_logo, 'team-logos'),
      uploadPublicImage(supabase, body.captain_photo, 'captain-photos'),
    ]);

    const passwordHash = await bcrypt.hash(password, 12);
    const existingTeam = await findTeam(supabase, activeSeason.id, teamName);
    const existingCaptain = await findCaptain(supabase, activeSeason.id, captainName, teamName);

    const captainPayload: Record<string, unknown> = {
      captain_name: captainName,
      team_name: teamName,
      password_hash: passwordHash,
      budget,
      remaining_budget: budget,
      season_id: activeSeason.id,
    };

    if (captainPhotoUrl) captainPayload.photo_url = captainPhotoUrl;
    else if (existingCaptain?.photo_url) captainPayload.photo_url = existingCaptain.photo_url;

    const captainResult = existingCaptain?.id
      ? await supabase.from('captains').update(captainPayload).eq('id', existingCaptain.id).select('*').single()
      : await supabase.from('captains').insert(captainPayload).select('*').single();

    if (captainResult.error) {
      return jsonError(`${captainResult.error.message}. If this is duplicate old-season data, run supabase/season_import_current_data_fix.sql once.`, 500);
    }

    const captain = captainResult.data;

    const teamPayload: Record<string, unknown> = {
      team_name: teamName,
      captain_id: captain.id,
      captain_name: captainName,
      budget,
      remaining_budget: budget,
      max_players: maxPlayers,
      season_id: activeSeason.id,
    };

    if (teamLogoUrl) teamPayload.logo_url = teamLogoUrl;
    else if (existingTeam?.logo_url) teamPayload.logo_url = existingTeam.logo_url;

    const teamResult = existingTeam?.id
      ? await supabase.from('teams').update(teamPayload).eq('id', existingTeam.id).select('*').single()
      : await supabase.from('teams').insert(teamPayload).select('*').single();

    if (teamResult.error) {
      return jsonError(`${teamResult.error.message}. If this is duplicate old-season data, run supabase/season_import_current_data_fix.sql once.`, 500);
    }

    const team = teamResult.data;

    await supabase
      .from('captains')
      .update({ team_id: team.id, team_name: team.team_name, season_id: activeSeason.id })
      .eq('id', captain.id);

    await createAuctionEvent(supabase, {
      event_type: existingTeam ? 'STATUS' : 'TEAM_CREATED',
      message: existingTeam
        ? `Admin updated ${teamName} with captain ${captainName}.`
        : `Admin added ${teamName} with captain ${captainName}.`,
      team_id: team.id,
      captain_id: captain.id,
      metadata: { season_id: activeSeason.id, budget, max_players: maxPlayers },
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      message: existingTeam ? 'Team existed in this season, so details were updated.' : 'Team and captain saved.',
      team,
      captain,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Could not save team and captain.', 500);
  }
}
