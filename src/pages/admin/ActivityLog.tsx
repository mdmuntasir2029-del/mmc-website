import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Modal from "../../components/Modal";
import * as db from "../../lib/db";
import { fileToDataUrl } from "../../lib/storage";
import type { ActivityLogEntry } from "../../lib/types";

export default function ActivityLog() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<ActivityLogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setEntries(await db.getActivityLog());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    await db.deleteActivityLogEntry(id);
    setSelected(null);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Club Activity Log</h2>
          <p>Session documents and records, organized by date.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Entry
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">No activity log entries yet.</div>
        ) : (
          <div className="log-list">
            {entries.map((entry) => (
              <div
                className="log-item"
                key={entry.id}
                onClick={() => setSelected(entry)}
              >
                <div className="log-item-date">
                  {formatDateShort(entry.date)}
                </div>
                <div className="log-item-main">
                  <h4>{entry.title}</h4>
                  <span>{entry.where}</span>
                </div>
                {entry.fileName && <span className="tag">{"\u{1F4CE}"} File</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddEntryModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="modal-meta-row">
            <span className="tag">{formatDateLong(selected.date)}</span>
          </div>

          <div className="modal-detail">
            <div className="k">What</div>
            <p style={{ marginBottom: 0 }}>{selected.what}</p>
          </div>
          <div className="modal-detail">
            <div className="k">Where</div>
            <p style={{ marginBottom: 0 }}>{selected.where}</p>
          </div>
          <div className="modal-detail">
            <div className="k">How</div>
            <p style={{ marginBottom: 0 }}>{selected.how}</p>
          </div>

          {selected.fileName && selected.fileDataUrl && (
            <div className="modal-detail">
              <div className="k">Attached Document</div>
              <a
                href={selected.fileDataUrl}
                download={selected.fileName}
                className="btn btn-secondary btn-sm"
              >
                Download {selected.fileName}
              </a>
            </div>
          )}

          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(selected.id)}
          >
            Delete Entry
          </button>
        </Modal>
      )}
    </>
  );
}

function AddEntryModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [how, setHow] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date || !title.trim() || !what.trim() || !where.trim() || !how.trim()) {
      setError("Date, title, what, where, and how are all required.");
      return;
    }
    setSubmitting(true);
    try {
      let fileName: string | null = null;
      let fileDataUrl: string | null = null;
      if (file) {
        fileName = file.name;
        fileDataUrl = await fileToDataUrl(file);
      }
      await db.addActivityLogEntry({
        date,
        title: title.trim(),
        what: what.trim(),
        where: where.trim(),
        how: how.trim(),
        fileName,
        fileDataUrl,
      });
      onSaved();
    } catch {
      setError("Could not save this entry. Try a smaller file.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Activity Log Entry" onClose={onClose}>
      {error && <div className="form-msg error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label>
              Date <span className="required">*</span>
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label>
              Title <span className="required">*</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title" />
          </div>
        </div>

        <div className="form-field">
          <label>
            What <span className="required">*</span>
          </label>
          <textarea rows={2} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What happened in this session" />
        </div>

        <div className="form-field">
          <label>
            Where <span className="required">*</span>
          </label>
          <input type="text" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Room / venue" />
        </div>

        <div className="form-field">
          <label>
            How <span className="required">*</span>
          </label>
          <textarea rows={2} value={how} onChange={(e) => setHow(e.target.value)} placeholder="Format, structure, resources used" />
        </div>

        <div className="form-field">
          <label>Document (optional)</label>
          <div className="form-file">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </Modal>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
