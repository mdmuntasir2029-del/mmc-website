/**
 * Data layer for the site, backed by Supabase (Postgres + Storage).
 * Every function keeps the same name/shape it had when this was
 * localStorage-backed, so pages/components didn't need to change —
 * only this file and auth.ts did.
 */
import { supabase, FILES_BUCKET } from "./supabaseClient";
import type {
  Member,
  ActivityLogEntry,
  ResourceCategory,
  ResourceItem,
  ForumPost,
} from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 10;
const POSTGRES_UNIQUE_VIOLATION = "23505";

export class DuplicateMemberError extends Error {}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadFile(path: string, file: File): Promise<void> {
  const { error } = await supabase.storage.from(FILES_BUCKET).upload(path, file, {
    upsert: false,
  });
  if (error) throw error;
}

async function removeFile(path: string | null): Promise<void> {
  if (!path) return;
  await supabase.storage.from(FILES_BUCKET).remove([path]);
}

/** Fetches a fresh, temporary download link for a stored file. */
export async function getFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw error ?? new Error("Could not create signed URL");
  return data.signedUrl;
}

// ---------- Members ----------

interface MemberRow {
  id: string;
  name: string;
  class_name: string;
  section: string;
  roll: string;
  student_code: string;
  phone: string;
  email: string | null;
  registered_at: string;
}

function fromMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    className: row.class_name,
    section: row.section,
    roll: row.roll,
    studentCode: row.student_code,
    phone: row.phone,
    email: row.email,
    registeredAt: row.registered_at,
  };
}

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return (data as MemberRow[]).map(fromMemberRow);
}

export async function addMember(
  data: Omit<Member, "id" | "registeredAt">
): Promise<Member> {
  // No .select() after this insert: the public registration policy only
  // grants anon INSERT, not SELECT, so asking PostgREST to return the row
  // would fail RLS even though the insert itself succeeded. The caller
  // (the registration form) doesn't need the DB-assigned id back anyway.
  const { error } = await supabase.from("members").insert({
    name: data.name,
    class_name: data.className,
    section: data.section,
    roll: data.roll,
    student_code: data.studentCode,
    phone: data.phone,
    email: data.email,
  });
  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new DuplicateMemberError(
        "This student code, phone number, or email is already registered."
      );
    }
    throw error;
  }
  return {
    ...data,
    id: crypto.randomUUID(),
    registeredAt: new Date().toISOString(),
  };
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Club Activity Log ----------

interface ActivityLogRow {
  id: string;
  date: string;
  title: string;
  what: string;
  where_text: string;
  how: string;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
}

function fromActivityLogRow(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    what: row.what,
    where: row.where_text,
    how: row.how,
    fileName: row.file_name,
    filePath: row.file_path,
    createdAt: row.created_at,
  };
}

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as ActivityLogRow[]).map(fromActivityLogRow);
}

export async function addActivityLogEntry(
  data: { date: string; title: string; what: string; where: string; how: string },
  file: File | null
): Promise<ActivityLogEntry> {
  let filePath: string | null = null;
  let fileName: string | null = null;

  if (file) {
    fileName = file.name;
    filePath = `activity-log/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    await uploadFile(filePath, file);
  }

  const { data: row, error } = await supabase
    .from("activity_log")
    .insert({
      date: data.date,
      title: data.title,
      what: data.what,
      where_text: data.where,
      how: data.how,
      file_name: fileName,
      file_path: filePath,
    })
    .select("*")
    .single();

  if (error) {
    await removeFile(filePath);
    throw error;
  }
  return fromActivityLogRow(row as ActivityLogRow);
}

export async function deleteActivityLogEntry(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("activity_log")
    .select("file_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("activity_log").delete().eq("id", id);
  if (error) throw error;
  await removeFile((row as { file_path: string | null } | null)?.file_path ?? null);
}

// ---------- Resources ----------

interface ResourceRow {
  id: string;
  category: ResourceCategory;
  title: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

function fromResourceRow(row: ResourceRow): ResourceItem {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    uploadedAt: row.uploaded_at,
  };
}

export async function getResources(
  category: ResourceCategory
): Promise<ResourceItem[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("category", category)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data as ResourceRow[]).map(fromResourceRow);
}

export async function addResource(
  category: ResourceCategory,
  data: { title: string },
  file: File
): Promise<ResourceItem> {
  const filePath = `resources/${category}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  await uploadFile(filePath, file);

  const { data: row, error } = await supabase
    .from("resources")
    .insert({
      category,
      title: data.title,
      file_name: file.name,
      file_path: filePath,
    })
    .select("*")
    .single();

  if (error) {
    await removeFile(filePath);
    throw error;
  }
  return fromResourceRow(row as ResourceRow);
}

export async function deleteResource(
  category: ResourceCategory,
  id: string
): Promise<void> {
  const { data: row } = await supabase
    .from("resources")
    .select("file_path")
    .eq("id", id)
    .eq("category", category)
    .single();
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("category", category);
  if (error) throw error;
  await removeFile((row as { file_path: string } | null)?.file_path ?? null);
}

// ---------- Executive Committee Forum ----------

interface ForumPostRow {
  id: string;
  author: string;
  message: string;
  created_at: string;
}

function fromForumPostRow(row: ForumPostRow): ForumPost {
  return {
    id: row.id,
    author: row.author,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function getForumPosts(): Promise<ForumPost[]> {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ForumPostRow[]).map(fromForumPostRow);
}

export async function addForumPost(
  data: Omit<ForumPost, "id" | "createdAt">
): Promise<ForumPost> {
  const { data: row, error } = await supabase
    .from("forum_posts")
    .insert({ author: data.author, message: data.message })
    .select("*")
    .single();
  if (error) throw error;
  return fromForumPostRow(row as ForumPostRow);
}

export async function deleteForumPost(id: string): Promise<void> {
  const { error } = await supabase.from("forum_posts").delete().eq("id", id);
  if (error) throw error;
}
