import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as db from "../lib/db";
import type { Fest, FestEvent, CustomFieldValues } from "../lib/types";
import { canRegister, eventPill, seatsLeftLabel } from "../lib/festStatus";
import { validateEmail, validatePhone } from "../lib/validation";
import { downloadIcsForEvent } from "../lib/ics";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
}

export default function EventPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const { sections, loaded } = useSiteSections();

  const [event, setEvent] = useState<FestEvent | null>(null);
  const [fest, setFest] = useState<Fest | null>(null);
  const [seatsTaken, setSeatsTaken] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [customValues, setCustomValues] = useState<CustomFieldValues>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!eventSlug) return;
    const ev = await db.getEventBySlug(eventSlug);
    setEvent(ev);
    if (ev) {
      const counts = await db.getEventSeatCounts();
      setSeatsTaken(counts[ev.id] ?? 0);
    }
    setDataLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  // Fetch the parent fest separately (for the breadcrumb) once we know
  // the event's festId — simplest correct way without a joined query.
  useEffect(() => {
    if (!event) return;
    db.getFests().then((all) => setFest(all.find((f) => f.id === event.festId) ?? null));
  }, [event]);

  const countdown = useCountdown(event?.registrationDeadline ?? new Date().toISOString());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!event) return;
    if (!fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setFormError(phoneErr);
      return;
    }
    for (const field of event.customFields) {
      if (field.required && !(customValues[field.key] ?? "").trim()) {
        setFormError(`"${field.label}" is required.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await db.registerForEvent(event.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        school: school.trim() || null,
        className: className.trim() || null,
        customFieldValues: customValues,
      });
      navigate(`/registration/${result.ticketCode}?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not complete registration.");
      setSubmitting(false);
    }
  }

  if (loaded && !sections.fests) {
    return <SectionUnavailable />;
  }

  if (!dataLoaded) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <p className="empty-state">Event not found.</p>
        <Link to="/fests" className="text-link">&larr; Back to Fests</Link>
      </div>
    );
  }

  const pill = eventPill(event, seatsTaken);
  const registrable = canRegister(event, seatsTaken);
  const fillPct = event.capacity ? Math.min(100, Math.round((seatsTaken / event.capacity) * 100)) : null;

  return (
    <div className="event-page">
      <section className="section">
        <div className="container">
          <p className="fest-breadcrumb">
            <Link to="/fests">Fests</Link>
            {fest && <> &rarr; <Link to={`/fests/${fest.slug}`}>{fest.name}</Link></>}
            {" "}&rarr; {event.name}
          </p>

          <div className="event-page-grid">
            <div>
              {event.coverUrl && (
                <img
                  className="event-page-cover"
                  src={event.coverUrl}
                  srcSet={event.coverSrcSet ?? undefined}
                  sizes="(max-width: 700px) 100vw, 600px"
                  alt=""
                />
              )}
              <div className="section-heading" style={{ textAlign: "left", margin: "20px 0" }}>
                <span className="event-category-badge">{event.category}</span>
                <h1>{event.name}</h1>
                {event.summary && <p>{event.summary}</p>}
              </div>
              {event.description && <p>{event.description}</p>}

              <div className="event-details-list">
                <div><strong>Date &amp; time:</strong> {new Date(event.startsAt).toLocaleString()}</div>
                {event.venue && <div><strong>Venue:</strong> {event.venue}</div>}
                {event.eligibility && <div><strong>Eligibility:</strong> {event.eligibility}</div>}
                <div><strong>Registration opens:</strong> {new Date(event.registrationOpensAt).toLocaleString()}</div>
                <div><strong>Registration deadline:</strong> {new Date(event.registrationDeadline).toLocaleString()}</div>
              </div>

              {pill !== "Closed" && (
                <div className="event-countdown">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s until deadline
                </div>
              )}

              {event.capacity !== null && (
                <div className="capacity-bar-wrap">
                  <div className="capacity-bar"><div className="capacity-bar-fill" style={{ width: `${fillPct}%` }} /></div>
                  <span>{seatsLeftLabel(event, seatsTaken)}</span>
                </div>
              )}

              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => downloadIcsForEvent(event)}
              >
                Add to calendar
              </button>
            </div>

            <div className="event-register-panel">
              <span className={`event-pill event-pill--${pill.replace(/\s+/g, "-").toLowerCase()}`}>{pill}</span>

              {!registrable ? (
                <p className="empty-state" style={{ marginTop: 16 }}>
                  {pill === "Not yet open" && "Registration hasn't opened yet."}
                  {pill === "Closed" && "Registration has closed."}
                  {pill === "Full" && "This event is full."}
                </p>
              ) : (
                <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
                  {formError && <div className="form-msg error">{formError}</div>}
                  {pill === "Full" && event.waitlistEnabled && (
                    <div className="form-msg" style={{ background: "#fff3cd", color: "#7a5b00" }}>
                      This event is full — you'll be added to the waitlist.
                    </div>
                  )}
                  <div className="form-field">
                    <label>Full Name <span className="required">*</span></label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Phone <span className="required">*</span></label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>School</label>
                    <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Class</label>
                    <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} />
                  </div>
                  {event.customFields.map((field) => (
                    <div className="form-field" key={field.key}>
                      <label>
                        {field.label} {field.required && <span className="required">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={customValues[field.key] ?? ""}
                          onChange={(e) => setCustomValues({ ...customValues, [field.key]: e.target.value })}
                          rows={3}
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={customValues[field.key] ?? ""}
                          onChange={(e) => setCustomValues({ ...customValues, [field.key]: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {(field.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={customValues[field.key] ?? ""}
                          onChange={(e) => setCustomValues({ ...customValues, [field.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                  <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                    {submitting ? "Registering..." : "Register"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
