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

/** Major site sections/pages the admin can show or hide. */
export type SectionKey =
  | "about"
  | "session_photos"
  | "lineup"
  | "awards"
  | "articles"
  | "leaderboard";

export const SECTION_KEYS: SectionKey[] = [
  "about",
  "session_photos",
  "lineup",
  "awards",
  "articles",
  "leaderboard",
];

export const SECTION_LABELS: Record<SectionKey, { title: string; desc: string }> = {
  about: { title: "About the Club", desc: "Home page — \"Where mathletes are made\" section." },
  session_photos: { title: "Photos From Last Session", desc: "Home page — the pi-wave photo panels." },
  lineup: { title: "How We Meet & Compete", desc: "Home page — the weekly sessions / contests cards." },
  awards: { title: "Awards Page", desc: "The /awards page and its navbar/footer link." },
  articles: { title: "Articles Page", desc: "The /articles page and its navbar/footer link." },
  leaderboard: { title: "Leaderboard Page", desc: "The /leaderboard page and its navbar/footer link." },
};
