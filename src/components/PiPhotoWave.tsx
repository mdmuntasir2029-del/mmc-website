import CurvedPiTrail from "./CurvedPiTrail";
import { waveSlots, waveSlotTopCss } from "../lib/piWave";
import type { SessionPhoto } from "../lib/types";

/**
 * The pinned pi wave with session photos placed beside each crest and
 * trough, alternating sides, popping in as the drawn wave reaches them.
 */
export default function PiPhotoWave({
  progress,
  cycles,
  photos,
  label,
  loaded,
}: {
  progress: number;
  cycles: number;
  photos: SessionPhoto[];
  label: string;
  loaded: boolean;
}) {
  const slots = waveSlots(cycles);

  return (
    <div className="pi-wave-stage">
      <div className="pi-wave-label">
        <span className="eyebrow">Photos From Last Session</span>
        {label && <span className="session-photos-label">{label}</span>}
        {loaded && photos.length === 0 && (
          <p className="session-photos-empty">
            No photos from the last session yet.
          </p>
        )}
      </div>

      <div className="pi-wave-area">
        <CurvedPiTrail progress={progress} cycles={cycles} />

        <div className="pi-wave-photos">
          {slots.map((slot, i) => {
            const photo = photos[i];
            if (!photo) return null;
            const revealed = progress >= slot.t;
            return (
              <figure
                key={photo.id}
                className={`session-photo pi-wave-photo pi-wave-photo--${slot.side}${
                  revealed ? " is-in" : ""
                }`}
                style={{ top: waveSlotTopCss(slot.t) }}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption ?? "Club session photo"}
                  loading="lazy"
                />
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      </div>
    </div>
  );
}
