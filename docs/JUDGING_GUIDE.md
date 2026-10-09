# Judging Guide

Everything the rubric asks for, mapped to exactly where to look — for
the 9th DRMC International Tech Carnival 2026, AI Web Development
Contest ("Smart Club Operations").

**Demo admin:** `demo-admin@manaratmath.club` / `FestHub2026!Judge`.
Grants: Fests & Events, Event Participants (not super admin).

**Judge visitor login (no account needed):** email `judge@example.com`
+ any of these ticket codes — `MMC-DEMO01` (confirmed), `MMC-DEMO02`
(waitlisted), `MMC-DEMO03` (attended). Use at `/my-registrations`.

## 5-minute walkthrough

1. Open `/fests` — see the three seeded fests split across
   Upcoming/Ongoing/Past tabs (A1).
2. Click **MMC Math Carnival 2026** → its event cards show category,
   date, venue, deadline, seats left, and a live status pill (A2).
3. Back on `/fests`, type "quiz" into **Search every event** — it
   matches across every fest at once (A3); add a category chip or
   "open only" and notice the URL gains a `?q=...&category=...`query
   string you can copy/reload (A4).
4. Open any **Open** event → full details, a live deadline countdown,
   a capacity bar, and the registration form (A5). Click **Add to
   calendar** — downloads a working `.ics` file (D4). Try it on a
   phone-width browser window — no horizontal scroll (A6).
5. Register with a real-looking email → lands on
   `/registration/:ticketCode` with your ticket code, a scannable QR
   code of it (D1), and its own **Add to calendar** button (B1–B3,
   D4). Try registering the same email twice — rejected with a clear
   message (B2/B6).
6. Open the **Robotics Challenge** event (seeded full, waitlist off) —
   registration is refused with a "Full" pill, no form shown (B4). Then
   open **Gaming Tournament** (seeded full, waitlist on) and register —
   you land on the confirmation page with a **waitlisted** status pill
   instead of being refused.
7. Go to `/my-registrations`, enter `judge@example.com` +
   `MMC-DEMO01` — see all three judge registrations with different
   statuses; cancel one and see its seat free up (B5). To see
   auto-promotion specifically: open Gaming Tournament's participants
   page as the demo admin (next step), cancel any one **confirmed**
   registration, and reload the list — the longest-waiting waitlisted
   row is now confirmed, with no admin action beyond the cancellation
   itself (D3).
8. Sign in as the demo admin → `/admin/events`: overview stats, fest/
   event CRUD, publish/archive (C1).
9. Click **Participants** on any seeded event →
   `/admin/events/:id/participants`: search, filter by status/school,
   per-row status change, bulk actions, the sign-ups-per-day chart and
   school breakdown, CSV export (C2–C5). Paste a ticket code into the
   search box and set its status to "attended" to simulate a door
   check-in (D2). Try it at a narrower browser width — the table
   scrolls inside its own box instead of the page (C6).

## Rubric map

### A. Fest Directory — 30 pts

| ID | Requirement | Where |
|---|---|---|
| A1 | Display available/upcoming fests | `/fests` — `src/pages/FestsDirectory.tsx` |
| A2 | Event cards with useful info | `/fests/:festSlug` — `src/pages/FestPage.tsx` |
| A3 | Search events | `/fests` search bar — `FestsDirectory.tsx` |
| A4 | Categories and filter | `/fests` filter chips, URL query string — `FestsDirectory.tsx` |
| A5 | Event details page | `/events/:eventSlug` — `src/pages/EventPage.tsx` |
| A6 | General UX/responsiveness | All of the above; see the Responsiveness section below |

### B. Registration System — 30 pts

| ID | Requirement | Where |
|---|---|---|
| B1 | Users can register | `/events/:eventSlug` form → `registerForEvent` (`src/lib/db.ts`) → `register_for_event()` RPC (`supabase/schema.sql`) |
| B2 | Form works correctly | `EventPage.tsx`, reuses `src/lib/validation.ts` |
| B3 | Confirmation | `/registration/:ticketCode` — `src/pages/RegistrationConfirmation.tsx` |
| B4 | Limits/deadlines work | Enforced inside `register_for_event()` (locks the event row, checks window/deadline/capacity/waitlist) and reflected via `src/lib/festStatus.ts`'s live status pill |
| B5 | View/manage own registration | `/my-registrations` — `src/pages/MyRegistrations.tsx` |
| B6 | General functionality | Double-submit guarded by a `submitting` state; errors are caught and shown inline, never thrown to the console |

### C. Organizer Management — 30 pts

| ID | Requirement | Where |
|---|---|---|
| C1 | Organizer dashboard | `/admin/events` — `src/pages/admin/FestHubDashboard.tsx` |
| C2 | View participants | `/admin/events/:eventId/participants` — `src/pages/admin/EventParticipants.tsx` |
| C3 | Search/filter participants | Same page — search box + status/school filters |
| C4 | Manage status | Same page — per-row dropdown + bulk select/apply |
| C5 | Statistics/tools | Same page — stat cards, sign-ups-per-day chart, school breakdown, CSV export |
| C6 | Tool responsiveness | `.table-wrap` scrolls tables inside their own container; forms stack to one column under 768px |

### D. Bonus — up to 30 pts

| ID | Requirement | Where |
|---|---|---|
| D1 | QR ticket | Registration confirmation page renders a scannable QR code of the ticket code — `src/lib/qr.ts` (`qrcode` package), `RegistrationConfirmation.tsx` |
| D2 | Check-in flow | Organizer looks up a ticket code in the participants search box (same box as C3) and sets its status to "attended" via the status dropdown — no separate camera-scanning UI was built; the QR code is there for a phone's native scanner to decode, then typed/pasted in |
| D3 | Automatic waitlist promotion | `promote_waitlist()` trigger on `event_registrations` (`supabase/schema.sql`) — fires on any confirmed→cancelled/rejected transition, whether via a visitor cancelling or an organizer changing status, and bumps the longest-waiting waitlisted registration to confirmed |
| D4 | Calendar export | "Add to calendar" button on both the event page and the confirmation page, downloads a `.ics` file — `src/lib/ics.ts` |

Also implemented, beyond the rubric's own D1–D4: a confirmation email
(Brevo, via `supabase/functions/send-registration-email/`) sent on
every successful registration, with a one-page "Participant Details"
PDF attached (name, ticket code, QR code, event/venue/time, school/
class, status) for use at check-in.

## Responsiveness

Every new page above was checked in-browser at 360px (phone), 768px
(tablet), and 1280px (desktop): no horizontal page scroll, admin tables
scroll inside `.table-wrap` instead of the page, and forms stack to a
single column under the relevant breakpoints in `src/styles/global.css`.
