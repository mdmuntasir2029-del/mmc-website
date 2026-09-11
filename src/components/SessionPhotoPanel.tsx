import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

type Variant = "left" | "right" | "full";

// Spaced so a photo pops in roughly as the pi wave's drawn wavefront
// reaches it — same pacing idea as the lineup cards.
const revealAt = (i: number, count: number) => (i + 0.4) / count;

/**
 * "Photos From Last Session" — the most recent session's photos.
 * "left" / "full" always show the heading (so it's present beside the pi
 * trail even before any photos are uploaded); "right" is overflow only
 * (the odd-indexed photos, no heading) and renders nothing when there
 * aren't any.
 *
 * When `progress` (the pi trail's scrub progress, 0..1) is supplied, the
 * photos reveal one by one as it advances instead of all appearing at
 * once — left/right panels use each photo's index in the *full* list so
 * the two sides stay in the same one-by-one sequence. Without a
 * `progress` (the non-pinned mobile layout) every photo is shown.
 */
export default function SessionPhotoPanel({
  variant,
  progress,
}: {
  variant: Variant;
  progress?: number;
}) {
  const [label, setLabel] = useState("");
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getLatestSessionPhotos()
      .then((data) => {
        if (data) {
          setLabel(data.label);
          setPhotos(data.photos);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const isOverflow = variant === "right";
  const indexed = photos.map((photo, i) => ({ photo, i }));
  const shown =
    variant === "left"
      ? indexed.filter((_, i) => i % 2 === 0)
      : variant === "right"
      ? indexed.filter((_, i) => i % 2 === 1)
      : indexed;

  if (isOverflow && shown.length === 0) return null;

  return (
    <aside className={`session-photos session-photos--${variant}`}>
      {!isOverflow && (
        <div className="session-photos-head">
          <span className="eyebrow">Photos From Last Session</span>
          {label && <span className="session-photos-label">{label}</span>}
        </div>
      )}

      {shown.length > 0 ? (
        <div className="session-photos-grid">
          {shown.map(({ photo: p, i }) => {
            const revealed =
              progress === undefined || progress >= revealAt(i, photos.length);
            return (
              <figure
                key={p.id}
                className={`session-photo${revealed ? " is-in" : ""}`}
              >
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? "Club session photo"}
                  loading="lazy"
                />
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      ) : (
        !isOverflow &&
        loaded && (
          <p className="session-photos-empty">
            No photos from the last session yet.
          </p>
        )
      )}
    </aside>
  );
}
