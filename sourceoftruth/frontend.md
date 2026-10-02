# Frontend Reference

Vite + React 19 + TypeScript, no server-side rendering, no meta-framework
— a plain client-rendered SPA. This document covers the pieces that span
multiple features: providers, hooks, the component inventory, the styling
system, and FRD mode's mechanics. For the route table and what each page
contains, see [feature-map.md](feature-map.md).

## Bootstrapping (`src/main.tsx`)

```tsx
<StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <SiteSectionsProvider>
        <FrdModeProvider>
          <App />
        </FrdModeProvider>
      </SiteSectionsProvider>
    </AuthProvider>
  </BrowserRouter>
</StrictMode>
```

Order matters here only in that `FrdModeProvider` calls `useLocation()`
internally (to know whether the current route is under `/admin`), so it
must be inside `BrowserRouter`. `AuthProvider` and `SiteSectionsProvider`
are independent of each other and of routing.

## Contexts

| Context | File | Provides | Backing store |
|---|---|---|---|
| `AuthContext` | `context/AuthContext.tsx` | `isAdmin`, `isSuperAdmin`, `permissions`, `canAccess(section)`, `email`, `loading`, `signOut()` | Supabase Auth session + `is_admin`/`is_super_admin`/`my_admin_permissions` RPCs |
| `SiteSectionsContext` | `context/SiteSectionsContext.tsx` | `sections: Record<SectionKey, boolean>`, `loaded` | `site_sections` table, cached in `localStorage` (`mmc_site_sections_v1`) — see [data-flow.md](data-flow.md#5-site-sections-visibility-the-caching-trade-off) |
| `FrdModeContext` | `context/FrdModeContext.tsx` | `frdMode: boolean`, `setFrdMode(on)` | `localStorage` only (`mmc_frd_mode`) — never touches Supabase |

Access each via its hook: `useAuth()`, `useSiteSections()` (re-exported
from `hooks/useSiteSections.ts` to keep that import path stable for
existing call sites), `useFrdMode()`.

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useSiteSections()` | `hooks/useSiteSections.ts` | Re-export of the context hook above |
| `useScrollScrub(enabled, disabledValue?)` | `hooks/useScrollScrub.ts` | Drives a 0→1 progress value from scroll position through a `position: sticky` "pinned" region — powers the Home lineup's sine-wave reveal and the Hall of Fame pi-trail. Scroll-driven via sticky positioning, not scroll-event hijacking, so native scroll behavior (momentum, keyboard, a11y) is unaffected. |
| `usePinnedScrollEnabled()` | `hooks/useScrollScrub.ts` | True only when the viewport is wide enough (>900px) and the visitor hasn't requested reduced motion — gates whether the pinned-scroll treatment runs at all, read synchronously on first render to avoid a layout flash |

## `src/lib/` (framework-agnostic logic)

| File | Purpose |
|---|---|
| `supabaseClient.ts` | Creates the single `supabase` client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; exports the two bucket name constants |
| `db.ts` | **Every** Supabase `from()`/`rpc()` call in the app lives here — one `getX`/`addX`/`deleteX` (and occasionally `updateX`) trio per table, plus the admin-permissions RPC wrappers. See [backend.md](backend.md) for what each maps to. |
| `auth.ts` | Sign-in, first-time account claim, sign-out, password reset/update, and the three admin-check RPC wrappers (`checkIsAdmin`, `checkIsSuperAdmin`, `checkEmailIsAdmin`) |
| `types.ts` | Every shared TypeScript interface, plus the `SectionKey`/`AdminSection` enums and their label/default maps |
| `constants.ts` | `CURRENT_SESSION_YEAR` — update each new club session |
| `validation.ts` | Shared form-input validation helpers |
| `awardInitials.ts` | Derives initials-avatar fallback text from a name when `image_path` is unset |
| `announcementReadTracking.ts` | `localStorage`-based per-browser "have I seen this announcement" tracking (`mmc_read_announcements`) — drives the unread glow on the `/announcements` calendar/week views |
| `frdPreloaderGeometry.ts` | Pure math: builds the Float32Array vertex buffers (Fibonacci spiral, damped sine wave, a hand-authored Descartes silhouette, a starfield) consumed by `FrdPreloader.tsx`'s WebGL2 renderer — kept separate from GL boilerplate so the geometry is readable/testable on its own |

## Component inventory

Grouped by what they're for rather than alphabetically:

**Layout / chrome** — `Navbar.tsx`, `Footer.tsx`, `DigitalRain.tsx`
(background canvas, mounted once in `App.tsx`), `Modal.tsx` (generic
modal shell), `ReportIssueButton.tsx` (sitewide floating button).

**Route guards** — `ProtectedAdminRoute.tsx` (redirects signed-out
visitors away from `/admin`), `RequireAdminSection.tsx` (hides an admin
page unless `canAccess(section)`), `RequireSuperAdmin.tsx`.

**Visual effects** — `SineWave.tsx`, `CurvedPiTrail.tsx`,
`RevealOnScroll.tsx`, `ParametricCurveCanvas.tsx` (FRD hero) — all driven
by the scroll-scrub hooks above or plain CSS/SVG animation, no external
animation library in the default theme.

**Content panels (public)** — `AwardsPanel.tsx` + `AwardDetailModal.tsx`,
`AnnouncementsPanel.tsx` + `AnnouncementDetailModal.tsx`,
`LeaderboardSection.tsx`, `TestimonialsPanel.tsx`, `CurrentLineup.tsx`,
`ActivitySlideshow.tsx`, `HeroSlideshow.tsx`, `SectionUnavailable.tsx`
(shown in place of any section whose `SectionKey` is off).

**FRD mode** — `FrdHero.tsx`, `FrdProblemOfTheDay.tsx`,
`FrdCompetitionBento.tsx`, `FrdExecutiveBoard.tsx`, `FrdPreloader.tsx`,
`FrdRouteBuffer.tsx`, `GlobalGoldenBuffer.tsx`. See "FRD mode" below.

**Icons** — `icons.tsx`, a single file exporting every inline SVG icon
component used across the app (no icon library dependency).

## Styling system

Everything lives in one file, `src/styles/global.css`, themed entirely
through CSS custom properties defined once on `:root`:

- **Palette tokens**: `--green-*`, `--cream`, `--white`, `--ink*`,
  `--page-bg`, `--text-on-dark*` — raw colors.
- **Semantic tokens**: `--color-accent*`, `--color-surface`,
  `--color-text*` — what components actually reference. `--color-accent`
  is the one interaction/emphasis color (links, focus states, buttons,
  the cursive "mathematics" word) — if the brand accent ever changes
  again, this is the only place that needs to.
- **Font tokens**: `--font-heading`/`--font-body` (STIX Two Text, serif —
  used for the protected "math-identity" elements like the pi-trail
  digits, which deliberately stay serif since Bebas Neue has no Greek
  coverage), `--font-heading-modern`/`--font-body-modern` (both Barlow,
  unified — see the token comment in `global.css` for why Bebas Neue was
  retired), `--font-cursive` (Dancing Script — the one deliberate
  emphasis face, e.g. "mathematics" on the landing page).
- Fonts are **self-hosted** under `public/fonts/` with their SIL Open
  Font License text alongside each family, not loaded from Google Fonts
  at runtime.

### FRD mode's token remap

`:root[data-theme="frd"] { ... }` redefines the *same* semantic token
names (`--color-accent`, `--white`, `--ink`, etc.) to FRD's own palette
(Obsidian background, Matrix Emerald / Warm Parchment / Electric Cyan
accents) and font stack (Cinzel / Cormorant Garamond / Inter / JetBrains
Mono, also self-hosted). Because most component CSS already reads
`var(--color-accent)` rather than a hardcoded color, this one block
re-themes almost the entire site's existing layout/structure for free.
Only Home, Navbar, and Footer additionally get bespoke FRD-specific
markup/CSS (`FrdHome.tsx` and friends) — every other page just
re-colors/re-fonts in place under the same layout.

**Gotcha to watch for**: a few rules use a token for its *other* common
meaning rather than its semantic name (e.g. `.footer-brand` used
`--white` to mean "literal white text," which broke once `--white` got
remapped to "dark slate surface" under FRD mode). When adding new CSS,
prefer the semantic tokens (`--color-text`, `--color-surface`) over the
raw palette ones (`--white`, `--ink`) specifically so FRD mode's remap
doesn't silently break it later.

## FRD mode

A complete alternate visual design, shipped as a **personal,
`localStorage`-only preview toggle** — never a site-wide setting, never
seen by any visitor other than whoever flipped it on in their own
browser.

- **Toggle**: `FrdModeContext`, flipped from a switch in the admin
  sidebar (`AdminLayout.tsx`). Stored under `localStorage` key
  `mmc_frd_mode`.
- **Route-scoped**: the `data-theme="frd"` attribute is only ever applied
  on `<html>` for non-`/admin` routes — so the admin panel (where the
  toggle itself lives) always renders in the normal light admin theme,
  regardless of the toggle's state. `frdMode` the boolean still reflects
  the stored preference everywhere; only the DOM attribute is gated.
- **Home gets a structurally different page** (`FrdHome.tsx`, swapped in
  by `Home.tsx` via an early return — after all hooks have already run,
  to avoid a rules-of-hooks violation). Every other page keeps its normal
  structure, just re-themed.
- **Pre-loader**: `FrdPreloader.tsx` renders once per **tab session**
  (`sessionStorage` key `mmc_frd_preloader_shown`, not `localStorage` —
  intentionally per-tab, not persisted across browser restarts), only
  when FRD mode is on and the route isn't `/admin`. It's a real WebGL2
  scene (starfield, progressively-revealed Fibonacci spiral and damped
  sine wave, a sliding Descartes line-art sketch), composited through an
  offscreen framebuffer for chromatic aberration + scanlines, with a
  Framer Motion DOM layer on top (quote, fun-fact rotator, progress bar).
  Falls back to the DOM layer alone if `getContext("webgl2")` fails.
- **Buffering overlay**: `GlobalGoldenBuffer.tsx` is a reusable
  golden-ratio spiral spinner over a `backdrop-filter: blur(8px)
  brightness(0.6)` scrim, wired to real async gaps (Problem of the Day's
  and the Competition Bento's initial data fetches, a file-download
  in-flight state, and a brief overlay on FRD-mode route changes via
  `FrdRouteBuffer.tsx`) — not shown for instant/synchronous actions.

See the plan history in git log messages ("FRD mode Stage F1" through
"F8") for the order these were built in, if you need the original
reasoning behind a specific piece.

## Build tooling

- **Vite** (`vite.config.ts`) — `@vitejs/plugin-react`, default config
  otherwise.
- **TypeScript**, project-referenced (`tsconfig.json` →
  `tsconfig.app.json` / `tsconfig.node.json`). `npm run build` runs
  `tsc -b` before `vite build`, so type errors fail the build.
- **oxlint** (`.oxlintrc.json`) — fast Rust-based linter, not ESLint.
  `npm run lint` runs it directly. Configured rules:
  `react/rules-of-hooks` (error), `react/only-export-components` (warn).
- **No test runner is configured.** Verification in this project is
  type-checking + build + manual/Playwright-driven visual checks, not an
  automated test suite — be aware of this when judging "is this safe to
  ship," especially for anything touching RLS-sensitive logic.
