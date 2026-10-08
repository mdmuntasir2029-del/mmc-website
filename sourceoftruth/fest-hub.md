# Fest Hub

Organization → Fest → Event → Registration — built for the 9th DRMC
International Tech Carnival 2026 AI Web Development Contest. Last
verified against the codebase on **2026-10-08** (built in that one
session, on the `contest/fest-hub` branch).

See [docs/SETUP.md](../docs/SETUP.md) for the two-deployment setup and
[docs/JUDGING_GUIDE.md](../docs/JUDGING_GUIDE.md) for the rubric map.
This file is the technical reference — read it before changing the
data model or the registration flow.

## Data model

Three tables, added to `supabase/schema.sql` following the file's
existing conventions exactly (see [backend.md](backend.md)):

| Table | Key columns | RLS |
|---|---|---|
| `fests` | `slug` (unique), `name`, `tagline`, `description`, `cover_path`, `starts_on`, `ends_on`, `venue`, `status` (`draft`/`published`/`archived`) | Standard pattern: public select where `status in ('published','archived')`, `is_admin()` for everything (including drafts) |
| `events` | `fest_id` → fests, `slug` (unique), `name`, `category` (`Competition`/`Workshop`/`Quiz`/`Session`/`Social`), `starts_at`, `ends_at`, `venue`, `eligibility`, `registration_opens_at`, `registration_deadline`, `capacity` (null = unlimited), `waitlist_enabled`, `cover_path`, `status` | Same pattern as `fests` |
| `event_registrations` | `event_id` → events, `ticket_code` (unique), `full_name`, `email`, `phone`, `school`, `class_name`, `status` (`pending`/`confirmed`/`waitlisted`/`cancelled`/`rejected`/`attended`), `checked_in_at`, `admin_note`. Unique on `(event_id, email)` | **No public policy at all** — see below |

