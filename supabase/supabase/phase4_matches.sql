-- ============================================================
-- Pickleball Community App — Phase 4 additions
-- Run this AFTER schema.sql and phase2_sessions_rsvp.sql.
--
-- The original `matches` table (player_ids/score/winner_id) from
-- schema.sql doesn't cleanly support doubles, so this replaces it
-- with a team-based structure. Safe to run since no match data
-- exists yet at this stage of the build.
-- ============================================================

drop table if exists public.matches cascade;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  team_a uuid[] not null,
  team_b uuid[] not null,
  sets jsonb not null default '[]'::jsonb, -- e.g. [{"a":11,"b":7},{"a":9,"b":11},{"a":11,"b":8}]
  winning_team text not null check (winning_team in ('a', 'b')),
  verified boolean not null default false,
  submitted_by uuid not null references public.players (id),
  created_at timestamptz not null default now(),
  constraint team_a_size check (array_length(team_a, 1) between 1 and 2),
  constraint team_b_size check (array_length(team_b, 1) between 1 and 2)
);

alter table public.matches enable row level security;

-- Any approved player (or admin) can see match results — scores are
-- shared/public within the club, same as the leaderboard.
create policy "matches_select_approved"
  on public.matches for select
  to authenticated
  using (
    exists (select 1 from public.players where id = auth.uid() and status = 'approved')
    or public.is_admin()
  );

-- A player can submit a result only if they're one of the four (or
-- two) participants; admins can submit on anyone's behalf.
create policy "matches_insert_participant_or_admin"
  on public.matches for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      exists (select 1 from public.players where id = auth.uid() and status = 'approved')
      and auth.uid() = any(team_a || team_b)
    )
  );

create policy "matches_admin_manage"
  on public.matches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- verify_match: admin confirms a submitted result. Applies the
-- scoring rule (win = +2 points, loss = +0) to every player on
-- both teams and marks the match verified. No-ops if already
-- verified so it can't be double-applied.
-- ------------------------------------------------------------
create or replace function public.verify_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_player_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if v_match.id is null then
    raise exception 'Match not found';
  end if;

  if v_match.verified then
    return;
  end if;

  if v_match.winning_team = 'a' then
    foreach v_player_id in array v_match.team_a loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_player_id;
    end loop;
    foreach v_player_id in array v_match.team_b loop
      update public.players set losses = losses + 1 where id = v_player_id;
    end loop;
  else
    foreach v_player_id in array v_match.team_b loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_player_id;
    end loop;
    foreach v_player_id in array v_match.team_a loop
      update public.players set losses = losses + 1 where id = v_player_id;
    end loop;
  end if;

  update public.matches set verified = true where id = p_match_id;
end;
$$;

revoke execute on function public.verify_match(uuid) from public;
grant execute on function public.verify_match(uuid) to authenticated;

-- ------------------------------------------------------------
-- reject_match: admin discards a bad submission. Only works while
-- unverified — once points have been applied, a match can't be
-- rejected this way (that reversal logic is out of scope for now).
-- ------------------------------------------------------------
create or replace function public.reject_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  delete from public.matches where id = p_match_id and verified = false;
end;
$$;

revoke execute on function public.reject_match(uuid) from public;
grant execute on function public.reject_match(uuid) to authenticated;
