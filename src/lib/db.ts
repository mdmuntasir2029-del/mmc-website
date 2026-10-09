/**
 * Data layer for the site, backed by Supabase (Postgres + Storage).
 * Every function keeps the same name/shape it had when this was
 * localStorage-backed, so pages/components didn't need to change —
 * only this file and auth.ts did.
 */
import { supabase, FILES_BUCKET, PUBLIC_BUCKET } from "./supabaseClient";
import type {
  OlympiadRegistration,
  ActivityLogEntry,
  ResourceCategory,
  ResourceItem,
  ForumPost,
  Article,
  SessionPhoto,
  Leaderboard,
  Award,
  ActivitySlideshowPhoto,
  HallOfFameEntry,
  Testimonial,
  Announcement,
  AnnouncementComment,
  IssueReport,
  ProblemOfTheDay,
  UpcomingCompetition,
  CompetitionArchiveEntry,
  SectionKey,
  Fest,
  FestStatus,
  FestEvent,
  EventCategory,
  EventRegistration,
  CustomFieldDef,
  CustomFieldValues,
} from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

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

// Widths offered in every gallery photo's srcset — covers a phone at
// 1x/2x DPR up through a full-width desktop slideshow frame, so no
// visitor downloads more pixels than their layout actually shows.
const GALLERY_WIDTHS = [320, 480, 640, 960, 1280];
const GALLERY_TRANSFORM_QUALITY = 75;

function publicImageUrl(path: string, width?: number): string {
  return supabase.storage
    .from(PUBLIC_BUCKET)
    .getPublicUrl(
      path,
      width ? { transform: { width, quality: GALLERY_TRANSFORM_QUALITY } } : undefined
    ).data.publicUrl;
}

/** srcset covering GALLERY_WIDTHS via Supabase's on-the-fly image
 *  transform/render endpoint — it also content-negotiates WebP for any
 *  browser that asks for it (Accept: image/webp), so this alone covers
 *  "responsive sizes" and "modern format" without a <picture> element. */
function gallerySrcSet(path: string): string {
  return GALLERY_WIDTHS.map((w) => `${publicImageUrl(path, w)} ${w}w`).join(", ");
}

// ---------- Admin roles / per-section permissions ----------
// Every function here is enforced server-side by is_super_admin() inside
// the RPC itself (see schema.sql) — hiding the admin's UI is a UX nicety,
// not the actual access control.

export interface AdminAccount {
  email: string;
  addedAt: string;
}

export async function listAdmins(): Promise<AdminAccount[]> {
  const { data, error } = await supabase.rpc("list_admins");
  if (error) throw error;
  return (data as { email: string; added_at: string }[]).map((row) => ({
    email: row.email,
    addedAt: row.added_at,
  }));
}

export async function addAdmin(email: string): Promise<void> {
  const { error } = await supabase.rpc("add_admin", { new_email: email });
  if (error) throw error;
}

export async function removeAdmin(email: string): Promise<void> {
  const { error } = await supabase.rpc("remove_admin", { target_email: email });
  if (error) throw error;
}

export async function listAdminPermissions(): Promise<
  { email: string; section: string }[]
> {
  const { data, error } = await supabase.rpc("list_admin_permissions");
  if (error) throw error;
  return data as { email: string; section: string }[];
}

export async function grantAdminSection(
  email: string,
  section: string
): Promise<void> {
  const { error } = await supabase.rpc("grant_admin_section", {
    target_email: email,
    target_section: section,
  });
  if (error) throw error;
}

export async function revokeAdminSection(
  email: string,
  section: string
): Promise<void> {
  const { error } = await supabase.rpc("revoke_admin_section", {
    target_email: email,
    target_section: section,
  });
  if (error) throw error;
}

// ---------- Named admin roles (reusable permission bundles) ----------

export interface AdminRole {
  id: string;
  name: string;
  createdAt: string;
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  const { data, error } = await supabase.rpc("list_admin_roles");
  if (error) throw error;
  return (data as { id: string; name: string; created_at: string }[]).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
}

export async function createAdminRole(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_admin_role", { role_name: name });
  if (error) throw error;
  return data as string;
}

export async function deleteAdminRole(roleId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_admin_role", { target_role_id: roleId });
  if (error) throw error;
}

export async function listAdminRolePermissions(): Promise<
  { roleId: string; section: string }[]
> {
  const { data, error } = await supabase.rpc("list_admin_role_permissions");
  if (error) throw error;
  return (data as { role_id: string; section: string }[]).map((row) => ({
    roleId: row.role_id,
    section: row.section,
  }));
}

export async function grantAdminRoleSection(
  roleId: string,
  section: string
): Promise<void> {
  const { error } = await supabase.rpc("grant_admin_role_section", {
    target_role_id: roleId,
    target_section: section,
  });
  if (error) throw error;
}

export async function revokeAdminRoleSection(
  roleId: string,
  section: string
): Promise<void> {
  const { error } = await supabase.rpc("revoke_admin_role_section", {
    target_role_id: roleId,
    target_section: section,
  });
  if (error) throw error;
}

export async function listAdminRoleAssignments(): Promise<
  { email: string; roleId: string }[]
> {
  const { data, error } = await supabase.rpc("list_admin_role_assignments");
  if (error) throw error;
  return (data as { email: string; role_id: string }[]).map((row) => ({
    email: row.email,
    roleId: row.role_id,
  }));
}

