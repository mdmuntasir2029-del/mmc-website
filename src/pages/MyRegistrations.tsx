import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as db from "../lib/db";
import type { EventRegistration, FestEvent } from "../lib/types";

export default function MyRegistrations() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [ticket, setTicket] = useState(params.get("ticket") ?? "");
  const [regs, setRegs] = useState<EventRegistration[]>([]);
  const [eventsById, setEventsById] = useState<Record<string, FestEvent>>({});
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    if (!email.trim() || !ticket.trim()) {
      setError("Enter both the email you registered with and any one of your ticket codes.");
      return;
    }
    setLoading(true);
    try {
      const list = await db.getMyRegistrations(email.trim(), ticket.trim());
      setRegs(list);
      setSearched(true);
      if (list.length === 0) {
        setError("No registrations found for that email + ticket code combination.");
      } else {
        const events = await Promise.all(
          Array.from(new Set(list.map((r) => r.eventId))).map((id) => db.getEventById(id))
        );
        const map: Record<string, FestEvent> = {};
        for (const ev of events) if (ev) map[ev.id] = ev;
        setEventsById(map);
      }
    } catch {
      setError("Could not look up registrations right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get("email") && params.get("ticket")) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(r: EventRegistration) {
    if (!confirm("Cancel this registration?")) return;
    try {
      await db.cancelMyRegistration(r.ticketCode, email.trim());
      lookup();
    } catch {
      setError("Could not cancel this registration.");
    }
  }

  return (
    <div className="section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">No account needed</span>
          <h1>My Registrations</h1>
          <p>Look yourself up with the email you registered with, plus any one of your ticket codes.</p>
        </div>

        <form onSubmit={lookup} className="my-registrations-lookup">
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Any ticket code</label>
            <input type="text" value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="MMC-XXXXXX" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Looking up..." : "Find my registrations"}
          </button>
        </form>

        {error && <div className="form-msg error" style={{ maxWidth: 480, margin: "16px auto" }}>{error}</div>}

        {searched && regs.length > 0 && (
          <div className="my-registrations-list">
            {regs.map((r) => {
              const ev = eventsById[r.eventId];
              return (
                <div className="my-registration-card" key={r.id}>
                  <div>
                    <strong>{ev?.name ?? "Event"}</strong>
                    <div className="fest-search-result-meta">
                      {ev && new Date(ev.startsAt).toLocaleString()} &middot; Ticket <code>{r.ticketCode}</code>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`status-pill status-pill--${r.status}`}>{r.status}</span>
                    <Link
                      className="btn btn-secondary btn-sm"
                      to={`/registration/${r.ticketCode}?email=${encodeURIComponent(email.trim())}`}
                    >
                      View
                    </Link>
                    {r.status !== "cancelled" && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
