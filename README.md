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
   the `members`, `activity_log`, `resources`, and `forum_posts` tables,
   their row-level security policies, and the private `mmc-files` storage
   bucket used for document/resource uploads. It's safe to re-run.
3. Create the admin account: **Authentication → Users → Add user**, email
   `mdmuntasir.2029@gmail.com`, set a password, and toggle **Auto Confirm
   User** on. This is the only account allowed into `/admin` — enforced by
   the RLS policies in `schema.sql`, not just the frontend.
4. Grab your keys from **Project Settings → API**: the **Project URL** and
   the **anon / public** key (not the service role key — that one should
   never end up in frontend code).
5. Put them in `.env.local` for local dev:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Add the same two variables in Vercel: **Project Settings → Environment
   Variables**, then redeploy so the build picks them up.

If the admin's email ever needs to change, update it in three places:
`ADMIN_EMAIL` in `src/lib/auth.ts`, and the two
`'mdmuntasir.2029@gmail.com'` literals in `supabase/schema.sql` (then
re-run the SQL).

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
- Uploaded files (activity log documents, resources) live in the private
  `mmc-files` Supabase Storage bucket. Download links are short-lived
  signed URLs generated on demand, not public links.
- There's only one privileged account. `src/pages/Access.tsx`'s sign-in
  form checks the email client-side for a friendly error message, but the
  actual enforcement is the RLS policies in `supabase/schema.sql` — even
  with a valid Supabase session, a non-admin email can't read/write any
  club data.
