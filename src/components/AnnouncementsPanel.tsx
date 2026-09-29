import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as db from "../lib/db";
import type { Announcement } from "../lib/types";
import AnnouncementDetailModal from "./AnnouncementDetailModal";

/** Home page teaser — the most recent few announcements, each opening
 *  the same detail popup the full /announcements page uses. The full
 *  calendar/week-by-week experience lives on its own page since it's
 *  substantial enough to be "a separate section of the website." */
export default function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    db.getAnnouncements()
      .then((all) => setAnnouncements(all.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    // Always rendered with this id (even when empty) — the hero's "See
    // Upcoming Events" button anchors straight here.
    <section className="section section-announcements" id="announcements">
      <div className="container">
        <div className="section-heading section-heading--row">
          <div>
            <span className="eyebrow">Stay in the loop</span>
            <h2>Announcements</h2>
          </div>
          <Link to="/announcements" className="text-link">
            View all &rarr;
          </Link>
        </div>
        {loaded && announcements.length === 0 ? (
          <p className="empty-state">No announcements yet &mdash; check back soon.</p>
        ) : (
          <div className="announcement-grid">
            {announcements.map((a, i) => (
              <figure className="announcement-card" key={a.id}>
                <button
                  type="button"
                  className="announcement-card-hover"
                  onClick={() => setSelected(a)}
                  aria-label={`View announcement: ${a.caption ?? "untitled"}`}
                >
                  <img
                    src={a.imageUrl}
                    srcSet={a.imageSrcSet}
                    sizes="(max-width: 900px) 100vw, 380px"
                    width={a.imageWidth ?? undefined}
                    height={a.imageHeight ?? undefined}
                    alt={a.caption ?? "Club announcement"}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="announcement-card-learn-more">Learn More</span>
                </button>
                {a.caption && <figcaption>{a.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <AnnouncementDetailModal announcement={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
