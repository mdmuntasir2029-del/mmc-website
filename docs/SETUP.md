# Setup

Local development, Supabase project setup, email delivery, and admin
management — moved here from the root README to keep that file short.
See [sourceoftruth/](../sourceoftruth/) for how the system is put
together once it's running.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

## Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   [`supabase/schema.sql`](../supabase/schema.sql), and run it. This
   creates every table (including `fests`/`events`/`event_registrations`
   for the Fest Hub), their row-level security policies, the private
   `mmc-files` storage bucket for admin uploads, and the public
   `mmc-public` bucket for images that need permanent URLs. It's safe to
   re-run any time — **re-run it after pulling changes to this file** to
   pick up new tables.
3. Set up Brevo as the SMTP provider so Supabase's confirmation and
   password-reset emails actually deliver reliably (Supabase's own
   default mailer is low-volume and rate-limited) — see **Brevo email
   setup** below. Do this before adding real admins.
4. `schema.sql` already seeds `mdmuntasir.2029@gmail.com` into the
   `admins` table — that email just needs to set its password once via
   the "First time signing in?" link on `/signin` (see below).
5. Grab your keys from **Project Settings → API**: the **Project URL** and
   the **anon / public** key (not the service role key — that one should
   never end up in frontend code).
6. Put them in `.env.local` for local dev:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
7. Add the same two variables in Vercel: **Project Settings → Environment
   Variables**, then redeploy so the build picks them up.

## Fest Hub: mock data + a second, separate deployment

The Fest/Event/Registration system (`/fests`, `/events/:slug`,
`/admin/events`, ...) is built so the **same codebase** can run two
ways, decided entirely by which Supabase project it's pointed at and
whether that project's `site_sections` table has a `('fests', true)`
row (see `SECTION_DEFAULT_VISIBLE.fests` in `src/lib/types.ts` — it
defaults to `false`, so a database that's never seen `seed.sql` keeps
the whole feature hidden):

1. **The real club site** (`manaratmath.club`) — run `schema.sql` on it
   (idempotent, just adds the new empty tables) but **never** run
   `seed.sql` against it. Fest pages and the "Events" nav link stay
   hidden.
2. **The Fest Hub contest deployment** — its own, separate Supabase
   project and its own Vercel project (same repo, same branch), so
   judges get a sandbox with a demo admin login and mock data that never
   touches real students' data:
   1. Create a new Supabase project.
   2. Run `schema.sql`, then `supabase/seed.sql` (~3 fests, 9 events
      covering every registration state, ~220 fictional registrations,
      and three judge demo tickets under `judge@example.com`).
   3. Create a demo admin (note: Supabase rejects `@example.com` as an
      invalid domain on signup, so use a real domain you control —
      this project uses `manaratmath.club`):
      ```sql
      insert into admins (email) values ('demo-admin@manaratmath.club');
      ```
      Have it set its password via `/signin`'s first-time flow, then
      from `/admin/roles` grant it **only** `Fests & Events` and
      `Event Participants` — not super admin.

      **If sign-in fails with "Email not confirmed"**: some Supabase
      projects now default **Confirm email** to *on* even without Brevo
      set up (this doc originally assumed the opposite default). Either
      turn it off at **Authentication → Providers → Email → Confirm
      email**, or confirm the account directly via SQL instead of
      setting up real mail delivery just for a demo account:
      ```sql
      update auth.users set email_confirmed_at = now()
      where email = 'demo-admin@manaratmath.club';
      ```
   4. New Vercel project, same GitHub repo, same branch, pointed at
      this Supabase project's URL/anon key via its own env vars.
   5. Take a database backup after seeding, in case a judge deletes
      data mid-evaluation — `seed.sql` is safely re-runnable (it
      upserts fests/events and skips registrations that already exist)
      if you need to restore.

If the club ever wants fest registration live on the real site, it's a
one-switch change: turn `fests` on from **Admin → Site Sections** on the
real database.

## Fest Hub: registration confirmation emails (optional, not yet enabled)

Registrants currently only get the on-screen confirmation page (with
their QR ticket) — no email. Code for this is in
`supabase/functions/send-registration-email/` and already wired up to
call fire-and-forget from `EventPage.tsx` right after a successful
registration, but it's inert until deployed with real secrets (a
missing deployment just fails silently, same as a declined/invalid
email provider would — it never blocks the registration itself).

The email states the ticket code directly — no "click to verify" or
confirmation-code step — and attaches a one-page "Participant Details"
PDF (`ticket-pdf.ts`, built with `pdf-lib`): name, ticket code, a QR
code of it, event name/date/venue, school/class if given, and status,
laid out in a bordered panel sized to whatever content it actually has
(long names/event titles wrap instead of overflowing). Meant to be
printed or shown on a phone at check-in.

To turn it on:

