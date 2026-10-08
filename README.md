# MMC Fest Hub — Smart Club Operations for Manarat Mathletes Club

Submitted to the **9th DRMC International Tech Carnival 2026 — AI Web
Development Contest** ("Smart Club Operations").

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
- Per-event participant management: search, filter by status/school/
  class, per-row and bulk status changes, CSV export
- Per-event statistics: capacity fill %, status breakdown, sign-ups-
  per-day chart, school breakdown

**Bonus**
- Not implemented this round — see [Known Limitations](#known-limitations).

## Tech Stack

- React 19, TypeScript, Vite, React Router
- Supabase (Postgres, Auth, Storage, Row Level Security)
- Vercel (hosting + auto-deploy)
- No new npm packages were added for this build — see `package.json`
  for exact versions.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Full Supabase project setup, the Fest Hub's separate-deployment setup,
email delivery, and admin management: see **[docs/SETUP.md](docs/SETUP.md)**.

## Deployment URL

*(Fest Hub contest deployment — add the live `*.vercel.app` or custom
subdomain URL here once deployed; see `docs/SETUP.md`.)*

The main club site (unaffected by this feature, which stays hidden
there) is at [manaratmath.club](https://manaratmath.club).

## Demo Credentials

**Organizer login** (for `/admin/events`): `demo-admin@example.com` —
password set at deployment time (see the submission form / repository
owner). Demo-only; granted only the Fest Hub admin sections, not super
admin.

**Visitor lookup** (for `/my-registrations`, no account needed): email
`judge@example.com` with any of these ticket codes —
`MMC-DEMO01` (confirmed), `MMC-DEMO02` (waitlisted), `MMC-DEMO03`
(attended).

See **[docs/JUDGING_GUIDE.md](docs/JUDGING_GUIDE.md)** for a full
rubric-to-feature walkthrough.

## Third-party Services/APIs

- **Supabase** — Postgres database, Auth, Storage, and Row Level
  Security; the entire backend.
- **Vercel** — hosting and CI/CD (auto-deploy on push).
- **Brevo** — transactional email (SMTP) for Supabase Auth's
  confirmation/reset emails; see `docs/SETUP.md`.
- **Fonts** — several families are self-hosted under `public/fonts/`
  with their SIL Open Font License files alongside them.
- No paid APIs, no new npm packages added for the Fest Hub build.

## AI Tools/Features Used

Built almost entirely with **Claude Sonnet 5** via **Claude Code** (an
AI coding agent), with the product requirements document drafted with
**Claude Opus 5.5**. The deployed application itself does not call any
AI model at runtime — AI was used only during development. Full
disclosure, including what the human team did and did not delegate:
**[docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)**.

## Screenshots

*(To be added to `docs/screenshots/` once the contest deployment is
live — desktop and mobile views of the fest directory, an event page,
the registration confirmation, and the organizer dashboard.)*

## Known Limitations

- **No visitor accounts** — registration lookup is by email + ticket
  code, not a password login, by design (see the PRD).
- **No confirmation emails** — the confirmation page is the only
  record; Brevo/SMTP wiring for registration emails wasn't built this
  round (P2 in the project's scheme of work).
- **No bonus tier implemented** — QR ticket/check-in, automatic waitlist
  promotion, and calendar (.ics) export were scoped as bonus work and
  didn't make the cut against the deadline; a complete, tested core was
  prioritized over a partial bonus.
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
