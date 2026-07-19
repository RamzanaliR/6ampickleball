-- ============================================================
-- Pickleball Community App — Phase 16: player nicknames
-- Run this AFTER phase15_public_marketing.sql.
--
-- Adds an optional nickname players choose at signup (or set later
-- via their profile). The app displays nickname (falling back to
-- full name when unset) everywhere EXCEPT the global leaderboard and
-- tournament standings, which always show full legal name.
-- ============================================================

alter table public.players add column if not exists nickname text;

-- handle_new_user (redefined in phase12 to also pick up dupr_id) is
-- redefined again here to also pick up nickname when the signup form
-- supplies it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, dupr_id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'dupr_id', ''),
    nullif(new.raw_user_meta_data ->> 'nickname', '')
  );
  return new;
end;
$$;