1. [Install the Supabase CLI](https://supabase.com/docs/guides/cli) if
   you haven't, and `supabase login`.
2. In [Brevo](https://www.brevo.com), **SMTP & API → API Keys →
   Generate a new API key** (this is a *different* key from the SMTP
   key used for admin sign-in emails above). Also make sure a sender
   address is verified under **Senders**.
3. Deploy the function and set its secrets:
   ```bash
   supabase functions deploy send-registration-email --project-ref <your-project-ref>
   supabase secrets set \
     BREVO_API_KEY=your-brevo-api-key \
     SENDER_EMAIL=your-verified-sender@example.com \
     SENDER_NAME="Manarat Mathletes Club" \
     --project-ref <your-project-ref>
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected
   automatically by the platform for every Edge Function — you don't
   set those yourself.
4. That's it — no code or database change needed. The next successful
   registration will trigger a real email.

## Brevo email setup

Supabase Auth sends its own emails (signup confirmation, password reset)
through whatever mailer is configured — by default that's Supabase's own
low-volume sender, which is rate-limited and can land in spam. Routing
it through Brevo instead is a one-time dashboard setting, no code:

1. In [Brevo](https://www.brevo.com), go to **SMTP & API → SMTP** to get
   your SMTP login (your Brevo account email) and **generate an SMTP
   key** (this is different from Brevo's API key — it's the one used
   here). Also verify a sender address/domain under **Senders** — Brevo
   won't relay mail from an unverified sender.
2. In Supabase Dashboard → **Project Settings → Authentication → SMTP
   Settings**, enable **Custom SMTP** and fill in:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: your Brevo account email
   - Password: the SMTP key from step 1 (not your Brevo login password)
   - Sender email / name: your verified sender
3. Save. From then on, every Supabase Auth email goes through Brevo.
4. Now that delivery is reliable, turn **Confirm email** on:
   **Authentication → Providers → Email → Confirm email**. This closes a
   real gap — with it off, someone who knows or guesses a listed admin's
   email could claim that account before the real person does (see the
   note in `src/lib/auth.ts`'s `claimAccount`); with it on, the account
   isn't usable until a confirmation link reaches the actual inbox. The
   self-serve setup flow and the sign-in form both already adapt to
   whichever setting is active — no code changes needed either way.

## Adding another admin

Admin access is controlled entirely by the `admins` table in Supabase —
nothing in the code needs to change, and there's no separate step to
create their Supabase Auth account.

1. In the SQL Editor, run:
   ```sql
   insert into admins (email) values ('newadmin@example.com');
   ```
2. Tell them to go to `/signin` and click **"First time signing in with
   this email? Set your password"**. With Brevo + Confirm email set up
   as above, they'll get a confirmation email to click before the
   account is usable; without it, they're signed in immediately.
3. Grant them whichever admin sections they need from `/admin/roles`
   (super-admin only) — a brand-new admin starts with zero sections
   granted beyond the Dashboard.

That self-serve setup is really `supabase.auth.signUp()` under the hood,
which Supabase refuses to run a second time for the same email once it
already has a password — so this only ever works once per address, not
as a way to reset an existing one. Before calling it, the sign-in form
first checks the email against `admins` via `is_email_admin()` (another
SECURITY DEFINER function, returns true/false for one specific email
without exposing the list) and refuses outright if it isn't listed —
so a non-admin email gets an immediate "hasn't been added as an admin"
message and no Supabase Auth account is created for it at all.

To remove an admin: `delete from admins where email = 'old@example.com';`
(this only revokes access — it doesn't delete their Supabase Auth
account; any stray accounts can be cleaned up manually under
**Authentication → Users** if you want the list tidy).

The `admins` table has RLS enabled with no policies on it at all, so it
isn't readable through the API by anyone — not even signed-in admins.
Membership checks go through an `is_admin()` SQL function (SECURITY
DEFINER, see `schema.sql`) that the frontend calls via
`supabase.rpc('is_admin')`; it only ever returns true/false, never the
list itself.

## Architecture notes

See [sourceoftruth/](../sourceoftruth/) for the full depth — this is
just the essentials:

- `src/lib/db.ts` and `src/lib/auth.ts` are the only files that talk to
  Supabase — every page/component calls through them.
- Uploaded files (activity log documents, resources, article
  attachments, Fest/Event covers, competition archive papers) live in
  either the private `mmc-files` bucket (signed URLs, generated on
  demand) or the public `mmc-public` bucket (permanent URLs, for things
  like photos and cover images), depending on the feature — see
  `sourceoftruth/backend.md`.
- `src/pages/Access.tsx`'s sign-in form doesn't pre-check who's allowed
  in — it attempts a real sign-in, then calls `is_admin()`; if that comes
  back false it immediately signs the session back out. The actual
  enforcement is always the RLS policies, never anything client-side.
- Forgot password: "Forgot your password?" on `/signin` calls
  `supabase.auth.resetPasswordForEmail()`, which emails a recovery link
  pointing at `/reset-password`.
- The Fest Hub's visitor-facing "login" is email + any one ticket code
  (no passwords/accounts) — see `sourceoftruth/data-flow.md`.
