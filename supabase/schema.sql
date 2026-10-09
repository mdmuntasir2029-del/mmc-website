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

-- Reusable named bundles of section permissions (e.g. "Content Editor"
-- granting articles + resources) — same locked-down "RLS enabled, zero
-- policies" pattern, only reachable through the RPCs below.
create table if not exists admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table admin_roles enable row level security;

create table if not exists admin_role_permissions (
  role_id uuid not null references admin_roles (id) on delete cascade,
  section text not null,
  primary key (role_id, section)
);

alter table admin_role_permissions enable row level security;

create table if not exists admin_role_assignments (
  email text not null,
  role_id uuid not null references admin_roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (email, role_id)
);

alter table admin_role_assignments enable row level security;

-- What sections can the CALLING admin access? Any signed-in admin can
-- call this for themselves (no is_super_admin check) — the super admin
-- implicitly has every section regardless of what's in the table, which
-- the app's AuthContext accounts for rather than this function. Unions
-- sections granted directly with sections granted via an assigned role.
create or replace function my_admin_permissions() returns setof text
language sql security definer stable
set search_path = public
as $$
  select section from admin_permissions
  where email = (auth.jwt() ->> 'email')
  union
  select rp.section from admin_role_permissions rp
  join admin_role_assignments ra on ra.role_id = rp.role_id
  where ra.email = (auth.jwt() ->> 'email');
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
  delete from admin_role_assignments where lower(email) = lower(target_email);
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

-- ---------- Named roles (reusable permission bundles) ----------

create or replace function list_admin_roles() returns table (id uuid, name text, created_at timestamptz)
language sql security definer stable
set search_path = public
as $$
  select r.id, r.name, r.created_at from admin_roles r where is_super_admin();
$$;

grant execute on function list_admin_roles() to authenticated;

create or replace function list_admin_role_permissions() returns table (role_id uuid, section text)
language sql security definer stable
set search_path = public
as $$
  select rp.role_id, rp.section from admin_role_permissions rp where is_super_admin();
$$;

grant execute on function list_admin_role_permissions() to authenticated;

create or replace function list_admin_role_assignments() returns table (email text, role_id uuid)
language sql security definer stable
set search_path = public
as $$
  select ra.email, ra.role_id from admin_role_assignments ra where is_super_admin();
$$;

grant execute on function list_admin_role_assignments() to authenticated;

create or replace function create_admin_role(role_name text) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can create roles.';
  end if;
  insert into admin_roles (name) values (trim(role_name)) returning id into new_id;
  return new_id;
end;
$$;

grant execute on function create_admin_role(text) to authenticated;

create or replace function delete_admin_role(target_role_id uuid) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can delete roles.';
  end if;
  delete from admin_roles where id = target_role_id;
end;
$$;

grant execute on function delete_admin_role(uuid) to authenticated;

