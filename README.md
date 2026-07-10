# 6AM Pickleball Club — Community App

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

## Phase 6 — Community feed + polish ✅

This is the last phase in the original spec. The app now covers every
feature in `pickleball-community-app-spec.md`.

- [x] Community feed (`/feed`) — read-only for players, newest first
- [x] Admin feed management (`/admin/feed`) — post an announcement (text +
      optional image URL) and delete posts
- [x] Responsive pass — fixed one real bug (the leaderboard table would clip
      instead of scroll on narrow phones; now scrolls horizontally) and
      made grid layouts explicit about their mobile column count instead of
      relying on implicit browser behavior

**Notifications were intentionally left out**, per the spec's own call:
*"Notifications (build later if time allows)... can defer to v2."* Session
reminders and RSVP confirmations over WhatsApp are a real integration
project on their own (a WhatsApp Business API account, message templates,
a delivery pipeline) — bolting on a half-working version would cost more
in false confidence than it's worth. This is the natural v2 starting point.

**Feed images are a URL field, not a file upload.** Building real upload
(Supabase Storage bucket, upload UI, image processing) is a meaningful
chunk of work on its own; a URL field gets the same "post a photo" outcome
today; wiring up Storage is a clean, isolated upgrade later without
touching anything else.

## Post-launch tweaks

Changes made after all 6 phases were built:

- **Rebranded** from "Dar Pickleball Club" to **6AM Pickleball Club**,
  using the real club logo (`app/icon.png`, `app/apple-icon.png`,
  `app/favicon.ico`, `public/logo.png` in the nav) instead of the
  placeholder paddle-and-ball glyph.
- **Admin can add a member directly** (`/admin/players/new`) instead of
  waiting for someone to sign up themselves — enter a name and email, the
  system creates their account with a generated password and approves them
  immediately (no pending queue). The password is shown once, with a
  "Copy for WhatsApp" button, matching how you actually reach people.

  **This needs a new secret**: `SUPABASE_SERVICE_ROLE_KEY`, in
  `.env.local` (see `.env.local.example`) and later in Vercel's env vars.
  Find it in Supabase under Project Settings → API → service_role key.
  Creating a user directly (rather than through normal signup) requires
  Supabase's admin API, which only works with this key — never the public
  anon key. It's used in exactly one place, `lib/supabase/admin.ts`, only
  from server actions, and is never sent to the browser.

## Fixture Generator (Classic Robin) + related tweaks

The big addition: admin can generate a full round-robin doubles schedule
for a session, players get scored live at the courts, and the season
leaderboard updates automatically from the same matches. Built after a
long back-and-forth on the actual scheduling rules — see the design notes
below, since some of the choices aren't obvious from the code alone.

- [x] **"I'm in" replaces RSVP** everywhere — button labels, page copy,
      badges. (Internal code — variable names, the `rsvps` table, the
      `RsvpButton` component — kept their original names; only
      user-facing text changed.)
- [x] **Self-service password change** (`/dashboard` → Password section),
      closing the gap flagged in the admin-add-member tweak above.
- [x] **"Share on WhatsApp" button** on every session card — no messaging
      infrastructure, just a `wa.me` link pre-filled with the session
      details. Opens WhatsApp with the message ready to send.
- [x] **Court count on sessions** — a real field now (session create/edit
      forms, shown on the admin sessions list), and the default value the
      fixture generator proposes for that session.
- [x] **Guest members** — admin can add a guest (new or a returning one,
      picked from a dropdown) to a specific session. A guest is a real
      `players` row — plugs into RSVPs, matches, attendance normally —
      but has no login and is excluded from the season leaderboard and
      main roster. This needed dropping the foreign key from
      `players.id` to `auth.users.id`, since a guest has no auth account
      (see `supabase/phase7_tweaks.sql`).
- [x] **Any match's score can be corrected after the fact** — not just
      fixtures. `edit_match_result` reverses the old win/loss/points
      delta before applying the corrected one, so a fix can't
      double-count. The admin verification queue's "reject" flow from
      Phase 4 is unchanged; this is a *new* capability for matches that
      are already scored and were just entered wrong.
