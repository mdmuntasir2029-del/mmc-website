import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

type Variant = "left" | "right" | "full";

/**
 * "Photos From Last Session" — the most recent session's photos. On
 * desktop it renders as a narrow column flanking the pi trail (left /
 * right split the photos between them); on mobile it's one full panel.
 */
export default function SessionPhotoPanel({ variant }: { variant: Variant }) {
  const [label, setLabel] = useState("");
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);

  useEffect(() => {
    db.getLatestSessionPhotos()
      .then((data) => {
        if (data) {
          setLabel(data.label);
          setPhotos(data.photos);
        }
      })
      .catch(() => {});
  }, []);

  if (photos.length === 0) return null;

  const shown =
    variant === "left"
      ? photos.filter((_, i) => i % 2 === 0)
      : variant === "right"
      ? photos.filter((_, i) => i % 2 === 1)
      : photos;

  if (shown.length === 0) return null;

  return (
    <aside className={`session-photos session-photos--${variant}`}>
      <div className="session-photos-head">
        <span className="eyebrow">Photos From Last Session</span>
        {label && <span className="session-photos-label">{label}</span>}
      </div>
      <div className="session-photos-grid">
        {shown.map((p) => (
          <figure key={p.id}>
            <img src={p.imageUrl} alt={p.caption ?? "Club session photo"} loading="lazy" />
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </aside>
  );
}
