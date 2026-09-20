import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { ActivitySlideshowPhoto } from "../lib/types";

const AUTO_ADVANCE_MS = 5000;

/**
 * The About page's activity slideshow — a separate, independently
 * admin-managed photo set (see admin/ActivitySlideshow.tsx), organized
 * by week like Session Photos but not tied to it: this cycles through
 * every uploaded photo (not just the latest week), auto-advancing with
 * manual prev/next/dot controls.
 */
export default function ActivitySlideshow() {
  const [photos, setPhotos] = useState<ActivitySlideshowPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    db.getActivitySlideshowPhotos()
      .then(setPhotos)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  if (!loaded) return null;

  return (
    <section className="section section-slideshow" id="activity-slideshow">
      <div className="container">
        <div className="section-heading">
          <h2>Activity Slideshow</h2>
          <p>A running look back at club sessions, week by week.</p>
        </div>

        {photos.length === 0 ? (
          <p className="empty-state">No slideshow photos added yet.</p>
        ) : (
          <div className="slideshow-frame">
            <div className="slideshow-viewport">
              {photos.map((p, i) => (
                <figure
                  key={p.id}
                  className={`slideshow-slide${i === index ? " is-active" : ""}`}
                >
                  <img
                    src={p.imageUrl}
                    srcSet={p.imageSrcSet}
                    sizes="(max-width: 1180px) 100vw, 1180px"
                    width={1280}
                    height={720}
                    alt={p.caption ?? "Club activity photo"}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <figcaption>
                    <span className="slideshow-week">{p.weekLabel}</span>
                    {p.caption && <span className="slideshow-caption">{p.caption}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="slideshow-nav slideshow-nav--prev"
                  aria-label="Previous photo"
                  onClick={() =>
                    setIndex((i) => (i - 1 + photos.length) % photos.length)
                  }
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
        )}
      </div>
    </section>
  );
}