Because `fests`/`events` have both a public-select policy (status
check) and an admin `for all` policy, and Postgres combines multiple
permissive policies for the same command with OR, **admins see every
status (including drafts) through the exact same `getFests()`/
`getEvents()` calls the public directory uses** — there's no separate
"admin fetch" function. See [data-flow.md](data-flow.md#1-public-page-read-the-common-case)
for why this works.

## Why `event_registrations` has zero public policies

Every other public-facing table in this app has a `..._public_select`
policy. This one deliberately doesn't — not even for reading. The
reasons:

1. A participant's name/phone/email/school is private; "public select"
   would leak every registrant's data to anyone.
2. The visitor-facing "login" (email + any one ticket code) can't be
   expressed as a row-level policy — it needs to check "does this
   specific ticket code belong to this specific email" as a single
   atomic operation, not a filter a client could bypass by querying
   differently.

So every public interaction goes through one of four `SECURITY DEFINER`
RPCs instead (same "RLS enabled, zero policies, SECURITY DEFINER
mediates everything" pattern as `admins`/`admin_permissions` — see
[backend.md](backend.md#admin--permissions-tables)):

| Function | What it does |
|---|---|
| `register_for_event(event_id, full_name, email, phone, school, class_name)` | Locks the event row (`select ... for update`) so two near-simultaneous registrations can't both take the last seat. Rejects if the event isn't published, registration hasn't opened, the deadline has passed, or the email is already registered (the table's own unique constraint is the final backstop). Returns `confirmed` if under capacity, `waitlisted` if full with a waitlist, or raises an exception if full without one. |
| `get_my_registrations(email, ticket_code)` | Returns **nothing** unless `ticket_code` matches one of that email's own registrations — then returns every registration under that email. This one check is the entire "auth" model for visitors. |
| `cancel_my_registration(ticket_code, email)` | Sets `status = 'cancelled'`, scoped to the matching row only. |
| `get_event_seat_counts()` | Returns `{event_id, taken}` for every event (`confirmed`+`attended` counts) — lets the directory show "N seats left" without any participant data leaking. |

Alongside those four, a trigger function fires on every
`event_registrations` update:

| Trigger | What it does |
|---|---|
| `promote_waitlist()` (via `trg_promote_waitlist`, `after update for each row`) | If a row's status just moved from `confirmed` to `cancelled`/`rejected`, finds the oldest `waitlisted` row for the same event (`order by created_at asc ... for update skip locked`) and bumps it to `confirmed`. `security definer` so it works identically whether the triggering update came from `cancel_my_registration` (runs as the function owner) or a direct admin table write — both paths end up bypassing `event_registrations_admin_all` the same way every other write here does. No notification is sent; the promoted visitor finds out by checking `/my-registrations` (no email infra — see Known gaps). |

Admins read/write `event_registrations` directly (`db.getEventRegistrations`,
`updateRegistrationStatus`, `bulkUpdateRegistrationStatus` in `db.ts`),
gated by a plain `is_admin()` policy — same as `olympiad_registrations`.

## Event status pills — computed live, not stored

`src/lib/festStatus.ts`'s `eventPill()` derives **Open / Closing soon /
Full / Closed / Not yet open** from the event's own
`registration_opens_at`/`registration_deadline`/`capacity` plus the live
seat count, every time it's called — there's no stored status column
for this and no cron job. "Closing soon" is within 24 hours of the
deadline. This is also what gates whether the registration form even
renders (`canRegister()`): Closed/Not-yet-open/Full-without-waitlist all
hide the form entirely rather than letting a visitor submit into a
guaranteed rejection.

## Routes

| Route | Page | Notes |
|---|---|---|
| `/fests` | `FestsDirectory.tsx` | Tabs (Upcoming/Ongoing/Past) + an all-events search/filter bar, filters kept in the URL query string |
| `/fests/:festSlug` | `FestPage.tsx` | Fest banner + its event cards |
| `/events/:eventSlug` | `EventPage.tsx` | Full details, live countdown, capacity bar, the registration form |
| `/registration/:ticketCode` | `RegistrationConfirmation.tsx` | Takes `?email=` in the URL (not just the ticket code) so the page is bookmarkable/refresh-safe without a separate, weaker-auth lookup path — it reuses `get_my_registrations` under the hood |
| `/my-registrations` | `MyRegistrations.tsx` | The visitor "login": email + any one ticket code |
| `/admin/events` | `FestHubDashboard.tsx` | Overview stats + fest/event CRUD, gated by `AdminSection: fests_events` |
| `/admin/events/:eventId/participants` | `EventParticipants.tsx` | Per-event participant management, gated by `AdminSection: event_registrations` |

All gated behind `SectionKey: fests` (default `false` — see
[Two deployments](#two-deployments-one-codebase) below), checked the
same way as every other section via `useSiteSections()` +
`SectionUnavailable`.

## Two deployments, one codebase

See [docs/SETUP.md](../docs/SETUP.md) for the full setup. The short
version: `fests` defaults to hidden, and only the Fest Hub contest
deployment's Supabase project ever gets a `site_sections` row turning it
on (via `supabase/seed.sql`, which must never be run against the real
`manaratmath.club` database). Same repo, same `main` branch, same
`schema.sql` on both — just a different Supabase project (and Vercel
project) per deployment, and only one of them has the `fests` toggle
and the mock data.

## Bonus tier (P1)

All three implemented:

- **QR ticket**: `src/lib/qr.ts` (`qrcode` npm package) encodes just the
  ticket code — not a URL — as a PNG data URL, rendered on
  `RegistrationConfirmation.tsx`. Check-in is lookup-based rather than
  an in-app camera scanner: an organizer decodes it with a phone's
  native camera and pastes the code into `EventParticipants.tsx`'s
  existing search box, then marks the row attended.
- **Automatic waitlist promotion**: see `promote_waitlist()` above.
- **Calendar export**: `src/lib/ics.ts`'s `downloadIcsForEvent()`
  builds a minimal `VCALENDAR`/`VEVENT` client-side (no server
  round-trip) and triggers a `.ics` download — same Blob +
  `createObjectURL` + synthetic-click pattern `EventParticipants.tsx`'s
  CSV export already used, reused rather than reinvented. Wired to a
  button on both `EventPage.tsx` and `RegistrationConfirmation.tsx`.
  `endsAt` is nullable in the data model, so a missing end time falls
  back to a 2-hour block rather than a zero-length calendar entry.

## Known gaps

- **No confirmation email** — the confirmation page (plus the `.ics`
  file and QR code on it) is the only record of a successful
  registration; nothing emails the ticket code, and a promoted
  waitlisted visitor isn't notified either — they'd find out by
  checking `/my-registrations` again.
- **Registration-count scalability**: `getEvents()`/`getFests()` have no
  pagination — fine for a club's scale (dozens of events), would need
  revisiting at real scale.
