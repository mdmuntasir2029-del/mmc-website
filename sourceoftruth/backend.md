# Backend Reference

The entire backend is Supabase (Postgres + Auth + Storage), defined in one
file: [`supabase/schema.sql`](../supabase/schema.sql). It's written to be
**idempotent** — every statement is `create table if not exists`,
`add column if not exists`, `create or replace function`, or
`drop policy if exists` + `create policy` — so re-running the whole file
against a project that already has some of it is always safe. There is no
migration runner; "deploy the schema" means "paste this file into the SQL
Editor and run it."

> The Fest Hub's `fests`/`events`/`event_registrations` tables and its
> four public RPCs have their own dedicated reference, including *why*
> `event_registrations` has zero public policies (unlike everything
> else here): **[fest-hub.md](fest-hub.md)**.

This document describes what's in there in prose. If the two ever
disagree, trust the `.sql` file — it's the one that actually runs.

## Admin & permissions tables

These four tables, plus `admins`, implement the whole authorization
model. All five have **RLS enabled with zero policies** — none of them
can be read or written through the API by anyone, including a signed-in
admin. The only way in or out is through the `SECURITY DEFINER` functions
below, each of which re-checks the caller's identity internally.

| Table | Columns | Purpose |
|---|---|---|
| `admins` | `email` (PK), `added_at` | The allowlist. Being in this table *is* being an admin. |
| `admin_permissions` | `email`, `section` (PK on both) | Per-admin, per-section grants (directly assigned, not via a role) |
| `admin_roles` | `id` (PK), `name` (unique), `created_at` | Named, reusable permission bundles (e.g. "Content Editor") |
| `admin_role_permissions` | `role_id`, `section` (PK on both) | Which `AdminSection`s a role grants |
| `admin_role_assignments` | `email`, `role_id` (PK on both) | Which admins have which role |

The hardcoded super admin (`mdmuntasir.2029@gmail.com`, checked by
`is_super_admin()`, not stored as a row anywhere) always has access to
every `AdminSection` regardless of what's in these tables — the frontend
accounts for this in `AuthContext`, not by seeding rows.

### Functions

