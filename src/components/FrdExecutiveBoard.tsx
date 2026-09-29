import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { HallOfFameEntry, Award } from "../lib/types";
import { CURRENT_SESSION_YEAR } from "../lib/constants";

/**
 * "Executive Board & Leadership" — Core Page Architecture §4 of the
 * brief. Reuses the current session's Hall of Fame roster (same data
 * as About's "Current Year Lineup") rather than a separate exec-board
 * table, cross-referencing Awards by name for "top competition awards"
 * since there's no formal relation between the two tables.
 */
export default function FrdExecutiveBoard() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([db.getHallOfFameEntries(), db.getAwards()])
      .then(([allEntries, allAwards]) => {
        setEntries(allEntries.filter((e) => e.sessionYear === CURRENT_SESSION_YEAR));
        setAwards(allAwards);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || entries.length === 0) return null;

  return (
    <section className="frd-execboard" id="frd-executive-board">
      <div className="container">
        <span className="frd-eyebrow">Session {CURRENT_SESSION_YEAR}</span>
        <h2 className="frd-execboard-title">Executive Board &amp; Leadership</h2>
        <div className="frd-execboard-grid">
          {entries.map((e) => {
            const memberAwards = awards.filter(
              (a) => a.name.trim().toLowerCase() === e.name.trim().toLowerCase()
            );
            return (
              <article className="frd-exec-card" key={e.id}>
                {e.imageUrl ? (
                  <img src={e.imageUrl} alt="" className="frd-exec-photo" />
                ) : (
                  <div className="frd-exec-photo frd-exec-photo--placeholder" aria-hidden="true">
                    {e.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <h3>{e.name}</h3>
                <p className="frd-exec-role">{e.roleTitle}</p>

                {e.favoriteConstant && (
                  <p className="frd-exec-meta">
                    <span className="frd-exec-meta-label">Favorite constant</span>{" "}
                    {e.favoriteConstant}
                  </p>
                )}
                {e.researchArea && (
                  <p className="frd-exec-meta">
                    <span className="frd-exec-meta-label">Research area</span>{" "}
                    {e.researchArea}
                  </p>
                )}

                {memberAwards.length > 0 && (
                  <ul className="frd-exec-awards">
                    {memberAwards.map((a) => (
                      <li key={a.id}>{a.achievement}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
