-- ============================================================
-- Pickleball Community App — Phase 26: Notification preferences
-- Run this AFTER phase25_notification_tracking.sql.
--
-- Lets each person opt out of individual notification categories
-- instead of it being all-or-nothing. Defaults to true (opted in)
-- for everyone, matching current behavior — this migration doesn't
-- change what anyone receives until they actually flip a toggle.
--
-- notify_club_posts_pending only matters for Admins/Managers (that's
-- the only category they're eligible for), but the column lives on
-- every player row for simplicity — it's just never read for regular
-- members.
--
-- Safe to re-run.
-- ============================================================

alter table public.players
  add column if not exists notify_new_session boolean not null default true,
  add column if not exists notify_spots_remaining boolean not null default true,
  add column if not exists notify_fixtures_ready boolean not null default true,
  add column if not exists notify_reminders boolean not null default true,
  add column if not exists notify_club_posts_pending boolean not null default true;
