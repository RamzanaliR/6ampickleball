-- ============================================================
-- Pickleball Community App — Phase 10: feed moderation
-- Run this AFTER phase9_scoring_change.sql.
--
-- Opens posting up to every approved player instead of admin-only,
-- gated by admin approval before a post is publicly visible.
-- ============================================================

alter table public.community_feed
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected'));

-- Existing posts (all admin-authored, from before this migration)
-- were already effectively published — grandfather them in as approved
-- rather than sending them into a moderation queue retroactively.
update public.community_feed set status = 'approved' where status = 'pending';

drop policy if exists "community_feed_select_approved" on public.community_feed;
drop policy if exists "community_feed_admin_manage" on public.community_feed;

-- Everyone approved can see published posts, plus their own posts
-- regardless of status (so they can see "pending review"/"rejected").
-- Admin sees everything, for moderation.
create policy "community_feed_select"
  on public.community_feed for select
  to authenticated
  using (
    status = 'approved'
    or posted_by = auth.uid()
    or public.is_admin()
  );

-- Any approved player can post (app code decides the initial status —
-- admin posts publish immediately, everyone else starts pending).
create policy "community_feed_insert_approved_player"
  on public.community_feed for insert
  to authenticated
  with check (
    posted_by = auth.uid()
    and exists (select 1 from public.players where id = auth.uid() and status = 'approved')
  );

-- Only admins can change status (approve/reject) or delete.
create policy "community_feed_admin_moderate"
  on public.community_feed for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "community_feed_admin_delete"
  on public.community_feed for delete
  to authenticated
  using (public.is_admin());