- [x] **Fixture Generator** (`/admin/sessions/[id]/fixtures`) — the main
      feature. Classic Robin only (no live/flexible mode — decided
      against it: partner rotation needs a fixed roster to do properly,
      and re-deriving it every time someone joins or leaves mid-session
      added a lot of complexity for a case that turned out not to be
      needed). Always exactly 10 rounds. Generates real rows in the same
      `matches` table Phase 4 already built — a fixture match *is* a
      match, it just arrives with the teams already filled in and a
      `round_number`/`court_number` for display. Scores are entered
      live and applied immediately (no separate verification step for
      fixtures — see "any match can be corrected" above for how mistakes
      get fixed).

### How the schedule is actually generated

This is the part worth understanding rather than just trusting:

- **Partner rotation uses the classic "circle method"** — the same
  algorithm used for round-robin tournament scheduling generally (fix
  one player, rotate the rest). It's a mathematical guarantee of zero
  repeat partnerships for up to `N-1` rounds, not a best-effort heuristic.
  At your typical scale (12–26 players), that guarantee comfortably
  covers all 10 rounds every time — nobody partners with the same person
  twice in a session. See `generateClassicRobin` in
  `lib/fixtures/generate-classic-robin.ts`.
- **It only falls back to randomized search when 2+ players have to sit
  out every round** (i.e. the court count can't fit everyone even to
  within one spare) — a fixed pair of "bye slots" would occasionally have
  to face each other, which the courts don't have room for, so the clean
  guarantee doesn't cleanly apply there. That fallback still does well in
  practice (randomized attempts, keeps the best of several tries), just
  without the same hard guarantee.
- **Byes rotate fairly** whenever the player count isn't a clean multiple
  of 4, or exceeds what the booked courts can hold — tracked so nobody
  sits out twice before everyone's sat out once.
- **Opponent matching (which pair plays which) is always randomized
  search**, not deterministic — there's no equivalent clean guarantee for
  avoiding repeat opponents on top of guaranteed-fresh partners, so it's
  best-effort (many randomized attempts, keeps the lowest-repeat one).
- **Two scoreboards come out of the same matches**: the real season
  leaderboard (already built, untouched — win is +2 points, loss +0),
  and a same-day standings report specific to that session
  (`lib/fixtures/standings.ts`), using whatever scoring/rank/tie-break
  you picked when generating (win=1/loss=0 or no points at all, ranked
  by wins or points, tied broken by point difference or win count). One
  set of matches, two views of them.
- **Round time (8/10/12/15 min, or no limit) is a label only** — shown
  on the schedule, not a live synced countdown. Simpler build, and
  nothing stops you from asking for the live version later if the label
  turns out not to be enough.

## Second round of tweaks

- [x] **Profile is now a read-only overview** on the dashboard, with an
      "Edit profile" button that opens a modal — the profile form and
      password change both live inside it, so there's no more permanently-
      editable form sitting on the page or a separate Password section.
- [x] **Global leaderboard scoring changed**: a win is now worth **1
      point** (was 2), loss stays 0. Added a **GP** (games played)
      column; deliberately did *not* add PF/PA/PD to the global board —
      that level of detail lives on the per-session standings instead
      (see below), keeping the season view simple.
- [x] **Sessions are now Current / Upcoming / Previous.** A session
      becomes "Current" the moment fixtures are generated for it (shown
      first); everything else upcoming stays in "Upcoming" below it;
      completed sessions are "Previous" (last 20, most recent first) so
      players can look back at old results, not just the last 5.
- [x] **Players can view fixtures and results from their own side** —
      clicking any Current or Previous session opens `/sessions/[id]`,
      a read-only version of the same fixtures + standings view admin
      sees (no scoring controls). This needed a real RLS fix, not just
      a UI one: the original policy only let a match's own participants
      (or admin) see it before it was scored, which is right for a
      manually-submitted result but wrong for a fixture schedule —
      players need to see the *whole* round, not just their own games.
      `supabase/phase11_fixture_visibility.sql` opens fixture-sourced
      matches to any approved player regardless of score state; manually
      logged matches keep the original, narrower visibility.