create or replace function grant_admin_role_section(target_role_id uuid, target_section text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can edit roles.';
  end if;
  insert into admin_role_permissions (role_id, section) values (target_role_id, target_section)
  on conflict (role_id, section) do nothing;
end;
$$;

grant execute on function grant_admin_role_section(uuid, text) to authenticated;

create or replace function revoke_admin_role_section(target_role_id uuid, target_section text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can edit roles.';
  end if;
  delete from admin_role_permissions
  where role_id = target_role_id and section = target_section;
end;
$$;

grant execute on function revoke_admin_role_section(uuid, text) to authenticated;

create or replace function assign_admin_role(target_email text, target_role_id uuid) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can assign roles.';
  end if;
  insert into admin_role_assignments (email, role_id) values (lower(target_email), target_role_id)
  on conflict (email, role_id) do nothing;
end;
$$;

grant execute on function assign_admin_role(text, uuid) to authenticated;

create or replace function unassign_admin_role(target_email text, target_role_id uuid) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'Only the super admin can unassign roles.';
  end if;
  delete from admin_role_assignments
  where lower(email) = lower(target_email) and role_id = target_role_id;
end;
$$;

grant execute on function unassign_admin_role(text, uuid) to authenticated;

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

-- Extra fields for the FRD mode "Executive Board" module — optional, so
-- entries added before this stage (or for non-exec roster members)
-- don't need them.
alter table hall_of_fame_entries add column if not exists favorite_constant text;
alter table hall_of_fame_entries add column if not exists research_area text;

-- "What people say about the club" — testimonials from club personnel,
-- shown on the About page.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  person_name text not null,
  person_role text not null,
  created_at timestamptz not null default now()
);

-- Club announcements — image-only posts shown on the Home page, newest
-- first. Images live under "announcements/" in the same public bucket.
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- image_width/image_height: the upload's real pixel dimensions, read
-- client-side before upload (see admin/Announcements.tsx) — used as the
-- public <img>'s width/height attributes so the browser reserves the
-- CORRECT aspect ratio before the image loads. Without these, every
-- reload briefly lays the grid out with no size hint at all (images
-- vary in shape, unlike session photos, so a single guessed ratio
-- would be wrong for most of them) and then snaps once each image
-- finishes loading — the "resolution messes up on reload" report.
-- embed_url: optional "learn more" link. description: the longer
-- blog-post-style body shown in the detail popup. likes_count: a
-- simple counter (see the increment_announcement_likes() RPC below) —
-- good enough for a club site without a visitor-account system to key
-- a proper per-user like off of.
alter table announcements add column if not exists image_width integer;
alter table announcements add column if not exists image_height integer;
alter table announcements add column if not exists embed_url text;
alter table announcements add column if not exists description text;
alter table announcements add column if not exists likes_count integer not null default 0;

-- Open comments (no visitor-account system on this site) — a display
-- name plus a message, same low-friction pattern as the Olympiad
-- registration / issue reports forms.
create table if not exists announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements (id) on delete cascade,
  author_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function increment_announcement_likes(target_id uuid) returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update announcements set likes_count = likes_count + 1
  where id = target_id
  returning likes_count into new_count;
  return new_count;
end;
$$;

grant execute on function increment_announcement_likes(uuid) to anon, authenticated;

-- Bug reports / suggestions submitted via the sitewide "Report an
-- issue" button. Visible only to the super admin (mdmuntasir.2029@
-- gmail.com), not every admin — see is_super_admin() above.
create table if not exists issue_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bug', 'suggestion')),
  message text not null,
  reporter_email text,
  created_at timestamptz not null default now()
);

-- ========== FRD mode content ==========
-- Content for the toggleable FRD preview mode (see FrdModeContext) —
-- public select / admin write, same pattern as everything else.

create table if not exists problem_of_the_day (
  id uuid primary key default gen_random_uuid(),
  problem_date date not null unique,
  latex_problem text not null,
  hints text[] not null default '{}',
  answer_text text not null,
  solution_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists upcoming_competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  created_at timestamptz not null default now()
);

