# Manarat Mathletes Club — Website

React + TypeScript + Vite, backed by Supabase (Postgres + Auth + Storage).

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

## Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates
   the `members`, `activity_log`, `resources`, `forum_posts`, `articles`,
   and `admins` tables, their row-level security policies, and the
   private `mmc-files` storage bucket used for uploads. It's safe to
   re-run any time (e.g. after pulling changes to this file).
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
account. Any stray accounts created while this project's admin auth was
being built/tested — before the is_email_admin() pre-check existed —
are harmless but can be cleaned up manually under **Authentication →
Users** if you want the list tidy.)
(this doesn't delete their Supabase Auth account, just their access —
their old password stops meaning anything for this site either way).

The `admins` table has RLS enabled with no policies on it at all, so it
isn't readable through the API by anyone — not even signed-in admins.
Membership checks go through a `is_admin()` SQL function (SECURITY
DEFINER, see `schema.sql`) that the frontend calls via
`supabase.rpc('is_admin')`; it only ever returns true/false, never the
list itself.

## Brick Sans font

The Register button is styled for a font named "Brick Sans"
(`src/styles/global.css`, `--font-brick`), which falls back to Baloo 2
since Brick Sans isn't available via Google Fonts. If you have a licensed
copy of the real font, drop `BrickSans.woff2` into `public/fonts/` and it
will be picked up automatically via the existing `@font-face` rule.

## Architecture notes

- `src/lib/db.ts` and `src/lib/auth.ts` are the only files that talk to
  Supabase — every page/component calls through them, so if the backend
  ever changes again, this is still the only place that needs to.
- Uploaded files (activity log documents, resources, article attachments)
  live in the private `mmc-files` Supabase Storage bucket. Download links
  are short-lived signed URLs generated on demand, not public links —
  except files under the `articles/` folder, which have a storage policy
  allowing public read, since Articles is a public-facing section.
- Articles (`/articles`) are the one piece of club data that's publicly
  readable — anyone can view/download published articles, but only
  admins can publish, edit, or remove them (see the `articles_*` policies
  in `schema.sql`).
- `src/pages/Access.tsx`'s sign-in form doesn't pre-check who's allowed
  in — it attempts a real sign-in, then calls `is_admin()`; if that comes
  back false it immediately signs the session back out. The actual
  enforcement is always the RLS policies, never anything client-side.
- Forgot password: "Forgot your password?" on `/signin` calls
  `supabase.auth.resetPasswordForEmail()`, which emails a recovery link
  pointing at `/reset-password` (`src/pages/ResetPassword.tsx`). That
  page waits for Supabase's `PASSWORD_RECOVERY` auth event (or an
  already-active session, as a fallback for the case where that event
  fires before the page finishes mounting) before showing the "choose a
  new password" form, so it can't be used without a valid link. Passwords
  set this way go through `supabase.auth.updateUser()`, which — unlike
  the first-time `claimAccount()` — does update an existing password.