| Function | Caller | What it does |
|---|---|---|
| `is_admin()` | anon, authenticated | True if the JWT's email is in `admins` |
| `is_email_admin(check_email)` | anon, authenticated | True if a *specific* email (not the caller's own) is in `admins` — used to pre-check before `signUp()` so a non-admin email never gets a Supabase Auth account created |
| `is_super_admin()` | anon, authenticated | True only for the hardcoded super-admin email |
| `my_admin_permissions()` | authenticated | Returns the calling admin's own granted sections (direct + via role), unioned |
| `list_admins()` | authenticated | Super-admin-only: every row in `admins` |
| `list_admin_permissions()` | authenticated | Super-admin-only: every row in `admin_permissions` |
| `add_admin(new_email)` | authenticated | Super-admin-only: insert into `admins` |
| `remove_admin(target_email)` | authenticated | Super-admin-only: remove from `admins` + cascade their permissions/role assignments. Refuses to remove the super admin itself. |
| `grant_admin_section(target_email, target_section)` | authenticated | Super-admin-only: direct grant |
| `revoke_admin_section(target_email, target_section)` | authenticated | Super-admin-only: direct revoke |
| `list_admin_roles()` / `list_admin_role_permissions()` / `list_admin_role_assignments()` | authenticated | Super-admin-only reads |
| `create_admin_role(role_name)` | authenticated | Super-admin-only |
| `delete_admin_role(target_role_id)` | authenticated | Super-admin-only |
| `grant_admin_role_section(role_id, section)` / `revoke_admin_role_section(role_id, section)` | authenticated | Super-admin-only: edit a role's permission bundle |
| `assign_admin_role(email, role_id)` / `unassign_admin_role(email, role_id)` | authenticated | Super-admin-only: attach/detach a role from an admin |

Every one of the super-admin-only functions re-checks `is_super_admin()`
**inside its own body** and raises an exception if false — so even a
direct RPC call from outside the normal UI, by anyone other than the
super admin, fails server-side.

## Content tables

All of these follow the same two-policy pattern unless noted otherwise:
**`..._public_select`** (`for select to anon, authenticated using (true)`)
and **`..._admin_write`** (`for all using (is_admin()) with check (is_admin())`).

| Table | Key columns | Notes |
|---|---|---|
| `olympiad_registrations` | `full_name`, `school`, `class_name`, `gender`, `phone`, `email` | **Not** the standard pattern — public can `insert` only (sign-up form), only admins can `select`/`delete`. No public read at all. |
| `activity_log` | `date`, `title`, `what`, `where_text`, `how`, `file_name`, `file_path` | Admin-only `for all` — not publicly readable (internal log) |
| `resources` | `category` (`presentations`\|`quizzes`\|`questions`), `title`, `file_name`, `file_path` | Admin-only `for all` — downloads happen through admin-issued signed URLs |
| `forum_posts` | `author`, `message` | Admin-only `for all` ("Executive Forum" — internal, not public) |
| `articles` | `title`, `author`, `abstract`, `published_date`, `file_name`, `file_path`, `link` | Public select + admin write (standard pattern) — the one `mmc-files` folder with a public storage policy too (see below) |
| `session_photos` | `session_label`, `session_date`, `image_path`, `caption` | Standard pattern. Home hero carousel pulls the latest `session_date`'s photos. |
| `leaderboards` / `leaderboard_entries` | `game`, `played_on` / `player_name`, `score` | Standard pattern, one-to-many via `leaderboard_id` |
| `awards` | `name`, `achievement`, `initials`, `image_path` | Standard pattern. `image_path` optional — falls back to an initials avatar. |
| `activity_slideshow_photos` | `week_label`, `photo_date`, `image_path`, `caption` | Standard pattern. Independent photo set from `session_photos`, also week-organized. |
| `hall_of_fame_entries` | `name`, `role_title`, `session_year`, `image_path`, `display_order`, `favorite_constant`, `research_area` | Standard pattern. The last two columns are only used by the FRD mode Executive Board module. |
| `testimonials` | `quote`, `person_name`, `person_role` | Standard pattern |
| `announcements` | `image_path`, `caption`, `image_width`, `image_height`, `embed_url`, `description`, `likes_count` | Standard pattern. See [data-flow.md](data-flow.md#4-file-upload-with-real-dimensions-announcements) for why the dimension columns exist. |
| `announcement_comments` | `announcement_id` (FK, cascade delete), `author_name`, `message` | Public select **and** insert (open comments, no accounts); only admins can delete (moderation) |
| `issue_reports` | `kind` (`bug`\|`suggestion`), `message`, `reporter_email` | Public can `insert` only; only the **super admin** (not every admin) can `select`/`delete` |
| `problem_of_the_day` | `problem_date` (unique), `latex_problem`, `hints` (`text[]`), `answer_text`, `solution_text` | Standard pattern. Newest `problem_date` is treated as "today's." |
| `upcoming_competitions` | `name`, `event_date` | Standard pattern. Powers the FRD Competition Bento's countdown. |
| `competition_archive` | `contest_name`, `contest_year`, `paper_path`, `solution_path` | Standard pattern. Files live in the **private** `mmc-files` bucket (signed URLs), unlike most image content. |
| `site_sections` | `key` (PK), `visible`, `updated_at` | Public select (every visitor needs to know what to render) + admin write |

### RPC: `increment_announcement_likes(target_id)`

```sql
update announcements set likes_count = likes_count + 1
where id = target_id
returning likes_count;
```
Granted to `anon, authenticated` — anyone can like an announcement, no
auth required. The frontend soft-debounces repeat likes per browser via
`localStorage` (not a hard per-user limit, since there's no account
system to key a real one off).

### Retired table

`members` (general member registration) is no longer used by any code
path — the feature was removed, but the table itself is left in the
database rather than auto-dropped. See the comment block above it in
`schema.sql` for the manual `drop table` command once you've confirmed
nothing depends on it.

## Storage

Two buckets, both created idempotently via
`insert into storage.buckets (...) on conflict (id) do nothing/update`:

| Bucket | Public? | Used for | Policies |
|---|---|---|---|
| `mmc-files` | No | Activity log docs, Resources files, Article attachments, FRD Competition Archive papers/solutions | `mmc_files_admin_read` (admins only, any folder) + `mmc_files_public_read_articles` (anyone, but **only** the `articles/` folder) + `mmc_files_admin_write`/`mmc_files_admin_delete` |
| `mmc-public` | Yes | Session photos, Awards photos, Activity Slideshow photos, Hall of Fame photos, Announcement images | No read policy needed — reads are open because the bucket itself is public. `mmc_public_admin_write`/`mmc_public_admin_delete` gate writes. |

Storage policies are **bucket-wide, not per-table** — `mmc-public` holds
several unrelated tables' images, distinguished only by folder prefix
(`awards/`, `activity-slideshow/`, `hall-of-fame/`, `announcements/`,
session photos at the bucket root) purely by convention, not enforced by
policy. Non-admin downloads from `mmc-files` go through short-lived
**signed URLs** generated on demand (`db.getFileUrl()`), never permanent
links — except the `articles/` folder, which has its own public-read
policy since Articles is a public-facing section.

## Adding a new table

Follow the pattern every existing content table uses:

1. `create table if not exists my_table (...)` in `schema.sql`, under
   `-- ========== Tables ==========`.
2. `alter table my_table enable row level security;` in the RLS section.
3. Two policies, unless your table needs something stricter (like
   `olympiad_registrations` or `issue_reports`):
   ```sql
   drop policy if exists "my_table_public_select" on my_table;
   create policy "my_table_public_select" on my_table
     for select to anon, authenticated using (true);

   drop policy if exists "my_table_admin_write" on my_table;
   create policy "my_table_admin_write" on my_table
     for all using (is_admin()) with check (is_admin());
   ```
4. Add the matching TypeScript interface to `src/lib/types.ts` and a
   `fromMyTableRow()` mapper + CRUD functions to `src/lib/db.ts` (see any
   existing table's functions as a template — they're all the same
   shape: `getX`, `addX`, `deleteX`).
5. If this is an admin-managed feature, add a new `AdminSection` value
   (`types.ts`), a route in `App.tsx` wrapped in
   `<RequireAdminSection section="...">`, and a nav entry in
   `AdminLayout.tsx`'s `NAV_GROUPS`. See
   [admin-panel.md](admin-panel.md#adding-a-new-admin-managed-feature)
   for the full recipe.
6. If this is a new public-facing section visitors can toggle, add a
   `SectionKey` value, its label/description, its default-visible value
   (all three in `types.ts`), and seed it in `schema.sql`'s
   `insert into site_sections (key) values (...)`.
7. Tell whoever runs the live Supabase project to re-run `schema.sql`.
