import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { HallOfFameEntry } from "../../lib/types";
import { CURRENT_SESSION_YEAR } from "../../lib/constants";

export default function HallOfFame() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [sessionYear, setSessionYear] = useState(CURRENT_SESSION_YEAR);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setEntries(await db.getHallOfFameEntries());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !roleTitle.trim() || !sessionYear.trim()) {
      setError("Name, role, and session year are required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addHallOfFameEntry(
        {
          name: name.trim(),
          roleTitle: roleTitle.trim(),
          sessionYear: sessionYear.trim(),
          displayOrder: parseInt(displayOrder, 10) || 0,
        },
        file
      );
      setName("");
      setRoleTitle("");
      setDisplayOrder("0");
      setFile(null);
      load();
    } catch {
      setError("Could not add this entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteHallOfFameEntry(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Hall of Fame Roster</h2>
          <p>
            Photos shown on the /hall-of-fame page, grouped by session year.
            The current year's ({CURRENT_SESSION_YEAR}) entries also appear
            on the About page's "Current Year Lineup".
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Add an entry</h3>
        </div>
        {error && <div className="form-msg error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fahim Rahman"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Role / Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Club President"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Session Year <span className="required">*</span>
              </label>
              <input
                type="text"
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                placeholder={CURRENT_SESSION_YEAR}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Adding..." : "Add entry"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">No entries added yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }} />
                <th>Name</th>
                <th>Role</th>
                <th>Session Year</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.imageUrl && (
                      <img
                        src={e.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td>{e.name}</td>
                  <td>{e.roleTitle}</td>
                  <td>{e.sessionYear}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(e.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
