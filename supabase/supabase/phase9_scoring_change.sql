-- ============================================================
-- Pickleball Community App — Phase 9: leaderboard scoring change
-- Run this AFTER phase8_fixtures.sql.
--
-- Changes the season leaderboard scoring rule from "win = 2 points"
-- to "win = 1 point" (loss stays 0). This redefines the three
-- functions that award points on a win, so it applies to every path
-- a match can be scored through: regular admin verification,
-- fixture scoring, and match correction.
--
-- Note: this only affects points awarded from here on. If there's
-- already real season data recorded under the old +2 rule, existing
-- players' `points` totals won't be retroactively recalculated —
-- ask if you want a one-off script to rescale existing totals.
-- ============================================================

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

  if v_match.winning_team = 'a' then
    v_winners := v_match.team_a;
    v_losers := v_match.team_b;
  else
    v_winners := v_match.team_b;
    v_losers := v_match.team_a;
  end if;

  update public.matches set verified = true where id = p_match_id;

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

  update public.matches set sets = p_sets, winning_team = v_new_winning_team where id = p_match_id;
end;
$$;
