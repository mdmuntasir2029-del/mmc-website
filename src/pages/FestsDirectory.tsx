import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as db from "../lib/db";
import type { Fest, FestEvent } from "../lib/types";
import { EVENT_CATEGORIES } from "../lib/types";
import { eventPill, festPhase } from "../lib/festStatus";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

const TABS = ["upcoming", "ongoing", "past"] as const;
type Tab = (typeof TABS)[number];

export default function FestsDirectory() {
  const { sections, loaded } = useSiteSections();
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("ongoing");

  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const openOnly = params.get("open") === "1";

  useEffect(() => {
    Promise.all([db.getFests(), db.getEvents(), db.getEventSeatCounts()])
      .then(([f, e, s]) => {
        setFests(f);
        setEvents(e);
        setSeatCounts(s);
      })
      .catch(() => {})
      .finally(() => setDataLoaded(true));
  }, []);

  const festsByPhase = useMemo(() => {
    const groups: Record<Tab, Fest[]> = { upcoming: [], ongoing: [], past: [] };
    for (const f of fests) {
      groups[festPhase(f.startsOn, f.endsOn)].push(f);
    }
    return groups;
  }, [fests]);

  const eventCountByFest = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) map.set(e.festId, (map.get(e.festId) ?? 0) + 1);
    return map;
  }, [events]);

  const festById = useMemo(() => new Map(fests.map((f) => [f.id, f])), [fests]);

  const searchActive = query.trim() !== "" || category !== "" || openOnly;

  const matchingEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (category && e.category !== category) return false;
      const fest = festById.get(e.festId);
      if (openOnly) {
        const pill = eventPill(e, seatCounts[e.id] ?? 0);
        if (pill !== "Open" && pill !== "Closing soon") return false;
      }
      if (!q) return true;
      return [e.name, e.category, e.venue ?? "", fest?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [events, query, category, openOnly, festById, seatCounts]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  if (loaded && !sections.fests) {
    return <SectionUnavailable />;
  }

  return (
    <div className="fests-page">
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Manarat Mathletes Club</span>
            <h1>Fests &amp; Events</h1>
            <p>Browse upcoming fests and register for events — no Google Forms.</p>
          </div>

          <div className="fest-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={t === tab ? "is-active" : ""}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
                <span className="fest-tab-count">{festsByPhase[t].length}</span>
              </button>
            ))}
          </div>

          {!dataLoaded ? (
            <p className="empty-state">Loading...</p>
          ) : festsByPhase[tab].length === 0 ? (
            <p className="empty-state">No {tab} fests right now.</p>
          ) : (
            <div className="fest-card-grid">
              {festsByPhase[tab].map((f) => (
                <Link to={`/fests/${f.slug}`} className="fest-card" key={f.id}>
                  {f.coverUrl ? (
                    <img src={f.coverUrl} srcSet={f.coverSrcSet ?? undefined} sizes="360px" alt="" loading="lazy" />
                  ) : (
                    <div className="fest-card-cover-fallback" aria-hidden="true">{f.name.slice(0, 1)}</div>
                  )}
                  <div className="fest-card-body">
                    <h3>{f.name}</h3>
                    {f.tagline && <p>{f.tagline}</p>}
                    <div className="fest-card-meta">
                      <span>{new Date(f.startsOn).toLocaleDateString()} &ndash; {new Date(f.endsOn).toLocaleDateString()}</span>
                      {f.venue && <span>{f.venue}</span>}
                      <span>{eventCountByFest.get(f.id) ?? 0} events</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-green-deep">
        <div className="container">
          <div className="section-heading">
            <h2>Search every event</h2>
            <p>Search by name, category, venue, or fest — across every fest at once.</p>
          </div>

          <div className="fest-search-bar">
            <input
              type="text"
              placeholder="Search events..."
              value={query}
              onChange={(e) => updateParam("q", e.target.value)}
            />
            <div className="fest-filter-chips">
              <button
                className={category === "" ? "is-active" : ""}
                onClick={() => updateParam("category", "")}
              >
                All categories
              </button>
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={category === c ? "is-active" : ""}
                  onClick={() => updateParam("category", category === c ? "" : c)}
                >
                  {c}
                </button>
              ))}
              <button
                className={openOnly ? "is-active" : ""}
                onClick={() => updateParam("open", openOnly ? "" : "1")}
              >
                Open for registration only
              </button>
            </div>
          </div>

          {searchActive && (
            <div className="fest-search-results">
              {matchingEvents.length === 0 ? (
                <p className="empty-state">No events match.</p>
              ) : (
                matchingEvents.map((e) => {
                  const fest = festById.get(e.festId);
                  const pill = eventPill(e, seatCounts[e.id] ?? 0);
                  return (
                    <Link to={`/events/${e.slug}`} className="fest-search-result" key={e.id}>
                      <span className={`event-pill event-pill--${pill.replace(/\s+/g, "-").toLowerCase()}`}>{pill}</span>
                      <div>
                        <strong>{e.name}</strong>
                        <div className="fest-search-result-meta">
                          {e.category} &middot; {fest?.name} &middot; {new Date(e.startsAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
