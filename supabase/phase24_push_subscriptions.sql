-- ============================================================
-- Pickleball Community App — Phase 24: Push notification subscriptions
-- Run this AFTER phase23_rsvp_visibility.sql.
--
-- Phase 1 of push notifications: just the storage + permission model.
-- No actual notification triggers yet (new session, spots remaining,
-- fixtures ready, reminders) — those come in phase 2, wired into the
-- relevant server actions once this foundation is confirmed working.
--
-- A player can have multiple subscriptions (phone + laptop, or a
-- reinstalled PWA), so this is a one-to-many table, not a column on
-- players.
--
-- Safe to re-run.
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_player_id_idx
  on public.push_subscriptions(player_id);

alter table public.push_subscriptions enable row level security;

-- Everyone manages only their own subscriptions (the browser creates
-- these directly against the signed-in player). Sending notifications
-- happens server-side via the service-role client, which bypasses RLS
-- entirely — that's intentional, since the sender needs to reach
-- other people's subscriptions (e.g. "notify all approved members").
drop policy if exists "push_subscriptions_own" on public.push_subscriptions;
create policy "push_subscriptions_own"
  on public.push_subscriptions for all
  to authenticated
  using (player_id = auth.uid())
  with check (player_id = auth.uid());
