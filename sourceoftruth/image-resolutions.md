# Image Resolution Reference

What size image to upload, for every photo-upload field in the admin
panel — grounded in how each one is actually displayed (crop shape, CSS
size, and the responsive `srcset` width tiers each one requests), not
guesswork. Last verified against the codebase on **2026-10-03**.

## The short version

Most image fields on this site go through the same pipeline
(`src/lib/db.ts`'s `publicImageUrl`/`gallerySrcSet`), which generates a
responsive `srcset` at **320 / 480 / 640 / 960 / 1280px** wide via
Supabase's on-the-fly image transform. Two practical rules fall out of
that for every field below:

- **Uploading below ~800px on the relevant edge will look soft** on
  larger screens or retina displays, because the browser has nothing
  bigger to pick from.
- **Uploading much beyond ~1600px gains you nothing** — Supabase's
  transform only ever downscales (never upscales), and nothing on this
  site requests wider than the 1280px tier — it just makes the original
  file (and your Supabase storage usage) bigger for no visual benefit.

So: **aim for roughly 1000–1600px on the long edge** almost everywhere,
and match the aspect ratio/crop behavior called out per field below —
getting the aspect ratio right matters more than exact pixel count,
since a wrong-shaped photo gets cropped by `object-fit: cover`
regardless of resolution.

## Per-field reference

| Field (admin page) | Crop shape | Typical displayed size | Recommended upload | Aspect ratio |
|---|---|---|---|---|
| **Session Photos** (hero carousel) — Session Photos | Cropped to fill (`cover`) | up to 820×342 desktop, switches to 4:3 under 640px | **1600×900 or larger**, landscape | Wide landscape (≥16:9) — crops to a short 2.4:1 band on desktop, 4:3 on mobile, so keep the subject centered |
| **Announcements** — Announcements | **Not cropped** — shown at its own native aspect ratio (the admin upload's real pixel dimensions are stored and used directly) | up to ~430px wide (teaser/calendar/week views), ~400px in the detail popup | **≥1000px on the longer side** | Any — portrait, landscape, or square all work as-is, nothing gets cut off |
| **Awards** | Cropped to a **circle** (`object-fit: cover`) | 64px on the track, 160px in the detail popup | **≥640×640**, square | 1:1 — center the face, since the circle crop removes the corners |
| **Activity Slideshow** (About page) — Activity Slideshow | Cropped to fill (`cover`) | up to 1180×664 | **1920×1080 or larger**, landscape | 16:9 |
| **Hall of Fame roster photo** — Hall of Fame | See note below — **one upload, three possible crops** | 140px circle (Legacy Contributors **and** About page Current Year Lineup) **or** up to ~370×460 portrait (this year's scrapbook card) **or** 76px circle (FRD mode Executive Board) | **≥900×1125** (portrait), subject centered and not too tight a crop | Portrait, ~4:5 — see below |

## Note: Hall of Fame photos serve multiple crops from one upload

A Hall of Fame entry's photo isn't uploaded separately per place it
shows — the **same file** is reused across up to four different display
contexts, depending on whether the entry's Session Year matches the
current one (see [feature-map.md](feature-map.md) and
[admin-panel.md](admin-panel.md#adding-a-new-admin-managed-feature)):

- **This year's entries** show as a **portrait 4:5 rectangle** on the
  `/hall-of-fame` scrapbook cards (and the compact version riding the
  pi-wave), but the *exact same photo* also shows as a **circle** on the
  About page's Current Year Lineup (140px) and in FRD mode's Executive
  Board (76px).
- **Legacy (past-year) entries** only ever show as a **140px circle**
  on `/hall-of-fame`'s Legacy Contributors.

Because the same upload has to survive both a rectangular portrait crop
and a circular crop depending on context, a **centered headshot with
some breathing room around the face** (not cropped tight to the jawline)
works best — a tight crop that looks fine as a rectangle can end up
cutting off the chin or forehead once it's center-cropped into a circle.

## Why there's no entry for Articles / Resources / Activity Log / Competition Archive

Those admin pages accept file uploads too, but they're **documents**
(PDFs, slide decks, etc.), not images displayed inline — there's no
"resolution" to recommend; any readable file works, and file *size*
(not pixel dimensions) is the only practical limit there.

## Keeping this accurate

If you add a new image field or change how an existing one is
cropped/sized (a new `aspect-ratio`, a different `sizes` attribute, a
resized grid), update this table in the same change — see
[sourceoftruth/README.md](README.md) for the standing rule that this
folder is kept in sync with the code, not left to drift.
