-- ============================================================
-- Pickleball Community App — Phase 20: Manager role
-- Run this AFTER phase19_no_shows.sql.
--
-- Adds a "manager" role: a trusted tier between regular members and
-- admins. Managers can create sessions, add guests/members to a
-- session, generate (not regenerate) fixtures, approve/reject Club
-- posts, flag no-shows, and edit player/guest details. Everything
-- else (finances, dues, removing/deleting people, role changes,
-- password resets, regenerating fixtures) stays admin-only.
--
-- Safe to re-run — every statement below is idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- Allow 'manager' as a role value.
-- ------------------------------------------------------------
alter table public.players drop constraint if exists players_role_check;
alter table public.players add constraint players_role_check
  check (role in ('player', 'manager', 'admin'));

-- ------------------------------------------------------------
-- is_staff(): true for admin OR manager. Mirrors is_admin() but
-- deliberately kept separate — anywhere that should stay admin-only
-- keeps calling is_admin() unchanged.
-- ------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.players
    where id = auth.uid() and role in ('admin', 'manager') and status = 'approved'
  );
$$;

-- ------------------------------------------------------------
-- sessions: managers can create sessions. Editing/deleting/status
-- changes stay covered only by the existing admin-only
-- "sessions_admin_manage" policy (unchanged).
-- ------------------------------------------------------------
drop policy if exists "sessions_staff_insert" on public.sessions;
create policy "sessions_staff_insert"
  on public.sessions for insert
  to authenticated
  with check (public.is_staff());

-- ------------------------------------------------------------
-- rsvps: managers can add/confirm members and toggle no-shows
-- (insert + update). Deletes still only happen via
-- "rsvps_admin_manage" (unchanged) or the RPCs below.
-- ------------------------------------------------------------
drop policy if exists "rsvps_staff_insert" on public.rsvps;
create policy "rsvps_staff_insert"
  on public.rsvps for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "rsvps_staff_update" on public.rsvps;
create policy "rsvps_staff_update"
  on public.rsvps for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------------------------------------
-- matches: managers can insert fixture rows (generate fixtures).
-- Replaces the old insert policy so admin/participant/staff are all
-- covered in one place. Update/delete (regenerate, verify, reject,
-- score corrections) stay on "matches_admin_manage" (unchanged) —
-- this is what keeps "regenerate fixtures" admin-only even though
-- managers can generate the first schedule.
-- ------------------------------------------------------------
drop policy if exists "matches_insert_participant_or_admin" on public.matches;
create policy "matches_insert_participant_or_staff"
  on public.matches for insert
  to authenticated
  with check (
    public.is_staff()
    or (
      exists (select 1 from public.players where id = auth.uid() and status = 'approved')
      and auth.uid() = any(team_a || team_b)
    )
  );

-- ------------------------------------------------------------
-- add_guest_to_session: managers can add guests to a session.
-- ------------------------------------------------------------
create or replace function public.add_guest_to_session(
  p_session_id uuid,
  p_name text default null,
  p_existing_guest_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Admins and managers only';
  end if;

  if p_existing_guest_id is not null then
    v_guest_id := p_existing_guest_id;
    if not exists (
      select 1 from public.players where id = v_guest_id and is_guest = true
    ) then
      raise exception 'Not a known guest';
    end if;
  else
    if p_name is null or trim(p_name) = '' then
      raise exception 'Name is required for a new guest';
    end if;
    insert into public.players (name, is_guest, status, role)
    values (trim(p_name), true, 'approved', 'player')
    returning id into v_guest_id;
  end if;

  insert into public.rsvps (player_id, session_id, status)
  values (v_guest_id, p_session_id, 'confirmed')
  on conflict (player_id, session_id) do update set status = 'confirmed';

  return v_guest_id;
end;
$$;

-- ------------------------------------------------------------
-- community_feed: managers can approve/reject posts (update).
-- Deleting a post stays on "community_feed_admin_delete"
-- (unchanged, still is_admin()-only).
-- ------------------------------------------------------------
drop policy if exists "community_feed_admin_moderate" on public.community_feed;
create policy "community_feed_staff_moderate"
  on public.community_feed for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------------------------------------
-- staff_update_member_details / staff_update_guest_details:
-- narrow, column-scoped RPCs for editing player details. Deliberately
-- NOT done by loosening the broad "players_admin_manage" update
-- policy — that policy also covers role/status/points changes, which
-- must stay admin-only, and Postgres RLS can't restrict that at the
-- column level. These RPCs only ever touch name/nickname/phone/dupr_id.
-- ------------------------------------------------------------
create or replace function public.staff_update_member_details(
  p_player_id uuid,
  p_name text,
  p_nickname text,
  p_phone text,
  p_dupr_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Admins and managers only';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Name is required';
  end if;

  update public.players
  set name = trim(p_name),
      nickname = nullif(trim(coalesce(p_nickname, '')), ''),
      phone = nullif(trim(coalesce(p_phone, '')), ''),
      dupr_id = nullif(trim(coalesce(p_dupr_id, '')), '')
  where id = p_player_id
    and is_guest = false;
end;
$$;

revoke execute on function public.staff_update_member_details(uuid, text, text, text, text) from public;
grant execute on function public.staff_update_member_details(uuid, text, text, text, text) to authenticated;

create or replace function public.staff_update_guest_details(
  p_player_id uuid,
  p_name text,
  p_dupr_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Admins and managers only';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Name is required';
  end if;

  update public.players
  set name = trim(p_name),
      dupr_id = nullif(trim(coalesce(p_dupr_id, '')), '')
  where id = p_player_id
    and is_guest = true;
end;
$$;

revoke execute on function public.staff_update_guest_details(uuid, text, text) from public;
grant execute on function public.staff_update_guest_details(uuid, text, text) to authenticated;
