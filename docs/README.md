# Documentation Index

This folder holds documentation that's too detailed for the root
[README.md](../README.md) but doesn't belong inline in the code. Start at
the root README for local setup and Supabase configuration — come here
for a map of how the codebase itself is put together.

## Contents

- [architecture.md](architecture.md) — how the frontend, Supabase backend,
  and Vercel hosting fit together; where to look for a given kind of
  change.
- [SETUP.md](SETUP.md) — Supabase project setup, Brevo email, adding
  admins, and the Fest Hub's separate-deployment setup (its own
  Supabase + Vercel project, mock data, demo admin).
- [JUDGING_GUIDE.md](JUDGING_GUIDE.md) — every contest rubric item
  (A1–C6) mapped to its URL and source file, plus a 5-minute
  walkthrough with the demo logins.
- [AI_DISCLOSURE.md](AI_DISCLOSURE.md) — full AI-use disclosure for the
  contest submission.
- `screenshots/` — contest submission screenshots (added once the Fest
  Hub deployment is live).

For the full depth — every table and RLS policy, every page and admin
section cross-referenced, exact data-flow walkthroughs, the admin
permissions model — see **[../sourceoftruth/](../sourceoftruth/)**. This
page is the quick orientation; that folder is the reference you come back
to before changing something.

## Where else to look

- [README.md](../README.md) — local dev setup, Supabase project setup,
  Brevo email setup, adding/removing admins.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — branching, commit style, and the
  checks to run before opening a PR.
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community standards.
- [SECURITY.md](../SECURITY.md) — how to report a vulnerability.
- [supabase/schema.sql](../supabase/schema.sql) — the single source of
  truth for every table, RLS policy, storage bucket, and RPC function.
  There's no migration runner; this file is meant to be re-run wholesale
  against the Supabase SQL editor.
