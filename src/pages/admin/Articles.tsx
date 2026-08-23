import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Modal from "../../components/Modal";
import { IconClip } from "../../components/icons";
import * as db from "../../lib/db";
import type { Article } from "../../lib/types";

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setArticles(await db.getArticles());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remove this article?")) return;
    await db.deleteArticle(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Articles</h2>
          <p>Research articles published on the public site.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Article
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : articles.length === 0 ? (
          <div className="empty-state">No articles published yet.</div>
        ) : (
          articles.map((a) => (
            <div className="resource-item" key={a.id}>
              <div>
                <div className="name">{a.title}</div>
                <div className="meta">
                  {a.author} &middot; {new Date(a.publishedDate + "T00:00:00").toLocaleDateString()}
                  {a.fileName && (
                    <>
                      {" "}
                      &middot; <IconClip className="inline-icon" /> {a.fileName}
                    </>
                  )}
                  {a.link && <> &middot; has link</>}
                </div>
              </div>
              <div className="row">
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddArticleModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </>
  );
}

function AddArticleModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedDate, setPublishedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [abstract, setAbstract] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !publishedDate || !abstract.trim()) {
      setError("Title, author, date, and abstract are all required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addArticle(
        {
          title: title.trim(),
          author: author.trim(),
          abstract: abstract.trim(),
          publishedDate,
          link: link.trim() || null,
        },
        file
      );
      onSaved();
    } catch {
      setError("Could not save this article. Try a smaller file.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Article" onClose={onClose}>
      {error && <div className="form-msg error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>
            Title <span className="required">*</span>
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>
              Author <span className="required">*</span>
            </label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name(s)" />
          </div>
          <div className="form-field">
            <label>
              Published Date <span className="required">*</span>
            </label>
            <input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label>
            Abstract <span className="required">*</span>
          </label>
          <textarea rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Summary of the article" />
        </div>

        <div className="form-field">
          <label>External Link (optional)</label>
          <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>

        <div className="form-field">
          <label>Attachment (optional, e.g. PDF)</label>
          <div className="form-file">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Saving..." : "Publish Article"}
        </button>
      </form>
    </Modal>
  );
}
