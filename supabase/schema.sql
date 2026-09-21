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

-- ========== Super admin / per-section admin permissions ==========
-- One admin — hardcoded here, not a DB row — can manage which OTHER
-- admins can access which admin-panel sections. Hardcoding the email
-- (rather than e.g. an `is_super_admin` column on `admins`) means this
-- one account can never accidentally lock itself out by editing its own
-- row. Every RPC below re-checks is_super_admin() itself, so even if the
-- client-side UI hiding these controls were bypassed, the writes still
-- fail server-side for anyone else.

create or replace function is_super_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select lower(auth.jwt() ->> 'email') = 'mdmuntasir.2029@gmail.com';
$$;

grant execute on function is_super_admin() to anon, authenticated;

-- Same "RLS enabled, zero policies" pattern as `admins` — only reachable
-- through the SECURITY DEFINER functions below.
create table if not exists admin_permissions (
  email text not null,
  section text not null,
  granted_at timestamptz not null default now(),
  primary key (email, section)
);

alter table admin_permissions enable row level security;

-- What sections can the CALLING admin access? Any signed-in admin can
-- call this for themselves (no is_super_admin check) — the super admin
-- implicitly has every section regardless of what's in the table, which
-- the app's AuthContext accounts for rather than this function.
create or replace function my_admin_permissions() returns setof text
language sql security definer stable
set search_path = public
as $$
  select section from admin_permissions
  where email = (auth.jwt() ->> 'email');
$$;

grant execute on function my_admin_permissions() to authenticated;

-- Everything below is super-admin-only, enforced inside the function
-- body (not just hidden in the UI).

create or replace function list_admins() returns table (email text, added_at timestamptz)
language sql security definer stable
set search_path = public
as $$
  select a.email, a.added_at from admins a where is_super_admin();
$$;

grant execute on function list_admins() to authenticated;

create or replace function list_admin_permissions() returns table (email text, section text)
language sql security definer stable
set search_path = public
as $$
  select p.email, p.section from admin_permissions p where is_super_admin();
$$;

grant execute on function list_admin_permissions() to authenticated;

