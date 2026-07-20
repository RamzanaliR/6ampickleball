-- ============================================================
-- Pickleball Community App — Phase 21: Managers can edit sessions
-- Run this AFTER phase20_manager_role.sql.
--
-- Expands the Manager role: in addition to creating sessions,
-- Managers can now also edit session details (title, date, time,
-- location, capacity, courts, etc). Deleting a session and changing
-- its status (upcoming/completed/cancelled) stay admin-only — those
-- still go through the app-level admin-only checks in
-- deleteSession/setSessionStatus, unchanged.
--
-- Safe to re-run.
-- ============================================================

drop policy if exists "sessions_staff_update" on public.sessions;
create policy "sessions_staff_update"
  on public.sessions for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
