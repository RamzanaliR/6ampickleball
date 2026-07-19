-- ============================================================
-- Pickleball Community App — Phase 1 schema
-- Run this in the Supabase SQL editor (or via the CLI) on a
-- fresh project, after auth is enabled.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- players
-- One row per auth.users row (id is shared 1:1 with auth.users.id).
-- `role` isn't in the original spec table list but is required to
-- gate admin-only actions in RLS policies below.
-- ------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  skill_tier text check (skill_tier in ('beginner', 'intermediate', 'advanced')),
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'player' check (role in ('player', 'admin')),
  profile_photo_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- sessions
-- ------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_time timestamptz not null,
  location text not null,
  capacity integer not null check (capacity > 0),
  created_by uuid not null references public.players (id),
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled'))
);

-- ------------------------------------------------------------
-- rsvps
-- ------------------------------------------------------------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (player_id, session_id)
);

-- ------------------------------------------------------------
-- attendance [admin-only]
-- ------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  checked_in_by uuid not null references public.players (id),
  checked_in_at timestamptz not null default now(),
  unique (player_id, session_id)
);

-- ------------------------------------------------------------
-- matches
-- ------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_ids uuid[] not null,
  score text not null,
  winner_id uuid references public.players (id),
  verified boolean not null default false,
  submitted_by uuid not null references public.players (id)
);

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  period text,
  amount numeric(10, 2) not null,
  type text not null check (type in ('session_fee', 'membership')),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  method text not null default 'manual' check (method in ('manual', 'mobile_money', 'card')),
  marked_by uuid references public.players (id),
  paid_at timestamptz
);

-- ------------------------------------------------------------
-- community_feed
-- ------------------------------------------------------------
create table if not exists public.community_feed (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.players (id),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Auto-provision a `players` row whenever someone signs up via
-- Supabase Auth, status defaults to 'pending' until an admin
-- approves them.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Helper: is the current user an approved admin?
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.players
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- Phase 1 covers `players` fully since auth touches it directly.
-- Other tables are enabled here (default-deny) and get their
-- read/write policies filled in as each feature is built in
-- later phases, so nothing is accidentally left wide open.
-- ------------------------------------------------------------
alter table public.players enable row level security;
alter table public.sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.attendance enable row level security;
alter table public.matches enable row level security;
alter table public.payments enable row level security;
alter table public.community_feed enable row level security;

-- players: everyone approved can read the roster (needed for
-- leaderboard); a player can update their own profile fields but
-- not their own status/role/points (only admins do that).
create policy "players_select_approved_roster"
  on public.players for select
  to authenticated
  using (status = 'approved' or id = auth.uid() or public.is_admin());

create policy "players_update_own_profile"
  on public.players for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.players where id = auth.uid())
    and status = (select status from public.players where id = auth.uid())
    and points = (select points from public.players where id = auth.uid())
  );

create policy "players_admin_manage"
  on public.players for update
  to authenticated
  using (public.is_admin());
