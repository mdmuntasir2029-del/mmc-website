# Data Flow

Concrete walkthroughs of how data actually moves, for the handful of
flows that cover almost everything else in the app by extension.

## 1. Public page read (the common case)

Example: a visitor opens `/awards`.

```
Awards.tsx
  useSiteSections() ──► sections.awards === false? ──► render <SectionUnavailable/>, stop
  AwardsPanel.tsx
    useEffect ──► db.getAwards()
                    └─► supabase.from("awards").select("*").order(...)
                          └─► Postgres: RLS policy "awards_public_select"
                              (for select to anon, authenticated using (true))
                              → returns every row, no auth needed
                    └─► fromAwardRow() maps snake_case columns to the
                        camelCase Award type, and builds imageUrl /
                        imageSrcSet from image_path via
                        supabase.storage.from(PUBLIC_BUCKET).getPublicUrl()
  renders the scroll-revealed track from the returned Award[]
```

Every public-facing list/detail page follows this exact shape:
1. A page component checks `useSiteSections()` first (if it's gated by a
   `SectionKey`) and bails out to `<SectionUnavailable/>` if hidden.
2. A component fetches via one `db.ts` function in a `useEffect`.
3. `db.ts` calls `supabase.from(table).select(...)`, which Postgres allows
   because the table's `..._public_select` RLS policy says `using (true)`
   for `anon, authenticated`.
4. A `fromXRow()` mapper in `db.ts` converts the snake_case DB row into
   the camelCase TypeScript type from `types.ts`, computing any derived
   fields (public image URLs, srcsets) along the way.

No admin check happens anywhere in this path — public reads are public
reads, full stop, enforced by the table's own RLS policy rather than by
anything the frontend decides.

## 2. Admin write

Example: an admin adds an Award from `/admin/awards`.

```
pages/admin/Awards.tsx (form submit)
  └─► db.addAward({ name, achievement, initials }, file?)
        ├─► if a file was chosen: supabase.storage
        │     .from(PUBLIC_BUCKET).upload(`awards/${uuid}-${name}`, file)
        │     └─► Postgres storage policy "mmc_public_admin_write"
        │         (bucket_id = 'mmc-public' and is_admin())
        │         → succeeds only if the caller's JWT email is in `admins`
        └─► supabase.from("awards").insert({ name, achievement, ... })
              └─► Postgres RLS policy "awards_admin_write"
                  (for all using (is_admin()) with check (is_admin()))
                  → insert succeeds only if is_admin() returns true
```

