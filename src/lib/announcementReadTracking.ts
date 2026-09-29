/**
 * Per-visitor "have I seen this announcement" tracking — purely
 * client-side (localStorage), since this site has no visitor-account
 * system. Drives the unread "glow" on the /announcements calendar and
 * week views.
 */
const READ_KEY = "mmc_read_announcements";

export function getReadIds(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

export function markAnnouncementRead(id: string): void {
  try {
    const ids = getReadIds();
    ids.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // Private browsing / storage disabled — read state just won't
    // persist across reloads, which is a fine fallback for this.
  }
}

export function isAnnouncementRead(id: string, readIds: Set<string>): boolean {
  return readIds.has(id);
}
