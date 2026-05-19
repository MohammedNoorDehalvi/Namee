-- TEAM LOGO + CAPTAIN PHOTO + IMAGE RENDERING FIX
-- Run this once in Supabase SQL Editor.

-- 1. Add image URL columns
alter table public.teams
add column if not exists logo_url text;

alter table public.captains
add column if not exists photo_url text;

-- 2. Make sure player photo columns still exist
alter table public.players
add column if not exists photo_url text;

-- 3. Create/update public storage buckets for images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'apl-assets',
  'apl-assets',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 4. Public read policies for image rendering
alter table storage.objects enable row level security;

drop policy if exists "Public read APL assets" on storage.objects;
create policy "Public read APL assets"
on storage.objects
for select
using (bucket_id = 'apl-assets');

drop policy if exists "Public read player photos" on storage.objects;
create policy "Public read player photos"
on storage.objects
for select
using (bucket_id = 'player-photos');

-- 5. Reload PostgREST schema cache
select pg_notify('pgrst', 'reload schema');