-- "Past contest papers, solution keys" for the Competition Archive
-- bento — a question paper and (optionally) its solution key, kept as
-- two separate downloadable files rather than folded into the generic
-- `resources` table, since a contest entry naturally has both. Files
-- live in the private mmc-files bucket (signed-URL downloads, same as
-- Articles/Resources), not the public image bucket.
create table if not exists competition_archive (
  id uuid primary key default gen_random_uuid(),
  contest_name text not null,
  contest_year text not null,
  paper_path text not null,
  solution_path text,
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
  ('awards'), ('articles'), ('resources'), ('leaderboard'), ('hall_of_fame'),
  ('current_lineup'), ('testimonials'), ('announcements')
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
alter table announcements enable row level security;
alter table announcement_comments enable row level security;
alter table issue_reports enable row level security;
alter table problem_of_the_day enable row level security;
alter table upcoming_competitions enable row level security;
alter table competition_archive enable row level security;

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

drop policy if exists "announcements_public_select" on announcements;
create policy "announcements_public_select" on announcements
  for select to anon, authenticated using (true);

drop policy if exists "announcements_admin_write" on announcements;
create policy "announcements_admin_write" on announcements
  for all using (is_admin()) with check (is_admin());

-- Comments are public to post and read (open, no visitor accounts);
-- only admins can delete (moderation).
drop policy if exists "announcement_comments_public_select" on announcement_comments;
create policy "announcement_comments_public_select" on announcement_comments
  for select to anon, authenticated using (true);

drop policy if exists "announcement_comments_public_insert" on announcement_comments;
create policy "announcement_comments_public_insert" on announcement_comments
  for insert to anon, authenticated with check (true);

drop policy if exists "announcement_comments_admin_delete" on announcement_comments;
create policy "announcement_comments_admin_delete" on announcement_comments
  for delete using (is_admin());

-- Anyone can report an issue; only the super admin can read or clear
-- them (not every admin — see is_super_admin() above).
drop policy if exists "issue_reports_public_insert" on issue_reports;
create policy "issue_reports_public_insert" on issue_reports
  for insert to anon, authenticated
  with check (true);

drop policy if exists "issue_reports_super_admin_select" on issue_reports;
create policy "issue_reports_super_admin_select" on issue_reports
  for select using (is_super_admin());

drop policy if exists "issue_reports_super_admin_delete" on issue_reports;
create policy "issue_reports_super_admin_delete" on issue_reports
  for delete using (is_super_admin());

drop policy if exists "problem_of_the_day_public_select" on problem_of_the_day;
create policy "problem_of_the_day_public_select" on problem_of_the_day
  for select to anon, authenticated using (true);

drop policy if exists "problem_of_the_day_admin_write" on problem_of_the_day;
create policy "problem_of_the_day_admin_write" on problem_of_the_day
  for all using (is_admin()) with check (is_admin());

drop policy if exists "upcoming_competitions_public_select" on upcoming_competitions;
create policy "upcoming_competitions_public_select" on upcoming_competitions
  for select to anon, authenticated using (true);

drop policy if exists "upcoming_competitions_admin_write" on upcoming_competitions;
create policy "upcoming_competitions_admin_write" on upcoming_competitions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "competition_archive_public_select" on competition_archive;
create policy "competition_archive_public_select" on competition_archive
  for select to anon, authenticated using (true);

drop policy if exists "competition_archive_admin_write" on competition_archive;
create policy "competition_archive_admin_write" on competition_archive
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

-- ========== Fest Hub (Organization -> Fest -> Event -> Registration) ==========
-- Built for the 9th DRMC International Tech Carnival 2026 AI Web Dev
-- Contest — see sourceoftruth/fest-hub.md for the full design. Runs
-- against its OWN Supabase project for the contest deployment (see
-- docs/SETUP.md); on the real manaratmath.club database this just adds
-- empty tables, since the `fests` SectionKey defaults to hidden there
-- (no `site_sections` row inserted for it below).

create table if not exists fests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  cover_path text,
  starts_on date not null,
  ends_on date not null,
  venue text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  fest_id uuid not null references fests (id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('Competition', 'Workshop', 'Quiz', 'Session', 'Social')),
  summary text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  eligibility text,
  registration_opens_at timestamptz not null default now(),
  registration_deadline timestamptz not null,
  capacity integer, -- null = unlimited
  waitlist_enabled boolean not null default true,
  cover_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists events_fest_idx on events (fest_id);

-- Organizer-defined extra registration fields for this event (e.g. team
-- name / teammate names for a team event) — an array of
-- {key, label, type: "text"|"textarea"|"select", required, options}.
-- Deliberately schemaless (jsonb) rather than new columns, since the
-- set of fields varies per event, not per table.
alter table events add column if not exists custom_fields jsonb not null default '[]'::jsonb;

-- No public select policy at all (see the admins/admin_permissions
-- pattern above) — every public read/write goes through the
-- SECURITY DEFINER functions below, which never return more than a
-- participant's own rows. Admins read/write the whole table directly.
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  ticket_code text not null unique,
  full_name text not null,
  email text not null,
  phone text not null,
  school text,
  class_name text,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected', 'attended')
  ),
  checked_in_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);

