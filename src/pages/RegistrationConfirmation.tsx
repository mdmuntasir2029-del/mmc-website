import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import * as db from "../lib/db";
import type { EventRegistration, FestEvent } from "../lib/types";
import { ticketQrDataUrl } from "../lib/qr";
import { downloadIcsForEvent } from "../lib/ics";

export default function RegistrationConfirmation() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";

  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [event, setEvent] = useState<FestEvent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketCode || !email) {
      setLoaded(true);
      setError("This link is missing your email — use the one from your registration confirmation.");
      return;
    }
    (async () => {
      try {
        const list = await db.getMyRegistrations(email, ticketCode);
        const match = list.find((r) => r.ticketCode === ticketCode) ?? null;
        setRegistration(match);
        if (match) {
          const ev = await db.getEventById(match.eventId);
          setEvent(ev);
          ticketQrDataUrl(match.ticketCode).then(setQrDataUrl).catch(() => {});
        } else {
          setError("No registration found for that ticket code and email.");
        }
      } catch {
        setError("Could not load this registration.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [ticketCode, email]);

  if (!loaded) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <p className="empty-state">{error || "Registration not found."}</p>
        <Link to="/fests" className="text-link">&larr; Back to Fests</Link>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div className="registration-confirmation">
          <span className={`status-pill status-pill--${registration.status}`}>{registration.status}</span>
          <h1>You're registered!</h1>
          <div className="registration-ticket-code">{registration.ticketCode}</div>
          {qrDataUrl && (
            <img className="registration-ticket-qr" src={qrDataUrl} alt={`QR code for ticket ${registration.ticketCode}`} />
          )}
          <p>Keep this ticket code and the email you registered with — you'll need both to look up or cancel this registration. Show the QR code at check-in.</p>

          <div className="event-details-list" style={{ textAlign: "left" }}>
            {event && (
              <>
                <div><strong>Event:</strong> {event.name}</div>
                <div><strong>Date &amp; time:</strong> {new Date(event.startsAt).toLocaleString()}</div>
                {event.venue && <div><strong>Venue:</strong> {event.venue}</div>}
              </>
            )}
            <div><strong>Name:</strong> {registration.fullName}</div>
            <div><strong>Email:</strong> {registration.email}</div>
            <div><strong>Status:</strong> {registration.status}</div>
          </div>

          <div
            className="registration-actions"
            style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center", flexWrap: "wrap" }}
          >
            <button className="btn btn-secondary" onClick={() => window.print()}>Print / Save</button>
            {event && (
              <button className="btn btn-secondary" onClick={() => downloadIcsForEvent(event)}>
                Add to calendar
              </button>
            )}
            <Link
              className="btn btn-primary"
              to={`/my-registrations?email=${encodeURIComponent(registration.email)}&ticket=${registration.ticketCode}`}
            >
              View all my registrations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
