import type { CSSProperties } from "react";
import type { HallOfFameEntry } from "../lib/types";
import { autoInitials } from "../lib/awardInitials";

// Alternating tilt angles for an organic, hand-placed scrapbook feel —
// cycles rather than randomizes so the layout is stable across renders.
const TILTS = [-2.5, 2, -1.5, 2.5, -2, 1.5];

/**
 * A full-resolution "polaroid in a scrapbook" card for this session's
 * Hall of Fame roster — the FULL visual treatment (spiral-bound spine,
 * numbered watermark, badge + role stamp, sparkle, a handwritten-style
 * signature over the photo) per the "At the club this year" brief,
 * distinct from the compact mini-profile avatars used for
 * HallOfFameRosterCard / Legacy Contributors.
 */
export default function HallOfFameScrapbookCard({
  entry,
  index,
}: {
  entry: HallOfFameEntry;
  index: number;
}) {
  const tilt = TILTS[index % TILTS.length];

  return (
    <figure
      className="scrapbook-card"
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <div className="scrapbook-spine" aria-hidden="true">
        <div className="scrapbook-spine-holes">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="scrapbook-spine-hole" />
          ))}
        </div>
        <span className="scrapbook-spine-text">OFFICIAL</span>
      </div>

      <div className="scrapbook-body">
        <div className="scrapbook-top-row">
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="scrapbook-badge"
          />
          <span className="scrapbook-tag">{entry.roleTitle}</span>
        </div>

        <div className="scrapbook-photo-wrap">
          <span className="scrapbook-number" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="scrapbook-photo-frame">
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                srcSet={entry.imageSrcSet ?? undefined}
                sizes="(max-width: 640px) 80vw, 320px"
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="scrapbook-photo-fallback" aria-hidden="true">
                {autoInitials(entry.name)}
              </div>
            )}
            <span className="scrapbook-sparkle" aria-hidden="true">
              &#10022;
            </span>
            <span className="scrapbook-signature">{entry.name}</span>
          </div>
        </div>

        <figcaption className="scrapbook-caption">
          <span className="scrapbook-name">{entry.name}</span>
          <span className="scrapbook-role">{entry.roleTitle}</span>
        </figcaption>
      </div>
    </figure>
  );
}
