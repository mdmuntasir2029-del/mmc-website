import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { SessionPhoto } from "../lib/types";

const AUTO_ADVANCE_MS = 5000;

/**
 * The homepage hero's background — the latest session's photos (the
 * same data the admin's Session Photos page manages), auto-advancing
 * behind the hero text. A dark overlay (see .hero-slideshow-scrim in
 * global.css) sits over the whole thing so the hero text stays legible
 * on the left, with a lighter tint over the images themselves on the
 * right — "a background process behind the text" rather than a plain
 * photo gallery.
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
    <div className="hero-slideshow" aria-hidden="true">
      {photos.map((p, i) => (
        <img
          key={p.id}
          className={`hero-slideshow-slide${i === index ? " is-active" : ""}`}
          src={p.imageUrl}
          srcSet={p.imageSrcSet}
          sizes="100vw"
          width={1600}
          height={1200}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : undefined}
          decoding="async"
        />
      ))}
      <div className="hero-slideshow-scrim" />
    </div>
  );
}
