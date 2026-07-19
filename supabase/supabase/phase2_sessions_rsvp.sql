-- ============================================================
-- Pickleball Community App — Phase 2 additions
-- Run this AFTER schema.sql, in the Supabase SQL editor.
-- Adds: read policies for sessions/rsvps, and two RPC functions
-- that own the RSVP + waitlist + auto-promote logic so it can't
-- race under concurrent requests.
-- ============================================================

-- ------------------------------------------------------------
-- sessions: approved players (and admins) can read; only admins
-- can write. Session create/edit UI itself is Phase 3 — for now,
-- add test sessions directly via SQL, e.g.:
--   insert into public.sessions (title, date_time, location, capacity, created_by)
--   values ('Saturday Open Play', now() + interval '3 days', 'Oyster Bay Courts', 12,
--           (select id from public.players where role = 'admin' limit 1));
-- ------------------------------------------------------------
create policy "sessions_select_approved"
  on public.sessions for select
  to authenticated
  using (
    exists (select 1 from public.players where id = auth.uid() and status = 'approved')
    or public.is_admin()
  );

create policy "sessions_admin_manage"
  on public.sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- rsvps: players read their own rows (needed for spots-left
-- counts, everyone can see confirmed counts implicitly through
-- the RPC below rather than raw table access). Writes only
-- happen through the RPC functions.
-- ------------------------------------------------------------
create policy "rsvps_select_own_or_admin"
  on public.rsvps for select
  to authenticated
  using (player_id = auth.uid() or public.is_admin());

create policy "rsvps_admin_manage"
  on public.rsvps for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- rsvp_to_session: confirms if there's room, otherwise
-- waitlists. Locks the session row first so concurrent RSVPs to
-- the same session can't both slip in under capacity.
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

  select capacity, status into v_capacity, v_session_status
  from public.sessions
  where id = p_session_id
  for update;

  if v_capacity is null then
    raise exception 'Session not found';
  end if;

  if v_session_status <> 'upcoming' then
    raise exception 'Session is not open for RSVP';
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

revoke execute on function public.rsvp_to_session(uuid) from public;
grant execute on function public.rsvp_to_session(uuid) to authenticated;

-- ------------------------------------------------------------
-- cancel_rsvp: cancels the caller's RSVP. If they were confirmed
-- (i.e. holding a spot), promotes the longest-waiting waitlisted
-- player into that spot.
-- ------------------------------------------------------------
create or replace function public.cancel_rsvp(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid := auth.uid();
  v_was_confirmed boolean;
  v_promote_id uuid;
begin
  if v_player_id is null then
    raise exception 'Not authenticated';
  end if;

  -- lock the session so a concurrent RSVP can't slip in between
  -- the cancel and the waitlist promotion below
  perform 1 from public.sessions where id = p_session_id for update;

  select (status = 'confirmed') into v_was_confirmed
  from public.rsvps
  where player_id = v_player_id and session_id = p_session_id;

  update public.rsvps
  set status = 'cancelled'
  where player_id = v_player_id and session_id = p_session_id;

  if v_was_confirmed then
    select id into v_promote_id
    from public.rsvps
    where session_id = p_session_id and status = 'waitlisted'
    order by created_at asc
    limit 1
    for update;

    if v_promote_id is not null then
      update public.rsvps set status = 'confirmed' where id = v_promote_id;
    end if;
  end if;
end;
$$;

revoke execute on function public.cancel_rsvp(uuid) from public;
grant execute on function public.cancel_rsvp(uuid) to authenticated;
