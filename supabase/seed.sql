-- Fest Hub mock data — ONLY run this against the separate Fest Hub
-- contest deployment's Supabase project, never the real manaratmath.club
-- database (see sourceoftruth/fest-hub.md). Run schema.sql first.
--
-- Safe to re-run: fests/events upsert on their unique slug, and
-- registrations use fixed, deterministic emails per (event, index) so
-- the unique (event_id, email) constraint makes a second run a no-op
-- instead of erroring or duplicating rows. All names/emails/phones
-- below are fictional — no real student data.

-- ========== Fests ==========
-- One past (archived), one ongoing/open, one upcoming — see A1's
-- acceptance test ("seed data shows at least one fest in each tab").

insert into fests (id, slug, name, tagline, description, starts_on, ends_on, venue, status)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'mmc-math-week-2026',
    'MMC Math Week 2026',
    'A week of problem sets and talks',
    'Our previous session''s flagship week — archived now that it''s over.',
    (current_date - interval '45 days')::date,
    (current_date - interval '38 days')::date,
    'Manarat Dhaka International School & College',
    'archived'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'mmc-math-carnival-2026',
    'MMC Math Carnival 2026',
    'Contests, workshops, and a quiz night',
    'The club''s main carnival for this session — register below for any event.',
    (current_date - interval '2 days')::date,
    (current_date + interval '5 days')::date,
    'Manarat Dhaka International School & College',
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'intra-math-olympiad-2027',
    'Intra Math Olympiad 2027',
    'The next session''s flagship olympiad',
    'Registration opens closer to the date — check back soon.',
    (current_date + interval '60 days')::date,
    (current_date + interval '61 days')::date,
    'Manarat Dhaka International School & College',
    'published'
  )
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  venue = excluded.venue,
  status = excluded.status;

-- ========== Events ==========
-- Deliberately covers every state a judge should see (see the PRD):
-- open with seats, closing within 24h, full with waitlist on, full
-- with waitlist off, deadline passed, not yet open, unlimited
-- capacity — across all five categories.

