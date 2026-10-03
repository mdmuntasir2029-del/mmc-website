import { useEffect, useState } from "react";
import CurvedPiTrail from "../components/CurvedPiTrail";
import SectionUnavailable from "../components/SectionUnavailable";
import HallOfFameScrapbookCard from "../components/HallOfFameScrapbookCard";
import * as db from "../lib/db";
import type { HallOfFameEntry } from "../lib/types";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";
import { useSiteSections } from "../hooks/useSiteSections";
import { CURRENT_SESSION_YEAR } from "../lib/constants";

function groupByYear(entries: HallOfFameEntry[]): [string, HallOfFameEntry[]][] {
  const groups = new Map<string, HallOfFameEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.sessionYear) ?? [];
    list.push(entry);
    groups.set(entry.sessionYear, list);
  }
  // getHallOfFameEntries already orders by session_year desc, so
  // insertion order into the map is already newest-first.
  return Array.from(groups.entries());
}

export default function HallOfFame() {
  const { sections, loaded } = useSiteSections();
  const pinned = usePinnedScrollEnabled();
  const piScrub = useScrollScrub(pinned);

  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);

  useEffect(() => {
    db.getHallOfFameEntries()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setEntriesLoaded(true));
  }, []);

  if (loaded && !sections.hall_of_fame) {
    return <SectionUnavailable />;
  }

  // "At the club this year" gets the full-resolution scrapbook
  // treatment; every other session year is a "Legacy contributor,"
  // shown in the existing compact mini-profile style — the same
  // session_year / CURRENT_SESSION_YEAR split the About page's Current
  // Year Lineup already uses, so this needs no schema change.
  const currentYearEntries = entries.filter(
    (e) => e.sessionYear === CURRENT_SESSION_YEAR
  );
  const legacyEntries = entries.filter(
    (e) => e.sessionYear !== CURRENT_SESSION_YEAR
  );
  const legacyGroups = groupByYear(legacyEntries);

  return (
    <div className={pinned ? "hall-of-fame-page hall-of-fame-page--pinned" : "hall-of-fame-page"}>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">The club, in numbers</span>
            <h1>Hall of Fame</h1>
            <p>A running record of everyone who's helped run the club.</p>
          </div>
        </div>
      </section>

      {pinned ? (
        <div className="pin-outer pi-intro-outer" ref={piScrub.outerRef}>
          <div className="pin-sticky">
            <div className="pi-intro-row">
              <CurvedPiTrail progress={piScrub.progress} />
            </div>
          </div>
        </div>
      ) : (
        <section className="section pi-intro-static">
          <div className="container">
            <div className="pi-intro-wave-mobile" aria-hidden="true">
              <CurvedPiTrail progress={1} />
            </div>
          </div>
        </section>
      )}

      {entriesLoaded && entries.length === 0 ? (
        <section className="section section-hof-roster">
          <div className="container">
            <p className="empty-state">No roster entries added yet.</p>
          </div>
        </section>
      ) : (
        <>
          {currentYearEntries.length > 0 && (
            <section className="section section-hof-scrapbook">
              <div className="container">
                <div className="section-heading">
                  <h2>At the club this year:</h2>
                </div>
                <div className="scrapbook-grid">
                  {currentYearEntries.map((entry, i) => (
                    <HallOfFameScrapbookCard entry={entry} index={i} key={entry.id} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {legacyGroups.length > 0 && (
            <section className="section section-hof-roster">
              <div className="container">
                <div className="section-heading">
                  <h2>Legacy contributors:</h2>
                </div>
                {legacyGroups.map(([year, yearEntries]) => (
                  <div className="hof-year-group" key={year}>
                    <h3 className="hof-year-title">{year}</h3>
                    <div className="hof-roster-grid">
                      {yearEntries.map((entry) => (
                        <figure className="hof-roster-card" key={entry.id}>
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              srcSet={entry.imageSrcSet ?? undefined}
                              sizes="180px"
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className="hof-roster-avatar" aria-hidden="true">
                              {entry.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <figcaption>
                            <div className="hof-roster-name">{entry.name}</div>
                            <div className="hof-roster-role">{entry.roleTitle}</div>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
