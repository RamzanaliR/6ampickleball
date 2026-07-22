-- ============================================================
-- Pickleball Community App — Phase 23: Fix confirmed-roster visibility
-- Run this AFTER phase22_hero_settings.sql.
--
-- The old rsvps SELECT policy only let each person see their own RSVP
-- row (plus admins, via is_admin()). That's why the "Confirmed" list
-- on session cards only ever showed the viewer's own name unless they
-- were an Admin — Managers and regular players never had the DB
-- permission to see everyone else's rows.
--
-- This makes the confirmed/waitlisted roster visible to any approved
-- player, matching what the UI has always intended to show (the
-- roster is meant to be visible to all members, not just admins).
--
-- Safe to re-run.
-- ============================================================

drop policy if exists "rsvps_select_own_or_admin" on public.rsvps;
create policy "rsvps_select_approved_roster"
  on public.rsvps for select
  to authenticated
  using (
    player_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.players
      where id = auth.uid() and status = 'approved'
    )
  );
