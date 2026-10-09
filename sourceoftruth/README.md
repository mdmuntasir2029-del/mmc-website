# Source of Truth

This folder is the canonical technical reference for the Manarat Mathletes
Club website — how the system is built, how data moves through it, every
feature and where its code lives, and how the backend and admin panel are
wired together. Where `docs/` gives a short orientation for a new
contributor, this folder is the detailed reference you come back to when
you need to know exactly how something works before changing it.

**These are hand-maintained markdown files, not generated from the code.**
They were last verified against the codebase on **2026-10-08**. If you
change a table, a route, a section key, or an admin permission, update the
relevant file here in the same pull request — a stale "source of truth" is
worse than none, so treat drift here as a bug.

## Contents

- **[architecture.md](architecture.md)** — the system end to end: frontend,
  backend, hosting, how a request actually gets served, provider/service
  map, environment variables.
- **[data-flow.md](data-flow.md)** — concrete walkthroughs of how data
  moves for the flows that matter most: a public page read, an admin
  write, sign-in/authorization, a file upload, and the site-sections
  visibility cache.
- **[feature-map.md](feature-map.md)** — every public page and section,
  every admin page, and every toggleable feature, each with its route,
  its `SectionKey`/`AdminSection` key (if any), the component(s) that
  render it, and the table(s) it reads/writes.
- **[backend.md](backend.md)** — the full Supabase schema reference:
  every table and its columns, the RLS policy on each, every
  `SECURITY DEFINER` RPC function and what it's for, the two storage
  buckets and their policies, and how to add a new table following the
  existing conventions.
- **[frontend.md](frontend.md)** — the `src/` directory map, the full
  route table, every context/hook and what it provides, the component
  inventory, the CSS/theming system (including FRD mode), and the
  conventions new code is expected to follow.
- **[admin-panel.md](admin-panel.md)** — the admin permissions model
  (super admin vs. per-section admins vs. reusable roles), the sidebar
  navigation groups, and the step-by-step recipe for adding a new
  admin-managed feature end to end.
- **[image-resolutions.md](image-resolutions.md)** — what size photo to
  upload for every image field in the admin panel, grounded in each
  one's actual crop shape and display size (not guesswork).
- **[fest-hub.md](fest-hub.md)** — the Organization → Fest → Event →
  Registration system built for the DRMC AI Web Dev Contest: the data
  model, the four public RPCs and why registrations have no direct
  public table access, every route, and the two-deployment (real site
  vs. contest site) setup.

## How these relate to the rest of the repo

- **[../README.md](../README.md)** — local dev setup, Supabase project
  setup, Brevo email setup, adding/removing admins. Start there to get
  the project running; come here once it's running and you need to
  understand or change how it works.
- **[../docs/](../docs/)** — a short architecture orientation for new
  contributors. This folder supersedes it in depth; `docs/architecture.md`
  stays as the quick version.
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — branching, commit style,
  and the checks to run before a PR.
- **[../supabase/schema.sql](../supabase/schema.sql)** — the actual,
  executable source of truth for the database. `backend.md` describes it
  in prose; the `.sql` file is what you run and what wins if the two ever
  disagree.
