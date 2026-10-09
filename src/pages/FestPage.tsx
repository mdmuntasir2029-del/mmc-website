import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as db from "../lib/db";
import type { Fest, FestEvent } from "../lib/types";
import { eventPill, seatsLeftLabel } from "../lib/festStatus";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

export default function FestPage() {
  const { festSlug } = useParams<{ festSlug: string }>();
  const { sections, loaded } = useSiteSections();
  const [fest, setFest] = useState<Fest | null>(null);
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!festSlug) return;
    (async () => {
      try {
        const f = await db.getFestBySlug(festSlug);
        setFest(f);
        if (f) {
          const [e, s] = await Promise.all([db.getEvents(f.id), db.getEventSeatCounts()]);
          setEvents(e);
          setSeatCounts(s);
        }
      } finally {
        setDataLoaded(true);
      }
    })();
  }, [festSlug]);

  if (loaded && !sections.fests) {
    return <SectionUnavailable />;
  }

  if (dataLoaded && !fest) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <p className="empty-state">Fest not found.</p>
        <Link to="/fests" className="text-link">&larr; Back to Fests</Link>
      </div>
    );
  }

  return (
    <div className="fest-page">
      <section className="section fest-banner">
        <div className="container">
          <p className="fest-breadcrumb">
            <Link to="/fests">Fests</Link> {fest && <>&rarr; {fest.name}</>}
          </p>
          {fest && (
            <>
              <div className="section-heading">
                <h1>{fest.name}</h1>
                {fest.tagline && <p>{fest.tagline}</p>}
              </div>
              <div className="fest-banner-meta">
                <span>{new Date(fest.startsOn).toLocaleDateString()} &ndash; {new Date(fest.endsOn).toLocaleDateString()}</span>
                {fest.venue && <span>{fest.venue}</span>}
                <span className={`status-pill status-pill--${fest.status}`}>{fest.status}</span>
              </div>
              {fest.description && <p className="fest-banner-desc">{fest.description}</p>}
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!dataLoaded ? (
            <p className="empty-state">Loading...</p>
          ) : events.length === 0 ? (
            <p className="empty-state">No events under this fest yet.</p>
          ) : (
            <div className="event-card-grid">
              {events.map((e) => {
                const taken = seatCounts[e.id] ?? 0;
                const pill = eventPill(e, taken);
                return (
                  <Link to={`/events/${e.slug}`} className="event-card" key={e.id}>
                    {e.coverUrl ? (
                      <img src={e.coverUrl} srcSet={e.coverSrcSet ?? undefined} sizes="320px" alt="" loading="lazy" />
                    ) : (
                      <div className="event-card-cover-fallback" aria-hidden="true">{e.category[0]}</div>
                    )}
                    <div className="event-card-body">
                      <div className="event-card-top">
                        <span className="event-category-badge">{e.category}</span>
                        <span className={`event-pill event-pill--${pill.replace(/\s+/g, "-").toLowerCase()}`}>{pill}</span>
                      </div>
                      <h3>{e.name}</h3>
                      <div className="event-card-meta">
                        <span>{new Date(e.startsAt).toLocaleString()}</span>
                        {e.venue && <span>{e.venue}</span>}
                        <span>Deadline: {new Date(e.registrationDeadline).toLocaleDateString()}</span>
                        <span>{seatsLeftLabel(e, taken)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
