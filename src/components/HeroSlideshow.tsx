import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

const AUTO_ADVANCE_MS = 5000;

/**
 * A compact, user-controllable carousel of the latest session's photos
 * (the same data the admin's Session Photos page manages), shown below
 * the hero text rather than behind it — auto-advances, but can also be
 * stepped through with the prev/next arrows or the dots, same pattern
 * as the About page's ActivitySlideshow.
 */
export default function HeroSlideshow() {
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    db.getLatestSessionPhotos()
      .then((data) => setPhotos(data?.photos ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="hero-slideshow-frame">
      <div className="slideshow-viewport hero-slideshow-viewport">
        {photos.map((p, i) => (
          <figure
            key={p.id}
            className={`slideshow-slide${i === index ? " is-active" : ""}`}
          >
            <img
              src={p.imageUrl}
              srcSet={p.imageSrcSet}
              sizes="(max-width: 820px) 100vw, 820px"
              width={1600}
              height={1200}
              alt={p.caption ?? "Club session photo"}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
            />
            {p.caption && (
              <figcaption>
                <span className="slideshow-caption">{p.caption}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="slideshow-nav slideshow-nav--prev"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
          >
            &larr;
          </button>
          <button
            type="button"
            className="slideshow-nav slideshow-nav--next"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
          >
            &rarr;
          </button>

          <div className="slideshow-dots">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`slideshow-dot${i === index ? " is-active" : ""}`}
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
