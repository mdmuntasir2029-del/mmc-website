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
  fileDataUrl: string | null;
  createdAt: string;
}

export type ResourceCategory = "presentations" | "quizzes" | "questions";

export interface ResourceItem {
  id: string;
  title: string;
  fileName: string;
  fileDataUrl: string;
  uploadedAt: string;
}

export interface ForumPost {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}
