-- ============================================================
-- Pickleball Community App — Phase 8: Fixture Generator
-- Run this AFTER phase7_tweaks.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Fixture-generated matches are real rows in the same `matches`
-- table regular logged matches use — same leaderboard, same
-- history, no separate system. These columns distinguish them and
-- let a session's schedule be grouped/displayed by round and court.
--
-- winning_team loses its NOT NULL: a freshly generated fixture
-- match is "scheduled" (no score yet) until someone enters the
-- result. The existing check constraint already allows NULL
-- (Postgres CHECK passes on NULL), so no constraint change needed
-- there.
-- ------------------------------------------------------------
alter table public.matches
  add column if not exists round_number integer,
  add column if not exists court_number integer,
  add column if not exists source text not null default 'manual' check (source in ('manual', 'fixture'));

alter table public.matches alter column winning_team drop not null;

-- ------------------------------------------------------------
-- Fixture settings live on the session itself: what was chosen at
-- generation time (courts used, round length label, scoring mode,
-- rank-by, tie-break) so the standings report renders the same way
-- every time the page is reopened, not just right after generating.
-- ------------------------------------------------------------
alter table public.sessions add column if not exists fixture_settings jsonb;

-- ------------------------------------------------------------
-- score_fixture_match: admin-only. Enters a fixture match's result
-- and applies it immediately — no separate verification step,
-- since fixtures are scored live at the courts. Computes the
-- winning side from the sets rather than trusting a hand-picked
-- value, same as regular match submission.
-- ------------------------------------------------------------
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

  if v_winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  end if;
end;
$$;

revoke execute on function public.score_fixture_match(uuid, jsonb) from public;
grant execute on function public.score_fixture_match(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- edit_match_result: admin-only, works on ANY already-scored match
-- (fixture or manually logged — no reason a regular match typo
-- should be harder to fix than a fixture one). Reverses the old
-- win/loss/points delta before applying the corrected one, so a
-- correction can never double-count or leave stale points behind.
-- Only the score can change here, not who played — fixing a wrong
-- player entirely means deleting and re-creating the match.
-- ------------------------------------------------------------
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
    return; -- nothing actually changed
  end if;

  -- reverse the old result
  if v_match.winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins - 1, points = points - 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses - 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins - 1, points = points - 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses - 1 where id = v_id;
    end loop;
  end if;

  -- apply the corrected result
  if v_new_winning_team = 'a' then
    foreach v_id in array v_match.team_a loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_b loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  else
    foreach v_id in array v_match.team_b loop
      update public.players set wins = wins + 1, points = points + 2 where id = v_id;
    end loop;
    foreach v_id in array v_match.team_a loop
      update public.players set losses = losses + 1 where id = v_id;
    end loop;
  end if;

  update public.matches set sets = p_sets, winning_team = v_new_winning_team where id = p_match_id;
end;
$$;

revoke execute on function public.edit_match_result(uuid, jsonb) from public;
grant execute on function public.edit_match_result(uuid, jsonb) to authenticated;
