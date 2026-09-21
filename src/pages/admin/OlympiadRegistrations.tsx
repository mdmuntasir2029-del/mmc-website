import { useEffect, useMemo, useState } from "react";
import * as db from "../../lib/db";
import type { OlympiadRegistration } from "../../lib/types";

export default function OlympiadRegistrations() {
  const [registrations, setRegistrations] = useState<OlympiadRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setRegistrations(await db.getOlympiadRegistrations());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((r) =>
      [r.fullName, r.school, r.className, r.gender, r.phone, r.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [registrations, query]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this registration?")) return;
    await db.deleteOlympiadRegistration(id);
    load();
  }

  function exportCsv() {
    const header = ["Full Name", "School", "Class", "Gender", "Phone", "Email", "Registered At"];
    const rows = filtered.map((r) => [
      r.fullName,
      r.school,
      r.className,
      r.gender,
      r.phone,
      r.email ?? "",
      new Date(r.createdAt).toLocaleString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mmc-olympiad-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Olympiad Registrations</h2>
          <p>
            Everyone who has registered for the Intra Math Olympiad via its
            unlinked registration page.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="panel">
        <input
          type="text"
          placeholder="Search by name, school, class, gender, phone, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "8px",
            border: "1.5px solid #d3ead4",
            marginBottom: "20px",
          }}
        />

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No registrations found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName}</td>
                    <td>{r.school}</td>
                    <td>{r.className}</td>
                    <td>{r.gender}</td>
                    <td>{r.phone}</td>
                    <td>{r.email ?? "—"}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
