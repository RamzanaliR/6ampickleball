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

## Phase 4 — Match results + leaderboard ✅

- [x] Log a result (`/sessions/[id]/log-match`) — available once a session
      is marked completed. Pick singles or doubles, pick players, enter
      1–3 set scores; the winning side is derived from the sets, not picked
      by hand, so the score and the result can't contradict each other
- [x] Verification queue (`/admin/matches`) — admin verifies or rejects each
      submitted result; verifying is what actually applies points (a win is
      +2 points and a win added to the player's record, a loss is +0 points
      and a loss added — see `verify_match` in `supabase/phase4_matches.sql`)
- [x] Leaderboard now reflects real results automatically (no extra wiring
      needed — it already read `points`/`wins`/`losses` off `players`), plus
      an optional skill-tier filter
- [x] Dashboard shows real match history — opponent, set scores from your
      own side's perspective, and a Pending/Win/Loss badge

**Design decision worth knowing about:** the original spec's `matches` table
had a single `player_ids` array and one `winner_id`, which doesn't cleanly
express doubles (2 vs 2). `supabase/phase4_matches.sql` replaces it with
`team_a` / `team_b` arrays (1 player for singles, 2 for doubles) and a
`winning_team` ('a' or 'b'). It also adds a `sets` jsonb column
(`[{"a":11,"b":7}, ...]`) instead of a free-text score, since structured
scores are what let the winning side be computed instead of hand-picked.

## Phase 5 — Payments + attendance ✅

- [x] Attendance (`/admin/sessions/[id]/attendance`) — a checklist of every
      approved player for a given session, separate from RSVPs so no-shows
      and walk-ins both show up correctly. Players who RSVP'd confirmed are
      sorted to the top and flagged
- [x] Payments (`/admin/payments`) — admin can add a charge (session fee or
      membership) for any player and toggle it paid/unpaid, with filters by
      player, session, status, and period
- [x] Dashboard shows each player their own payment history (read-only, per
      the spec — players can see status but never edit it)
- [x] Admin overview gets a fifth stat card: unpaid dues, linking straight
      into the pre-filtered payments list

**Note on the data model:** `payments` and `attendance` existed in
`schema.sql` from Phase 1 with RLS *enabled* but no policies yet — meaning
nothing could actually read or write them until now. That's normal; it's
the same default-deny pattern used throughout so nothing was ever
accidentally left wide open while unfinished. `supabase/phase5_payments_attendance.sql`
adds the missing policies and a `created_at` column on `payments` (needed
to sort history — the id is a uuid, not a timestamp).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** Open the SQL editor in your Supabase project and run,
   in order: `supabase/schema.sql`, `supabase/phase2_sessions_rsvp.sql`,
   `supabase/phase4_matches.sql`, then `supabase/phase5_payments_attendance.sql`.
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
  dashboard/               player dashboard (profile, stats, RSVPs, matches, payments)
  sessions/                sessions list + RSVP/waitlist
  sessions/[id]/log-match/  submit a match result
  leaderboard/              live standings + tier filter
  admin/                    admin overview
  admin/players/             approval queue + roster
  admin/sessions/             session list + quick actions
  admin/sessions/new/          create session
  admin/sessions/[id]/edit/     edit session
  admin/sessions/[id]/attendance/  per-session attendance checklist
  admin/matches/               match verification queue
  admin/payments/               payments list + filters
  admin/payments/new/            add a charge
lib/
  supabase/client.ts       browser Supabase client
  supabase/server.ts       server Supabase client
  supabase/middleware.ts   session refresh + route protection
  actions/rsvp.ts           RSVP / cancel server actions
  actions/profile.ts        profile update server action
  actions/admin-players.ts   approve/reject server actions
  actions/admin-sessions.ts  create/update/status server actions
  actions/matches.ts          submit/verify/reject server actions
  actions/attendance.ts        toggle attendance server action
  actions/payments.ts           create charge / toggle paid server actions
  format.ts                  date/time + TZS currency helpers
  types.ts                 shared TS types mirroring the schema
components/
  nav.tsx / nav-bar.tsx     responsive nav
  auth-card.tsx             shared auth form shell
  form-field.tsx             shared text input
  profile-form.tsx           editable profile form
  session-card.tsx            session card w/ RSVP button
  rsvp-button.tsx              RSVP/cancel/waitlist button
  match-form.tsx                singles/doubles result submission form
  leaderboard-table.tsx          filterable standings table
  page-header.tsx           interior page header
  empty-state.tsx            shared empty-state block
  logo-mark.tsx              paddle + ball glyph
  admin/admin-tabs.tsx        Overview/Players/Sessions/Matches/Payments sub-nav
  admin/player-approval-row.tsx
  admin/session-form.tsx        shared create/edit form
  admin/session-quick-actions.tsx
  admin/match-verification-row.tsx
  admin/attendance-checkbox.tsx
  admin/payment-form.tsx
  admin/payment-status-toggle.tsx
supabase/
  schema.sql                 tables, trigger, RLS foundation
  phase2_sessions_rsvp.sql    sessions/rsvps RLS + RSVP RPC functions
  phase4_matches.sql           team-based matches table + verify/reject RPCs
  phase5_payments_attendance.sql  payments/attendance RLS + created_at
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

- **Phase 6** — community feed, notifications, polish pass (last phase in
  the original spec)
