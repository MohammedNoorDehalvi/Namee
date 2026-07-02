-- Run this once in Supabase SQL Editor.
-- It removes the old max-2-players-per-phone-number database limit.
-- It keeps phone number normalization and basic validation only.

alter table public.players add column if not exists normalized_phone text;

update public.players
set normalized_phone = regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g')
where normalized_phone is null;

create or replace function public.normalize_and_limit_player_phone()
returns trigger
language plpgsql
security definer
as $$
declare
  clean_phone text;
  digits_only text;
begin
  clean_phone := regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g');
  digits_only := regexp_replace(clean_phone, '[^0-9]', '', 'g');

  if length(digits_only) < 10 or length(digits_only) > 15 then
    raise exception 'Invalid phone number format.';
  end if;

  new.phone := clean_phone;
  new.normalized_phone := clean_phone;
  return new;
end;
$$;

drop trigger if exists normalize_and_limit_player_phone on public.players;
create trigger normalize_and_limit_player_phone
before insert or update of phone on public.players
for each row
execute function public.normalize_and_limit_player_phone();
