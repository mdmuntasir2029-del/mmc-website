import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { Award } from "../../lib/types";

export default function Awards() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [achievement, setAchievement] = useState("");
  const [initials, setInitials] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setAwards(await db.getAwards());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !achievement.trim()) {
      setError("A winner's name and achievement are required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addAward({
        name: name.trim(),
        achievement: achievement.trim(),
        initials: initials.trim() || null,
      });
      setName("");
      setAchievement("");
      setInitials("");
      load();
    } catch {
      setError("Could not add this winner.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteAward(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Awards</h2>
          <p>Winners shown on the /awards page's y = x scatter.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Add a winner</h3>
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
                Achievement <span className="required">*</span>
              </label>
              <input
                type="text"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="e.g. National Olympiad — Gold"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Initials</label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="Auto from name if left blank"
                maxLength={3}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Adding..." : "Add winner"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : awards.length === 0 ? (
          <div className="empty-state">No winners added yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Name</th>
                <th>Achievement</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {awards.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td>{a.name}</td>
                  <td>{a.achievement}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
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
