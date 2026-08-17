/**
 * Data layer for the site. Every function is async and returns a Promise,
 * even though the current implementation is synchronous localStorage —
 * that keeps every call site (components) already shaped correctly for
 * a future swap to a real backend (Supabase), which only requires
 * rewriting the function bodies in this file.
 */
import { readList, writeList, newId } from "./storage";
import type {
  Member,
  ActivityLogEntry,
  ResourceCategory,
  ResourceItem,
  ForumPost,
} from "./types";

const KEYS = {
  members: "members",
  activityLog: "activity_log",
  resources: "resources",
  forum: "forum_posts",
};

function resourceKey(category: ResourceCategory): string {
  return `${KEYS.resources}:${category}`;
}

// ---------- Members ----------

export async function getMembers(): Promise<Member[]> {
  return readList<Member>(KEYS.members).sort((a, b) =>
    b.registeredAt.localeCompare(a.registeredAt)
  );
}

export async function addMember(
  data: Omit<Member, "id" | "registeredAt">
): Promise<Member> {
  const member: Member = {
    ...data,
    id: newId(),
    registeredAt: new Date().toISOString(),
  };
  const list = readList<Member>(KEYS.members);
  list.push(member);
  writeList(KEYS.members, list);
  return member;
}

export async function deleteMember(id: string): Promise<void> {
  const list = readList<Member>(KEYS.members).filter((m) => m.id !== id);
  writeList(KEYS.members, list);
}

// ---------- Club Activity Log ----------

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  return readList<ActivityLogEntry>(KEYS.activityLog).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

export async function addActivityLogEntry(
  data: Omit<ActivityLogEntry, "id" | "createdAt">
): Promise<ActivityLogEntry> {
  const entry: ActivityLogEntry = {
    ...data,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  const list = readList<ActivityLogEntry>(KEYS.activityLog);
  list.push(entry);
  writeList(KEYS.activityLog, list);
  return entry;
}

export async function deleteActivityLogEntry(id: string): Promise<void> {
  const list = readList<ActivityLogEntry>(KEYS.activityLog).filter(
    (e) => e.id !== id
  );
  writeList(KEYS.activityLog, list);
}

// ---------- Resources ----------

export async function getResources(
  category: ResourceCategory
): Promise<ResourceItem[]> {
  return readList<ResourceItem>(resourceKey(category)).sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt)
  );
}

export async function addResource(
  category: ResourceCategory,
  data: Omit<ResourceItem, "id" | "uploadedAt">
): Promise<ResourceItem> {
  const item: ResourceItem = {
    ...data,
    id: newId(),
    uploadedAt: new Date().toISOString(),
  };
  const list = readList<ResourceItem>(resourceKey(category));
  list.push(item);
  writeList(resourceKey(category), list);
  return item;
}

export async function deleteResource(
  category: ResourceCategory,
  id: string
): Promise<void> {
  const list = readList<ResourceItem>(resourceKey(category)).filter(
    (r) => r.id !== id
  );
  writeList(resourceKey(category), list);
}

// ---------- Executive Committee Forum ----------

export async function getForumPosts(): Promise<ForumPost[]> {
  return readList<ForumPost>(KEYS.forum).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

export async function addForumPost(
  data: Omit<ForumPost, "id" | "createdAt">
): Promise<ForumPost> {
  const post: ForumPost = {
    ...data,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  const list = readList<ForumPost>(KEYS.forum);
  list.push(post);
  writeList(KEYS.forum, list);
  return post;
}

export async function deleteForumPost(id: string): Promise<void> {
  const list = readList<ForumPost>(KEYS.forum).filter((p) => p.id !== id);
  writeList(KEYS.forum, list);
}
