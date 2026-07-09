# Dar Pickleball Club — Community App

Next.js (App Router) + Supabase + Tailwind CSS v4. Built in phases — see
`pickleball-community-app-spec.md` for the full spec this was built from.

## Phase 1 — Foundation ✅

- [x] Next.js project + Tailwind, brand fonts (Big Shoulders Display / Inter / JetBrains Mono)
- [x] Supabase schema (`supabase/schema.sql`) — all tables from the spec, plus
      a `role` column on `players` (needed for admin gating, not in the
      original table list) and an auto-provision trigger so every signup
      gets a `pending` player row
- [x] Auth: email/password sign up + sign in, session refresh via middleware,
      route protection for `/dashboard`, `/sessions`, `/leaderboard`, `/admin`
- [x] Responsive layout + nav (desktop bar, mobile menu), landing page
- [x] Placeholder Dashboard / Sessions / Leaderboard / Admin pages wired to
      real auth state (leaderboard already reads live `players` data)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** Open the SQL editor in your Supabase project and run
   the contents of `supabase/schema.sql`.
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
  dashboard/               player dashboard
  sessions/                sessions list (Phase 2)
  leaderboard/              live standings
  admin/                    admin shell (Phase 3)
lib/
  supabase/client.ts       browser Supabase client
  supabase/server.ts       server Supabase client
  supabase/middleware.ts   session refresh + route protection
  types.ts                 shared TS types mirroring the schema
components/
  nav.tsx / nav-bar.tsx     responsive nav
  auth-card.tsx             shared auth form shell
  page-header.tsx           interior page header
  logo-mark.tsx              paddle + ball glyph
supabase/
  schema.sql                tables, trigger, RLS
```

## Design tokens

Defined in `app/globals.css`. Palette pulls from the sport itself rather
than a generic app palette: deep court green (`--color-court`), optic-yellow
ball (`--color-ball`, used sparingly), warm paper background, and a dashed
"kitchen line" rule (`.kitchen-line`) used as the one recurring structural
motif — nav bottom border, table headers, section dividers.

## Next phases

- **Phase 2** — signup → pending approval flow is done; still need player
  profile editing, real session list + RSVP/waitlist logic
- **Phase 3** — admin player approval queue, session create/edit
- **Phase 4** — match submission + verification, leaderboard scoring rules
- **Phase 5** — payment tracking UI, attendance log
- **Phase 6** — community feed, notifications, polish pass
