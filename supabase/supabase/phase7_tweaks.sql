-- ============================================================
-- Pickleball Community App — Phase 7: tweaks
-- Run this AFTER schema.sql, phase2_sessions_rsvp.sql,
-- phase4_matches.sql, phase5_payments_attendance.sql, and
-- phase6_feed.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Court count on sessions — used for admin planning and as the
-- default court count when generating fixtures.
-- ------------------------------------------------------------
alter table public.sessions add column if not exists courts integer;

-- ------------------------------------------------------------
-- Guest members. A guest is a real players row (so it plugs into
-- RSVPs, matches, attendance — everything that already expects a
-- player id) but with no auth.users account and excluded from the
-- season leaderboard. This means players.id can no longer be
-- strictly 1:1 with auth.users, so the foreign key is dropped —
-- real signups still get id = auth user's id via handle_new_user,
-- guests get a freshly generated id instead.
-- ------------------------------------------------------------
alter table public.players drop constraint if exists players_id_fkey;
alter table public.players alter column id set default gen_random_uuid();
alter table public.players alter column email drop not null;
alter table public.players add column if not exists is_guest boolean not null default false;

-- ------------------------------------------------------------
-- add_guest_to_session: admin-only. Creates a new guest (or reuses
-- an existing one via p_existing_guest_id, for a repeat visitor)
-- and force-confirms their RSVP for the given session — guests
-- skip the capacity/waitlist logic entirely since an admin adding
-- them directly is a deliberate decision, not a queue position.
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
  if not public.is_admin() then
    raise exception 'Admins only';
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

revoke execute on function public.add_guest_to_session(uuid, text, uuid) from public;
grant execute on function public.add_guest_to_session(uuid, text, uuid) to authenticated;
