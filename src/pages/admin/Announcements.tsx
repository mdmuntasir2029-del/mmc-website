import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { Announcement } from "../../lib/types";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setAnnouncements(await db.getAnnouncements());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!files || files.length === 0) {
      setError("At least one image is required.");
      return;
    }
    setSubmitting(true);
    try {
      for (const file of Array.from(files)) {
        await db.addAnnouncement({ caption: caption.trim() || null }, file);
      }
      setCaption("");
      setFiles(null);
      setFileInputKey((k) => k + 1);
      load();
    } catch {
      setError("Could not upload one of the images. Try smaller image files.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteAnnouncement(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Announcements</h2>
          <p>Image announcements shown on the Home page, newest first.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Post an announcement</h3>
        </div>

        {error && <div className="form-msg error">{error}</div>}

        <form onSubmit={handleUpload}>
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label>Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Applied to every image in this upload"
            />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>
              Image(s) <span className="required">*</span>
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
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="empty-state">No announcements posted yet.</div>
        ) : (
          <div className="admin-photo-grid">
            {announcements.map((a) => (
              <figure className="admin-photo" key={a.id}>
                <img
                  src={a.imageUrl}
                  width={800}
                  height={600}
                  loading="lazy"
                  alt={a.caption ?? "Announcement"}
                />
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(a.id)}
                >
                  Remove
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
