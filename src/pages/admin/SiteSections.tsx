import { useEffect, useState } from "react";
import * as db from "../../lib/db";
import { SECTION_KEYS, SECTION_LABELS } from "../../lib/types";
import type { SectionKey } from "../../lib/types";

export default function SiteSections() {
  const [visible, setVisible] = useState<Record<SectionKey, boolean>>(
    () =>
      SECTION_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<SectionKey, boolean>
      )
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SectionKey | null>(null);

  useEffect(() => {
    db.getSiteSections()
      .then((data) => setVisible((v) => ({ ...v, ...data })))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: SectionKey) {
    const next = !visible[key];
    setVisible((v) => ({ ...v, [key]: next }));
    setSavingKey(key);
    try {
      await db.setSectionVisible(key, next);
    } catch {
      // Roll back on failure.
      setVisible((v) => ({ ...v, [key]: !next }));
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
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="section-toggle-list">
            {SECTION_KEYS.map((key) => (
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
        )}
      </div>
    </>
  );
}
