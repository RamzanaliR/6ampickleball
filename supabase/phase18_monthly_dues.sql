-- ============================================================
-- Pickleball Community App — Phase 18: monthly dues
-- Run this AFTER phase17_finances.sql.
--
-- Two pieces:
-- 1. `monthly_dues_amount` on players — each member's preset dues
--    amount (varies per person, set by an admin). Null/0 = no dues
--    set for them (e.g. guests, or members who pay per-session only).
-- 2. `dues_months` — one row per calendar month recording whether an
--    admin charged dues that month or explicitly skipped it (pay per
--    session instead). Drives the "confirm dues" reminder on the
--    admin overview — it only shows for months with no row yet.
-- ============================================================

alter table public.players add column if not exists monthly_dues_amount numeric(10, 2);

create table if not exists public.dues_months (
  period text primary key, -- 'YYYY-MM'
  status text not null check (status in ('charged', 'skipped')),
  decided_by uuid references public.players(id),
  decided_at timestamptz not null default now()
);

alter table public.dues_months enable row level security;

drop policy if exists "dues_months_admin_all" on public.dues_months;
create policy "dues_months_admin_all"
  on public.dues_months for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
