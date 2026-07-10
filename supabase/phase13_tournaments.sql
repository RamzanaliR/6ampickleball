-- ============================================================
-- Pickleball Community App — Phase 13: Tournaments
-- Run this AFTER phase12_leaderboard_opt_out_dupr_delete.sql.
--
-- Design: a tournament is a tagged group of regular sessions, not a
-- parallel system. Each week is an ordinary session (same Classic
-- Robin fixture generator, same live scoring), just tagged with a
-- tournament_id and — by convention, enforced in the UI, not here —
-- created with counts_toward_leaderboard = false. Cumulative
-- tournament standings are computed the exact same way session
-- standings already are (lib/fixtures/standings.ts), just fed every
-- match across every session tagged to the tournament instead of one.
-- ============================================================

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  format text not null default 'round_robin' check (format in ('round_robin')),
  scoring text not null default 'points' check (scoring in ('points', 'no_points')),
  rank_by text not null default 'wins' check (rank_by in ('wins', 'points')),
  tiebreak text not null default 'point_diff' check (tiebreak in ('point_diff', 'wins')),
  created_by uuid not null references public.players (id),
  created_at timestamptz not null default now()
);

alter table public.sessions add column if not exists tournament_id uuid references public.tournaments (id) on delete set null;

-- The 24-30 player pool registered for a tournament. Someone still
-- RSVPs to each week's session individually (existing capacity/
-- waitlist logic handles "more than 24 want to play this week"
-- unchanged) — this table is who's *eligible* to RSVP at all.
create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, player_id)
);

alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;

create policy "tournaments_select_approved"
  on public.tournaments for select
  to authenticated
  using (
    exists (select 1 from public.players where id = auth.uid() and status = 'approved')
    or public.is_admin()
  );

create policy "tournaments_admin_manage"
  on public.tournaments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "tournament_entries_select_approved"
  on public.tournament_entries for select
  to authenticated
  using (
    exists (select 1 from public.players where id = auth.uid() and status = 'approved')
    or public.is_admin()
  );

create policy "tournament_entries_admin_manage"
  on public.tournament_entries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- rsvp_to_session: redefined to add one check — if the session
-- belongs to a tournament, only players registered for that
-- tournament can RSVP. Everything else (capacity, waitlist,
-- re-RSVP handling) is unchanged from phase2.
-- ------------------------------------------------------------
create or replace function public.rsvp_to_session(p_session_id uuid)
returns public.rsvps
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid := auth.uid();
  v_capacity int;
  v_session_status text;
  v_tournament_id uuid;
  v_confirmed_count int;
  v_new_status text;
  v_row public.rsvps;
begin
  if v_player_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.players where id = v_player_id and status = 'approved'
  ) then
    raise exception 'Only approved players can RSVP';
  end if;

  select capacity, status, tournament_id into v_capacity, v_session_status, v_tournament_id
  from public.sessions
  where id = p_session_id
  for update;

  if v_capacity is null then
    raise exception 'Session not found';
  end if;

  if v_session_status <> 'upcoming' then
    raise exception 'Session is not open for RSVP';
  end if;

  if v_tournament_id is not null and not exists (
    select 1 from public.tournament_entries
    where tournament_id = v_tournament_id and player_id = v_player_id
  ) then
    raise exception 'This session is part of a tournament you are not registered for';
  end if;

  select * into v_row from public.rsvps
  where player_id = v_player_id and session_id = p_session_id;

  if found and v_row.status in ('confirmed', 'waitlisted') then
    return v_row;
  end if;

  select count(*) into v_confirmed_count
  from public.rsvps
  where session_id = p_session_id and status = 'confirmed';

  v_new_status := case when v_confirmed_count < v_capacity then 'confirmed' else 'waitlisted' end;

  insert into public.rsvps (player_id, session_id, status)
  values (v_player_id, p_session_id, v_new_status)
  on conflict (player_id, session_id)
  do update set status = v_new_status, created_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
