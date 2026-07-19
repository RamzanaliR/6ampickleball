-- ============================================================
-- Pickleball Community App — Phase 14: feed media (multi image/video)
-- Run this AFTER phase10_feed_moderation.sql.
--
-- Adds a `media` column holding an array of {url, type} objects so a
-- post can carry several images/videos (the old single `image_url`
-- column is kept for backward compatibility and is no longer written
-- to by new code, but old posts still render fine with it).
--
-- Also creates a public "feed-media" storage bucket that approved
-- players upload directly to from the browser (bypassing the Vercel
-- function body-size limit for video uploads).
-- ============================================================

alter table public.community_feed
  add column if not exists media jsonb not null default '[]'::jsonb;

-- Storage bucket for feed images/videos. Public read (so <img>/<video>
-- tags can load straight from the CDN URL), authenticated write.
insert into storage.buckets (id, name, public, file_size_limit)
values ('feed-media', 'feed-media', true, 52428800) -- 50MB cap per file
on conflict (id) do nothing;

drop policy if exists "feed_media_public_read" on storage.objects;
create policy "feed_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'feed-media');

drop policy if exists "feed_media_approved_upload" on storage.objects;
create policy "feed_media_approved_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'feed-media'
    and exists (
      select 1 from public.players
      where id = auth.uid() and status = 'approved'
    )
  );

-- Let a player delete their own uploaded files (object name is prefixed
-- with their user id — see the client upload code), admins can delete any.
drop policy if exists "feed_media_owner_or_admin_delete" on storage.objects;
create policy "feed_media_owner_or_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'feed-media'
    and (owner = auth.uid() or public.is_admin())
  );
