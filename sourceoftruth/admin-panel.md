# Admin Panel Reference

How `/admin` decides who gets in, what they can see, and how to extend it
with a new admin-managed feature.

> The two Fest Hub `AdminSection`s (`fests_events`, `event_registrations`)
> follow this exact model — see **[fest-hub.md](fest-hub.md)** for their
> routes and what each gates.

## The three layers of gating

Every `/admin/*` route passes through up to three checks, each handled by
a different component, each backed by a real server-side check (not just
hidden UI):

```
/admin/*
  └─ ProtectedAdminRoute        "Is this visitor signed in AND an admin at all?"
       │  (redirects to /signin if not; shows a loading state while checking)
       └─ AdminLayout (sidebar + Outlet)
            └─ RequireAdminSection section="X"   "Can THIS admin reach section X?"
                 │  (renders <SectionUnavailable/> if not — super admin always passes)
                 └─ the actual admin page
```
or, for the two super-admin-only pages:
```
            └─ RequireSuperAdmin   "Is this admin THE super admin?"
```

- **`ProtectedAdminRoute`** (`components/ProtectedAdminRoute.tsx`) reads
  `useAuth().isAdmin`. This is the only check Dashboard itself needs —
  every signed-in admin can see the Dashboard.
- **`RequireAdminSection`** (`components/RequireAdminSection.tsx`) reads
  `useAuth().canAccess(section)`. Every other admin page is wrapped in
  this, in `App.tsx`'s route definitions, each naming its own
  `AdminSection`.
- **`RequireSuperAdmin`** (`components/RequireSuperAdmin.tsx`) reads
  `useAuth().isSuperAdmin` — used only for `/admin/roles` and
  `/admin/issue-reports`.

All three are **UX conveniences**, not the real security boundary — see
[data-flow.md](data-flow.md#3-authorization-flow-sign-in--admin-ui).
Even if a non-admin somehow rendered an admin page's JSX, every data
call it makes would still fail server-side because the table's RLS
policy itself calls `is_admin()`/`is_super_admin()`.

## Who is "an admin" at all

Being an admin is **just being a row in the `admins` table** — there is
no separate Supabase Auth role or claim. `is_admin()` checks the signed-in
JWT's email against that table on every call. Adding an admin is a single
SQL statement (see the root [README.md](../README.md#adding-another-admin));
they then self-serve their own password via `/signin`'s "First time
signing in with this email?" flow — there's no separate step to create
their Supabase Auth account.

## The permission model: three ways an admin can be granted a section

An `AdminSection` (e.g. `"awards"`) can reach a given admin through any
of three paths, all unioned together by `my_admin_permissions()`:

1. **Being the super admin** — one hardcoded email
   (`is_super_admin()` in `schema.sql`), always has every section,
   regardless of what's in any table. This can't be changed from the UI
   at all, by design, so the super admin account can never lock itself
   out.
2. **A direct grant** — a row in `admin_permissions (email, section)`,
   set via `grant_admin_section()` / `revoke_admin_section()`.
3. **A role assignment** — the admin is in `admin_role_assignments` for
   some `role_id`, and that role has a row in `admin_role_permissions`
   for the section. Roles are reusable named bundles (e.g. a "Content
   Editor" role bundling `articles` + `resources` + `announcements`) so
   the super admin can grant/revoke several sections to several admins at
   once instead of ticking every box per-admin every time.

All of this is managed from **`/admin/roles`** (`AdminRoles.tsx`,
super-admin only): add/remove admins, grant/revoke individual sections
per admin, and create/edit/assign reusable roles. Every mutation on that
page goes through the super-admin-only RPCs listed in
[backend.md](backend.md#functions) — the page itself has no special
privilege beyond being able to call them as the super admin.

## Sidebar navigation groups

`AdminLayout.tsx` defines `NAV_GROUPS` — admin pages grouped by **which
part of the public site they manage**, not alphabetically, so it's
obvious at a glance where a given control's effect shows up:

| Group | Pages |
|---|---|
| *(ungrouped)* | Dashboard |
| Home | Session Photos (Hero), Announcements |
| About | Activity Slideshow, Testimonials |
| Hall of Fame | Hall of Fame Roster |
| Awards | Awards |
| Club Publications | Articles, Resources |
| Leaderboards | Leaderboards |
| Site-wide | Club Activity Log, Executive Forum, Olympiad Registrations, Site Sections |
| FRD Mode | Problem of the Day, Competitions & Archive |
| Super Admin | Admin Roles, Issue Reports |

Each item is filtered live against `canAccess(section)` (or
`isSuperAdmin` for the two Super Admin items) — a whole group header
disappears if none of its items are visible to the current admin, so a
limited admin's sidebar only ever shows what they can actually open.

The **FRD Mode Preview** toggle also lives in this sidebar, below the nav
groups — see [frontend.md](frontend.md#frd-mode). It's unrelated to the
permission system above: every admin can flip it for themselves, it's not
gated by any `AdminSection`.

## Adding a new admin-managed feature

End-to-end recipe, following the exact shape every existing feature uses:

1. **Backend** — new table + RLS policies in `schema.sql`. See
   [backend.md](backend.md#adding-a-new-table).
2. **Types** — add the interface to `types.ts`, and a new value to the
   `AdminSection` union + its entry in `ADMIN_SECTION_LABELS`.
3. **`db.ts`** — `getX()`/`addX()`/`deleteX()` functions and a
   `fromXRow()` mapper, matching the pattern of any existing table's
   functions in that file.
4. **Admin page** — a new file under `src/pages/admin/`, typically a
   simple list + add-form + delete-button UI (every existing admin page
   is this same shape — copy the structurally closest one, e.g.
   `Testimonials.tsx` for a simple text-only table, `Awards.tsx` for one
   with an optional image upload).
5. **Route** — in `App.tsx`, add
   ```tsx
   <Route
     path="my-feature"
     element={
       <RequireAdminSection section="my_feature">
         <MyFeaturePage />
       </RequireAdminSection>
     }
   />
   ```
   inside the existing `/admin` route block.
6. **Nav entry** — add an item to the appropriate group (or a new group)
   in `AdminLayout.tsx`'s `NAV_GROUPS`.
7. **Public-facing piece**, if any — a component reading the new table
   via `db.ts`, rendered from whichever public page it belongs on. If
   it's a whole new toggleable section (not a sub-part of an existing
   page), also add a `SectionKey` — see
   [backend.md](backend.md#adding-a-new-table) step 6.
8. **Tell whoever runs the live Supabase project** to re-run
   `schema.sql` — this is a manual step, there is no migration runner or
   CI step that does it automatically.

A brand-new admin, once added to `admins`, starts with **zero** granted
sections (not even Dashboard-adjacent ones beyond Dashboard itself,
which every admin gets for free) — the super admin has to explicitly
grant sections or assign a role from `/admin/roles` before that admin
can reach anything else.
