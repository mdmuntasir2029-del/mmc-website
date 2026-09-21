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
  SectionKey,
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
