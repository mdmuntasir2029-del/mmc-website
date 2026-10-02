# Architecture

## System at a glance

```
┌─────────────────────────────┐
│   Browser (React 19 SPA)    │
│  Vite build, client-side    │
│  routing via react-router   │
└──────────────┬──────────────┘
               │ supabase-js (REST + RPC over HTTPS)
               ▼
┌─────────────────────────────┐
│          Supabase           │
│  Postgres  — every table,   │
│   Row Level Security (RLS)  │
│  Auth      — email/password │
│  Storage   — two buckets    │
└─────────────────────────────┘

               ▲
               │ git push to main
┌──────────────┴──────────────┐
│           Vercel            │
│  Builds `vite build`,       │
│  serves the static output,  │
│  auto-deploys on every push │
└─────────────────────────────┘
```

There is no custom backend server. The React app talks to Supabase
directly from the browser using the public **anon key** — every
authorization decision that matters is enforced by Postgres Row Level
Security policies and `SECURITY DEFINER` functions, never by anything
client-side. Client-side gating (hiding a nav link, a `RequireAdminSection`
wrapper) exists purely to avoid a confusing UI flash; it is never the real
security boundary. See [backend.md](backend.md) for the policies
themselves and [data-flow.md](data-flow.md) for why this split is safe.

## Repository layout

```
src/
  pages/            One component per public route, plus pages/admin/
                     for the whole admin dashboard.
  components/       Shared UI used by more than one page.
  context/          React context providers (auth, site-section
                     visibility, FRD mode).
  hooks/            Small reusable hooks.
  lib/              Framework-agnostic logic — db.ts and auth.ts are the
                     ONLY files that call Supabase directly.
  styles/           A single global.css, themed via CSS custom
                     properties (see frontend.md).
  assets/           Static assets bundled by Vite.
supabase/
  schema.sql        Every table, RLS policy, storage bucket, and RPC —
                     re-run wholesale in the SQL editor, no migration
                     runner.
public/             Static files served as-is (logo, self-hosted fonts).
.github/            CI workflow, issue/PR templates, dependabot.
docs/               Short contributor-facing architecture overview.
sourceoftruth/      This folder — the detailed reference.
```

## Request lifecycle

1. A visitor requests any path on the production domain.
2. Vercel serves the static build. `vercel.json` rewrites every
   non-file path to `/index.html` (SPA fallback), so deep links like
   `/hall-of-fame` or `/admin/awards` work on a hard refresh.
3. `index.html` loads the bundled JS, which boots React at `src/main.tsx`.
4. `main.tsx` wraps the app in, from outside in: `BrowserRouter` →
   `AuthProvider` → `SiteSectionsProvider` → `FrdModeProvider` → `App`.
5. `App.tsx` (see [frontend.md](frontend.md) for the full route table)
   matches the path to a page component and renders it inside `Navbar`/
   `Footer`, plus a few always-mounted globals: `DigitalRain` (background
   canvas), `FrdPreloader`/`FrdRouteBuffer` (FRD mode only), and
   `ReportIssueButton`.
6. The page component fetches whatever data it needs through
   `src/lib/db.ts`, which calls Supabase's REST/RPC endpoints with the
   anon key. Postgres RLS decides what comes back.

## Hosting / deployment

- **Vercel**, auto-deploying on every push to `main`. There is no staging
  environment — `main` is production.
- Build command is the default `npm run build` (`tsc -b && vite build`).
- Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  are set in Vercel's Project Settings and in `.env.local` for local dev
  (see `.env.example`).
- `vercel.json` also sets a one-year immutable `Cache-Control` on
  `/assets/*` and on font/image extensions — safe because Vite
  content-hashes those filenames on every build.
- **Supabase schema changes are not part of the deploy.** `schema.sql`
  has to be re-run manually in the Supabase SQL editor after a pull that
  changes it — see the root [README.md](../README.md).

## Provider / service map

| Concern | Provider | Notes |
|---|---|---|
| Hosting + CI deploy | Vercel | Auto-deploy on push to `main` |
| Database | Supabase (Postgres) | Every table, see [backend.md](backend.md) |
| Auth | Supabase Auth | Email/password only; admin membership is a DB table, not an Auth role |
| File storage | Supabase Storage | Two buckets — `mmc-files` (private, signed URLs) and `mmc-public` (public, permanent URLs) |
| Transactional email | Brevo, via Supabase's custom SMTP setting | Signup confirmation + password reset; see root README's "Brevo email setup" |
| Source control / CI | GitHub + GitHub Actions | `.github/workflows/ci.yml` lints, type-checks, and builds every PR into `main` |

## Key architectural decisions worth knowing before you change things

- **Single source of truth for Supabase access**: `src/lib/db.ts` (data)
  and `src/lib/auth.ts` (auth) are the only files importing
  `supabaseClient`. Every page/component goes through them. If the
  backend ever changes shape, these two files are the only ones that
  need to.
- **RLS is the real gate, always**: client-side admin checks exist only
  to avoid UI flashing the wrong thing. See
  [data-flow.md](data-flow.md#authorization-flow).
- **Two parallel "visibility" systems, not one**: `SectionKey` controls
  what *visitors* see (Site Sections admin page); `AdminSection` controls
  what a given *admin* can reach inside `/admin`. They look similar but
  are enforced completely differently — see
  [feature-map.md](feature-map.md) and [admin-panel.md](admin-panel.md).
- **FRD mode is a personal, non-destructive overlay, not a fork**: a
  second visual design system lives behind a `localStorage`-only toggle
  (`FrdModeContext`), scoped so it never renders under `/admin` and never
  affects any visitor other than whoever flipped it on in their own
  browser. See [frontend.md](frontend.md#frd-mode).
- **No custom backend code, intentionally**: every "server-side" rule
  (who's an admin, what an admin can edit, incrementing a like counter)
  lives in Postgres as RLS policies or `SECURITY DEFINER` functions in
  `schema.sql`, not in a Node/Express layer. There is nothing to deploy
  or scale beyond the static frontend and Supabase itself.
