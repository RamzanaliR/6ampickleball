-- ============================================================
-- Pickleball Community App — Phase 22: Editable homepage hero
-- Run this AFTER phase21_manager_edit_session.sql.
--
-- Lets an Admin change the homepage hero image, headline, subtext,
-- and both buttons from the Admin panel — useful for swapping in a
-- tournament/celebration photo without a code change.
--
-- Safe to re-run.
-- ============================================================

create table if not exists public.site_settings (
  id boolean primary key default true,
  hero_image_url text not null default '/hero.jpg',
  hero_eyebrow text not null default '6AM Pickleball Club • Dar es Salaam',
  hero_headline text not null default 'When the courts opens
before the city wake up',
  hero_subtext text not null default 'A Dar es Salaam pickleball family that starts the day together — early mornings, good rallies, and friendships that outlast the session.',
  hero_button1_label text not null default 'Request to join',
  hero_button1_href text not null default '/signup',
  hero_button2_label text not null default 'See what we''re about',
  hero_button2_href text not null default '#events',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.players(id),
  -- Singleton table: only one row can ever exist.
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Anyone (including signed-out visitors on the marketing page) can read.
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  to public
  using (true);

-- Only admins can change it.
drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage bucket for the hero image (and any other site-wide media
-- later). Public read, admin-only write.
insert into storage.buckets (id, name, public, file_size_limit)
values ('site-media', 'site-media', true, 20971520) -- 20MB cap
on conflict (id) do nothing;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'site-media');

drop policy if exists "site_media_admin_write" on storage.objects;
create policy "site_media_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
