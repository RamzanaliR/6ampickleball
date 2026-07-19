-- ============================================================
-- Pickleball Community App — Phase 15: public marketing page access
-- Run this AFTER phase14_feed_media.sql.
--
-- The signed-out one-page marketing site (app/welcome + root "/")
-- needs two things visible to anonymous visitors, without opening up
-- the full roster or feed to the public:
--   1. Approved community feed posts (for the "previous events" gallery)
--   2. A handful of aggregate counts (for the "by the numbers" strip)
-- ============================================================

-- Anyone (including signed-out visitors) can read APPROVED posts only.
-- Pending/rejected posts and poster identity stay behind the existing
-- authenticated policies.
drop policy if exists "community_feed_public_read_approved" on public.community_feed;
create policy "community_feed_public_read_approved"
  on public.community_feed for select
  to anon
  using (status = 'approved');

-- Aggregate-only counts for the marketing page stat strip. A security
-- definer function so anonymous visitors get numbers without needing
-- any direct table grants (roster stays private).
create or replace function public.club_public_stats()
returns table (members int, sessions_hosted int, matches_played int)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*)::int from public.players where status = 'approved' and is_guest = false),
    (select count(*)::int from public.sessions where status in ('completed', 'upcoming')),
    (select count(*)::int from public.matches where verified = true);
$$;

grant execute on function public.club_public_stats() to anon, authenticated;
