import { useEffect, useMemo, useState } from "react";
import * as db from "../../lib/db";
import type { Member } from "../../lib/types";

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setMembers(await db.getMembers());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.className, m.section, m.roll, m.studentCode, m.phone, m.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [members, query]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this member from the list?")) return;
    await db.deleteMember(id);
    load();
  }

  function exportCsv() {
    const header = ["Name", "Class", "Section", "Roll", "Student Code", "Phone", "Email", "Registered At"];
    const rows = filtered.map((m) => [
      m.name,
      m.className,
      m.section,
      m.roll,
      m.studentCode,
      m.phone,
      m.email ?? "",
      new Date(m.registeredAt).toLocaleString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mmc-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Member Management</h2>
          <p>Everyone who has registered for the club.</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="panel">
        <input
          type="text"
          placeholder="Search by name, class, roll, student code, phone, or email..."
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
          <div className="empty-state">No members found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll</th>
                  <th>Student Code</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.className}</td>
                    <td>{m.section}</td>
                    <td>{m.roll}</td>
                    <td>{m.studentCode}</td>
                    <td>{m.phone}</td>
                    <td>{m.email ?? "—"}</td>
                    <td>{new Date(m.registeredAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
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
