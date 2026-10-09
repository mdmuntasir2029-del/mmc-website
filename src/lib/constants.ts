/**
 * The club's current session/year label, used to filter the About
 * page's "Current Year Lineup" down to this year's Hall of Fame
 * entries. Update this each new session — it's matched against the
 * free-text `session_year` an admin types into a Hall of Fame entry, so
 * keep the two in sync (e.g. "2026–2027").
 */
export const CURRENT_SESSION_YEAR = "2026–2027";

/**
 * The real club site's canonical domain — deliberately hardcoded rather
 * than derived from window.location.origin for anything that goes into
 * an email (password reset links, etc). An admin could trigger "forgot
 * password" from a Vercel preview/branch deployment or a custom domain
 * that isn't the canonical one; using window.location.origin there sends
 * them a reset link back to whichever one they happened to be on, which
 * only works if that exact origin is also allow-listed in Supabase's
 * Auth → URL Configuration (it usually isn't for preview URLs) — so the
 * link silently falls back to the dashboard's configured Site URL
 * instead, which may not be where the admin actually landed. Hardcoding
 * this means the email link is always the one domain that's guaranteed
 * to be allow-listed and actually work.
 */
export const SITE_URL = "https://manaratmath.club";
