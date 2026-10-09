/**
 * The club's current session/year label, used to filter the About
 * page's "Current Year Lineup" down to this year's Hall of Fame
 * entries. Update this each new session — it's matched against the
 * free-text `session_year` an admin types into a Hall of Fame entry, so
 * keep the two in sync (e.g. "2026–2027").
 */
export const CURRENT_SESSION_YEAR = "2026–2027";

/**
 * This deployment's canonical domain — deliberately NOT derived from
 * window.location.origin for anything that goes into an email (password
 * reset links, etc). An admin could trigger "forgot password" from a
 * Vercel preview/branch deployment or a non-canonical domain; using
 * window.location.origin there sends them a reset link back to whichever
 * one they happened to be on, which only works if that exact origin is
 * also allow-listed in Supabase's Auth → URL Configuration (it usually
 * isn't for preview URLs) — so the link silently falls back to the
 * dashboard's configured Site URL instead, which may not be where the
 * admin actually landed.
 *
 * Read from VITE_SITE_URL so each of this codebase's two deployments
 * (the real site, and the separate Fest Hub contest deployment — see
 * sourceoftruth/fest-hub.md) can set its own value in its own Vercel
 * project without the other needing a code change. Falls back to the
 * real site's domain, which is correct for local dev and for the real
 * deployment even before its env var is added.
 */
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://manaratmath.club";
