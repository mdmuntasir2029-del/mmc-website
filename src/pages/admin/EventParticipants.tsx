import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as db from "../../lib/db";
import type { EventRegistration, FestEvent, RegistrationStatus } from "../../lib/types";

const STATUS_OPTIONS: RegistrationStatus[] = [
  "pending",
  "confirmed",
  "waitlisted",
  "cancelled",
  "rejected",
  "attended",
];

export default function EventParticipants() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<FestEvent | null>(null);
  const [regs, setRegs] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function load() {
    if (!eventId) return;
    setLoading(true);
    const [ev, list] = await Promise.all([
      db.getEventById(eventId),
      db.getEventRegistrations(eventId),
    ]);
    setEvent(ev);
    setRegs(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const schools = useMemo(
    () => Array.from(new Set(regs.map((r) => r.school).filter((s): s is string => !!s))).sort(),
    [regs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return regs.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (schoolFilter && r.school !== schoolFilter) return false;
      if (!q) return true;
      return [r.fullName, r.email, r.phone, r.school ?? "", r.className ?? "", r.ticketCode]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [regs, query, statusFilter, schoolFilter]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const r of regs) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const taken = (byStatus.confirmed ?? 0) + (byStatus.attended ?? 0);
    const fillPct = event?.capacity ? Math.round((taken / event.capacity) * 100) : null;

    const byDay = new Map<string, number>();
    for (const r of regs) {
      const day = r.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
    const maxDay = Math.max(1, ...days.map(([, n]) => n));

    const bySchool = new Map<string, number>();
    for (const r of regs) {
      const key = r.school ?? "Unspecified";
      bySchool.set(key, (bySchool.get(key) ?? 0) + 1);
    }
    const schoolBreakdown = Array.from(bySchool.entries()).sort(([, a], [, b]) => b - a);

    return { byStatus, taken, fillPct, days, maxDay, schoolBreakdown };
  }, [regs, event]);

  function toggleSelected(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((s) => (s.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id))));
  }

  async function handleStatusChange(id: string, status: RegistrationStatus) {
    await db.updateRegistrationStatus(id, status);
    load();
  }

  async function handleBulk(status: RegistrationStatus) {
    if (selected.size === 0) return;
    await db.bulkUpdateRegistrationStatus(Array.from(selected), status);
    setSelected(new Set());
    load();
  }

  function exportCsv() {
    const customFields = event?.customFields ?? [];
    const header = [
      "Name", "School", "Class", "Email", "Phone", "Ticket", "Status", "Registered At",
      ...customFields.map((f) => f.label),
    ];
    const rows = filtered.map((r) => [
      r.fullName,
      r.school ?? "",
      r.className ?? "",
      r.email,
      r.phone,
      r.ticketCode,
      r.status,
      new Date(r.createdAt).toLocaleString(),
      ...customFields.map((f) => r.customFieldValues[f.key] ?? ""),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmc-${event?.slug ?? "event"}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>{event ? event.name : "Participants"}</h2>
          <p>
            <Link to="/admin/events" className="text-link">&larr; Back to Fests &amp; Events</Link>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="panel">
        <div className="admin-stat-cards">
          <div className="admin-stat-card">
            <div className="admin-stat-value">{regs.length}</div>
            <div className="admin-stat-label">Total registrations</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">
              {stats.taken}{event?.capacity ? ` / ${event.capacity}` : ""}
            </div>
            <div className="admin-stat-label">Seats filled{stats.fillPct !== null ? ` (${stats.fillPct}%)` : ""}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{stats.byStatus.waitlisted ?? 0}</div>
            <div className="admin-stat-label">Waitlisted</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{stats.byStatus.attended ?? 0}</div>
            <div className="admin-stat-label">Checked in</div>
          </div>
        </div>

        {stats.days.length > 0 && (
          <div className="admin-chart">
            <div className="admin-chart-title">Sign-ups per day</div>
            <div className="admin-chart-bars">
              {stats.days.map(([day, n]) => (
                <div className="admin-chart-bar-col" key={day} title={`${day}: ${n}`}>
                  <div
                    className="admin-chart-bar"
                    style={{ height: `${Math.max(6, (n / stats.maxDay) * 60)}px` }}
                  />
                  <span className="admin-chart-bar-label">{day.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.schoolBreakdown.length > 0 && (
          <div className="admin-chart">
            <div className="admin-chart-title">By school</div>
            <ul className="admin-breakdown-list">
              {stats.schoolBreakdown.slice(0, 8).map(([school, n]) => (
                <li key={school}>
                  <span>{school}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="form-row">
          <input
            type="text"
            placeholder="Search by name, email, phone, ticket..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 2, padding: "11px 14px", borderRadius: 8, border: "1.5px solid #d3ead4" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">All schools</option>
            {schools.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {selected.size > 0 && (
          <div className="admin-bulk-bar">
            <span>{selected.size} selected</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulk("confirmed")}>Confirm</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulk("rejected")}>Reject</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulk("attended")}>Mark attended</button>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No registrations match.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Registered</th>
                  {(event?.customFields.length ?? 0) > 0 && <th>Details</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelected(r.id)}
                      />
                    </td>
                    <td>{r.fullName}</td>
                    <td>{r.school ?? "—"}</td>
                    <td>{r.className ?? "—"}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td><code>{r.ticketCode}</code></td>
                    <td>
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value as RegistrationStatus)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    {(event?.customFields.length ?? 0) > 0 && (
                      <td>
                        {event && event.customFields.some((f) => r.customFieldValues[f.key]) ? (
                          <details>
                            <summary style={{ cursor: "pointer" }}>View</summary>
                            <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                              {event.customFields.map((f) => (
                                <div key={f.key}>
                                  <strong>{f.label}:</strong> {r.customFieldValues[f.key] || "—"}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
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
