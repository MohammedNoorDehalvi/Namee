import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuctionEvent, jsonError, requireAdminRequest } from '@/lib/auction-server';

export const runtime = 'nodejs';

const ASSET_BUCKET = 'apl-assets';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type CreateTeamCaptainBody = {
  team_name?: string;
  captain_name?: string;
  password?: string;
  budget?: number | string;
  max_players?: number | string;
};

type TeamRow = {
  id: string;
  team_name: string | null;
  captain_id?: string | null;
  captain_name?: string | null;
  budget?: number | null;
  remaining_budget?: number | null;
  max_players?: number | null;
  logo_url?: string | null;
};

type CaptainRow = {
  id: string;
  captain_name: string | null;
  team_name: string | null;
  team_id?: string | null;
  budget?: number | null;
  remaining_budget?: number | null;
  photo_url?: string | null;
};

type ParsedRequest = CreateTeamCaptainBody & {
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

function key(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function isDuplicateError(error: unknown) {
  const maybe = error as { code?: string; message?: string } | null;
  return maybe?.code === '23505' || String(maybe?.message || '').toLowerCase().includes('duplicate key');
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

async function ensureAssetBucket(supabase: NonNullable<ReturnType<typeof requireAdminRequest>['supabase']>) {
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
  supabase: NonNullable<ReturnType<typeof requireAdminRequest>['supabase']>,
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

async function readTeams(supabase: NonNullable<ReturnType<typeof requireAdminRequest>['supabase']>) {
  const { data, error } = await supabase
    .from('teams')
    .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players,logo_url');

  if (error) throw new Error(error.message);
  return (data || []) as TeamRow[];
}

async function readCaptains(supabase: NonNullable<ReturnType<typeof requireAdminRequest>['supabase']>) {
  const { data, error } = await supabase
    .from('captains')
    .select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url');

  if (error) throw new Error(error.message);
  return (data || []) as CaptainRow[];
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

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
    const passwordHash = await bcrypt.hash(password, 12);
    const [teams, captains] = await Promise.all([readTeams(supabase), readCaptains(supabase)]);

    const existingTeam = teams.find((team) => key(team.team_name) === key(teamName)) || null;
    const captainByName = captains.find((captain) => key(captain.captain_name) === key(captainName)) || null;
    const captainByTeam = captains.find((captain) => key(captain.team_name) === key(teamName)) || null;

    if (captainByName && captainByTeam && captainByName.id !== captainByTeam.id) {
      return jsonError(
        `Cannot save because ${captainName} and ${teamName} are already connected to different captain records. Delete one old test record or use a new name.`,
        409,
      );
    }

    if (captainByName && captainByName.team_name && key(captainByName.team_name) !== key(teamName)) {
      return jsonError(`Captain ${captainName} already belongs to team ${captainByName.team_name}.`, 409);
    }

    const [teamLogoUrl, captainPhotoUrl] = await Promise.all([
      uploadPublicImage(supabase, body.team_logo, 'team-logos'),
      uploadPublicImage(supabase, body.captain_photo, 'captain-photos'),
    ]);

    const existingCaptain = captainByName || captainByTeam || null;
    let captain: CaptainRow | null = null;

    const captainPayload: Record<string, unknown> = {
      captain_name: captainName,
      team_name: teamName,
      password_hash: passwordHash,
      budget,
      remaining_budget: budget,
    };

    if (captainPhotoUrl) captainPayload.photo_url = captainPhotoUrl;
    else if (existingCaptain?.photo_url) captainPayload.photo_url = existingCaptain.photo_url;

    if (existingCaptain?.id) {
      const { data, error } = await supabase
        .from('captains')
        .update(captainPayload)
        .eq('id', existingCaptain.id)
        .select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url')
        .single();

      if (error) return jsonError(error.message, 500);
      captain = data as CaptainRow;
    } else {
      const { data, error } = await supabase
        .from('captains')
        .insert(captainPayload)
        .select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url')
        .single();

      if (error) {
        if (!isDuplicateError(error)) return jsonError(error.message, 500);

        const freshCaptains = await readCaptains(supabase);
        const duplicateCaptain =
          freshCaptains.find((item) => key(item.captain_name) === key(captainName)) ||
          freshCaptains.find((item) => key(item.team_name) === key(teamName));

        if (!duplicateCaptain) return jsonError('Captain already exists. Refresh and try again.', 409);

        const retry = await supabase
          .from('captains')
          .update(captainPayload)
          .eq('id', duplicateCaptain.id)
          .select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url')
          .single();

        if (retry.error) return jsonError(retry.error.message, 500);
        captain = retry.data as CaptainRow;
      } else {
        captain = data as CaptainRow;
      }
    }

    if (!captain?.id) return jsonError('Could not save captain.', 500);

    let team: TeamRow | null = null;
    const teamPayload: Record<string, unknown> = {
      team_name: teamName,
      captain_id: captain.id,
      captain_name: captainName,
      budget,
      remaining_budget: budget,
      max_players: maxPlayers,
    };

    if (teamLogoUrl) teamPayload.logo_url = teamLogoUrl;
    else if (existingTeam?.logo_url) teamPayload.logo_url = existingTeam.logo_url;

    if (existingTeam?.id) {
      const { data, error } = await supabase
        .from('teams')
        .update(teamPayload)
        .eq('id', existingTeam.id)
        .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players,logo_url')
        .single();

      if (error) return jsonError(error.message, 500);
      team = data as TeamRow;
    } else {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamPayload)
        .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players,logo_url')
        .single();

      if (error) {
        if (!isDuplicateError(error)) return jsonError(error.message, 500);

        const freshTeams = await readTeams(supabase);
        const duplicateTeam = freshTeams.find((item) => key(item.team_name) === key(teamName));
        if (!duplicateTeam) return jsonError('Team already exists. Refresh and try again.', 409);

        const retry = await supabase
          .from('teams')
          .update(teamPayload)
          .eq('id', duplicateTeam.id)
          .select('id,team_name,captain_id,captain_name,budget,remaining_budget,max_players,logo_url')
          .single();

        if (retry.error) return jsonError(retry.error.message, 500);
        team = retry.data as TeamRow;
      } else {
        team = data as TeamRow;
      }
    }

    if (!team?.id) return jsonError('Could not save team.', 500);

    const { data: linkedCaptain, error: linkError } = await supabase
      .from('captains')
      .update({ team_id: team.id, team_name: teamName, budget, remaining_budget: budget, ...(captainPhotoUrl ? { photo_url: captainPhotoUrl } : {}) })
      .eq('id', captain.id)
      .select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url')
      .single();

    if (linkError) return jsonError(linkError.message, 500);

    try {
      await createAuctionEvent(supabase, {
        event_type: existingTeam ? 'STATUS' : 'TEAM_CREATED',
        message: existingTeam
          ? `Admin updated ${teamName} with captain ${captainName}.`
          : `Admin added ${teamName} with captain ${captainName}.`,
        team_id: team.id,
        captain_id: captain.id,
        metadata: { budget, max_players: maxPlayers, team_logo: Boolean(teamLogoUrl), captain_photo: Boolean(captainPhotoUrl) },
      });
    } catch {
      // Saving team/captain should not fail just because event table is missing.
    }

    return NextResponse.json({
      ok: true,
      message: existingTeam ? 'Team existed, so details were updated.' : 'Team and captain saved.',
      team,
      captain: linkedCaptain,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Could not save team and captain.', 500);
  }
}