export async function assignAdminRole(email: string, roleId: string): Promise<void> {
  const { error } = await supabase.rpc("assign_admin_role", {
    target_email: email,
    target_role_id: roleId,
  });
  if (error) throw error;
}

export async function unassignAdminRole(email: string, roleId: string): Promise<void> {
  const { error } = await supabase.rpc("unassign_admin_role", {
    target_email: email,
    target_role_id: roleId,
  });
  if (error) throw error;
}

// ---------- Intra Math Olympiad registrations ----------
// Deliberately not linked from anywhere in the UI (see OlympiadRegister.tsx
// and its route in App.tsx) — this replaced general member registration,
// which was removed entirely (including Member Management in the admin
// panel) as it was no longer in use.

interface OlympiadRegistrationRow {
  id: string;
  full_name: string;
  school: string;
  class_name: string;
  gender: string;
  phone: string;
  email: string | null;
  created_at: string;
}

function fromOlympiadRegistrationRow(
  row: OlympiadRegistrationRow
): OlympiadRegistration {
  return {
    id: row.id,
    fullName: row.full_name,
    school: row.school,
    className: row.class_name,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function getOlympiadRegistrations(): Promise<
  OlympiadRegistration[]
> {
  const { data, error } = await supabase
    .from("olympiad_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OlympiadRegistrationRow[]).map(fromOlympiadRegistrationRow);
}

export async function addOlympiadRegistration(
  data: Omit<OlympiadRegistration, "id" | "createdAt">
): Promise<void> {
  // No .select() after this insert: the public registration policy only
  // grants anon INSERT, not SELECT, so asking PostgREST to return the row
  // would fail RLS even though the insert itself succeeded.
  const { error } = await supabase.from("olympiad_registrations").insert({
    full_name: data.fullName,
    school: data.school,
    class_name: data.className,
    gender: data.gender,
    phone: data.phone,
    email: data.email,
  });
  if (error) throw error;
}

export async function deleteOlympiadRegistration(id: string): Promise<void> {
  const { error } = await supabase
    .from("olympiad_registrations")
    .delete()
    .eq("id", id);
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

export async function updateActivityLogEntry(
  id: string,
  data: { date: string; title: string; what: string; where: string; how: string },
  fileChange: { file: File | null; remove: boolean }
): Promise<ActivityLogEntry> {
  const updatePayload: Record<string, unknown> = {
    date: data.date,
    title: data.title,
    what: data.what,
    where_text: data.where,
    how: data.how,
  };

  let oldFilePath: string | null = null;
  if (fileChange.file || fileChange.remove) {
    const { data: existingRow } = await supabase
      .from("activity_log")
      .select("file_path")
      .eq("id", id)
      .single();
    oldFilePath = (existingRow as { file_path: string | null } | null)?.file_path ?? null;
  }

  if (fileChange.file) {
    const filePath = `activity-log/${crypto.randomUUID()}-${sanitizeFileName(fileChange.file.name)}`;
    await uploadFile(filePath, fileChange.file);
    updatePayload.file_name = fileChange.file.name;
    updatePayload.file_path = filePath;
  } else if (fileChange.remove) {
    updatePayload.file_name = null;
    updatePayload.file_path = null;
  }

  const { data: row, error } = await supabase
    .from("activity_log")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  if ((fileChange.file || fileChange.remove) && oldFilePath) {
    await removeFile(oldFilePath);
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

// ---------- Articles ----------

interface ArticleRow {
  id: string;
  title: string;
  author: string;
  abstract: string;
  published_date: string;
  file_name: string | null;
  file_path: string | null;
  link: string | null;
  created_at: string;
}

function fromArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    abstract: row.abstract,
    publishedDate: row.published_date,
    fileName: row.file_name,
    filePath: row.file_path,
    link: row.link,
    createdAt: row.created_at,
  };
}

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_date", { ascending: false });
  if (error) throw error;
  return (data as ArticleRow[]).map(fromArticleRow);
}

export async function addArticle(
  data: { title: string; author: string; abstract: string; publishedDate: string; link: string | null },
  file: File | null
): Promise<Article> {
  let filePath: string | null = null;
  let fileName: string | null = null;

  if (file) {
    fileName = file.name;
    filePath = `articles/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    await uploadFile(filePath, file);
  }

  const { data: row, error } = await supabase
    .from("articles")
    .insert({
      title: data.title,
      author: data.author,
      abstract: data.abstract,
      published_date: data.publishedDate,
      link: data.link,
      file_name: fileName,
      file_path: filePath,
    })
    .select("*")
    .single();

  if (error) {
    await removeFile(filePath);
    throw error;
  }
  return fromArticleRow(row as ArticleRow);
}

export async function deleteArticle(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("articles")
    .select("file_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
  await removeFile((row as { file_path: string | null } | null)?.file_path ?? null);
}

// ---------- Session Photos ----------

interface SessionPhotoRow {
  id: string;
  session_label: string;
  session_date: string;
  image_path: string;
  caption: string | null;
  created_at: string;
}

function fromSessionPhotoRow(row: SessionPhotoRow): SessionPhoto {
  return {
    id: row.id,
    sessionLabel: row.session_label,
    sessionDate: row.session_date,
    imagePath: row.image_path,
    imageUrl: publicImageUrl(row.image_path, 640),
    imageSrcSet: gallerySrcSet(row.image_path),
    caption: row.caption,
    createdAt: row.created_at,
  };
}

export async function getSessionPhotos(): Promise<SessionPhoto[]> {
  const { data, error } = await supabase
    .from("session_photos")
    .select("*")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as SessionPhotoRow[]).map(fromSessionPhotoRow);
}

/** The photos from the most recent session, for the home-page panels. */
export async function getLatestSessionPhotos(): Promise<{
  label: string;
  date: string;
  photos: SessionPhoto[];
} | null> {
  const all = await getSessionPhotos();
  if (all.length === 0) return null;
  const latestDate = all[0].sessionDate;
  const photos = all.filter((p) => p.sessionDate === latestDate);
  return { label: photos[0].sessionLabel, date: latestDate, photos };
}

export async function addSessionPhoto(
  data: { sessionLabel: string; sessionDate: string; caption: string | null },
  file: File
): Promise<SessionPhoto> {
  const imagePath = `session-photos/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(imagePath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: row, error } = await supabase
    .from("session_photos")
    .insert({
      session_label: data.sessionLabel,
      session_date: data.sessionDate,
      image_path: imagePath,
      caption: data.caption,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(PUBLIC_BUCKET).remove([imagePath]);
    throw error;
  }
  return fromSessionPhotoRow(row as SessionPhotoRow);
}

export async function deleteSessionPhoto(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("session_photos")
    .select("image_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("session_photos").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { image_path: string } | null)?.image_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

// ---------- Activity Slideshow (About page — separate from Session Photos) ----------

interface ActivitySlideshowPhotoRow {
  id: string;
  week_label: string;
  photo_date: string;
  image_path: string;
  caption: string | null;
  created_at: string;
}

function fromActivitySlideshowPhotoRow(
  row: ActivitySlideshowPhotoRow
): ActivitySlideshowPhoto {
  return {
    id: row.id,
    weekLabel: row.week_label,
    photoDate: row.photo_date,
    imagePath: row.image_path,
    imageUrl: publicImageUrl(row.image_path, 960),
    imageSrcSet: gallerySrcSet(row.image_path),
    caption: row.caption,
    createdAt: row.created_at,
  };
}

/** All slideshow photos, newest week first — the About page cycles
 *  through every one of these (unlike Session Photos, which is
 *  latest-week-only). */
export async function getActivitySlideshowPhotos(): Promise<
  ActivitySlideshowPhoto[]
> {
  const { data, error } = await supabase
    .from("activity_slideshow_photos")
    .select("*")
    .order("photo_date", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ActivitySlideshowPhotoRow[]).map(fromActivitySlideshowPhotoRow);
}

export async function addActivitySlideshowPhoto(
  data: { weekLabel: string; photoDate: string; caption: string | null },
  file: File
): Promise<ActivitySlideshowPhoto> {
  const imagePath = `activity-slideshow/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(imagePath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: row, error } = await supabase
    .from("activity_slideshow_photos")
    .insert({
      week_label: data.weekLabel,
      photo_date: data.photoDate,
      image_path: imagePath,
      caption: data.caption,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(PUBLIC_BUCKET).remove([imagePath]);
    throw error;
  }
  return fromActivitySlideshowPhotoRow(row as ActivitySlideshowPhotoRow);
}

export async function deleteActivitySlideshowPhoto(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("activity_slideshow_photos")
    .select("image_path")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("activity_slideshow_photos")
    .delete()
    .eq("id", id);
  if (error) throw error;
  const path = (row as { image_path: string } | null)?.image_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

// ---------- Leaderboards ----------

interface LeaderboardEntryRow {
  id: string;
  leaderboard_id: string;
  player_name: string;
  score: number | null;
  created_at: string;
}

interface LeaderboardRow {
  id: string;
  game: string;
  played_on: string;
  created_at: string;
  leaderboard_entries: LeaderboardEntryRow[] | null;
}

export async function getLeaderboards(): Promise<Leaderboard[]> {
  const { data, error } = await supabase
    .from("leaderboards")
    .select("*, leaderboard_entries(*)")
    .order("played_on", { ascending: false });
  if (error) throw error;
  return (data as LeaderboardRow[]).map((row) => ({
    id: row.id,
    game: row.game,
    playedOn: row.played_on,
    createdAt: row.created_at,
    entries: (row.leaderboard_entries ?? [])
      .map((e) => ({ id: e.id, playerName: e.player_name, score: e.score }))
      .sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity)),
  }));
}

export async function addLeaderboard(data: {
  game: string;
  playedOn: string;
}): Promise<void> {
  const { error } = await supabase
    .from("leaderboards")
    .insert({ game: data.game, played_on: data.playedOn });
  if (error) throw error;
}

export async function deleteLeaderboard(id: string): Promise<void> {
  const { error } = await supabase.from("leaderboards").delete().eq("id", id);
  if (error) throw error;
}

export async function addLeaderboardEntry(
  leaderboardId: string,
  data: { playerName: string; score: number | null }
): Promise<void> {
  const { error } = await supabase.from("leaderboard_entries").insert({
    leaderboard_id: leaderboardId,
    player_name: data.playerName,
    score: data.score,
  });
  if (error) throw error;
}

export async function deleteLeaderboardEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("leaderboard_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------- Awards ----------

interface AwardRow {
  id: string;
  name: string;
  achievement: string;
  initials: string | null;
  image_path: string | null;
  created_at: string;
}

function fromAwardRow(row: AwardRow): Award {
  return {
    id: row.id,
    name: row.name,
    achievement: row.achievement,
    initials: row.initials,
    imagePath: row.image_path,
    imageUrl: row.image_path ? publicImageUrl(row.image_path, 480) : null,
    imageSrcSet: row.image_path ? gallerySrcSet(row.image_path) : null,
    createdAt: row.created_at,
  };
}

export async function getAwards(): Promise<Award[]> {
  const { data, error } = await supabase
    .from("awards")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as AwardRow[]).map(fromAwardRow);
}

export async function addAward(
  data: {
    name: string;
    achievement: string;
    initials: string | null;
  },
  file: File | null
): Promise<Award> {
  let imagePath: string | null = null;
  if (file) {
    imagePath = `awards/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(imagePath, file, { upsert: false });
    if (uploadError) throw uploadError;
  }

  const { data: row, error } = await supabase
    .from("awards")
    .insert({
      name: data.name,
      achievement: data.achievement,
      initials: data.initials,
      image_path: imagePath,
    })
    .select("*")
    .single();
  if (error) {
    if (imagePath) await supabase.storage.from(PUBLIC_BUCKET).remove([imagePath]);
    throw error;
  }
  return fromAwardRow(row as AwardRow);
}

export async function deleteAward(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("awards")
    .select("image_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("awards").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { image_path: string | null } | null)?.image_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

// ---------- Hall of Fame roster ----------

interface HallOfFameEntryRow {
  id: string;
  name: string;
  role_title: string;
  session_year: string;
  image_path: string | null;
  display_order: number;
  favorite_constant: string | null;
  research_area: string | null;
  created_at: string;
}

function fromHallOfFameEntryRow(row: HallOfFameEntryRow): HallOfFameEntry {
  return {
    id: row.id,
    name: row.name,
    roleTitle: row.role_title,
    sessionYear: row.session_year,
    imagePath: row.image_path,
    imageUrl: row.image_path ? publicImageUrl(row.image_path, 480) : null,
    imageSrcSet: row.image_path ? gallerySrcSet(row.image_path) : null,
    displayOrder: row.display_order,
    favoriteConstant: row.favorite_constant,
    researchArea: row.research_area,
    createdAt: row.created_at,
  };
}

export async function getHallOfFameEntries(): Promise<HallOfFameEntry[]> {
  const { data, error } = await supabase
    .from("hall_of_fame_entries")
    .select("*")
    .order("session_year", { ascending: false })
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as HallOfFameEntryRow[]).map(fromHallOfFameEntryRow);
}

export async function addHallOfFameEntry(
  data: {
    name: string;
    roleTitle: string;
    sessionYear: string;
    displayOrder: number;
    favoriteConstant?: string | null;
    researchArea?: string | null;
  },
  file: File | null
): Promise<HallOfFameEntry> {
  let imagePath: string | null = null;
  if (file) {
    imagePath = `hall-of-fame/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(imagePath, file, { upsert: false });
    if (uploadError) throw uploadError;
  }

  const { data: row, error } = await supabase
    .from("hall_of_fame_entries")
    .insert({
      name: data.name,
      role_title: data.roleTitle,
      session_year: data.sessionYear,
      display_order: data.displayOrder,
      image_path: imagePath,
      favorite_constant: data.favoriteConstant ?? null,
      research_area: data.researchArea ?? null,
    })
    .select("*")
    .single();
  if (error) {
    if (imagePath) await supabase.storage.from(PUBLIC_BUCKET).remove([imagePath]);
    throw error;
  }
  return fromHallOfFameEntryRow(row as HallOfFameEntryRow);
}

export async function deleteHallOfFameEntry(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("hall_of_fame_entries")
    .select("image_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("hall_of_fame_entries").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { image_path: string | null } | null)?.image_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

// ---------- Testimonials ----------

interface TestimonialRow {
  id: string;
  quote: string;
  person_name: string;
  person_role: string;
  created_at: string;
}

function fromTestimonialRow(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    quote: row.quote,
    personName: row.person_name,
    personRole: row.person_role,
    createdAt: row.created_at,
  };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TestimonialRow[]).map(fromTestimonialRow);
}

export async function addTestimonial(data: {
  quote: string;
  personName: string;
  personRole: string;
}): Promise<Testimonial> {
  const { data: row, error } = await supabase
    .from("testimonials")
    .insert({
      quote: data.quote,
      person_name: data.personName,
      person_role: data.personRole,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromTestimonialRow(row as TestimonialRow);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Announcements ----------

interface AnnouncementRow {
  id: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  caption: string | null;
  description: string | null;
  embed_url: string | null;
  likes_count: number;
  created_at: string;
}

function fromAnnouncementRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    imagePath: row.image_path,
    imageUrl: publicImageUrl(row.image_path, 960),
    imageSrcSet: gallerySrcSet(row.image_path),
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    caption: row.caption,
    description: row.description,
    embedUrl: row.embed_url,
    likesCount: row.likes_count,
    createdAt: row.created_at,
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as AnnouncementRow[]).map(fromAnnouncementRow);
}

export async function addAnnouncement(
  data: {
    caption: string | null;
    description: string | null;
    embedUrl: string | null;
    /** Read client-side (e.g. via an Image() probe) before upload — see
     *  admin/Announcements.tsx — so the public page can reserve the
     *  correct aspect ratio instead of guessing one. */
    imageWidth: number | null;
    imageHeight: number | null;
  },
  file: File
): Promise<Announcement> {
  const imagePath = `announcements/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(imagePath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: row, error } = await supabase
    .from("announcements")
    .insert({
      image_path: imagePath,
      caption: data.caption,
      description: data.description,
      embed_url: data.embedUrl,
      image_width: data.imageWidth,
      image_height: data.imageHeight,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(PUBLIC_BUCKET).remove([imagePath]);
    throw error;
  }
  return fromAnnouncementRow(row as AnnouncementRow);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("announcements")
    .select("image_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { image_path: string } | null)?.image_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

/** Increments and returns the new like count — a plain counter, not a
 *  per-visitor toggle (no visitor-account system on this site); the
 *  public component debounces repeat clicks from the same browser via
 *  localStorage so it isn't trivially spammable by accident. */
export async function likeAnnouncement(id: string): Promise<number> {
  const { data, error } = await supabase.rpc("increment_announcement_likes", {
    target_id: id,
  });
  if (error) throw error;
  return data as number;
}

interface AnnouncementCommentRow {
  id: string;
  announcement_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

function fromAnnouncementCommentRow(row: AnnouncementCommentRow): AnnouncementComment {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    authorName: row.author_name,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function getAnnouncementComments(
  announcementId: string
): Promise<AnnouncementComment[]> {
  const { data, error } = await supabase
    .from("announcement_comments")
    .select("*")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as AnnouncementCommentRow[]).map(fromAnnouncementCommentRow);
}

export async function addAnnouncementComment(
  announcementId: string,
  data: { authorName: string; message: string }
): Promise<void> {
  const { error } = await supabase.from("announcement_comments").insert({
    announcement_id: announcementId,
    author_name: data.authorName,
    message: data.message,
  });
  if (error) throw error;
}

export async function deleteAnnouncementComment(id: string): Promise<void> {
  const { error } = await supabase.from("announcement_comments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Issue reports (super-admin only) ----------

interface IssueReportRow {
  id: string;
  kind: "bug" | "suggestion";
  message: string;
  reporter_email: string | null;
  created_at: string;
}

function fromIssueReportRow(row: IssueReportRow): IssueReport {
  return {
    id: row.id,
    kind: row.kind,
    message: row.message,
    reporterEmail: row.reporter_email,
    createdAt: row.created_at,
  };
}

/** Public — anyone can submit, no admin session required. */
export async function addIssueReport(data: {
  kind: "bug" | "suggestion";
  message: string;
  reporterEmail: string | null;
}): Promise<void> {
  const { error } = await supabase.from("issue_reports").insert({
    kind: data.kind,
    message: data.message,
    reporter_email: data.reporterEmail,
  });
  if (error) throw error;
}

/** Super-admin only — enforced server-side by RLS, not just this call. */
export async function getIssueReports(): Promise<IssueReport[]> {
  const { data, error } = await supabase
    .from("issue_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as IssueReportRow[]).map(fromIssueReportRow);
}

export async function deleteIssueReport(id: string): Promise<void> {
  const { error } = await supabase.from("issue_reports").delete().eq("id", id);
  if (error) throw error;
}

// ---------- FRD mode: Problem of the Day ----------

interface ProblemOfTheDayRow {
  id: string;
  problem_date: string;
  latex_problem: string;
  hints: string[];
  answer_text: string;
  solution_text: string;
  created_at: string;
}

function fromProblemOfTheDayRow(row: ProblemOfTheDayRow): ProblemOfTheDay {
  return {
    id: row.id,
    problemDate: row.problem_date,
    latexProblem: row.latex_problem,
    hints: row.hints,
    answerText: row.answer_text,
    solutionText: row.solution_text,
    createdAt: row.created_at,
  };
}

export async function getProblemsOfTheDay(): Promise<ProblemOfTheDay[]> {
  const { data, error } = await supabase
    .from("problem_of_the_day")
    .select("*")
    .order("problem_date", { ascending: false });
  if (error) throw error;
  return (data as ProblemOfTheDayRow[]).map(fromProblemOfTheDayRow);
}

/** Today's problem is just the most recently dated row — same
 *  "latest wins" convention as Session Photos' "latest session." */
export async function getLatestProblemOfTheDay(): Promise<ProblemOfTheDay | null> {
  const { data, error } = await supabase
    .from("problem_of_the_day")
    .select("*")
    .order("problem_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? fromProblemOfTheDayRow(data as ProblemOfTheDayRow) : null;
}

export async function addProblemOfTheDay(data: {
  problemDate: string;
  latexProblem: string;
  hints: string[];
  answerText: string;
  solutionText: string;
}): Promise<ProblemOfTheDay> {
  const { data: row, error } = await supabase
    .from("problem_of_the_day")
    .insert({
      problem_date: data.problemDate,
      latex_problem: data.latexProblem,
      hints: data.hints,
      answer_text: data.answerText,
      solution_text: data.solutionText,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromProblemOfTheDayRow(row as ProblemOfTheDayRow);
}

export async function deleteProblemOfTheDay(id: string): Promise<void> {
  const { error } = await supabase.from("problem_of_the_day").delete().eq("id", id);
  if (error) throw error;
}

// ---------- FRD mode: upcoming competitions ----------

interface UpcomingCompetitionRow {
  id: string;
  name: string;
  event_date: string;
  created_at: string;
}

function fromUpcomingCompetitionRow(row: UpcomingCompetitionRow): UpcomingCompetition {
  return {
    id: row.id,
    name: row.name,
    eventDate: row.event_date,
    createdAt: row.created_at,
  };
}

export async function getUpcomingCompetitions(): Promise<UpcomingCompetition[]> {
  const { data, error } = await supabase
    .from("upcoming_competitions")
    .select("*")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data as UpcomingCompetitionRow[]).map(fromUpcomingCompetitionRow);
}

export async function addUpcomingCompetition(data: {
  name: string;
  eventDate: string;
}): Promise<UpcomingCompetition> {
  const { data: row, error } = await supabase
    .from("upcoming_competitions")
    .insert({ name: data.name, event_date: data.eventDate })
    .select("*")
    .single();
  if (error) throw error;
  return fromUpcomingCompetitionRow(row as UpcomingCompetitionRow);
}

export async function deleteUpcomingCompetition(id: string): Promise<void> {
  const { error } = await supabase.from("upcoming_competitions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- FRD mode: competition archive ----------

interface CompetitionArchiveRow {
  id: string;
  contest_name: string;
  contest_year: string;
  paper_path: string;
  solution_path: string | null;
  created_at: string;
}

function fromCompetitionArchiveRow(row: CompetitionArchiveRow): CompetitionArchiveEntry {
  return {
    id: row.id,
    contestName: row.contest_name,
    contestYear: row.contest_year,
    paperPath: row.paper_path,
    solutionPath: row.solution_path,
    createdAt: row.created_at,
  };
}

export async function getCompetitionArchive(): Promise<CompetitionArchiveEntry[]> {
  const { data, error } = await supabase
    .from("competition_archive")
    .select("*")
    .order("contest_year", { ascending: false });
  if (error) throw error;
  return (data as CompetitionArchiveRow[]).map(fromCompetitionArchiveRow);
}

export async function addCompetitionArchiveEntry(
  data: { contestName: string; contestYear: string },
  paperFile: File,
  solutionFile: File | null
): Promise<CompetitionArchiveEntry> {
  const paperPath = `competition-archive/${crypto.randomUUID()}-${sanitizeFileName(paperFile.name)}`;
  await uploadFile(paperPath, paperFile);

  let solutionPath: string | null = null;
  if (solutionFile) {
    solutionPath = `competition-archive/${crypto.randomUUID()}-${sanitizeFileName(solutionFile.name)}`;
    await uploadFile(solutionPath, solutionFile);
  }

  const { data: row, error } = await supabase
    .from("competition_archive")
    .insert({
      contest_name: data.contestName,
      contest_year: data.contestYear,
      paper_path: paperPath,
      solution_path: solutionPath,
    })
    .select("*")
    .single();

  if (error) {
    await removeFile(paperPath);
    await removeFile(solutionPath);
    throw error;
  }
  return fromCompetitionArchiveRow(row as CompetitionArchiveRow);
}

export async function deleteCompetitionArchiveEntry(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("competition_archive")
    .select("paper_path, solution_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("competition_archive").delete().eq("id", id);
  if (error) throw error;
  const r = row as { paper_path: string; solution_path: string | null } | null;
  if (r?.paper_path) await removeFile(r.paper_path);
  if (r?.solution_path) await removeFile(r.solution_path);
}

// ---------- Site sections (admin show/hide) ----------

interface SiteSectionRow {
  key: SectionKey;
  visible: boolean;
}

/** Only returns the keys the DB actually has rows for — callers should
 *  merge this over their own "everything visible" defaults, so a key
 *  the schema hasn't seeded yet still renders instead of vanishing. */
export async function getSiteSections(): Promise<Partial<Record<SectionKey, boolean>>> {
  const { data, error } = await supabase.from("site_sections").select("*");
  if (error) throw error;
  const result: Partial<Record<SectionKey, boolean>> = {};
  for (const row of data as SiteSectionRow[]) {
    result[row.key] = row.visible;
  }
  return result;
}

export async function setSectionVisible(
  key: SectionKey,
  visible: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_sections")
    .upsert({ key, visible, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

// ---------- Fest Hub (Organization -> Fest -> Event -> Registration) ----------
// See sourceoftruth/fest-hub.md. RLS shows admins every status (draft
// included) and shows everyone else only published/archived rows, so
// the SAME getFests()/getEvents() calls serve both the public directory
// and the admin dashboard — no separate "admin" fetch functions needed.

interface FestRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_path: string | null;
  starts_on: string;
  ends_on: string;
  venue: string | null;
  status: FestStatus;
  created_at: string;
}

function fromFestRow(row: FestRow): Fest {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    coverPath: row.cover_path,
    coverUrl: row.cover_path ? publicImageUrl(row.cover_path, 960) : null,
    coverSrcSet: row.cover_path ? gallerySrcSet(row.cover_path) : null,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    venue: row.venue,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getFests(): Promise<Fest[]> {
  const { data, error } = await supabase
    .from("fests")
    .select("*")
    .order("starts_on", { ascending: false });
  if (error) throw error;
  return (data as FestRow[]).map(fromFestRow);
}

export async function getFestBySlug(slug: string): Promise<Fest | null> {
  const { data, error } = await supabase
    .from("fests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? fromFestRow(data as FestRow) : null;
}

export async function addFest(
  data: {
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    startsOn: string;
    endsOn: string;
    venue: string | null;
    status: FestStatus;
  },
  file: File | null
): Promise<Fest> {
  let coverPath: string | null = null;
  if (file) {
    coverPath = `fests/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(coverPath, file, { upsert: false });
    if (uploadError) throw uploadError;
  }
  const { data: row, error } = await supabase
    .from("fests")
    .insert({
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      starts_on: data.startsOn,
      ends_on: data.endsOn,
      venue: data.venue,
      status: data.status,
      cover_path: coverPath,
    })
    .select("*")
    .single();
  if (error) {
    if (coverPath) await supabase.storage.from(PUBLIC_BUCKET).remove([coverPath]);
    throw error;
  }
  return fromFestRow(row as FestRow);
}

export async function updateFest(
  id: string,
  data: Partial<{
    name: string;
    tagline: string | null;
    description: string | null;
    startsOn: string;
    endsOn: string;
    venue: string | null;
    status: FestStatus;
  }>,
  file?: File | null
): Promise<Fest> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.tagline !== undefined) patch.tagline = data.tagline;
  if (data.description !== undefined) patch.description = data.description;
  if (data.startsOn !== undefined) patch.starts_on = data.startsOn;
  if (data.endsOn !== undefined) patch.ends_on = data.endsOn;
  if (data.venue !== undefined) patch.venue = data.venue;
  if (data.status !== undefined) patch.status = data.status;

  if (file) {
    const coverPath = `fests/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(coverPath, file, { upsert: false });
    if (uploadError) throw uploadError;
    patch.cover_path = coverPath;
  }

  const { data: row, error } = await supabase
    .from("fests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromFestRow(row as FestRow);
}

export async function deleteFest(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("fests")
    .select("cover_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("fests").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { cover_path: string | null } | null)?.cover_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

interface EventRow {
  id: string;
  fest_id: string;
  slug: string;
  name: string;
  category: EventCategory;
  summary: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  eligibility: string | null;
  registration_opens_at: string;
  registration_deadline: string;
  capacity: number | null;
  waitlist_enabled: boolean;
  cover_path: string | null;
  status: FestStatus;
  created_at: string;
  custom_fields: CustomFieldDef[];
}

function fromEventRow(row: EventRow): FestEvent {
  return {
    id: row.id,
    festId: row.fest_id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.summary,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venue: row.venue,
    eligibility: row.eligibility,
    registrationOpensAt: row.registration_opens_at,
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    waitlistEnabled: row.waitlist_enabled,
    coverPath: row.cover_path,
    coverUrl: row.cover_path ? publicImageUrl(row.cover_path, 960) : null,
    coverSrcSet: row.cover_path ? gallerySrcSet(row.cover_path) : null,
    status: row.status,
    createdAt: row.created_at,
    customFields: row.custom_fields ?? [],
  };
}

/** All events, or only one fest's — the fest directory's search/filter
 *  works across every fest, so most callers want the unfiltered list. */
export async function getEvents(festId?: string): Promise<FestEvent[]> {
  let query = supabase.from("events").select("*").order("starts_at", { ascending: true });
  if (festId) query = query.eq("fest_id", festId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as EventRow[]).map(fromEventRow);
}

export async function getEventBySlug(slug: string): Promise<FestEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? fromEventRow(data as EventRow) : null;
}

export async function getEventById(id: string): Promise<FestEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromEventRow(data as EventRow) : null;
}

export async function addEvent(
  data: {
    festId: string;
    slug: string;
    name: string;
    category: EventCategory;
    summary: string | null;
    description: string | null;
    startsAt: string;
    endsAt: string | null;
    venue: string | null;
    eligibility: string | null;
    registrationOpensAt: string;
    registrationDeadline: string;
    capacity: number | null;
    waitlistEnabled: boolean;
    status: FestStatus;
    customFields: CustomFieldDef[];
  },
  file: File | null
): Promise<FestEvent> {
  let coverPath: string | null = null;
  if (file) {
    coverPath = `events/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(coverPath, file, { upsert: false });
    if (uploadError) throw uploadError;
  }
  const { data: row, error } = await supabase
    .from("events")
    .insert({
      fest_id: data.festId,
      slug: data.slug,
      name: data.name,
      category: data.category,
      summary: data.summary,
      description: data.description,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      venue: data.venue,
      eligibility: data.eligibility,
      registration_opens_at: data.registrationOpensAt,
      registration_deadline: data.registrationDeadline,
      capacity: data.capacity,
      waitlist_enabled: data.waitlistEnabled,
      status: data.status,
      cover_path: coverPath,
      custom_fields: data.customFields,
    })
    .select("*")
    .single();
  if (error) {
    if (coverPath) await supabase.storage.from(PUBLIC_BUCKET).remove([coverPath]);
    throw error;
  }
  return fromEventRow(row as EventRow);
}

export async function updateEvent(
  id: string,
  data: Partial<{
    name: string;
    category: EventCategory;
    summary: string | null;
    description: string | null;
    startsAt: string;
    endsAt: string | null;
    venue: string | null;
    eligibility: string | null;
    registrationOpensAt: string;
    registrationDeadline: string;
    capacity: number | null;
    waitlistEnabled: boolean;
    status: FestStatus;
    customFields: CustomFieldDef[];
  }>,
  file?: File | null
): Promise<FestEvent> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.category !== undefined) patch.category = data.category;
  if (data.summary !== undefined) patch.summary = data.summary;
  if (data.description !== undefined) patch.description = data.description;
  if (data.startsAt !== undefined) patch.starts_at = data.startsAt;
  if (data.endsAt !== undefined) patch.ends_at = data.endsAt;
  if (data.venue !== undefined) patch.venue = data.venue;
  if (data.eligibility !== undefined) patch.eligibility = data.eligibility;
  if (data.registrationOpensAt !== undefined) patch.registration_opens_at = data.registrationOpensAt;
  if (data.registrationDeadline !== undefined) patch.registration_deadline = data.registrationDeadline;
  if (data.capacity !== undefined) patch.capacity = data.capacity;
  if (data.waitlistEnabled !== undefined) patch.waitlist_enabled = data.waitlistEnabled;
  if (data.status !== undefined) patch.status = data.status;
  if (data.customFields !== undefined) patch.custom_fields = data.customFields;

  if (file) {
    const coverPath = `events/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(coverPath, file, { upsert: false });
    if (uploadError) throw uploadError;
    patch.cover_path = coverPath;
  }

  const { data: row, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromEventRow(row as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("events")
    .select("cover_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  const path = (row as { cover_path: string | null } | null)?.cover_path;
  if (path) await supabase.storage.from(PUBLIC_BUCKET).remove([path]);
}

/** Seats taken per event (confirmed + attended) — public RPC, used by
 *  the directory to show "N seats left" without exposing participant
 *  rows (there's no public select policy on event_registrations at all). */
export async function getEventSeatCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("get_event_seat_counts");
  if (error) throw error;
  const result: Record<string, number> = {};
  for (const row of data as { event_id: string; taken: number }[]) {
    result[row.event_id] = row.taken;
  }
  return result;
}

/** The only way the public creates a registration — goes through the
 *  register_for_event RPC, never a direct insert (see schema.sql). */
export async function registerForEvent(
  eventId: string,
  data: {
    fullName: string;
    email: string;
    phone: string;
    school: string | null;
    className: string | null;
    customFieldValues?: CustomFieldValues;
  }
): Promise<{ id: string; ticketCode: string; status: string }> {
  const { data: rows, error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_full_name: data.fullName,
    p_email: data.email,
    p_phone: data.phone,
    p_school: data.school,
    p_class_name: data.className,
    p_custom_field_values: data.customFieldValues ?? {},
  });
  if (error) throw error;
  const row = (rows as { id: string; ticket_code: string; status: string }[])[0];
  return { id: row.id, ticketCode: row.ticket_code, status: row.status };
}

/** Best-effort confirmation/waitlist email via the send-registration-email
 *  Edge Function (Brevo). Fire-and-forget by design — see
 *  EventPage.tsx's call site: a failed or not-yet-configured email must
 *  never block or appear to fail the registration itself. */
export async function sendRegistrationEmail(registrationId: string): Promise<void> {
  await supabase.functions.invoke("send-registration-email", {
    body: { registrationId },
  });
}

interface MyRegistrationRow {
  id: string;
  event_id: string;
  ticket_code: string;
  full_name: string;
  email: string;
  phone: string;
  school: string | null;
  class_name: string | null;
  status: EventRegistration["status"];
  checked_in_at: string | null;
  created_at: string;
}

function fromMyRegistrationRow(row: MyRegistrationRow): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    ticketCode: row.ticket_code,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    school: row.school,
    className: row.class_name,
    status: row.status,
    checkedInAt: row.checked_in_at,
    adminNote: null,
    createdAt: row.created_at,
    updatedAt: row.created_at,
    // get_my_registrations() doesn't return this column (visitors don't
    // need to see it echoed back) — admins see the real values via
    // getEventRegistrations()/getAllEventRegistrations() below.
    customFieldValues: {},
  };
}

/** The "login" for visitors without accounts — only returns rows if
 *  ticketCode matches one of that email's own registrations. Powers
 *  both /my-registrations and the bookmarkable /registration/:ticketCode
 *  confirmation page (which passes ?email= in the URL). */
export async function getMyRegistrations(
  email: string,
  ticketCode: string
): Promise<EventRegistration[]> {
  const { data, error } = await supabase.rpc("get_my_registrations", {
    p_email: email,
    p_ticket_code: ticketCode,
  });
  if (error) throw error;
  return (data as MyRegistrationRow[]).map(fromMyRegistrationRow);
}

export async function cancelMyRegistration(
  ticketCode: string,
  email: string
): Promise<void> {
  const { error } = await supabase.rpc("cancel_my_registration", {
    p_ticket_code: ticketCode,
    p_email: email,
  });
  if (error) throw error;
}

// ---------- Fest Hub admin: participant management ----------
// Direct table access (not RPCs) — same is_admin()-gated pattern as
// every other admin table (e.g. olympiad_registrations).

interface EventRegistrationRow {
  id: string;
  event_id: string;
  ticket_code: string;
  full_name: string;
  email: string;
  phone: string;
  school: string | null;
  class_name: string | null;
  status: EventRegistration["status"];
  checked_in_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  custom_field_values: CustomFieldValues;
}

function fromEventRegistrationRow(row: EventRegistrationRow): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    ticketCode: row.ticket_code,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    school: row.school,
    className: row.class_name,
    status: row.status,
    checkedInAt: row.checked_in_at,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customFieldValues: row.custom_field_values ?? {},
  };
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventRegistrationRow[]).map(fromEventRegistrationRow);
}

/** Every registration across every event — for the organizer dashboard's
 *  overview cards (total registrations, today's sign-ups). */
export async function getAllEventRegistrations(): Promise<EventRegistration[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EventRegistrationRow[]).map(fromEventRegistrationRow);
}

export async function updateRegistrationStatus(
  id: string,
  status: EventRegistration["status"],
  adminNote?: string | null
): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "attended") patch.checked_in_at = new Date().toISOString();
  if (adminNote !== undefined) patch.admin_note = adminNote;
  const { error } = await supabase
    .from("event_registrations")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateRegistrationStatus(
  ids: string[],
  status: EventRegistration["status"]
): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "attended") patch.checked_in_at = new Date().toISOString();
  const { error } = await supabase
    .from("event_registrations")
    .update(patch)
    .in("id", ids);
  if (error) throw error;
}
