import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { Announcement } from "../../lib/types";

/** Reads a File's real pixel dimensions before upload — decoding it via
 *  a throwaway <img>, which is the only reliable cross-browser way to
 *  get natural width/height from a File without a server round trip.
 *  Used so the public page can reserve the correct aspect ratio per
 *  image instead of guessing one (see db.ts's addAnnouncement). */
function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
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
        const dims = await readImageDimensions(file);
        await db.addAnnouncement(
          {
            caption: caption.trim() || null,
            description: description.trim() || null,
            embedUrl: embedUrl.trim() || null,
            imageWidth: dims?.width ?? null,
            imageHeight: dims?.height ?? null,
          },
          file
        );
      }
      setCaption("");
      setDescription("");
      setEmbedUrl("");
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
          <p>Image announcements shown on the Home page and the full /announcements page, newest first.</p>
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
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label>Description (optional, shown in the detail popup)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A longer write-up, like a blog post body."
              rows={4}
            />
          </div>
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label>"Learn more" link (optional)</label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://..."
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
            <p className="form-hint" style={{ marginTop: 6 }}>
              The description/link above apply to every image in this
              upload — post them one at a time if they need to differ.
            </p>
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
