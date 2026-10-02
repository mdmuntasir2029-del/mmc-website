# Feature Map

Every public page/section and every admin page, cross-referenced with its
route, its visibility key (if any), the component(s) that render it, and
the table(s) it reads or writes. Use this as the index when you need to
find "where does X live" or "what does toggling Y actually affect."

## Public routes

| Route | Page component | Notes |
|---|---|---|
| `/` | `pages/Home.tsx` (or `pages/FrdHome.tsx` in FRD mode) | See "Home page sections" below |
| `/about` | `pages/About.tsx` | See "About page sections" below |
| `/awards` | `pages/Awards.tsx` → `components/AwardsPanel.tsx` | Gated by `SectionKey: awards` |
| `/articles` | redirects to `/club-publications/articles` | Legacy URL kept working |
| `/club-publications` | `pages/ClubPublications.tsx` (layout + tabs) | Nav link shows if `articles` OR `resources` is visible |
| `/club-publications/articles` | `pages/Articles.tsx` | Gated by `SectionKey: articles` |
| `/club-publications/resources` | `pages/ClubResources.tsx` | Gated by `SectionKey: resources` |
| `/announcements` | `pages/AnnouncementsPage.tsx` | Gated by `SectionKey: announcements`; calendar + week views |
| `/leaderboard` | `pages/Leaderboard.tsx` → `components/LeaderboardSection.tsx` | Gated by `SectionKey: leaderboard` |
| `/hall-of-fame` | `pages/HallOfFame.tsx` | Gated by `SectionKey: hall_of_fame` |
| `/signin` | `pages/Access.tsx` | Sign-in + first-time admin account setup + "forgot password" |
| `/reset-password` | `pages/ResetPassword.tsx` | Landing page for the password-recovery email link |
| `/intra-olympiad-registration-2027` | `pages/OlympiadRegister.tsx` | Not linked anywhere in the UI, reachable only by exact URL |
| `/admin/*` | `pages/admin/*` | See "Admin pages" below |

## Home page (`/`) sections

| Section | `SectionKey` | Component | Backing table(s) |
|---|---|---|---|
| Hero text + CTAs | — (always shown) | inline in `Home.tsx` | — |
| Hero photo carousel | `session_photos` | `components/HeroSlideshow.tsx` | `session_photos` |
| "How We Meet & Compete" (sine-wave card lineup) | `lineup` | inline in `Home.tsx` + `components/SineWave.tsx` | — (static `HIGHLIGHTS` copy) |
| Announcements teaser (6 latest, links to `/announcements`) | `announcements` | `components/AnnouncementsPanel.tsx` + `components/AnnouncementDetailModal.tsx` | `announcements`, `announcement_comments` |
| "Read some of our articles" link | `articles` | inline in `Home.tsx` | — (just a link) |

The hero's "See Upcoming Events" button is always rendered when
`announcements` is visible — it's an in-page anchor to the announcements
teaser section, not a separate toggle.

## About page (`/about`) sections

| Section | `SectionKey` | Component | Backing table(s) |
|---|---|---|---|
| Intro + quick-facts grid | — (part of `about`) | inline in `About.tsx` | — (static copy) |
| Activity Slideshow | `activity_slideshow` | `components/ActivitySlideshow.tsx` | `activity_slideshow_photos` |
| Current Year Lineup | `current_lineup` | `components/CurrentLineup.tsx` | `hall_of_fame_entries` filtered by `CURRENT_SESSION_YEAR` (`src/lib/constants.ts`) |
| Testimonials | `testimonials` | `components/TestimonialsPanel.tsx` | `testimonials` |

The whole `/about` route itself is also gated by `SectionKey: about` —
turning that off hides the page and its nav/footer link entirely,
independent of the four sub-toggles above.

## Announcements (`/announcements`) in detail

- Default view: a month **calendar** — click a date to see that day's
  announcement(s); days with any unread announcement glow.
- Alternate view: a **week-by-week vertical list**, same unread-glow rule.
- "Unread" is tracked client-side only, per browser, via
  `src/lib/announcementReadTracking.ts` (`localStorage` key
  `mmc_read_announcements`) — there's no visitor-account system, so this
  is intentionally per-device, not server-tracked.
- Clicking any announcement (here, on the Home teaser, or from the
  calendar/week view) opens `components/AnnouncementDetailModal.tsx` —
  image left, description right, a thumbs-up like counter
  (`increment_announcement_likes` RPC, soft-debounced per-browser via
  `localStorage`), and an open comment thread (`announcement_comments`,
  no visitor accounts — just a display name).

## Hall of Fame (`/hall-of-fame`) in detail

- Full roster across all session years, from `hall_of_fame_entries`.
- Shares its backing table with the About page's "Current Year Lineup"
  (same table, different filter) and with the FRD mode Executive Board
  module (same table again, filtered to the current year, cross-referenced
  against `awards` by name).

