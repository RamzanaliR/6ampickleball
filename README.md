# Dar Pickleball Club — Community App

Next.js (App Router) + Supabase + Tailwind CSS v4. Built in phases — see
`pickleball-community-app-spec.md` for the full spec this was built from.

## Phase 1 — Foundation ✅

- [x] Next.js project + Tailwind, brand fonts (Big Shoulders Display / Inter / JetBrains Mono)
- [x] Supabase schema (`supabase/schema.sql`) — all tables from the spec, plus
      a `role` column on `players` (needed for admin gating, not in the
      original table list) and an auto-provision trigger so every signup
      gets a `pending` player row
- [x] Auth: email/password sign up + sign in, session refresh via `proxy.ts`
      (Next.js 16 renamed `middleware.ts`), route protection for
      `/dashboard`, `/sessions`, `/leaderboard`, `/admin`
- [x] Responsive layout + nav (desktop bar, mobile menu), landing page
- [x] Placeholder Dashboard / Sessions / Leaderboard / Admin pages wired to
      real auth state (leaderboard already reads live `players` data)

## Phase 2 — Player-facing core ✅

- [x] Editable player profile (name, phone, skill tier) on the dashboard
- [x] Real sessions list, pulled from `sessions`
- [x] RSVP / cancel, with capacity + waitlist + auto-promote logic owned by
      two Postgres RPC functions (`rsvp_to_session`, `cancel_rsvp`) so it's
      safe under concurrent requests — see `supabase/phase2_sessions_rsvp.sql`
- [x] Dashboard shows the sessions a player has RSVP'd to (confirmed or
      waitlisted), with a match-history placeholder for Phase 4

**Note:** the admin UI for creating/editing sessions is Phase 3. To test the
RSVP flow now, add a session directly in the Supabase SQL editor:
```sql
insert into public.sessions (title, date_time, location, capacity, created_by)
values (
  'Saturday Open Play',
  now() + interval '3 days',
  'Oyster Bay Courts',
  12,
  (select id from public.players where role = 'admin' limit 1)
);
```

## Phase 3 — Admin core ✅

- [x] Admin overview (`/admin`) with pending/upcoming/roster stat cards
- [x] Player approval queue (`/admin/players`) — approve/reject pending
      signups, plus a read-only roster list
- [x] Session create/edit (`/admin/sessions`, `/admin/sessions/new`,
      `/admin/sessions/[id]/edit`) — the SQL workaround above is no longer
      needed, sessions can be created from the UI now
- [x] Quick actions to mark a session completed or cancelled (and reopen it)
- [x] Fixed a latent bug from Phase 2: session times were being formatted in
      whatever timezone the server happens to run in. All date/time display
      and input now pins to Africa/Dar_es_Salaam explicitly
      (`lib/format.ts`), so it's correct on Vercel (which defaults to UTC)
      without needing a timezone picker

**Promoting a second admin** is still done via SQL (there's no UI for
changing roles yet — kept out of scope to avoid an admin accidentally
locking themselves out):
```sql
update public.players set role = 'admin' where email = 'someone@example.com';
```

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** Open the SQL editor in your Supabase project and run,
   in order: `supabase/schema.sql`, then `supabase/phase2_sessions_rsvp.sql`.
3. **Env vars.** Copy `.env.local.example` to `.env.local` and fill in your
   project's URL + anon key (Project Settings → API).
4. **Install & run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.
5. **Make yourself an admin.** After signing up once through the app, run
   this in the Supabase SQL editor:
   ```sql
   update public.players
   set role = 'admin', status = 'approved'
   where email = 'you@example.com';
   ```

## Project structure

```
app/
  page.tsx                landing page
  (auth)/login/           sign in
  (auth)/signup/          sign up
  auth/callback/route.ts  email confirmation exchange
  dashboard/               player dashboard (profile, stats, my RSVPs)
  sessions/                sessions list + RSVP/waitlist
  leaderboard/              live standings
  admin/                    admin overview
  admin/players/             approval queue + roster
  admin/sessions/             session list + quick actions
  admin/sessions/new/          create session
  admin/sessions/[id]/edit/     edit session
lib/
  supabase/client.ts       browser Supabase client
  supabase/server.ts       server Supabase client
  supabase/middleware.ts   session refresh + route protection
  actions/rsvp.ts           RSVP / cancel server actions
  actions/profile.ts        profile update server action
  actions/admin-players.ts   approve/reject server actions
  actions/admin-sessions.ts  create/update/status server actions
  format.ts                  date/time helpers, pinned to Africa/Dar_es_Salaam
  types.ts                 shared TS types mirroring the schema
components/
  nav.tsx / nav-bar.tsx     responsive nav
  auth-card.tsx             shared auth form shell
  form-field.tsx             shared text input
  profile-form.tsx           editable profile form
  session-card.tsx            session card w/ RSVP button
  rsvp-button.tsx              RSVP/cancel/waitlist button
  page-header.tsx           interior page header
  empty-state.tsx            shared empty-state block
  logo-mark.tsx              paddle + ball glyph
  admin/admin-tabs.tsx        Overview/Players/Sessions sub-nav
  admin/player-approval-row.tsx
  admin/session-form.tsx        shared create/edit form
  admin/session-quick-actions.tsx
supabase/
  schema.sql                 tables, trigger, RLS foundation
  phase2_sessions_rsvp.sql    sessions/rsvps RLS + RSVP RPC functions
```

## Design tokens

Defined in `app/globals.css`. Palette pulls from the sport itself rather
than a generic app palette: deep court green (`--color-court`), optic-yellow
ball (`--color-ball`, used sparingly), warm paper background, and a dashed
"kitchen line" rule (`.kitchen-line`) used as the one recurring structural
motif — nav bottom border, table headers, section dividers. Fonts (Big
Shoulders Display / Inter / JetBrains Mono) are self-hosted via Fontsource
rather than fetched from Google at build time — see the note in Phase 3.

## Next phases

- **Phase 4** — match submission + verification, leaderboard scoring rules
- **Phase 5** — payment tracking UI, attendance log
- **Phase 6** — community feed, notifications, polish pass
