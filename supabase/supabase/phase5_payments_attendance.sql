-- ============================================================
-- Pickleball Community App — Phase 5 additions
-- Run this AFTER schema.sql, phase2_sessions_rsvp.sql, and
-- phase4_matches.sql.
-- ============================================================

-- payments didn't have a timestamp column, needed to sort history
-- sensibly (id is a uuid, not chronological).
alter table public.payments add column if not exists created_at timestamptz not null default now();

-- ------------------------------------------------------------
-- payments: a player can see their own payment history but never
-- edit it directly ("Players can see their own payment status but
-- not edit it" per the spec). Only admins create/update rows —
-- that covers both marking paid/unpaid and adding new charges.
-- ------------------------------------------------------------
create policy "payments_select_own_or_admin"
  on public.payments for select
  to authenticated
  using (player_id = auth.uid() or public.is_admin());

create policy "payments_admin_manage"
  on public.payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- attendance: admin-only end to end, per the spec ("[admin-only]"
-- on the table itself). Players never query this table directly.
-- ------------------------------------------------------------
create policy "attendance_admin_manage"
  on public.attendance for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
