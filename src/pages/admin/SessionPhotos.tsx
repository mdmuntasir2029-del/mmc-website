import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { SessionPhoto } from "../../lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SessionPhotos() {
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [sessionLabel, setSessionLabel] = useState("");
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setPhotos(await db.getSessionPhotos());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Group by session (label + date), newest session first.
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; date: string; items: SessionPhoto[] }>();
    for (const p of photos) {
      const key = `${p.sessionDate}__${p.sessionLabel}`;
      if (!map.has(key))
        map.set(key, { label: p.sessionLabel, date: p.sessionDate, items: [] });
      map.get(key)!.items.push(p);
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [photos]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!sessionLabel.trim() || !sessionDate || !files || files.length === 0) {
      setError("A session label, a date, and at least one photo are required.");
      return;
    }
    setSubmitting(true);
    try {
      for (const file of Array.from(files)) {
        await db.addSessionPhoto(
          {
            sessionLabel: sessionLabel.trim(),
            sessionDate,
            caption: caption.trim() || null,
          },
          file
        );
      }
      setCaption("");
      setFiles(null);
      setFileInputKey((k) => k + 1);
      load();
    } catch {
      setError("Could not upload one of the photos. Try smaller image files.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteSessionPhoto(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Session Photos</h2>
          <p>
            Photos from each week's session. The most recent session's photos
            show on the home page.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Add photos</h3>
        </div>

        {error && <div className="form-msg error">{error}</div>}

        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>
                Session label <span className="required">*</span>
              </label>
              <input
                type="text"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="e.g. Week 5"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>
                Session date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label>Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Applied to every photo in this upload"
            />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>
              Photos <span className="required">*</span>
            </label>
            <div className="form-file">
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="panel">
          <p>Loading...</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="panel">
          <div className="empty-state">No session photos yet.</div>
        </div>
      ) : (
        grouped.map((g) => (
          <div className="panel" key={`${g.date}__${g.label}`}>
            <div className="panel-title-row">
              <h3 style={{ margin: 0 }}>
                {g.label}{" "}
                <span style={{ fontWeight: 400, opacity: 0.6 }}>
                  &middot; {new Date(g.date + "T00:00:00").toLocaleDateString()}
                </span>
              </h3>
            </div>
            <div className="admin-photo-grid">
              {g.items.map((p) => (
                <figure className="admin-photo" key={p.id}>
                  <img src={p.imageUrl} alt={p.caption ?? "Session photo"} />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                  >
                    Remove
                  </button>
                </figure>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
