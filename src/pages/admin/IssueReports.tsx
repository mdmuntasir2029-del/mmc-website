import { useEffect, useState } from "react";
import * as db from "../../lib/db";
import type { IssueReport } from "../../lib/types";

export default function IssueReports() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setReports(await db.getIssueReports());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    await db.deleteIssueReport(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Issue Reports</h2>
          <p>
            Bug reports and suggestions submitted through the sitewide
            "Report an issue" button — visible only to you.
          </p>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : reports.length === 0 ? (
          <div className="empty-state">No reports yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Type</th>
                <th>Message</th>
                <th>Email</th>
                <th style={{ width: 130 }}>Submitted</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.kind === "bug" ? "Bug" : "Suggestion"}</td>
                  <td>{r.message}</td>
                  <td>{r.reporterEmail ?? "—"}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(r.id)}
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
