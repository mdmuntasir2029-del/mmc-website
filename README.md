# Manarat Mathletes Club — Website

React + TypeScript + Vite. Data layer currently runs on browser
localStorage as a working prototype (see `src/lib/`) so it can be swapped
for Supabase later without touching the pages/components.

## Run locally

```bash
npm install
npm run dev
```

## Admin access

Sign in at `/signin` with `mdmuntasir.2029@gmail.com`. The first sign-in
lets you set a password (stored locally, hashed with SHA-256) — there is
no separate signup step for the admin account.

## Brick Sans font

The Register button is styled for a font named "Brick Sans"
(`src/styles/global.css`, `--font-brick`), which falls back to Baloo 2
since Brick Sans isn't a font available via Google Fonts. If you have a
licensed copy of the real font, drop `BrickSans.woff2` into
`public/fonts/` and it will be picked up automatically via the existing
`@font-face` rule.

## Known limits of the current prototype

- All data (members, activity log, resources, forum posts, admin
  credentials) lives in `localStorage` on one browser/device — nothing
  syncs across devices yet.
- Uploaded files are stored as base64 data URLs, which is fine for a few
  small files but not for many/large ones — localStorage has a ~5–10MB
  ceiling per origin.
- Sign-in only exists for the single admin account; general
  member accounts are not implemented yet.

These are exactly the pieces meant to move to Supabase (data + file
storage) and Brevo (email auth) next — `src/lib/db.ts` and
`src/lib/auth.ts` are the only files that need to change.
