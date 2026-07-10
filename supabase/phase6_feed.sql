-- ============================================================
-- Pickleball Community App — Phase 6 additions
-- Run this AFTER schema.sql, phase2_sessions_rsvp.sql,
-- phase4_matches.sql, and phase5_payments_attendance.sql.
-- ============================================================

-- community_feed existed since Phase 1 with RLS enabled but no
-- policies (same default-deny pattern as payments/attendance
-- before Phase 5). Any approved player (or admin) can read; only
-- admins can post or delete.
create policy "community_feed_select_approved"
  on public.community_feed for select
  to authenticated
  using (
    exists (select 1 from public.players where id = auth.uid() and status = 'approved')
    or public.is_admin()
  );

create policy "community_feed_admin_manage"
  on public.community_feed for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
