# Fest Hub — Organizer Feature Guide

> **Two separate deployments live in this one repo.** Don't confuse them:
>
> | | Main website | Fest Hub (contest only) |
> |---|---|---|
> | **Link** | [manaratmath.club](https://manaratmath.club) | [mmc-website-fest.vercel.app](https://mmc-website-fest.vercel.app) |
> | **What it is** | The real, permanent Manarat Mathletes Club site | A separate sandbox built for the DRMC AI Web Development Contest judging — its own Supabase project, its own Vercel project, mock data |
> | **Fest Hub visible?** | No — hidden by default, even though the code is in `main` (see [sourceoftruth/fest-hub.md](../sourceoftruth/fest-hub.md)) | Yes — this is the deployment this guide is actually about |
>
> Everything below describes the **Fest Hub** admin experience. If you're looking for the real club site's existing admin panel (Session Photos, Announcements, Hall of Fame, etc.), this guide isn't it — see the root [README.md](../README.md) instead.

Fest Hub replaces Google Forms: organizers create fests and events here, and students browse, register, and manage their own sign-ups — no spreadsheet copy-pasting required.

This guide covers everything an organizer does day to day: setting up a fest, adding events, managing who's registered, and checking people in on the day.

## Getting in

1. Go to `/signin` on the Fest Hub deployment above.
2. If this is your first time, click **"First time signing in with this email? Set your password"** — this only works if your email has already been added as an admin by the club's super admin.
3. Already have a password? Sign in normally.
4. Once in, look for **Fest Hub** in the admin sidebar and click **Fests & Events**.

You'll only see sections you've been granted — if Fest Hub isn't in your sidebar, ask the super admin to grant you access.

## Creating a Fest

A **Fest** is the umbrella a group of events sits under — e.g. "MMC Math Carnival 2026." Events can't exist without one.

From **Fests & Events**, use the **Add a fest** form:

| Field | Notes |
| --- | --- |
| Name | Required |
| URL slug | Auto-generated from the name if left blank |
| Tagline / Description | Optional, shown on the public fest page |
| Starts on / Ends on | Required — these drive the Upcoming/Ongoing/Past tabs visitors see |
| Venue | Optional |
| Status | **Draft** (hidden from visitors), **Published** (live on `/fests`), or **Archived** (shown under "Past") |
| Cover image | Optional |

Edit or delete a fest anytime from the table below the form. **Deleting a fest deletes every event and registration under it — there's no undo.**

## Creating an Event

An **Event** is the actual thing students register for — a contest, workshop, quiz, session, or social, always under a Fest.

Key fields in **Add an event**:

| Field | Notes |
| --- | --- |
| Fest, Category | Required |
| Name, URL slug | Slug auto-generates from the name |
| Summary | Short line shown on event cards |
| Description | Full details, shown on the event page |
| Starts at | Required |
| Registration opens / deadline | Registration is only possible inside this window — enforced automatically, not just a suggestion |
| Capacity | Leave blank for unlimited |
| Waitlist | If on, extra sign-ups after capacity go to a waitlist instead of being turned away |
| Status | Draft / Published / Archived, same meaning as for fests |

### Custom registration fields

Add extra questions to an event's registration form — a team name, dietary needs, anything. Each field is short text, a paragraph, or a dropdown, and can be marked required.

**This is also how team registration works** — there's no separate "team" feature. Add a "Team Name" field plus one field per teammate (see the seeded "Team Relay Round" event for an example), and the registrant fills them in alongside their own details.

## Managing registrations

Click **Participants** on any event to open its registration list. You get:

- **Stats at a glance** — total registrations, seats filled (with %), waitlisted count, checked-in count.
- **A sign-ups-per-day chart** and a **school breakdown** — useful for spotting which schools are turning out.
- **Search** by name, email, phone, or ticket code.
- **Filters** by status and school.
- **Per-row status changes** — a dropdown on each registration: pending, confirmed, waitlisted, cancelled, rejected, attended.
- **Bulk actions** — select multiple rows, then confirm, reject, or mark attended all at once.
- **CSV export** — downloads everything currently filtered/searched, including any custom field answers.
- **Details** — if the event has custom fields, click to expand a row's answers (team name, teammates, etc.).

## Checking people in on the day

Every registrant's confirmation email includes a QR code and a PDF "ticket" with their details. There's no dedicated scanner app — check-in is lookup-based:

1. Decode the registrant's QR code with any phone camera (or just ask for their ticket code — it's printed as plain text too).
2. Paste or type that code into the **Participants** search box for that event.
3. Find their row and set status to **Attended**.

That's it — their row now shows as checked in, and it's reflected immediately in the stats at the top of the page.

## What visitors see

Worth knowing the full picture, since it shapes what you'll be asked about:

- Browse and search every fest and event at `/fests`, filterable by category or "open for registration only."
- Register on an event's page — full name, email, phone, school, and class are required, plus any custom fields you've added.
- Capacity and deadlines are enforced automatically — a full event with waitlisting on moves them to the waitlist instead; a full event without it, or one past its deadline, won't show a registration form at all.
- They land on a confirmation page with their ticket code and QR code, and get an email with the same plus the PDF ticket attached.
- They can look themselves up anytime at `/my-registrations` with their email and any one ticket code — no account or password needed — and cancel from there if plans change.
- Cancelling automatically promotes the longest-waiting person on the waitlist to confirmed — no action needed from you.

## Good to know

- **Draft means invisible, not deleted.** A draft fest or event never shows to visitors, but you can still see and edit it in the admin panel — it's the right way to prep something before announcing it.
- **School and Class are required** on every registration — there's no way around this for visitors.
- **The waitlist manages itself.** When a confirmed registrant cancels, the next person in line is promoted automatically — you'll never need to manually move someone off a waitlist for this reason.
- **"Add to calendar"** on the event page and confirmation page lets visitors download a `.ics` file for their own calendar app.
- **Deleting is permanent** for fests, events, and registrations alike — there's no recovery.
- Confirmation emails (with the PDF ticket) depend on the email system being configured — if registrants say they never received one, that's worth checking first before assuming it's a user error.
