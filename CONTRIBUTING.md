# Contributing

Thanks for taking the time to contribute to the Manarat Mathletes Club
website. This project is a small Vite + React + TypeScript SPA backed by
Supabase — see [docs/architecture.md](docs/architecture.md) for the shape
of the codebase before diving in.

## Getting set up

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase URL + anon key
npm run dev
```

See the root [README.md](README.md) for full local/Supabase setup.

## Branching

Branch off `main` using one of these prefixes so intent is clear at a
glance:

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — tooling, docs, dependency, or config work
  that isn't a feature or a fix

## Commit messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <short summary>

<optional body>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`,
`ci`. Example:

```
fix(announcements): stop forced 4:3 crop from cutting off poster images
```

## Before opening a pull request

Run the same checks CI runs:

```bash
npm run lint        # oxlint
npx tsc --noEmit     # type-check without emitting
npm run build        # full production build
```

Keep pull requests scoped to one change — a bug fix doesn't need to carry
an unrelated refactor along with it. Fill out the PR template; if your
change touches `supabase/schema.sql`, say so explicitly, since schema
changes need to be run manually against the live Supabase project (there's
no automated migration runner).

## Reporting bugs / requesting features

Use the issue templates under **New Issue** — they ask for the context
that's actually needed to act on a report (repro steps for bugs, the
problem being solved for feature requests).

## Code of conduct

Participation in this project is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).
