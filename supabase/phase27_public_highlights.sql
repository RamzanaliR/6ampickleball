-- ============================================================
-- Pickleball Community App — Phase 27: Public highlights page
-- Run this AFTER phase26_notification_preferences.sql.
--
-- Powers a new signed-out /highlights page: a Top 10 leaderboard,
-- "standout player" stats, and recent Club posts — all recruiting
-- material, safe for a public link. Same pattern as club_public_stats
-- (phase15): SECURITY DEFINER functions that expose only nicknames
-- and aggregate numbers, never phone numbers, DUPR IDs, or the full
-- roster.
--
-- Safe to re-run.
-- ============================================================

-- Top 10 by points. Nickname only (falls back to first name).
create or replace function public.club_public_leaderboard()
returns table (nickname text, points int, wins int, losses int)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(nullif(trim(nickname), ''), split_part(name, ' ', 1)) as nickname,
    points,
    wins,
    losses
  from public.players
  where status = 'approved' and is_guest = false
  order by points desc, wins desc
  limit 10;
$$;

grant execute on function public.club_public_leaderboard() to anon, authenticated;

-- Most sessions attended in the current calendar month.
create or replace function public.club_public_most_active_this_month()
returns table (nickname text, sessions_count int)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(nullif(trim(p.nickname), ''), split_part(p.name, ' ', 1)) as nickname,
    count(*)::int as sessions_count
  from public.rsvps r
  join public.sessions s on s.id = r.session_id
  join public.players p on p.id = r.player_id
  where r.status = 'confirmed'
    and p.is_guest = false
    and p.status = 'approved'
    and date_trunc('month', s.date_time) = date_trunc('month', now())
  group by p.id, nickname
  order by sessions_count desc
  limit 1;
$$;

grant execute on function public.club_public_most_active_this_month() to anon, authenticated;

-- Highest win rate, minimum 5 recorded matches so a lucky 2-0 doesn't top the list.
create or replace function public.club_public_top_win_rate()
returns table (nickname text, wins int, losses int, win_rate int)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(nullif(trim(nickname), ''), split_part(name, ' ', 1)) as nickname,
    wins,
    losses,
    round((wins::numeric / nullif(wins + losses, 0)) * 100)::int as win_rate
  from public.players
  where status = 'approved' and is_guest = false and (wins + losses) >= 5
  order by win_rate desc, wins desc
  limit 1;
$$;

grant execute on function public.club_public_top_win_rate() to anon, authenticated;

-- One row per player per completed match, most recent first. Used to
-- compute "current win streak" in application code (walking from the
-- most recent match backwards until the first loss) — doing that math
-- in SQL directly gets unreadable fast, this keeps it simple while
-- still only exposing nicknames, not player IDs or any other detail.
create or replace function public.club_public_match_results()
returns table (nickname text, played_at timestamptz, round_number int, won boolean)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.nickname_resolved as nickname,
    s.date_time as played_at,
    m.round_number,
    (pid = any(
      case
        when m.winning_team = 1 then m.team_a
        when m.winning_team = 2 then m.team_b
        else array[]::uuid[]
      end
    )) as won
  from public.matches m
  join public.sessions s on s.id = m.session_id
  cross join lateral unnest(m.team_a || m.team_b) as pid
  join lateral (
    select coalesce(nullif(trim(pl.nickname), ''), split_part(pl.name, ' ', 1)) as nickname_resolved
    from public.players pl
    where pl.id = pid and pl.status = 'approved' and pl.is_guest = false
  ) p on true
  where m.source = 'fixture'
    and jsonb_array_length(coalesce(m.sets, '[]'::jsonb)) > 0
    and m.winning_team is not null
  order by s.date_time desc, m.round_number desc
  limit 1000;
$$;

grant execute on function public.club_public_match_results() to anon, authenticated;