- [x] **Fixtures pages (both admin and player) are now 2-column**:
      session standings on the left (with **PF/PA/PD** — points for,
      against, and the difference, summed from the actual set scores,
      e.g. 11-6, 8-9, 11-2), one round of matches at a time on the
      right, with prev/next buttons and touch-swipe support
      (`components/fixture-round-navigator.tsx`).
- [x] **Any approved player can view any other player's profile and
      stats** (`/players/[id]`) — stat cards plus match history, same
      shape as your own dashboard history. Leaderboard names link there.
      Works under existing RLS with no new policies needed, since a
      verified match was already publicly visible.
- [x] **The guest form now shows who's already confirmed** for the
      session (players and guests together) right below it, so admin
      isn't adding guests blind.
- [x] **Feed is now open to everyone, with admin approval.** Any
      approved player gets a compose box at the top of `/feed` — posts
      go to a pending queue and only become public once an admin
      approves them (admin's own posts still publish immediately, no
      self-review needed). A player sees their own pending/rejected
      posts inline with a status badge; admin gets a "Pending review"
      section on `/admin/feed` with approve/reject.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** Open the SQL editor in your Supabase project and run,
   in order: `supabase/schema.sql`, `supabase/phase2_sessions_rsvp.sql`,
   `supabase/phase4_matches.sql`, `supabase/phase5_payments_attendance.sql`,
   `supabase/phase6_feed.sql`, `supabase/phase7_tweaks.sql`,
   `supabase/phase8_fixtures.sql`, `supabase/phase9_scoring_change.sql`,
   `supabase/phase10_feed_moderation.sql`, then
   `supabase/phase11_fixture_visibility.sql`.
3. **Env vars.** Copy `.env.local.example` to `.env.local` and fill in your
   project's URL, anon key, and service role key (all under Project
   Settings → API — the service role key is needed for Admin → Players →
   Add member).
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
  dashboard/               player dashboard (profile overview, stats, sessions, matches, payments)
  sessions/                sessions list: Current / Upcoming / Previous
  sessions/[id]/            read-only fixtures + standings for one session
  sessions/[id]/log-match/  submit a match result
  leaderboard/              live standings (GP/W/L/Points) + tier filter
  players/[id]/              any player's public stats + match history
  feed/                     read + compose club announcements (pending review)
  admin/                    admin overview
  admin/players/             approval queue + roster
  admin/players/new/           add a member directly
  admin/sessions/             session list + quick actions
  admin/sessions/new/          create session
  admin/sessions/[id]/edit/     edit session
  admin/sessions/[id]/attendance/  per-session attendance checklist
  admin/sessions/[id]/fixtures/    generate/score fixtures, 2-col standings+rounds
  admin/matches/               match verification queue (manual matches only)
  admin/payments/               payments list + filters
  admin/payments/new/            add a charge
  admin/feed/                    direct-post form + pending-review moderation queue
  icon.png, apple-icon.png, favicon.ico   club logo, all icon sizes
lib/
  supabase/client.ts       browser Supabase client
  supabase/server.ts       server Supabase client
  supabase/middleware.ts   session refresh + route protection
  supabase/admin.ts         service-role client (admin add-member only)
  fixtures/generate-classic-robin.ts  the round-robin scheduling algorithm
  fixtures/standings.ts                same-day standings (W/L/PF/PA)
  actions/rsvp.ts           "I'm in" / cancel server actions
  actions/profile.ts        profile update + password change server actions
  actions/admin-players.ts   approve/reject/add-member server actions
  actions/admin-sessions.ts  create/update/status server actions
  actions/matches.ts          submit/verify/reject server actions
  actions/fixtures.ts          generate/score fixture server actions
  actions/guests.ts             add-guest server action
  actions/attendance.ts        toggle attendance server action
  actions/payments.ts           create charge / toggle paid server actions
  actions/feed.ts                post (admin/player) / moderate / delete
  format.ts                  date/time + TZS currency helpers
  types.ts                 shared TS types mirroring the schema
