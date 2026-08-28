-- Manarat Mathletes Club — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent (if not exists / on conflict).

create extension if not exists pgcrypto;

-- ========== Admins ==========
-- Who gets into /admin is controlled by rows in this table, not by
-- anything in the codebase.
--
-- To add another admin, just run in the SQL Editor:
--   insert into admins (email) values ('newemail@example.com');
-- They then self-serve their own password from /signin — "First time
-- signing in with this email? Set your password" — no separate step to
-- create their Supabase Auth account.
--
-- To remove one:
--   delete from admins where email = 'oldemail@example.com';
--
-- This table has RLS enabled with NO policies on it at all, so it isn't
-- readable or writable through the API by anyone, including signed-in
-- admins — only the SQL Editor (which runs as the table owner) or the
-- is_admin() function below (which runs with elevated privileges) can
-- touch it. That keeps the admin list private even though membership
-- checks happen from the client.

create table if not exists admins (
  email text primary key,
  added_at timestamptz not null default now()
);

insert into admins (email) values ('mdmuntasir.2029@gmail.com')
on conflict (email) do nothing;

alter table admins enable row level security;

create or replace function is_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from admins where email = (auth.jwt() ->> 'email')
  );
$$;

grant execute on function is_admin() to anon, authenticated;

-- Lets the sign-in page check ONE specific email against the allowlist
-- before creating a Supabase Auth account for it (signUp() has no idea
-- about `admins` — it'll happily create a login for anyone). Only ever
-- returns true/false for the exact email asked about, never the list.
create or replace function is_email_admin(check_email text) returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from admins where lower(email) = lower(check_email)
  );
$$;

grant execute on function is_email_admin(text) to anon, authenticated;

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

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  abstract text not null,
  published_date date not null,
  file_name text,
  file_path text,
  link text,
  created_at timestamptz not null default now()
);

-- ========== Row Level Security ==========

alter table members enable row level security;
alter table activity_log enable row level security;
alter table resources enable row level security;
alter table forum_posts enable row level security;
alter table articles enable row level security;

drop policy if exists "members_public_insert" on members;
create policy "members_public_insert" on members
  for insert to anon, authenticated
  with check (true);

drop policy if exists "members_admin_select" on members;
create policy "members_admin_select" on members
  for select using (is_admin());

drop policy if exists "members_admin_update" on members;
create policy "members_admin_update" on members
  for update using (is_admin()) with check (is_admin());

drop policy if exists "members_admin_delete" on members;
create policy "members_admin_delete" on members
  for delete using (is_admin());

drop policy if exists "activity_log_admin_all" on activity_log;
create policy "activity_log_admin_all" on activity_log
  for all using (is_admin()) with check (is_admin());

drop policy if exists "resources_admin_all" on resources;
create policy "resources_admin_all" on resources
  for all using (is_admin()) with check (is_admin());

drop policy if exists "forum_posts_admin_all" on forum_posts;
create policy "forum_posts_admin_all" on forum_posts
  for all using (is_admin()) with check (is_admin());

-- Articles are publicly readable (it's a website section); only admins
-- can publish, edit, or remove them.
drop policy if exists "articles_public_select" on articles;
create policy "articles_public_select" on articles
  for select to anon, authenticated
  using (true);

drop policy if exists "articles_admin_write" on articles;
create policy "articles_admin_write" on articles
  for all using (is_admin()) with check (is_admin());

-- ========== Storage (activity log docs, resource files, articles) ==========

insert into storage.buckets (id, name, public)
values ('mmc-files', 'mmc-files', false)
on conflict (id) do nothing;

drop policy if exists "mmc_files_admin_read" on storage.objects;
create policy "mmc_files_admin_read" on storage.objects
  for select using (
    bucket_id = 'mmc-files' and is_admin()
  );

-- Article attachments live under the "articles/" folder in the same
-- bucket and are the one thing non-admins can download.
drop policy if exists "mmc_files_public_read_articles" on storage.objects;
create policy "mmc_files_public_read_articles" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'mmc-files' and (storage.foldername(name))[1] = 'articles'
  );

drop policy if exists "mmc_files_admin_write" on storage.objects;
create policy "mmc_files_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'mmc-files' and is_admin()
  );

drop policy if exists "mmc_files_admin_delete" on storage.objects;
create policy "mmc_files_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'mmc-files' and is_admin()
  );