## FRD mode (personal preview, not a `SectionKey`)

FRD mode is a from-scratch alternate visual design, toggled per-browser
from the admin sidebar (`FrdModeContext`, `localStorage` key
`mmc_frd_mode`) — it is **not** part of the `SectionKey` system and
affects nothing for any other visitor. See
[frontend.md](frontend.md#frd-mode) for how the toggle itself works.

| Module | Component | Backing table(s) |
|---|---|---|
| Hero + interactive parametric curve | `components/FrdHero.tsx`, `components/ParametricCurveCanvas.tsx` | — |
| Problem of the Day terminal (KaTeX) | `components/FrdProblemOfTheDay.tsx` | `problem_of_the_day` |
| Competition Archive & Leaderboard bento | `components/FrdCompetitionBento.tsx` | `upcoming_competitions`, `competition_archive`, `leaderboards`/`leaderboard_entries` (reused, not duplicated) |
| Executive Board | `components/FrdExecutiveBoard.tsx` | `hall_of_fame_entries` (current year) + `awards` (cross-referenced by name) |
| WebGL immersive pre-loader | `components/FrdPreloader.tsx`, geometry in `src/lib/frdPreloaderGeometry.ts` | — |
| Golden-ratio buffering overlay | `components/GlobalGoldenBuffer.tsx`, route-change trigger in `components/FrdRouteBuffer.tsx` | — |

## Admin pages (`/admin/*`)

Every row below (except Dashboard) is wrapped in
`<RequireAdminSection section="...">`, so a non-super-admin only sees it
if the super admin has granted that `AdminSection` to them (directly or
via a role). See [admin-panel.md](admin-panel.md) for how granting works.

| Route | Page component | `AdminSection` | Manages table(s) | Sidebar group |
|---|---|---|---|---|
| `/admin` | `Dashboard.tsx` | *(none — every admin sees it)* | — | — |
| `/admin/session-photos` | `SessionPhotos.tsx` | `session_photos` | `session_photos` | Home |
| `/admin/announcements` | `Announcements.tsx` | `announcements` | `announcements`, `announcement_comments` (delete only) | Home |
| `/admin/activity-slideshow` | `ActivitySlideshow.tsx` | `activity_slideshow` | `activity_slideshow_photos` | About |
| `/admin/testimonials` | `Testimonials.tsx` | `testimonials` | `testimonials` | About |
| `/admin/hall-of-fame` | `HallOfFame.tsx` | `hall_of_fame_entries` | `hall_of_fame_entries` | Hall of Fame |
| `/admin/awards` | `Awards.tsx` | `awards` | `awards` | Awards |
| `/admin/articles` | `Articles.tsx` | `articles` | `articles` | Club Publications |
| `/admin/resources` | `Resources.tsx` | `resources` | `resources` | Club Publications |
| `/admin/leaderboards` | `Leaderboards.tsx` | `leaderboards` | `leaderboards`, `leaderboard_entries` | Leaderboards |
| `/admin/activity-log` | `ActivityLog.tsx` | `activity_log` | `activity_log` | Site-wide |
| `/admin/forum` | `Forum.tsx` | `forum` | `forum_posts` | Site-wide |
| `/admin/olympiad-registrations` | `OlympiadRegistrations.tsx` | `olympiad_registrations` | `olympiad_registrations` | Site-wide |
| `/admin/site-sections` | `SiteSections.tsx` | `site_sections` | `site_sections` | Site-wide |
| `/admin/problem-of-the-day` | `ProblemOfTheDay.tsx` | `frd_problem_of_the_day` | `problem_of_the_day` | FRD Mode |
| `/admin/frd-competitions` | `FrdCompetitions.tsx` | `frd_competitions` | `upcoming_competitions`, `competition_archive` | FRD Mode |
| `/admin/roles` | `AdminRoles.tsx` | *(super admin only)* | `admins`, `admin_permissions`, `admin_roles`, `admin_role_permissions`, `admin_role_assignments` | Super Admin |
| `/admin/issue-reports` | `IssueReports.tsx` | *(super admin only)* | `issue_reports` | Super Admin |

## Site-wide (not page-specific)

| Feature | Component | Backing table |
|---|---|---|
| "Report an issue" floating button | `components/ReportIssueButton.tsx` | `issue_reports` |
| Background digital-rain canvas | `components/DigitalRain.tsx` | — (pure visual, no data) |
| Olympiad registration form | `pages/OlympiadRegister.tsx` | `olympiad_registrations` |

## Retired / present-but-unused

- **General member registration** ("Member Management" in the admin
  panel) was removed from the app entirely. Its `members` table is still
  present in the database (not auto-dropped) — see the comment above it
  in `schema.sql` for the manual drop command once you've confirmed
  nothing needs it.
- A `register` `site_sections` row from that era is no longer seeded by
  `schema.sql`; it's safe to delete manually if it's still in your table.