insert into events (
  id, fest_id, slug, name, category, summary, description,
  starts_at, ends_at, venue, eligibility,
  registration_opens_at, registration_deadline,
  capacity, waitlist_enabled, status
) values
  -- Past fest's events (archived, for completeness).
  (
    '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
    'speed-mental-math', 'Speed Mental Math', 'Competition',
    'Fast arithmetic under pressure.', 'A timed mental-math contest, open to all classes.',
    (current_date - interval '40 days')::date + time '10:00',
    (current_date - interval '40 days')::date + time '12:00',
    'Room 101', 'All classes',
    (current_date - interval '50 days')::date, (current_date - interval '41 days')::date,
    40, true, 'archived'
  ),

  -- Ongoing carnival's events — the main demo surface.
  (
    '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002',
    'ai-web-dev-contest', 'AI Web Development Contest', 'Competition',
    'Build a smart club operations platform.', 'Teams build a web platform for club operations — see the full rulebook at the venue.',
    (current_date + interval '3 days')::date + time '09:00',
    (current_date + interval '4 days')::date + time '18:00',
    'Computer Lab', 'Classes 9-12',
    current_timestamp - interval '5 days', current_timestamp + interval '18 hours', -- closing soon
    40, true, 'published'
  ),
  (
    '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000002',
    'robotics-challenge', 'Robotics Challenge', 'Competition',
    'Build and race a line-following robot.', 'Bring your own kit or use one of ours.',
    (current_date + interval '2 days')::date + time '10:00', null,
    'Science Lab', 'Classes 6-12',
    current_timestamp - interval '10 days', current_timestamp + interval '6 days',
    12, false, 'published' -- full, waitlist OFF
  ),
  (
    '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000002',
    'gaming-tournament', 'Gaming Tournament', 'Social',
    'A casual inter-house gaming night.', 'Chess and a few casual multiplayer games — just for fun.',
    (current_date + interval '1 day')::date + time '16:00', null,
    'Common Room', 'All classes',
    current_timestamp - interval '8 days', current_timestamp + interval '20 hours', -- closing soon
    20, true, 'published' -- full, waitlist ON
  ),
  (
    '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000002',
    'intro-to-proofs-workshop', 'Intro to Proofs Workshop', 'Workshop',
    'A gentle introduction to mathematical proof.', 'No prior olympiad experience needed.',
    (current_date + interval '2 days')::date + time '14:00',
    (current_date + interval '2 days')::date + time '16:00',
    'Room 204', 'Classes 7-10',
    current_timestamp - interval '5 days', current_timestamp + interval '4 days',
    null, true, 'published' -- unlimited capacity
  ),
  (
    '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000002',
    'number-theory-quiz', 'Number Theory Quiz', 'Quiz',
    'A buzzer-style quiz on number theory.', 'Individual quiz, 20 questions.',
    (current_date + interval '3 days')::date + time '11:00',
    (current_date + interval '3 days')::date + time '12:30',
    'Auditorium', 'Classes 9-12',
    current_timestamp - interval '6 days', current_timestamp + interval '2 days',
    50, true, 'published'
  ),
  (
    '00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000002',
    'executive-panel-session', 'Executive Panel: Life After Olympiads', 'Session',
    'Alumni share what came next.', 'A panel discussion with club alumni.',
    (current_date + interval '4 days')::date + time '17:00', null,
    'Auditorium', 'All classes',
    current_timestamp - interval '5 days', current_timestamp + interval '3 days',
    100, true, 'published'
  ),
  (
    '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000002',
    'combinatorics-workshop', 'Combinatorics Workshop', 'Workshop',
    'Counting techniques for olympiad problems.', 'Covers permutations, combinations, and the pigeonhole principle.',
    (current_date - interval '1 day')::date + time '10:00',
    (current_date - interval '1 day')::date + time '12:00',
    'Room 204', 'Classes 9-12',
    current_timestamp - interval '12 days', current_timestamp - interval '2 days', -- deadline passed
    30, true, 'published'
  ),
  (
    '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000002',
    'team-relay-round', 'Team Relay Round', 'Competition',
    'A relay-style team contest.', 'Teams of 4 pass answers down the line against the clock.',
    (current_date + interval '5 days')::date + time '10:00', null,
    'Gymnasium', 'Classes 6-12',
    current_timestamp + interval '1 day', current_timestamp + interval '6 days', -- not yet open
    24, true, 'published'
  ),

  -- Upcoming olympiad's events (registration not open yet).
  (
    '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000003',
    'intra-olympiad-2027-main', 'Intra Math Olympiad 2027 — Main Round', 'Competition',
    'The main individual round.', 'Full rules released closer to the date.',
    (current_date + interval '60 days')::date + time '09:00', null,
    'Auditorium', 'All classes',
    current_timestamp + interval '45 days', current_timestamp + interval '58 days', -- not yet open
    200, true, 'published'
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  description = excluded.description,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  venue = excluded.venue,
  eligibility = excluded.eligibility,
  registration_opens_at = excluded.registration_opens_at,
  registration_deadline = excluded.registration_deadline,
  capacity = excluded.capacity,
  waitlist_enabled = excluded.waitlist_enabled,
  status = excluded.status;

-- ========== Registrations ==========
-- 150-250 fictional registrations spread over the last ~2 weeks (so
-- the organizer dashboard's sign-ups-per-day chart has real shape),
-- with mixed statuses. Deterministic per (event, index) email so a
-- second run of this script is a no-op via the unique constraint.

do $$
declare
  schools text[] := array[
    'Manarat Dhaka International School', 'DRMC', 'Scholastica',
    'Sunbeams School', 'Mastermind School', 'Maple Leaf International',
    'South Breeze School', 'Viqarunnisa Noon School'
  ];
  first_names text[] := array[
    'Ayesha','Rafi','Nusrat','Tanvir','Mehjabin','Sadman','Farzana','Imtiaz',
    'Labiba','Rakib','Samira','Fahim','Tasnim','Arman','Promi','Shuvo',
    'Anika','Zayan','Ishrat','Nabil'
  ];
  last_names text[] := array[
    'Rahman','Islam','Chowdhury','Hossain','Ahmed','Karim','Hasan','Akter',
    'Siddique','Alam'
  ];
  ev record;
  i integer;
  n integer;
  total_for_event integer;
  seat_cap integer;
  reg_status text;
  days_ago integer;
begin
  for ev in select id, capacity, waitlist_enabled, slug from events loop
    -- Roughly fill (and for the two "full" demo events, overfill)
    -- each event's capacity; unlimited-capacity events get a flat 18.
    seat_cap := coalesce(ev.capacity, 18);
    if ev.slug in ('robotics-challenge', 'gaming-tournament') then
      total_for_event := seat_cap + 4; -- intentionally over capacity
    elsif ev.slug = 'intra-olympiad-2027-main' then
      total_for_event := 0; -- registration not open yet — no sign-ups possible
    else
      total_for_event := greatest(3, round(seat_cap * 0.6)::int);
    end if;

    for i in 1..total_for_event loop
      n := (hashtext(ev.slug || '-' || i::text));
      days_ago := abs(n) % 14;
      if ev.capacity is not null and i <= ev.capacity then
        reg_status := case when abs(n) % 11 = 0 then 'attended' else 'confirmed' end;
      elsif ev.capacity is not null then
        reg_status := case when ev.waitlist_enabled then 'waitlisted' else 'rejected' end;
      else
        reg_status := 'confirmed';
      end if;
      if abs(n) % 17 = 0 then
        reg_status := 'cancelled';
      end if;

      insert into event_registrations (
        event_id, ticket_code, full_name, email, phone, school, class_name,
        status, created_at
      ) values (
        ev.id,
        'MMC-' || upper(substr(md5(ev.slug || i::text), 1, 6)),
        first_names[1 + abs(n) % array_length(first_names, 1)] || ' ' ||
          last_names[1 + abs(n / 7) % array_length(last_names, 1)],
        'student' || abs(n) || '@example.com',
        '01700' || lpad((abs(n) % 1000000)::text, 6, '0'),
        schools[1 + abs(n / 3) % array_length(schools, 1)],
        (6 + abs(n) % 7)::text,
        reg_status,
        current_timestamp - (days_ago || ' days')::interval - (abs(n) % 1440 || ' minutes')::interval
      )
      on conflict (event_id, email) do nothing;
    end loop;
  end loop;
end $$;

-- Judge demo registrations — one email, three different statuses
-- across three different events, so /my-registrations has something
-- real to show. Ticket codes are fixed/readable for the README.
insert into event_registrations (event_id, ticket_code, full_name, email, phone, school, class_name, status)
values
  ('00000000-0000-0000-0000-000000000201', 'MMC-DEMO01', 'Judge Demo', 'judge@example.com', '01700000001', 'Demo School', '10', 'confirmed'),
  ('00000000-0000-0000-0000-000000000203', 'MMC-DEMO02', 'Judge Demo', 'judge@example.com', '01700000001', 'Demo School', '10', 'waitlisted'),
  ('00000000-0000-0000-0000-000000000206', 'MMC-DEMO03', 'Judge Demo', 'judge@example.com', '01700000001', 'Demo School', '10', 'attended')
on conflict (event_id, email) do nothing;

-- ========== Site section toggle ==========
-- Only ever run on the Fest Hub deployment's database — the real
-- manaratmath.club database must never get this row (see
-- SECTION_DEFAULT_VISIBLE.fests in src/lib/types.ts).
insert into site_sections (key, visible) values ('fests', true)
on conflict (key) do update set visible = true;
