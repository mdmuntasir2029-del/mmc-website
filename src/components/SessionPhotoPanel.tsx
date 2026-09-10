import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

type Variant = "left" | "right" | "full";

/**
 * "Photos From Last Session" — the most recent session's photos.
 * "left" / "full" always show the heading (so it's present beside the pi
 * trail even before any photos are uploaded); "right" is overflow only
 * (the odd-indexed photos, no heading) and renders nothing when there
 * aren't any.
 */
export default function SessionPhotoPanel({ variant }: { variant: Variant }) {
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
  const shown =
    variant === "left"
      ? photos.filter((_, i) => i % 2 === 0)
      : variant === "right"
      ? photos.filter((_, i) => i % 2 === 1)
      : photos;

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
          {shown.map((p) => (
            <figure key={p.id}>
              <img
                src={p.imageUrl}
                alt={p.caption ?? "Club session photo"}
                loading="lazy"
              />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
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
