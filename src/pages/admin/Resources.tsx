import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { ResourceCategory, ResourceItem } from "../../lib/types";

const CATEGORIES: { key: ResourceCategory; label: string }[] = [
  { key: "presentations", label: "Presentations" },
  { key: "quizzes", label: "Quizzes" },
  { key: "questions", label: "Questions" },
];

export default function Resources() {
  const [category, setCategory] = useState<ResourceCategory>("presentations");
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load(cat: ResourceCategory) {
    setLoading(true);
    setItems(await db.getResources(cat));
    setLoading(false);
  }

  useEffect(() => {
    load(category);
  }, [category]);

  const [fileInputKey, setFileInputKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !file) {
      setError("A title and a file are both required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addResource(category, { title: title.trim() }, file);
      setTitle("");
      setFile(null);
      setFileInputKey((k) => k + 1);
      load(category);
    } catch {
      setError("Could not save this file. Try something smaller.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteResource(category, id);
    load(category);
  }

  async function handleDownload(item: ResourceItem) {
    setDownloadingId(item.id);
    try {
      const url = await db.getFileUrl(item.filePath);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Resources</h2>
          <p>Academic materials shared with club members.</p>
        </div>
      </div>

      <div className="subtab-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`subtab ${category === c.key ? "active" : ""}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>
            Upload to {CATEGORIES.find((c) => c.key === category)?.label}
          </h3>
        </div>

        {error && <div className="form-msg error">{error}</div>}

        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Week 3 slides"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                File <span className="required">*</span>
              </label>
              <div className="form-file">
                <input
                  key={fileInputKey}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: "14px" }}
          >
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">Nothing uploaded here yet.</div>
        ) : (
          items.map((item) => (
            <div className="resource-item" key={item.id}>
              <div>
                <div className="name">{item.title}</div>
                <div className="meta">
                  {item.fileName} &middot;{" "}
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="row">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={downloadingId === item.id}
                  onClick={() => handleDownload(item)}
                >
                  {downloadingId === item.id ? "Preparing..." : "Download"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