-- Answers to that event's custom_fields, keyed by field "key". Validated
-- client-side against the event's field list (required/type), same
-- trust level as every other visitor-supplied column on this table.
alter table event_registrations add column if not exists custom_field_values jsonb not null default '{}'::jsonb;

create index if not exists event_registrations_event_idx on event_registrations (event_id);

alter table fests enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;

drop policy if exists "fests_public_select" on fests;
create policy "fests_public_select" on fests
  for select to anon, authenticated
  using (status in ('published', 'archived'));

drop policy if exists "fests_admin_write" on fests;
create policy "fests_admin_write" on fests
  for all using (is_admin()) with check (is_admin());

drop policy if exists "events_public_select" on events;
create policy "events_public_select" on events
  for select to anon, authenticated
  using (status in ('published', 'archived'));

drop policy if exists "events_admin_write" on events;
create policy "events_admin_write" on events
  for all using (is_admin()) with check (is_admin());

-- event_registrations: admins can read/manage everything directly;
-- everyone else goes through register_for_event / get_my_registrations
-- / cancel_my_registration below, never the table itself.
drop policy if exists "event_registrations_admin_all" on event_registrations;
create policy "event_registrations_admin_all" on event_registrations
  for all using (is_admin()) with check (is_admin());

-- Short, readable ticket codes (e.g. MMC-7K2Q9F) — retries on the rare
-- collision against the table's own unique constraint.
create or replace function generate_ticket_code() returns text
language plpgsql
as $$
declare
  candidate text;
  tries integer := 0;
begin
  loop
    candidate := 'MMC-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from event_registrations where ticket_code = candidate);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'Could not generate a unique ticket code';
    end if;
  end loop;
  return candidate;
end;
$$;

-- The only way the public can create a registration. Locks the event
-- row first (select ... for update) so two near-simultaneous
-- registrations can't both claim the last seat.
--
-- Dropped and recreated (rather than a plain `create or replace`) because
-- changing either the parameter list or the output columns changes the
-- function's identity/return type — `create or replace` refuses both
-- ("cannot change return type") and would otherwise leave an old version
-- in place as a second overload instead of replacing it. Both prior
-- signatures are dropped so this is idempotent regardless of which one a
-- given database currently has.
drop function if exists register_for_event(uuid, text, text, text, text, text);
drop function if exists register_for_event(uuid, text, text, text, text, text, jsonb);

create or replace function register_for_event(
  p_event_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_school text,
  p_class_name text,
  p_custom_field_values jsonb default '{}'::jsonb
) returns table (id uuid, ticket_code text, status text)
language plpgsql security definer
set search_path = public
as $$
declare
  ev events%rowtype;
  taken integer;
  new_id uuid;
  new_code text;
  new_status text;
begin
  -- Table-qualified: this function's own `returns table (id uuid, ...)`
  -- output column would otherwise make a bare `id` ambiguous here too.
  select * into ev from events where events.id = p_event_id for update;
  if not found then
    raise exception 'Event not found.';
  end if;
  if ev.status != 'published' then
    raise exception 'This event is not open for registration.';
  end if;
  if now() < ev.registration_opens_at then
    raise exception 'Registration has not opened yet.';
  end if;
  if now() > ev.registration_deadline then
    raise exception 'The registration deadline has passed.';
  end if;
  if exists (
    select 1 from event_registrations
    where event_id = p_event_id and lower(email) = lower(p_email)
  ) then
    raise exception 'This email is already registered for this event.';
  end if;

  -- Table-qualified: this function's own `returns table (..., status text)`
  -- output column would otherwise make a bare `status` ambiguous here.
  select count(*) into taken from event_registrations
    where event_registrations.event_id = p_event_id
      and event_registrations.status in ('confirmed', 'attended');

  if ev.capacity is null or taken < ev.capacity then
    new_status := 'confirmed';
  elsif ev.waitlist_enabled then
    new_status := 'waitlisted';
  else
    raise exception 'This event is full.';
  end if;

  new_code := generate_ticket_code();

  insert into event_registrations (
    event_id, ticket_code, full_name, email, phone, school, class_name, status, custom_field_values
  ) values (
    p_event_id, new_code, trim(p_full_name), lower(trim(p_email)), trim(p_phone),
    nullif(trim(p_school), ''), nullif(trim(p_class_name), ''), new_status,
    coalesce(p_custom_field_values, '{}'::jsonb)
  )
  returning event_registrations.id into new_id;

  return query select new_id, new_code, new_status;
