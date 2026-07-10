-- ============================================================
-- Pickleball Community App — Phase 12
-- Run this AFTER phase11_fixture_visibility.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Players: DUPR ID, collected at signup or added later via profile.
-- ------------------------------------------------------------
alter table public.players add column if not exists dupr_id text;

-- handle_new_user (from schema.sql) only read name/email out of
-- signup metadata — redefined here to also pick up dupr_id when the
-- signup form supplies it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email, dupr_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'dupr_id', '')
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Sessions: per-session leaderboard opt-out + DUPR-eligible flag.
-- "DUPR eligible" is tracking-only for now — there's no DUPR API
-- integration, so it just tells the admin which sessions' results
-- still need to be entered into DUPR by hand.
-- ------------------------------------------------------------
alter table public.sessions add column if not exists counts_toward_leaderboard boolean not null default true;
alter table public.sessions add column if not exists dupr_eligible boolean not null default false;

-- ------------------------------------------------------------
-- Matches: snapshot counts_toward_leaderboard from the session at
-- creation time, rather than the scoring functions re-checking the
-- session live. This matters — if someone toggles a session's
-- leaderboard setting AFTER matches already exist, the matches keep
-- whatever rule was true when they were scored, so reversing a
-- match later (edit, delete) is always consistent with what was
-- actually applied, not what the session's setting happens to be now.
-- ------------------------------------------------------------
alter table public.matches add column if not exists counts_toward_leaderboard boolean not null default true;

-- ------------------------------------------------------------
-- verify_match / score_fixture_match / edit_match_result: redefined
-- to skip the wins/losses/points update entirely when the match's
-- own counts_toward_leaderboard is false. The match still gets
-- scored and shows up in session standings either way — it just
-- doesn't touch the season leaderboard.
-- ------------------------------------------------------------
create or replace function public.verify_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_winners uuid[];
  v_losers uuid[];
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if v_match.verified then
    raise exception 'Match is already verified';
  end if;

  update public.matches set verified = true where id = p_match_id;

  if not v_match.counts_toward_leaderboard then
    return;
  end if;

  if v_match.winning_team = 'a' then
    v_winners := v_match.team_a;
    v_losers := v_match.team_b;
  else
    v_winners := v_match.team_b;
    v_losers := v_match.team_a;
  end if;

  foreach v_id in array v_winners loop
    update public.players set wins = wins + 1, points = points + 1 where id = v_id;
  end loop;

  foreach v_id in array v_losers loop
    update public.players set losses = losses + 1 where id = v_id;
  end loop;
end;
$$;

create or replace function public.score_fixture_match(p_match_id uuid, p_sets jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_sets_won_a int := 0;
  v_sets_won_b int := 0;
  v_set jsonb;
  v_winning_team text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if v_match.id is null then
    raise exception 'Match not found';
  end if;
  if v_match.verified then
    raise exception 'Match has already been scored';
  end if;

  for v_set in select * from jsonb_array_elements(p_sets) loop
    if (v_set ->> 'a')::int > (v_set ->> 'b')::int then
      v_sets_won_a := v_sets_won_a + 1;
    else
      v_sets_won_b := v_sets_won_b + 1;
    end if;
  end loop;

  if v_sets_won_a = v_sets_won_b then
    raise exception 'Sets are tied overall';
  end if;
  v_winning_team := case when v_sets_won_a > v_sets_won_b then 'a' else 'b' end;

  update public.matches
  set sets = p_sets, winning_team = v_winning_team, verified = true
  where id = p_match_id;

  if not v_match.counts_toward_leaderboard then
    return;
  end if;

  if v_winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins + 1, points = points + 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins + 1, points = points + 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  end if;
end;
$$;

create or replace function public.edit_match_result(p_match_id uuid, p_sets jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_sets_won_a int := 0;
  v_sets_won_b int := 0;
  v_set jsonb;
  v_new_winning_team text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if v_match.id is null then
    raise exception 'Match not found';
  end if;
  if not v_match.verified then
    raise exception 'Match has not been scored yet';
  end if;

  for v_set in select * from jsonb_array_elements(p_sets) loop
    if (v_set ->> 'a')::int > (v_set ->> 'b')::int then
      v_sets_won_a := v_sets_won_a + 1;
    else
      v_sets_won_b := v_sets_won_b + 1;
    end if;
  end loop;
  if v_sets_won_a = v_sets_won_b then
    raise exception 'Sets are tied overall';
  end if;
  v_new_winning_team := case when v_sets_won_a > v_sets_won_b then 'a' else 'b' end;

  if v_new_winning_team = v_match.winning_team and p_sets = v_match.sets then
    return;
  end if;

  update public.matches set sets = p_sets, winning_team = v_new_winning_team where id = p_match_id;

  if not v_match.counts_toward_leaderboard then
    return;
  end if;

  -- reverse the old result
  if v_match.winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins - 1, points = points - 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses - 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins - 1, points = points - 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses - 1 where id = v_id;
    end loop;
  end if;

  -- apply the corrected result
  if v_new_winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins + 1, points = points + 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins + 1, points = points + 1 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- delete_session: admin-only. Reverses any points already applied
-- by this session's verified, leaderboard-counting matches, THEN
-- deletes the session — letting the existing ON DELETE CASCADE
-- clean up its rsvps/attendance/matches. Without this, a plain
-- `delete from sessions` would cascade-delete the matches without
-- ever reversing the win/loss/points they'd already applied,
-- silently corrupting the leaderboard.
-- ------------------------------------------------------------
create or replace function public.delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  for v_match in
    select * from public.matches
    where session_id = p_session_id and verified = true and counts_toward_leaderboard = true
  loop
    if v_match.winning_team = 'a' then
      foreach v_id in array v_match.team_a loop
        update public.players set wins = wins - 1, points = points - 1 where id = v_id;
      end loop;
      foreach v_id in array v_match.team_b loop
        update public.players set losses = losses - 1 where id = v_id;
      end loop;
    else
      foreach v_id in array v_match.team_b loop
        update public.players set wins = wins - 1, points = points - 1 where id = v_id;
      end loop;
      foreach v_id in array v_match.team_a loop
        update public.players set losses = losses - 1 where id = v_id;
      end loop;
    end if;
  end loop;

  delete from public.sessions where id = p_session_id;
end;
$$;

revoke execute on function public.delete_session(uuid) from public;
grant execute on function public.delete_session(uuid) to authenticated;
