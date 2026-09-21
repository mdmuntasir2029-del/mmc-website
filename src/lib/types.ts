export interface Member {
  id: string;
  name: string;
  className: string;
  section: string;
  roll: string;
  studentCode: string;
  phone: string;
  email: string | null;
  registeredAt: string;
}

export interface ActivityLogEntry {
  id: string;
  date: string;
  title: string;
  what: string;
  where: string;
  how: string;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
}

export type ResourceCategory = "presentations" | "quizzes" | "questions";

export interface ResourceItem {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface ForumPost {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  abstract: string;
  publishedDate: string;
  fileName: string | null;
  filePath: string | null;
  link: string | null;
  createdAt: string;
}

export interface SessionPhoto {
  id: string;
  sessionLabel: string;
  sessionDate: string;
  imagePath: string;
  imageUrl: string;
  /** srcset value covering several widths, for responsive <img> sizing. */
  imageSrcSet: string;
  caption: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number | null;
}

export interface Leaderboard {
  id: string;
  game: string;
  playedOn: string;
  createdAt: string;
  entries: LeaderboardEntry[];
}

export interface Award {
  id: string;
  name: string;
  achievement: string;
  initials: string | null;
  createdAt: string;
}

/** A photo in the About page's activity slideshow — its own set,
 *  independent of the homepage's Session Photos, also organized by week. */
export interface ActivitySlideshowPhoto {
  id: string;
  weekLabel: string;
  photoDate: string;
  imagePath: string;
  imageUrl: string;
  /** srcset value covering several widths, for responsive <img> sizing. */
  imageSrcSet: string;
  caption: string | null;
  createdAt: string;
}

/** Major site sections/pages the admin can show or hide. */
export type SectionKey =
  | "about"
  | "session_photos"
  | "lineup"
  | "activity_slideshow"
  | "awards"
  | "articles"
  | "leaderboard"
  | "register"
  | "hall_of_fame";

export const SECTION_KEYS: SectionKey[] = [
  "about",
  "session_photos",
  "lineup",
  "activity_slideshow",
  "awards",
  "articles",
  "leaderboard",
  "register",
  "hall_of_fame",
];

export const SECTION_LABELS: Record<SectionKey, { title: string; desc: string }> = {
  about: { title: "About Page", desc: "The /about page and its navbar/footer link — the whole page, including the sub-sections below." },
  session_photos: { title: "Hero Photo Slideshow", desc: "Home page — the latest session's photos, running behind the hero text." },
  lineup: { title: "How We Meet & Compete", desc: "Home page — the weekly sessions / contests cards." },
  activity_slideshow: { title: "Activity Slideshow", desc: "About page — the admin-managed photo slideshow, organized by week." },
  awards: { title: "Awards Page", desc: "The /awards page and its navbar/footer link." },
  articles: { title: "Articles Page", desc: "The /articles page and its navbar/footer link." },
  leaderboard: { title: "Leaderboard Page", desc: "The /leaderboard page and its navbar/footer link." },
  register: {
    title: "Member Registration",
    desc: "The /register page, its nav/footer/hero links, and the hero \"registrations open\" line. Sign-in is unaffected.",
  },
  hall_of_fame: { title: "Hall of Fame Page", desc: "The /hall-of-fame page and its navbar/footer link — now hosts the pi-wave." },
};

/**
 * Client-side fallback used before the DB responds (and for any key the
 * DB has no row for yet, e.g. schema.sql hasn't been re-run). Every
 * section defaults to visible except registration (deliberately paused
 * site-wide) — that should read as hidden immediately on deploy rather
 * than depending on an admin remembering to also flip a DB toggle (or
 * re-run a migration) at the same time. Note this fallback only applies
 * before schema.sql's seed row exists for a key (or before the DB
 * responds) — once a `site_sections` row exists for `hall_of_fame`
 * (seeded `false` back when the page was a placeholder), the admin
 * needs to flip it on themselves from the Site Sections page now that
 * it has real content; changing this default alone won't do it.
 */
export const SECTION_DEFAULT_VISIBLE: Record<SectionKey, boolean> = {
  about: true,
  session_photos: true,
  lineup: true,
  activity_slideshow: true,
  awards: true,
  articles: true,
  leaderboard: true,
  register: false,
  hall_of_fame: true,
};
