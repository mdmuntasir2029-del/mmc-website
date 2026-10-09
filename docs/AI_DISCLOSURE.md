# AI Use Disclosure

**Project:** MMC Fest Hub — Smart Club Operations for Manarat Mathletes Club
**Repository:** https://github.com/mdmuntasir2029-del/mmc-website
**Submitted to:** 9th DRMC International Tech Carnival 2026 — AI Web Development Contest
**Last updated:** 2026-10-08

The contest rules allow any AI agents or tools and require them to be
disclosed. This document lists every AI tool used on this project, what
it was used for, and what the human team did. It is meant to be read
alongside the commit history, where AI-assisted commits carry a
`Co-Authored-By` trailer.

## 1. Summary

| Tool | Provider | Used for | Evidence |
|---|---|---|---|
| Claude Sonnet 5, via Claude Code (an AI coding agent CLI) | Anthropic | Writing and refactoring essentially all application code, the SQL schema, the mock-data seed script, and this documentation set — both the pre-existing site (since 17 Aug 2026) and every Fest Hub feature built during the contest window (8–9 Oct 2026) | Commits carrying `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` — 110 of the first 120 commits (17 Aug – 3 Oct 2026), and every commit on the `contest/fest-hub` branch |
| Claude Opus 5.5 (claude.ai) | Anthropic | The gap analysis and the product requirements document / scheme of work for the contest build (`MMC_Fest_Hub_PRD.pdf`, 8 Oct 2026), which the developer then had Claude Code implement against | The PRD document itself, shared with the development session |

No other AI tool (no separate code-generation tool, no image-generation
tool, no third-party mock-data generator) was used. The mock data in
`supabase/seed.sql` was written by the same AI coding agent as the rest
of the code, not a separate tool.

## 2. Pre-existing codebase

This project extends the club's existing website, which was started on
17 August 2026, before the contest topics were released on 4 October
2026. The contest rules permit code reuse, boilerplates and starter
templates. The pre-existing site (home, about, announcements,
leaderboards, hall of fame, admin panel and permissions) was built with
heavy AI assistance, as shown by the commit trailers above. Everything
listed under "Fest Hub" features in the README was built during the
contest window (8–9 October 2026).

## 3. What AI did

- Generated essentially all of the React/TypeScript components, page
  layouts, and CSS — both before the contest and for every Fest Hub
  feature (fest/event directory, registration, confirmation, my-
  registrations, organizer dashboard, participant management).
- Wrote the Supabase SQL: tables, row-level-security policies, and
  database functions, including the Fest Hub's registration-capacity/
  deadline/waitlist logic in `register_for_event()`.
- Wrote `supabase/seed.sql`'s fictional mock data (fest/event/
  registration rows) and the deterministic-hash approach that makes it
  safely re-runnable.
- Drafted documentation: `sourceoftruth/`, `docs/`, the README, and this
  file.
- Produced the requirements analysis mapping the rulebook's judging
  criteria to features (the PRD referenced above).
- Found and fixed real bugs during its own verification passes (e.g. a
  CSS specificity collision, a form-contrast issue, and a stacking-
  context bug affecting modals), documented in the relevant commit
  messages.

## 4. What the human team did

- Decided what the club and the contest entry needed, set feature
  priorities, and made the scope/timeline/deployment decisions recorded
  in the PRD (separate Fest Hub deployment, MMC as the organization,
  deadline interpretation, etc.).
- Directed the AI coding agent task by task, reviewed its output, and
  made the final call on anything ambiguous.
- Is responsible for running the schema and seed scripts, configuring
  the separate Supabase/Vercel projects, creating the demo admin
  account, and capturing the screenshots in `docs/screenshots/` once a
  live deployment exists.
- Will test every feature on the deployed site at phone, tablet, and
  desktop widths before submission.
- Made the final decisions on what was submitted.

## 5. AI features inside the product

The deployed application does **not** call any AI model or AI API at
runtime. AI was used only during development — the product itself is a
conventional CRUD platform (fests, events, registrations) with no
AI-powered end-user feature.

## 6. Data and privacy

- All sample data in the deployed contest build (`supabase/seed.sql`) is
  fictional — generated names, `@example.com` emails, `01700`-prefixed
  placeholder phone numbers. No real student data was given to any AI
  tool for the purpose of generating sample data, and none is included
  in the seed script.
- Secrets (the Supabase service-role key, SMTP keys) were never pasted
  into any AI tool or committed to the repository; only the public
  anon/publishable key is used in frontend code, by design (see
  `sourceoftruth/architecture.md`).

## 7. Responsibility

The team has reviewed the AI-generated code and content and takes full
responsibility for it, including its licensing and the licenses of any
third-party assets and libraries used (see `LICENSE` and the
"Third-party services/APIs" section of the README). No new third-party
packages were added for the Fest Hub build — it uses the same
dependencies already in `package.json`.