create or replace function add_admin(new_email text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can add admins.';
  end if;
  insert into admins (email) values (lower(new_email))
  on conflict (email) do nothing;
end;
$$;

grant execute on function add_admin(text) to authenticated;

create or replace function remove_admin(target_email text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can remove admins.';
  end if;
  if lower(target_email) = 'mdmuntasir.2029@gmail.com' then
    raise exception 'The super admin account cannot be removed.';
  end if;
  delete from admins where lower(email) = lower(target_email);
  delete from admin_permissions where lower(email) = lower(target_email);
end;
$$;

grant execute on function remove_admin(text) to authenticated;

create or replace function grant_admin_section(target_email text, target_section text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can grant admin sections.';
  end if;
  insert into admin_permissions (email, section) values (lower(target_email), target_section)
  on conflict (email, section) do nothing;
end;
$$;

grant execute on function grant_admin_section(text, text) to authenticated;

create or replace function revoke_admin_section(target_email text, target_section text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can revoke admin sections.';
  end if;
  delete from admin_permissions
  where lower(email) = lower(target_email) and section = target_section;
end;
$$;

grant execute on function revoke_admin_section(text, text) to authenticated;

-- ========== Tables ==========

-- General member registration (and Member Management in the admin panel)
-- was removed entirely — it's no longer used. The `members` table itself
-- is left in place rather than dropped here automatically; once you've
-- confirmed nothing else needs it, drop it yourself with:
--   drop table if exists members cascade;

-- Replaces general member registration: submissions from the (unlinked,
-- URL-only) Intra Math Olympiad registration page.
create table if not exists olympiad_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  school text not null,
  class_name text not null,
  gender text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

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

-- Photos from club sessions, grouped by week. Shown on the home page
-- ("Photos From Last Session"); images live in the public mmc-public
-- bucket so they can be <img>-referenced directly.
create table if not exists session_photos (
  id uuid primary key default gen_random_uuid(),
  session_label text not null,
  session_date date not null,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Leaderboards from games played during club activities. One row per
-- game/session, with ranked entries in leaderboard_entries.
create table if not exists leaderboards (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  played_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  leaderboard_id uuid not null references leaderboards(id) on delete cascade,
  player_name text not null,
  score numeric,
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_entries_board_idx
  on leaderboard_entries (leaderboard_id);

-- Award-winning mathletes, shown on the /awards page's scroll-revealed
-- track. Ordered by created_at so newer winners appear further along.
-- image_path is optional — falls back to an initials avatar when unset.
-- Images live in the same public mmc-public bucket (existing storage
-- policies are bucket-wide, not table-specific) under "awards/".
create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  achievement text not null,
  initials text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table awards add column if not exists image_path text;

-- The About page's activity slideshow — its own photo set, independent
-- of the homepage's session_photos, also organized by week. Images live
-- in the same public mmc-public bucket (existing storage policies are
-- bucket-wide, not table-specific) under "activity-slideshow/".
create table if not exists activity_slideshow_photos (
  id uuid primary key default gen_random_uuid(),
  week_label text not null,
  photo_date date not null,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Hall of Fame roster — a photo per member/personnel, tagged by session
-- year. The About page's "Current Year Lineup" pulls the current year's
-- rows from this same table (see CURRENT_SESSION_YEAR in
-- src/lib/constants.ts). Images live under "hall-of-fame/" in the same
-- public bucket.
create table if not exists hall_of_fame_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  session_year text not null,
  image_path text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- "What people say about the club" — testimonials from club personnel,
-- shown on the About page.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  person_name text not null,
  person_role text not null,
  created_at timestamptz not null default now()
);

-- Which major site sections/pages are currently shown. Rows are
-- upserted from the admin "Site Sections" page, so this seed just makes
-- sure every key exists (and defaults to visible) the first time the
-- schema runs — it's fine if the app later adds keys not listed here.
create table if not exists site_sections (
  key text primary key,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into site_sections (key) values
  ('about'), ('session_photos'), ('lineup'), ('activity_slideshow'),
  ('awards'), ('articles'), ('leaderboard'), ('hall_of_fame'),
  ('current_lineup'), ('testimonials')
on conflict (key) do nothing;

-- Note: if your site_sections table already has a `hall_of_fame` row
-- seeded `false` from back when that page was an empty placeholder, this
-- `on conflict do nothing` won't touch it — flip it on yourself from the
-- admin's Site Sections page now that the page has real content (the
-- pi-wave). The `register` key (member registration, now removed
-- entirely) is no longer seeded; its row is safe to delete manually:
--   delete from site_sections where key = 'register';

-- ========== Row Level Security ==========

alter table olympiad_registrations enable row level security;
alter table activity_log enable row level security;
alter table resources enable row level security;
alter table forum_posts enable row level security;
alter table articles enable row level security;
alter table session_photos enable row level security;
alter table leaderboards enable row level security;
alter table leaderboard_entries enable row level security;
alter table awards enable row level security;
alter table site_sections enable row level security;
alter table activity_slideshow_photos enable row level security;
alter table hall_of_fame_entries enable row level security;
alter table testimonials enable row level security;

drop policy if exists "olympiad_registrations_public_insert" on olympiad_registrations;
create policy "olympiad_registrations_public_insert" on olympiad_registrations
  for insert to anon, authenticated
  with check (true);

drop policy if exists "olympiad_registrations_admin_select" on olympiad_registrations;
create policy "olympiad_registrations_admin_select" on olympiad_registrations
  for select using (is_admin());

drop policy if exists "olympiad_registrations_admin_delete" on olympiad_registrations;
create policy "olympiad_registrations_admin_delete" on olympiad_registrations
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

-- Session photos & leaderboards are website content: publicly readable,
-- only admins write.
drop policy if exists "session_photos_public_select" on session_photos;
create policy "session_photos_public_select" on session_photos
  for select to anon, authenticated using (true);

drop policy if exists "session_photos_admin_write" on session_photos;
create policy "session_photos_admin_write" on session_photos
  for all using (is_admin()) with check (is_admin());

drop policy if exists "activity_slideshow_photos_public_select" on activity_slideshow_photos;
create policy "activity_slideshow_photos_public_select" on activity_slideshow_photos
  for select to anon, authenticated using (true);

drop policy if exists "activity_slideshow_photos_admin_write" on activity_slideshow_photos;
create policy "activity_slideshow_photos_admin_write" on activity_slideshow_photos
  for all using (is_admin()) with check (is_admin());

drop policy if exists "leaderboards_public_select" on leaderboards;
create policy "leaderboards_public_select" on leaderboards
  for select to anon, authenticated using (true);

drop policy if exists "leaderboards_admin_write" on leaderboards;
create policy "leaderboards_admin_write" on leaderboards
  for all using (is_admin()) with check (is_admin());

drop policy if exists "leaderboard_entries_public_select" on leaderboard_entries;
create policy "leaderboard_entries_public_select" on leaderboard_entries
  for select to anon, authenticated using (true);

drop policy if exists "leaderboard_entries_admin_write" on leaderboard_entries;
create policy "leaderboard_entries_admin_write" on leaderboard_entries
  for all using (is_admin()) with check (is_admin());

drop policy if exists "awards_public_select" on awards;
create policy "awards_public_select" on awards
  for select to anon, authenticated using (true);

drop policy if exists "awards_admin_write" on awards;
create policy "awards_admin_write" on awards
  for all using (is_admin()) with check (is_admin());

drop policy if exists "hall_of_fame_entries_public_select" on hall_of_fame_entries;
create policy "hall_of_fame_entries_public_select" on hall_of_fame_entries
  for select to anon, authenticated using (true);

drop policy if exists "hall_of_fame_entries_admin_write" on hall_of_fame_entries;
create policy "hall_of_fame_entries_admin_write" on hall_of_fame_entries
  for all using (is_admin()) with check (is_admin());

drop policy if exists "testimonials_public_select" on testimonials;
create policy "testimonials_public_select" on testimonials
  for select to anon, authenticated using (true);

drop policy if exists "testimonials_admin_write" on testimonials;
create policy "testimonials_admin_write" on testimonials
  for all using (is_admin()) with check (is_admin());

-- Section visibility is read by every visitor (it decides what renders)
-- but only admins can flip it.
drop policy if exists "site_sections_public_select" on site_sections;
create policy "site_sections_public_select" on site_sections
  for select to anon, authenticated using (true);

drop policy if exists "site_sections_admin_write" on site_sections;
create policy "site_sections_admin_write" on site_sections
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

-- ========== Storage (public: session photos) ==========
-- A separate PUBLIC bucket so session photos get permanent CDN URLs for
-- <img> tags. Reads are open by virtue of the bucket being public; only
-- admins can add or remove files.

insert into storage.buckets (id, name, public)
values ('mmc-public', 'mmc-public', true)
on conflict (id) do update set public = true;

drop policy if exists "mmc_public_admin_write" on storage.objects;
create policy "mmc_public_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'mmc-public' and is_admin()
  );

drop policy if exists "mmc_public_admin_delete" on storage.objects;
create policy "mmc_public_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'mmc-public' and is_admin()
  );
