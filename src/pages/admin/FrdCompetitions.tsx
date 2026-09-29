import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { UpcomingCompetition, CompetitionArchiveEntry } from "../../lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminFrdCompetitions() {
  const [tab, setTab] = useState<"upcoming" | "archive">("upcoming");

  const [upcoming, setUpcoming] = useState<UpcomingCompetition[]>([]);
  const [archive, setArchive] = useState<CompetitionArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState(todayISO());

  const [contestName, setContestName] = useState("");
  const [contestYear, setContestYear] = useState("");
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const [u, a] = await Promise.all([
      db.getUpcomingCompetitions(),
      db.getCompetitionArchive(),
    ]);
    setUpcoming(u);
    setArchive(a);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddUpcoming(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !eventDate) {
      setError("A name and date are both required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addUpcomingCompetition({ name: name.trim(), eventDate });
      setName("");
      load();
    } catch {
      setError("Could not add this competition.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddArchive(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!contestName.trim() || !contestYear.trim() || !paperFile) {
      setError("A name, year, and question paper file are required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addCompetitionArchiveEntry(
        { contestName: contestName.trim(), contestYear: contestYear.trim() },
        paperFile,
        solutionFile
      );
      setContestName("");
      setContestYear("");
      setPaperFile(null);
      setSolutionFile(null);
      setFileInputKey((k) => k + 1);
      load();
    } catch {
      setError("Could not save this entry. Try smaller files.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Competitions &amp; Archive (FRD mode)</h2>
          <p>
            Powers the FRD preview's Competition Bento — upcoming events
            (countdown) and past contest papers/solution keys.
          </p>
        </div>
      </div>

      <div className="subtab-row">
        <button
          className={`subtab ${tab === "upcoming" ? "active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`subtab ${tab === "archive" ? "active" : ""}`}
          onClick={() => setTab("archive")}
        >
          Archive
        </button>
      </div>

      {error && <div className="form-msg error">{error}</div>}

      {tab === "upcoming" ? (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h3 style={{ margin: 0 }}>Add an upcoming competition</h3>
            </div>
            <form onSubmit={handleAddUpcoming}>
              <div className="form-row">
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Intra Math Olympiad"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>
                    Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                style={{ marginTop: 14 }}
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </form>
          </div>

          <div className="panel">
            {loading ? (
              <p>Loading...</p>
            ) : upcoming.length === 0 ? (
              <div className="empty-state">No upcoming competitions yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th style={{ width: 90 }} />
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.eventDate}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            await db.deleteUpcomingCompetition(u.id);
                            load();
                          }}
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
      ) : (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h3 style={{ margin: 0 }}>Add an archive entry</h3>
            </div>
            <form onSubmit={handleAddArchive}>
              <div className="form-row">
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>
                    Contest Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={contestName}
                    onChange={(e) => setContestName(e.target.value)}
                    placeholder="e.g. AMC 10"
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>
                    Year <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={contestYear}
                    onChange={(e) => setContestYear(e.target.value)}
                    placeholder="e.g. 2026"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>
                    Question Paper <span className="required">*</span>
                  </label>
                  <div className="form-file">
                    <input
                      key={`paper-${fileInputKey}`}
                      type="file"
                      onChange={(e) => setPaperFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Solution Key (optional)</label>
                  <div className="form-file">
                    <input
                      key={`solution-${fileInputKey}`}
                      type="file"
                      onChange={(e) => setSolutionFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                style={{ marginTop: 14 }}
              >
                {submitting ? "Uploading..." : "Add"}
              </button>
            </form>
          </div>

          <div className="panel">
            {loading ? (
              <p>Loading...</p>
            ) : archive.length === 0 ? (
              <div className="empty-state">No archive entries yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Contest</th>
                    <th>Year</th>
                    <th>Solution?</th>
                    <th style={{ width: 90 }} />
                  </tr>
                </thead>
                <tbody>
                  {archive.map((a) => (
                    <tr key={a.id}>
                      <td>{a.contestName}</td>
                      <td>{a.contestYear}</td>
                      <td>{a.solutionPath ? "Yes" : "—"}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            await db.deleteCompetitionArchiveEntry(a.id);
                            load();
                          }}
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
      )}
    </>
  );
}
