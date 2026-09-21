import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { Announcement } from "../lib/types";

export default function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getAnnouncements()
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && announcements.length === 0) return null;

  return (
    <section className="section section-announcements">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Stay in the loop</span>
          <h2>Announcements</h2>
        </div>
        <div className="announcement-grid">
          {announcements.map((a, i) => (
            <figure className="announcement-card" key={a.id}>
              <img
                src={a.imageUrl}
                srcSet={a.imageSrcSet}
                sizes="(max-width: 900px) 100vw, 380px"
                width={800}
                height={600}
                alt={a.caption ?? "Club announcement"}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              {a.caption && <figcaption>{a.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
