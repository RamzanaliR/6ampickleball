-- ============================================================
-- Pickleball Community App — Phase 28: Weather alert tracking
-- Run this AFTER phase27_public_highlights.sql.
--
-- Tracks whether a rain-risk push has already gone out for a session,
-- same dedup pattern as the reminder columns from phase25 — the
-- weather cron only ever sends one alert per session.
--
-- Safe to re-run.
-- ============================================================

alter table public.sessions
  add column if not exists weather_alert_sent boolean not null default false;