end;
$$;

grant execute on function register_for_event(uuid, text, text, text, text, text, jsonb) to anon, authenticated;

-- The "login" for visitors without accounts: only returns rows if the
-- ticket code matches one of that email's own registrations, so
-- knowing someone's email alone isn't enough to see their data.
create or replace function get_my_registrations(p_email text, p_ticket_code text)
returns table (
  id uuid,
  event_id uuid,
  ticket_code text,
  full_name text,
  email text,
  phone text,
  school text,
  class_name text,
  status text,
  checked_in_at timestamptz,
  created_at timestamptz
)
language plpgsql security definer
set search_path = public
as $$
begin
  -- Table-qualified throughout this function: every RETURNS TABLE output
  -- column here is named identically to an event_registrations column, so
  -- a bare `email`/`ticket_code`/etc. is ambiguous between the two.
  if not exists (
    select 1 from event_registrations
    where lower(event_registrations.email) = lower(p_email)
      and event_registrations.ticket_code = p_ticket_code
  ) then
    return;
  end if;

  return query
    select r.id, r.event_id, r.ticket_code, r.full_name, r.email, r.phone,
           r.school, r.class_name, r.status, r.checked_in_at, r.created_at
    from event_registrations r
    where lower(r.email) = lower(p_email)
    order by r.created_at desc;
end;
$$;

grant execute on function get_my_registrations(text, text) to anon, authenticated;

create or replace function cancel_my_registration(p_ticket_code text, p_email text) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update event_registrations
  set status = 'cancelled', updated_at = now()
  where ticket_code = p_ticket_code
    and lower(email) = lower(p_email)
    and status not in ('cancelled');

  if not found then
    raise exception 'No matching registration found for that ticket code and email.';
  end if;
end;
$$;

grant execute on function cancel_my_registration(text, text) to anon, authenticated;

-- Bonus: automatic waitlist promotion. Whenever a confirmed registration
-- frees up (cancelled by the visitor, or rejected by an organizer), the
-- longest-waiting "waitlisted" row for the same event is bumped to
-- "confirmed" automatically — no admin action needed. security definer
-- so this fires correctly whether the triggering update came from
-- cancel_my_registration (runs as the function owner) or a direct admin
-- table update (runs as the signed-in admin); either way this trigger's
-- own update bypasses event_registrations' admin-only RLS policy, same
-- bypass pattern as every other security definer function above.
create or replace function promote_waitlist() returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  next_row event_registrations%rowtype;
begin
  if new.status in ('cancelled', 'rejected') and old.status = 'confirmed' then
    select * into next_row from event_registrations
      where event_id = new.event_id and status = 'waitlisted'
      order by created_at asc
      limit 1
      for update skip locked;
    if found then
      update event_registrations
        set status = 'confirmed', updated_at = now()
        where id = next_row.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_promote_waitlist on event_registrations;
create trigger trg_promote_waitlist
  after update on event_registrations
  for each row execute function promote_waitlist();

-- Lets the public directory show "12 seats left" without exposing any
-- participant row.
create or replace function get_event_seat_counts()
returns table (event_id uuid, taken integer)
language sql security definer stable
set search_path = public
as $$
  select event_id, count(*)::int as taken
  from event_registrations
  where status in ('confirmed', 'attended')
  group by event_id;
$$;

grant execute on function get_event_seat_counts() to anon, authenticated;
