-- Manarat Mathletes Club — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent (if not exists / on conflict).

create extension if not exists pgcrypto;

-- ========== Tables ==========

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_name text not null,
  section text not null,
  roll text not null,
  student_code text not null unique,
  phone text not null,
  email text,
  registered_at timestamptz not null default now()
);

-- A phone number (always given) or an email (when given) should only be
-- able to register once. If this fails with "could not create unique
-- index" / "duplicate key", there are already-duplicate rows in the table
-- — remove the extras in Member Management first, then re-run this file.
create unique index if not exists members_phone_unique_idx on members (phone);
create unique index if not exists members_email_unique_idx on members (lower(email)) where email is not null;

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  what text not null,
  where_text text not null,
  how text not null,
  file_name text,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('presentations', 'quizzes', 'questions')),
  title text not null,
  file_name text not null,
  file_path text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ========== Row Level Security ==========
-- Every privileged check is pinned to this one admin email. If the admin
-- address ever changes, update it here (search "mdmuntasir.2029@gmail.com"
-- in this file) as well as ADMIN_EMAIL in src/lib/auth.ts.

alter table members enable row level security;
alter table activity_log enable row level security;
alter table resources enable row level security;
alter table forum_posts enable row level security;

drop policy if exists "members_public_insert" on members;
create policy "members_public_insert" on members
  for insert to anon, authenticated
  with check (true);

drop policy if exists "members_admin_select" on members;
create policy "members_admin_select" on members
  for select using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

drop policy if exists "members_admin_update" on members;
create policy "members_admin_update" on members
  for update
  using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

drop policy if exists "members_admin_delete" on members;
create policy "members_admin_delete" on members
  for delete using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

drop policy if exists "activity_log_admin_all" on activity_log;
create policy "activity_log_admin_all" on activity_log
  for all
  using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

drop policy if exists "resources_admin_all" on resources;
create policy "resources_admin_all" on resources
  for all
  using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

drop policy if exists "forum_posts_admin_all" on forum_posts;
create policy "forum_posts_admin_all" on forum_posts
  for all
  using ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com');

-- ========== Storage (activity log docs + resource files) ==========

insert into storage.buckets (id, name, public)
values ('mmc-files', 'mmc-files', false)
on conflict (id) do nothing;

drop policy if exists "mmc_files_admin_read" on storage.objects;
create policy "mmc_files_admin_read" on storage.objects
  for select using (
    bucket_id = 'mmc-files' and (auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com'
  );

drop policy if exists "mmc_files_admin_write" on storage.objects;
create policy "mmc_files_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'mmc-files' and (auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com'
  );

drop policy if exists "mmc_files_admin_delete" on storage.objects;
create policy "mmc_files_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'mmc-files' and (auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com'
  );
