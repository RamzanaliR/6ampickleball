-- ============================================================
-- Pickleball Community App — Phase 25: Notification tracking columns
-- Run this AFTER phase24_push_subscriptions.sql.
--
-- Phase 2 of push notifications: the actual triggers. These columns
-- record what's already been sent for a session so the four triggers
-- below never fire twice for the same event:
--   - new session posted            (no column needed — sent once,
--                                     synchronously, right after insert)
--   - spots remaining (10/5/2)      -> notified_spots_thresholds
--   - fixtures ready                -> notified_fixtures_ready
--   - reminders (24h/12h/6h before) -> reminder_24h_sent / 12h / 6h
--
-- Safe to re-run.
-- ============================================================

alter table public.sessions
  add column if not exists notified_spots_thresholds int[] not null default '{}',
  add column if not exists notified_fixtures_ready boolean not null default false,
  add column if not exists reminder_24h_sent boolean not null default false,
  add column if not exists reminder_12h_sent boolean not null default false,
  add column if not exists reminder_6h_sent boolean not null default false;
