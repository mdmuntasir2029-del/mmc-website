import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { Testimonial } from "../../lib/types";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const [quote, setQuote] = useState("");
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setTestimonials(await db.getTestimonials());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!quote.trim() || !personName.trim() || !personRole.trim()) {
      setError("A quote, name, and role are all required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addTestimonial({
        quote: quote.trim(),
        personName: personName.trim(),
        personRole: personRole.trim(),
      });
      setQuote("");
      setPersonName("");
      setPersonRole("");
      load();
    } catch {
      setError("Could not add this testimonial.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteTestimonial(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Testimonials</h2>
          <p>Shown in the About page's "What People Say About the Club" section.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Add a testimonial</h3>
        </div>
        {error && <div className="form-msg error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-field">
            <label>
              Quote <span className="required">*</span>
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What they said about the club"
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Md. Shariful Islam"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Role <span className="required">*</span>
              </label>
              <input
                type="text"
                value={personRole}
                onChange={(e) => setPersonRole(e.target.value)}
                placeholder="e.g. Club In-Charge"
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Adding..." : "Add testimonial"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : testimonials.length === 0 ? (
          <div className="empty-state">No testimonials added yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Name</th>
                <th>Role</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id}>
                  <td>{t.quote}</td>
                  <td>{t.personName}</td>
                  <td>{t.personRole}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(t.id)}
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
