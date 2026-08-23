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
3. Turn off email confirmation so a new admin's self-serve password setup
   (below) works immediately: **Authentication → Providers → Email →**
   toggle **Confirm email** off.
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

## Adding another admin

Admin access is controlled entirely by the `admins` table in Supabase —
nothing in the code needs to change, and there's no separate step to
create their Supabase Auth account.

1. In the SQL Editor, run:
   ```sql
   insert into admins (email) values ('newadmin@example.com');
   ```
2. Tell them to go to `/signin` and click **"First time signing in with
   this email? Set your password"** — they choose their own password
   right there and are signed in immediately.

That self-serve setup is really `supabase.auth.signUp()` under the hood,
which Supabase refuses to run a second time for the same email once it
already has a password — so this only ever works once per address, not
as a way to reset an existing one (that still requires the dashboard;
see the note in `src/pages/Access.tsx`). It only grants access at all if
the email is already in `admins` — anyone can technically create an
unprivileged Supabase Auth account with any email through this form (the
same as Supabase's own public signup would allow), but `is_admin()` gates
every table and storage bucket, so that account gets nothing without
also being listed in `admins`.

⚠️ Because email confirmation is off, there's a narrow window between
adding an email to `admins` and that person actually claiming it where
someone else who knows/guesses that address could claim it first. Tell
new admins to set their password right after you add them to close that
window quickly, or re-enable **Confirm email** if you'd rather trade the
one-click setup for that protection.

To remove an admin: `delete from admins where email = 'old@example.com';`

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
