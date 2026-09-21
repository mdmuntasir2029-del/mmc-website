import { useEffect, useState } from "react";
import * as db from "../../lib/db";
import { SECTION_DEFAULT_VISIBLE, SECTION_LABELS } from "../../lib/types";
import type { SectionKey } from "../../lib/types";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

// Grouped by which page each toggle actually affects, rather than one
// flat list — see item 5 of the redesign brief ("organize the site
// section controls better... according to each page").
const SECTION_GROUPS: { label: string; keys: SectionKey[] }[] = [
  { label: "Home", keys: ["session_photos", "lineup"] },
  { label: "About", keys: ["about", "activity_slideshow"] },
  { label: "Hall of Fame", keys: ["hall_of_fame"] },
  { label: "Awards", keys: ["awards"] },
  { label: "Articles", keys: ["articles"] },
  { label: "Leaderboard", keys: ["leaderboard"] },
];

export default function SiteSections() {
  const [visible, setVisible] = useState<Record<SectionKey, boolean>>(SECTION_DEFAULT_VISIBLE);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SectionKey | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    db.getSiteSections()
      .then((data) => setVisible((v) => ({ ...v, ...data })))
      .catch((err) =>
        setError(
          `Could not load current settings (${errorMessage(err)}). Showing defaults — ` +
            `has supabase/schema.sql been run since the Site Sections feature was added?`
        )
      )
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: SectionKey) {
    setError("");
    const next = !visible[key];
    setVisible((v) => ({ ...v, [key]: next }));
    setSavingKey(key);
    try {
      await db.setSectionVisible(key, next);
    } catch (err) {
      // Roll back on failure.
      setVisible((v) => ({ ...v, [key]: !next }));
      setError(
        `Could not save this change (${errorMessage(err)}). Has supabase/schema.sql ` +
          `been run since the Site Sections feature was added?`
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Site Sections</h2>
          <p>Show or hide major sections/pages on the live site.</p>
        </div>
      </div>

      <div className="panel">
        {error && <div className="form-msg error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          SECTION_GROUPS.map((group) => (
            <div className="section-toggle-group" key={group.label}>
              <h3 className="section-toggle-group-title">{group.label}</h3>
              <div className="section-toggle-list">
                {group.keys.map((key) => (
                  <label className="checkbox-field section-toggle-row" key={key}>
                    <div className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={visible[key]}
                        disabled={savingKey === key}
                        onChange={() => toggle(key)}
                      />
                      <div>
                        <div className="section-toggle-title">
                          {SECTION_LABELS[key].title}
                        </div>
                        <div className="section-toggle-desc">
                          {SECTION_LABELS[key].desc}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