The page never checks admin status itself before calling `db.addAward` —
it doesn't need to, because:
- The route is already behind `<ProtectedAdminRoute>` (redirects signed-out
  visitors to `/signin`) and, for this specific page, a
  `<RequireAdminSection section="awards">` wrapper (hides the page from a
  signed-in admin who hasn't been granted the `awards` section).
- Even if both of those were somehow bypassed, the **actual** write would
  still fail server-side, because `is_admin()` re-checks the caller's JWT
  against the `admins` table on every single call. The UI gating is a
  convenience, not the enforcement.

## 3. Authorization flow (sign-in → admin UI)

```
1. Visitor goes to /signin, enters email + password.
2. Access.tsx calls auth.signIn(email, password)
     └─► supabase.auth.signInWithPassword(...)
3. On success, AuthContext's onAuthStateChange fires with the new session.
4. AuthContext.syncAdmin(session):
     a. checkIsAdmin() → supabase.rpc("is_admin")
          └─► Postgres: select exists(select 1 from admins where
              email = auth.jwt()->>'email')
     b. if admin: checkIsSuperAdmin() + getMyAdminPermissions() in parallel
          └─► rpc("is_super_admin")   — hardcoded email check
          └─► rpc("my_admin_permissions") — union of directly-granted
              sections and sections granted via an assigned role
5. AuthContext now exposes { isAdmin, isSuperAdmin, permissions, canAccess }
6. <ProtectedAdminRoute> reads isAdmin to allow/redirect.
7. <RequireAdminSection section="X"> reads canAccess("X") to allow/redirect.
8. <RequireSuperAdmin> reads isSuperAdmin to allow/redirect.
9. AdminLayout's sidebar filters NAV_GROUPS the same way, so an admin
   only ever sees links to sections they can actually open.
```

The `admins` table itself has RLS enabled with **zero** policies — it
cannot be read or written through the API by anyone, admin or not. Every
check above goes through a `SECURITY DEFINER` function
(`is_admin`/`is_super_admin`/`my_admin_permissions`/...), which runs with
elevated privileges internally but only ever returns a boolean or a
narrow result set — never the underlying admin list. See
[backend.md](backend.md#admin--permissions-tables) for the full function
list.

## 4. File upload with real dimensions (announcements)

A slightly more involved example, because it shows client-side
preprocessing feeding into both storage and the database row:

```
admin/Announcements.tsx (file chosen)
  └─► readImageDimensions(file)
        — loads the file into a throwaway <img> via
          URL.createObjectURL(file), reads naturalWidth/naturalHeight,
          revokes the object URL
  └─► db.addAnnouncement({ caption, description, embedUrl,
                            imageWidth, imageHeight }, file)
        ├─► storage.from(PUBLIC_BUCKET).upload(`announcements/${uuid}-...`, file)
        └─► supabase.from("announcements").insert({
              image_path, image_width, image_height, embed_url,
              description, caption
            })
```

`image_width`/`image_height` are stored so the **public** `<img>` can
use them as real `width`/`height` HTML attributes — the browser reserves
the correct aspect-ratio space before the image loads, avoiding layout
shift, without forcing every announcement into one fixed crop (unlike
session photos, announcement posters vary wildly in shape). This is the
fix for the "resolution messes up on reload" class of bug — see the
comment above these columns in `schema.sql` for the full history.

## 5. Site-sections visibility: the caching trade-off

`SiteSectionsContext` is the one place in the app that deliberately
trades strict correctness for perceived performance, so it's worth
understanding in full:

```
First-ever page load (no localStorage cache):
  1. SiteSectionsProvider initializes sections = SECTION_DEFAULT_VISIBLE
     (all true) and loaded = false — synchronously, before first paint.
  2. Page renders using those defaults (everything visible).
  3. useEffect fires db.getSiteSections() → supabase.from("site_sections")
  4. Response merges into state + localStorage ("mmc_site_sections_v1"),
     loaded flips to true.
  5. If an admin had actually hidden a section, it disappears at this
     point — a brief flash of a since-hidden section is possible, but
     only ever on a visitor's very first visit with an empty cache.

Every subsequent page load (cache present):
  1. SiteSectionsProvider reads localStorage SYNCHRONOUSLY in its
     useState initializer — sections reflect the last known-good server
     state immediately, loaded = true from the first render.
  2. The same useEffect still re-fetches in the background and updates
     both state and the cache, so drift self-corrects within one load.
```

This exists because an earlier version blocked the entire app's render on
this one fetch to guarantee zero flash — correct, but it serialized this
fetch in front of every page's own data fetches, which a real Lighthouse
run showed measurably delaying LCP. The localStorage cache gets the "no
flash" property back for the case that actually matters (repeat visits)
without that cost. See the full comment in
`src/context/SiteSectionsContext.tsx` for the reasoning in the original
author's words.

## 6. Why two different "which features are on" systems exist

It's easy to conflate these two — they're deliberately separate:

| | `SectionKey` | `AdminSection` |
|---|---|---|
| Controls | What a **visitor** sees on the public site | What a given **admin** can reach inside `/admin` |
| Set via | Admin's "Site Sections" page (`/admin/site-sections`) | Super admin's "Admin Roles" page (`/admin/roles`) |
| Stored in | `site_sections` table (`key`, `visible`) | `admin_permissions` / `admin_role_*` tables |
| Read by | `useSiteSections()` everywhere on the public site | `useAuth().canAccess(section)` inside `/admin` |
| Super admin bypass | No — hiding a section hides it for everyone, including admins browsing the public site | Yes — the super admin can always reach every admin section regardless of grants |

A section can be fully visible to the public (`SectionKey` on) while a
specific admin still can't manage it (`AdminSection` not granted to
them), and vice versa. See [feature-map.md](feature-map.md) for the
complete cross-reference of every section/page against both keys.
