# Security Policy

## Supported Versions

This is a single continuously-deployed website, not a versioned library —
there's only ever one "supported version": whatever is currently on the
`main` branch and deployed to production. Security fixes are applied
directly to `main`.

## Reporting a Vulnerability

If you find a security vulnerability in this codebase (for example, an
RLS policy gap, an auth bypass, or an injection vector), please **do not**
open a public GitHub issue for it.

Instead, email **mdmuntasir.2029@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, screenshots, or proof-of-concept code

You should expect an acknowledgement within a few days. Once the issue is
confirmed and fixed, we'll credit the report (unless you'd prefer to stay
anonymous) in the fix's commit or release notes.

## Scope

Relevant areas for this project specifically:

- Supabase Row Level Security policies (`supabase/schema.sql`) — anything
  that could let a non-admin read or write data an admin should gate
- The admin auth flow (`src/lib/auth.ts`, `src/pages/Access.tsx`,
  `src/pages/ResetPassword.tsx`)
- Anything that could leak the Supabase service role key or other secrets
  through frontend code (this app should only ever use the anon/public key)
