import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { HallOfFameEntry } from "../lib/types";
import { CURRENT_SESSION_YEAR } from "../lib/constants";

/**
 * This session's Hall of Fame entries, shown as a plain sequential card
 * row — deliberately no spiral/wave scroll effect here (unlike the
 * pi-wave/awards track), per the redesign brief. Sources the same data
 * the admin's Hall of Fame Roster page manages, filtered to the current
 * session year.
 */
export default function CurrentLineup() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getHallOfFameEntries()
      .then((all) =>
        setEntries(all.filter((e) => e.sessionYear === CURRENT_SESSION_YEAR))
      )
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && entries.length === 0) return null;

  return (
    <section className="section section-lineup-cards">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Session {CURRENT_SESSION_YEAR}</span>
          <h2>Current Year Lineup</h2>
        </div>
        <div className="lineup-cards-row">
          {entries.map((entry) => (
            <figure className="lineup-person-card" key={entry.id}>
              {entry.imageUrl ? (
                <img
                  src={entry.imageUrl}
                  srcSet={entry.imageSrcSet ?? undefined}
                  sizes="160px"
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="lineup-person-avatar" aria-hidden="true">
                  {entry.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <figcaption>
                <div className="lineup-person-name">{entry.name}</div>
                <div className="lineup-person-role">{entry.roleTitle}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
