import type { SessionPhoto } from "../lib/types";

/**
 * Mobile / reduced-motion layout for "Photos From Last Session": there's
 * no scroll-scrubbed pi wave to place them beside there (see
 * PiPhotoWave for the desktop pinned version), so every photo from the
 * latest session just shows in one grid, already revealed.
 */
export default function SessionPhotoPanel({
  label,
  photos,
  loaded,
}: {
  label: string;
  photos: SessionPhoto[];
  loaded: boolean;
}) {
  return (
    <aside className="session-photos session-photos--full">
      <div className="session-photos-head">
        <span className="eyebrow">Photos From Last Session</span>
        {label && <span className="session-photos-label">{label}</span>}
      </div>

      {photos.length > 0 ? (
        <div className="session-photos-grid">
          {photos.map((p) => (
            <figure key={p.id} className="session-photo is-in">
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
        loaded && (
          <p className="session-photos-empty">
            No photos from the last session yet.
          </p>
        )
      )}
    </aside>
  );
}
