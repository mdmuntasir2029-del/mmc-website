# Architecture

## Overview

This is a single-page app: **Vite + React 19 + TypeScript** on the
frontend, **Supabase** (Postgres + Auth + Storage) as the entire backend,
and **Vercel** for hosting — it auto-deploys on every push to `main`.
There's no separate API server; the frontend talks to Supabase directly
over its REST/RPC client, with Postgres Row Level Security (RLS) doing
all the authorization.

```
Browser (React SPA)
   │
   ├── supabase-js client ──► Supabase (Postgres + Auth + Storage)
   │                              - RLS policies gate every table
   │                              - SECURITY DEFINER functions (is_admin(),
   │                                is_super_admin(), etc.) expose narrow
   │                                yes/no checks without leaking rows
   │
   └── static build ──► Vercel (auto-deploy on push to main)
```

## Directory layout

```
src/
  pages/            One component per route (Home, About, Awards, ...),
    admin/          plus the whole admin dashboard under pages/admin/.
  components/       Shared, reusable UI pieces (Navbar, Footer, modals,
                     panels used by more than one page).
  context/          React context providers — AuthContext (session/admin
                     state), SiteSectionsContext (which public sections
                     are toggled on), FrdModeContext (the personal FRD
                     design-mode preview toggle).
  hooks/            Small reusable hooks (useSiteSections, useScrollScrub).
  lib/              Framework-agnostic logic: db.ts and auth.ts are the
                     ONLY files that call Supabase directly; types.ts has
                     every shared TS interface; the rest are small pure
                     helpers (validation, constants, read-tracking, etc.).
  styles/           A single global.css using CSS custom properties for
                     theming — see "Theming" below.
supabase/
  schema.sql        Every table, RLS policy, storage bucket, and RPC
                     function, meant to be re-run wholesale in the
                     Supabase SQL editor (no migration runner).
public/              Static assets served as-is (logo, self-hosted fonts).
```

## Data access pattern

Every page/component that needs data imports from `src/lib/db.ts`
(`import * as db from "../lib/db"`) rather than calling `supabase-js`
directly. This keeps exactly one file aware of the Postgres schema, so a
backend change only ever requires editing `db.ts` plus the corresponding
type in `types.ts`. `src/lib/auth.ts` follows the same rule for
sign-in/sign-up/password flows.

## Authorization

- The `admins` / `admin_roles` / `admin_role_assignments` tables have RLS
  enabled with **no** public-readable policies — nothing about admin
  membership is queryable directly through the API.
- All membership/permission checks go through `SECURITY DEFINER` SQL
  functions (`is_admin()`, `is_super_admin()`, `is_email_admin()`, and
  per-permission role checks), called via `supabase.rpc(...)`. These only
  ever return booleans, never the underlying rows.
- The frontend never trusts its own state for enforcement — `RLS` on each
  table is the real gate. Client-side checks (e.g. `RequireAdminSection`)
  only control what's *rendered*, to avoid a confusing UI flash, not what
  the database actually allows.

## Public "site sections" toggle

`SiteSectionsContext` + the `site_sections` table let admins show/hide
whole public sections (Announcements, Awards, Leaderboard, Articles,
Resources, ...) from **Site Sections** in the admin panel without a
deploy. Every public page checks `useSiteSections()` and renders
`SectionUnavailable` if its section is off.

## FRD design mode

`FrdModeContext` provides an alternate, from-scratch visual theme
("FRD mode") toggled on via `data-theme="frd"` on `<html>`. It's
deliberately:

- **Personal, not sitewide** — stored in `localStorage`
  (`mmc_frd_mode`), visible only in the browser that flipped it on. It
  never changes what an ordinary visitor sees.
- **Route-scoped** — the attribute is never applied under `/admin`, so
  the admin dashboard (where the toggle itself lives) always renders in
  the normal light theme regardless of the toggle's state.

Almost the entire re-theme is a single `:root[data-theme="frd"] { ... }`
CSS custom-property remap in `global.css` — component CSS reads the same
`var(--...)` tokens either way. Only Home gets a structurally different
layout in FRD mode (`src/pages/FrdHome.tsx`); every other page keeps its
normal layout and content, just re-colored/re-fonted.

## Hosting / deploys

Vercel builds and deploys automatically on every push to `main`
(`vite build` → static output, see `vercel.json` for routing/rewrite
config). There is no staging environment — `main` is production. Schema
changes are **not** part of the deploy; they have to be run manually
against the live Supabase project's SQL editor (see the root
[README.md](../README.md)).
