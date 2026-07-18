-- ============================================================
-- Pickleball Community App — Phase 19: no-shows
-- Run this AFTER phase18_monthly_dues.sql.
--
-- Replaces the old full-roster "attendance" check-in flow (tedious —
-- required checking off everyone who showed up) with a much lighter
-- one: confirmed RSVPs are assumed to have shown up, and an admin
-- only needs to flag the exceptions.
--
-- The old `attendance` table is left in place (unused, harmless) so
-- this migration doesn't touch or lose any existing data — it's just
-- no longer read from or written to by the app.
-- ============================================================

alter table public.rsvps add column if not exists no_show boolean not null default false;
