# MMC Fest Hub — Smart Club Operations for Manarat Mathletes Club

Submitted to the **9th DRMC International Tech Carnival 2026 — AI Web
Development Contest** ("Smart Club Operations").

> ### ⚠️ This repo has two live deployments — don't confuse them
>
> | | Main website | Fest Hub (this contest submission) |
> |---|---|---|
> | **Link** | [manaratmath.club](https://manaratmath.club) | [mmc-website-fest.vercel.app](https://mmc-website-fest.vercel.app) |
> | **Database** | The real club's Supabase project — real students' data | A separate, judging-only Supabase project — mock data only |
> | **Fest Hub feature visible?** | No, always hidden | Yes |
>
> Same codebase, same `main` branch, two different Supabase + Vercel
> projects. See [Why it runs as its own deployment](#deployment-url)
> below for the full reasoning.

## Description

Clubs that run multiple events (fests, workshops, quizzes, contests)
usually fall back on Google Forms for registration — no directory, no
capacity limits, no way for an organizer to see everything in one place,
no way for a registrant to look up or cancel what they signed up for.
This project replaces that with a full **Organization → Fest → Event →
Registration** platform: visitors browse fests and their events, search
and filter across all of them, register with live capacity/deadline
enforcement, and look up or cancel their own registrations by email +
ticket code (no visitor accounts). Organizers get a dashboard to create
and publish fests/events and manage every participant.

It's built as a new module on top of the Manarat Mathletes Club's
existing website (home, about, announcements, leaderboards, hall of
fame, admin panel) rather than a separate project — see
[Deployment](#deployment-url) for why it runs as its own deployment
regardless.

## Features

**Fest Directory**
- Fest cards grouped into Upcoming / Ongoing / Past tabs
- Event cards with category, date/time, venue, deadline, seats left, and
  a live status pill (Open / Closing soon / Full / Closed / Not yet open)
- Search across every event by name, category, venue, or fest
- Category, fest, and "open for registration only" filters, kept in the
  URL query string

**Registration**
- Per-event registration with capacity and deadline enforcement,
  enforced server-side (not just in the UI)
- Automatic waitlisting when an event is full and its organizer has
  enabled one
- A bookmarkable confirmation page with the registration's ticket code
- "My Registrations": look yourself up by email + any one ticket code
  (no account/password), view every registration, cancel any of them

**Organizer tools**
- A dashboard with overview stats (fests, events, total registrations,
  today's sign-ups)
- Fest and event CRUD: create, edit, publish/unpublish/archive, cover
  image upload
- Custom per-event registration fields (short text / paragraph /
  dropdown, each optionally required) — e.g. a team name and teammate
  names for a team event, with no schema change needed per event
- Per-event participant management: search, filter by status/school/
  class, per-row and bulk status changes, CSV export (including any
  custom field answers), a details view per registration
- Per-event statistics: capacity fill %, status breakdown, sign-ups-
  per-day chart, school breakdown

**Bonus**
- Scannable QR code of the ticket code on the registration confirmation
  page; an organizer checks someone in by searching their ticket code in
  the participants table (same search box used for everything else) and
  marking it "attended"
- Automatic waitlist promotion — a database trigger bumps the
  longest-waiting waitlisted registration to confirmed the instant a
  confirmed one is cancelled or rejected, no admin action needed
- "Add to calendar" (.ics download) on both the event page and the
  registration confirmation page

## Tech Stack

- React 19, TypeScript, Vite, React Router
- Supabase (Postgres, Auth, Storage, Row Level Security)
- Vercel (hosting + auto-deploy)
- `qrcode` — the only new npm package added for this build, used
  client-side to render the ticket QR code (no server/API involved); see
  `package.json` for exact versions.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Full Supabase project setup, the Fest Hub's separate-deployment setup,
email delivery, and admin management: see **[docs/SETUP.md](docs/SETUP.md)**.

## Deployment URL

Fest Hub contest deployment: [mmc-website-fest.vercel.app](https://mmc-website-fest.vercel.app)

The main club site (unaffected by this feature, which stays hidden
there) is at [manaratmath.club](https://manaratmath.club).

## Demo Credentials

**Organizer login** (for `/admin/events`): `demo-admin@manaratmath.club`
/ `FestHub2026!Judge`. Demo-only; granted only the Fest Hub admin
sections, not super admin.

**Visitor lookup** (for `/my-registrations`, no account needed): email
`judge@example.com` with any of these ticket codes —
`MMC-DEMO01` (confirmed), `MMC-DEMO02` (waitlisted), `MMC-DEMO03`
(attended).

See **[docs/JUDGING_GUIDE.md](docs/JUDGING_GUIDE.md)** for a full
rubric-to-feature walkthrough, or **[docs/ORGANIZER_GUIDE.md](docs/ORGANIZER_GUIDE.md)**
if you're actually running events through Fest Hub rather than judging it —
non-technical, covers creating fests/events, managing registrations, and
check-in on the day.

## Third-party Services/APIs

- **Supabase** — Postgres database, Auth, Storage, and Row Level
  Security; the entire backend.
- **Vercel** — hosting and CI/CD (auto-deploy on push).
- **Brevo** — transactional email (SMTP) for Supabase Auth's
  confirmation/reset emails; see `docs/SETUP.md`.
- **Fonts** — several families are self-hosted under `public/fonts/`
  with their SIL Open Font License files alongside them.
- **qrcode** (npm, MIT license) — generates the ticket QR code entirely
  client-side; no external QR service or API call.
- No paid APIs.

## AI Tools/Features Used

Built almost entirely with **Claude Sonnet 5** via **Claude Code** (an
AI coding agent), with the product requirements document drafted with
**Claude Opus 5.5**. The deployed application itself does not call any
AI model at runtime — AI was used only during development. Full
disclosure, including what the human team did and did not delegate:
**[docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)**.

## Screenshots

All captured from the live deployment — see [`docs/screenshots/`](docs/screenshots/):

| | Desktop | Mobile |
|---|---|---|
| Fest directory | [fest-directory-desktop.png](docs/screenshots/fest-directory-desktop.png) | [fest-directory-mobile.png](docs/screenshots/fest-directory-mobile.png) |
| Event page | [event-page-desktop.png](docs/screenshots/event-page-desktop.png) | [event-page-mobile.png](docs/screenshots/event-page-mobile.png) |
| Registration confirmation | [registration-confirmation.png](docs/screenshots/registration-confirmation.png) | — |
| Organizer dashboard | [organizer-dashboard-desktop.png](docs/screenshots/organizer-dashboard-desktop.png) | — |
| Event participants | [event-participants-desktop.png](docs/screenshots/event-participants-desktop.png) | — |

## Known Limitations

- **No visitor accounts** — registration lookup is by email + ticket
  code, not a password login, by design (see the PRD).
- **Confirmation emails are built but not yet turned on** — the
  confirmation page is the only record a registrant gets right now.
  The code (`supabase/functions/send-registration-email/`) sends the
  ticket code directly (no "click to verify" step) plus a one-page
  "Participant Details" PDF — name, ticket code + QR, event/venue/
  time, school/class, status — attached for use at check-in on the
  day of the event. It's written, wired up, and fails silently when
  not configured, exactly like a real declined send would — it just
  needs a Brevo API key and an Edge Function deploy to go live. See
  [docs/SETUP.md](docs/SETUP.md#fest-hub-registration-confirmation-emails-optional-not-yet-enabled).
- **No dedicated "team registration"** — rather than redesigning the
  core data model around teams (which would ripple through capacity
  counting, the waitlist trigger, and every admin view, right after
  that model was proven correct against a real Postgres engine),
  team-style sign-ups are instead handled through custom per-event
  fields — see "Team Relay Round" in the seed data for a team
  name + 3 teammate fields. Each registration is still one row with
  one email/ticket, which keeps the verified capacity/waitlist logic
  untouched.
- **The real club's existing Olympiad registration page
  (`/intra-olympiad-registration-2027`) was intentionally left as-is**
  rather than migrated onto Fest Hub's generic system. It's a separate,
  already-live page on the real site with its own table
  (`olympiad_registrations`) and real prior sign-ups — rebuilding it
  onto a new system is a product decision with real consequences for
  that flow, not something to fold into a contest deadline.
- **Check-in is lookup-based, not camera-scanning** — the QR code is
  there for a phone's native camera/scanner to decode, but the admin
  participants page itself only has a text search box, not an in-app
  camera scanner; an organizer pastes the decoded ticket code in and
  marks it attended.
- **Free-tier hosting** — the contest deployment runs on Supabase/Vercel
  free tiers; a long-idle Supabase project can pause and need a visit to
  wake it back up.
- **Mock data only** on the contest deployment — see
  `supabase/seed.sql`; the real club database never receives this data
  or the `fests` section toggle.
- **No automated test suite** — verified via manual Playwright-driven
  click-throughs during development (zero console errors across the
  full register → confirm → look-up → admin flow), not CI-enforced
  tests.

## License

MIT — see [LICENSE](LICENSE).

---

**Looking for how the system actually works?** The full schema, every
page/section mapped out, data-flow walkthroughs, and the admin
permissions model live in **[sourceoftruth/](sourceoftruth/)**.
