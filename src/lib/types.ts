/** A submission to the (unlinked, URL-only) intra math olympiad
 *  registration form — see OlympiadRegister.tsx. */
export interface OlympiadRegistration {
  id: string;
  fullName: string;
  school: string;
  className: string;
  gender: string;
  phone: string;
  email: string | null;
  createdAt: string;
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

/**
 * Admin-panel areas that can be granted to individual admins by the
 * super admin (see AdminRoles.tsx / grant_admin_section in schema.sql).
 * Distinct from SectionKey below — that controls what VISITORS see;
 * this controls what a given ADMIN can reach in /admin. The super admin
 * always has every section regardless of what's granted here. Dashboard
 * isn't listed since every admin can see it.
 */
export type AdminSection =
  | "activity_log"
  | "resources"
  | "articles"
  | "session_photos"
  | "activity_slideshow"
  | "leaderboards"
  | "awards"
  | "olympiad_registrations"
  | "forum"
  | "site_sections";

export const ADMIN_SECTION_LABELS: Record<AdminSection, string> = {
  activity_log: "Club Activity Log",
  resources: "Resources",
  articles: "Articles",
  session_photos: "Session Photos (Home hero)",
  activity_slideshow: "Activity Slideshow (About)",
  leaderboards: "Leaderboards",
  awards: "Awards",
  olympiad_registrations: "Olympiad Registrations",
  forum: "Executive Forum",
  site_sections: "Site Sections",
};

/** Major site sections/pages the admin can show or hide. */
export type SectionKey =
  | "about"
  | "session_photos"
  | "lineup"
  | "activity_slideshow"
  | "awards"
  | "articles"
  | "leaderboard"
  | "hall_of_fame";

export const SECTION_KEYS: SectionKey[] = [
  "about",
  "session_photos",
  "lineup",
  "activity_slideshow",
  "awards",
  "articles",
  "leaderboard",
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
  hall_of_fame: { title: "Hall of Fame Page", desc: "The /hall-of-fame page and its navbar/footer link — now hosts the pi-wave." },
};

/**
 * Client-side fallback used before the DB responds (and for any key the
 * DB has no row for yet, e.g. schema.sql hasn't been re-run). Note this
 * fallback only applies before schema.sql's seed row exists for a key
 * (or before the DB responds) — once a `site_sections` row exists for
 * `hall_of_fame` (seeded `false` back when the page was a placeholder),
 * the admin needs to flip it on themselves from the Site Sections page
 * now that it has real content; changing this default alone won't do it.
 */
export const SECTION_DEFAULT_VISIBLE: Record<SectionKey, boolean> = {
  about: true,
  session_photos: true,
  lineup: true,
  activity_slideshow: true,
  awards: true,
  articles: true,
  leaderboard: true,
  hall_of_fame: true,
};
