-- ============================================================
-- Pickleball Community App — Phase 11: fixture visibility fix
-- Run this AFTER phase10_feed_moderation.sql.
--
-- The original matches SELECT policy (phase4) only shows an
-- unverified match to its own participants or an admin — correct
-- for a manually-submitted result awaiting trust, but wrong for a
-- fixture schedule: players need to see the WHOLE round (who's
-- playing whom, on which court), not just their own games, and
-- before any scores are in. Fixture matches are schedule data, not
-- an unverified claim, so they get their own, more open policy.
-- Manual matches are untouched — same restricted visibility as before.
-- ============================================================

create policy "matches_select_fixture_public"
  on public.matches for select
  to authenticated
  using (
    source = 'fixture'
    and exists (select 1 from public.players where id = auth.uid() and status = 'approved')
  );
