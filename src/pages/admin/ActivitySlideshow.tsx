import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { ActivitySlideshowPhoto } from "../../lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ActivitySlideshow() {
  const [photos, setPhotos] = useState<ActivitySlideshowPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekLabel, setWeekLabel] = useState("");
  const [photoDate, setPhotoDate] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setPhotos(await db.getActivitySlideshowPhotos());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Group by week (label + date), newest first — matches Session Photos.
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { label: string; date: string; items: ActivitySlideshowPhoto[] }
    >();
    for (const p of photos) {
      const key = `${p.photoDate}__${p.weekLabel}`;
      if (!map.has(key))
        map.set(key, { label: p.weekLabel, date: p.photoDate, items: [] });
      map.get(key)!.items.push(p);
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [photos]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!weekLabel.trim() || !photoDate || !files || files.length === 0) {
      setError("A week label, a date, and at least one photo are required.");
      return;
    }
    setSubmitting(true);
    try {
      for (const file of Array.from(files)) {
        await db.addActivitySlideshowPhoto(
          {
            weekLabel: weekLabel.trim(),
            photoDate,
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
    await db.deleteActivitySlideshowPhoto(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Activity Slideshow</h2>
          <p>
            Photos for the About page's slideshow, organized by week &mdash;
            separate from Session Photos on the home page.
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
                Week label <span className="required">*</span>
              </label>
              <input
                type="text"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="e.g. Week 5"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
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
          <div className="empty-state">No slideshow photos yet.</div>
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
                  <img src={p.imageUrl} alt={p.caption ?? "Activity photo"} />
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