components/
  nav.tsx / nav-bar.tsx     responsive nav (real club logo)
  auth-card.tsx             shared auth form shell
  form-field.tsx             shared text input
  modal.tsx                   reusable dialog-based modal
  profile-form.tsx           editable profile form (used inside the modal)
  profile-overview.tsx        read-only summary + "Edit profile" → modal
  change-password-form.tsx    self-service password change (inside the modal)
  session-card.tsx            session card w/ "I'm in" + WhatsApp share
  rsvp-button.tsx              "I'm in"/cancel/waitlist button
  whatsapp-share-button.tsx     wa.me pre-filled share link
  match-form.tsx                singles/doubles result submission form
  leaderboard-table.tsx          filterable standings table, links to profiles
  session-standings-table.tsx     shared W/L/PF/PA/PD table (admin + player)
  fixture-round-navigator.tsx      one round at a time, arrows + swipe
  read-only-match-card.tsx          player-facing match display
  feed-compose-form.tsx              any approved player's post form
  page-header.tsx           interior page header
  empty-state.tsx            shared empty-state block
  admin/admin-tabs.tsx        Overview/Players/Sessions/Matches/Payments/Feed sub-nav
  admin/player-approval-row.tsx
  admin/add-member-form.tsx     create a member account directly
  admin/session-form.tsx        shared create/edit form (incl. courts)
  admin/session-quick-actions.tsx
  admin/match-verification-row.tsx
  admin/attendance-checkbox.tsx
  admin/add-guest-form.tsx        add new/returning guest to a session
  admin/generate-fixtures-form.tsx  fixture settings + generate
  admin/fixture-match-score-form.tsx  live score entry + edit
  admin/payment-form.tsx
  admin/payment-status-toggle.tsx
  admin/feed-post-form.tsx        admin's direct-post form
  admin/feed-post-row.tsx          published post row + delete
  admin/feed-moderation-row.tsx     pending post row + approve/reject
supabase/
  schema.sql                 tables, trigger, RLS foundation
  phase2_sessions_rsvp.sql    sessions/rsvps RLS + RSVP RPC functions
  phase4_matches.sql           team-based matches table + verify/reject RPCs
  phase5_payments_attendance.sql  payments/attendance RLS + created_at
  phase6_feed.sql                  community_feed RLS
  phase7_tweaks.sql                 courts column + guest member support
  phase8_fixtures.sql                fixture columns + score/edit RPCs
  phase9_scoring_change.sql           win = 1 point (was 2)
  phase10_feed_moderation.sql          feed status column + open posting
  phase11_fixture_visibility.sql        fixture schedule visible to all players
```

## Design tokens

Defined in `app/globals.css`. Palette pulls from the sport itself rather
than a generic app palette: deep court green (`--color-court`), optic-yellow
ball (`--color-ball`, used sparingly), warm paper background, and a dashed
"kitchen line" rule (`.kitchen-line`) used as the one recurring structural
motif — nav bottom border, table headers, section dividers. Fonts (Big
Shoulders Display / Inter / JetBrains Mono) are self-hosted via Fontsource
rather than fetched from Google at build time — see the note in Phase 3.

## Status

All 6 phases from the original spec are built, plus a large post-launch
addition: the Fixture Generator, guest members, admin add-member, and a
handful of smaller tweaks (see above). Natural next steps if you want to
keep going:
- Real mobile money integration (Selcom/Flutterwave/DPO) — the `payments`
  table's `method` column was designed for this from Phase 1
- WhatsApp *notifications* (automatic reminders) — the share button covers
  manual sharing; a real reminder system needs the WhatsApp Business API
- Supabase Storage for feed images and player profile photos, instead of
  URL fields
- A role-management UI for promoting a second admin (currently SQL-only,
  see Phase 3)
- Tournaments (bracket-style, fixed partners) — deliberately parked until
  the Fixture Generator was solid, since they share some DNA (random
  draws) but need their own data model (fixed teams, brackets, byes for
  non-power-of-2 entrant counts)
