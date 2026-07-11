-- ============================================================
-- Pickleball Community App — Phase 17: finances (received + paid)
-- Run this AFTER phase16_nickname.sql.
--
-- The payments table only ever tracked money coming IN from members
-- (session fees, membership dues). This adds a `direction` so the
-- same table can also track money going OUT (court rental, kit,
-- coaching, etc.) — the "Paid" side of the new Finances page.
--
-- Existing rows are all incoming charges, so they default to
-- direction = 'received' and keep working exactly as before.
-- ============================================================

alter table public.payments add column if not exists direction text not null default 'received'
  check (direction in ('received', 'paid'));

-- Outgoing ("paid") entries have no player, so player_id can no
-- longer be mandatory. Same for type — it only makes sense for
-- incoming charges (session_fee / membership).
alter table public.payments alter column player_id drop not null;
alter table public.payments alter column type drop not null;

alter table public.payments drop constraint if exists payments_type_check;
alter table public.payments add constraint payments_type_check
  check (type is null or type in ('session_fee', 'membership'));

-- Free-text fields for the new "Paid" side, plus a description that
-- both sides can use, and a free-text "received by" for the incoming
-- side (mirrors "paid by" on the outgoing side) — these are just
-- notes on who physically handled the cash, not app user references.
alter table public.payments add column if not exists paid_to text;
alter table public.payments add column if not exists description text;
alter table public.payments add column if not exists received_by text;
alter table public.payments add column if not exists paid_by text;
