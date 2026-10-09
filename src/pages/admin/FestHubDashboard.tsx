import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import * as db from "../../lib/db";
import type {
  Fest,
  FestEvent,
  FestStatus,
  EventCategory,
  EventRegistration,
  CustomFieldDef,
  CustomFieldType,
} from "../../lib/types";
import { EVENT_CATEGORIES } from "../../lib/types";

/** Form-editing shape for one custom field row — options are kept as a
 *  raw comma-separated string while editing, and the stable `key` is
 *  only derived from the label at submit time. */
interface CustomFieldFormRow {
  label: string;
  type: CustomFieldType;
  required: boolean;
  optionsText: string;
}

const EMPTY_CUSTOM_FIELD: CustomFieldFormRow = {
  label: "",
  type: "text",
  required: false,
  optionsText: "",
};

const EMPTY_FEST_FORM = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  startsOn: "",
  endsOn: "",
  venue: "",
  status: "draft" as FestStatus,
};

const EMPTY_EVENT_FORM = {
  festId: "",
  slug: "",
  name: "",
  category: "Competition" as EventCategory,
  summary: "",
  description: "",
  startsAt: "",
  endsAt: "",
  venue: "",
  eligibility: "",
  registrationOpensAt: "",
  registrationDeadline: "",
  capacity: "",
  waitlistEnabled: true,
  status: "draft" as FestStatus,
  customFields: [] as CustomFieldFormRow[],
};

function toSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm", not a full ISO
// string with seconds/timezone.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// Rows with no label are treated as not-yet-finished and dropped silently
// (lets an admin click "+ Add field" without it blocking submission).
// Keys are derived from the label, de-duplicated so two fields can't
// silently collide and overwrite each other's stored value.
function toCustomFieldDefs(rows: CustomFieldFormRow[]): CustomFieldDef[] {
  const seen = new Map<string, number>();
  return rows
    .filter((r) => r.label.trim())
    .map((r) => {
      let key = toSlug(r.label) || "field";
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      if (count > 0) key = `${key}-${count + 1}`;
      return {
        key,
        label: r.label.trim(),
        type: r.type,
        required: r.required,
        options:
          r.type === "select"
            ? r.optionsText.split(",").map((o) => o.trim()).filter(Boolean)
            : null,
      };
    });
}

function fromCustomFieldDefs(defs: CustomFieldDef[]): CustomFieldFormRow[] {
  return defs.map((d) => ({
    label: d.label,
    type: d.type,
    required: d.required,
    optionsText: (d.options ?? []).join(", "),
  }));
}

export default function FestHubDashboard() {
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const [festForm, setFestForm] = useState(EMPTY_FEST_FORM);
  const [editingFestId, setEditingFestId] = useState<string | null>(null);
  const [festFile, setFestFile] = useState<File | null>(null);
  const [festError, setFestError] = useState("");
  const [savingFest, setSavingFest] = useState(false);

  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [eventError, setEventError] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  async function load() {
    setLoading(true);
    const [f, e, r] = await Promise.all([
      db.getFests(),
      db.getEvents(),
      db.getAllEventRegistrations(),
    ]);
    setFests(f);
    setEvents(e);
    setRegistrations(r);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const todaysSignups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return registrations.filter((r) => r.createdAt.slice(0, 10) === today).length;
  }, [registrations]);

  const eventsByFest = useMemo(() => {
    const map = new Map<string, FestEvent[]>();
    for (const e of events) {
      const list = map.get(e.festId) ?? [];
      list.push(e);
      map.set(e.festId, list);
    }
    return map;
  }, [events]);

  const registrationCountByEvent = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrations) {
      if (r.status === "cancelled" || r.status === "rejected") continue;
      map.set(r.eventId, (map.get(r.eventId) ?? 0) + 1);
    }
    return map;
  }, [registrations]);

  // ---------- Fest form ----------

  function startEditFest(f: Fest) {
    setEditingFestId(f.id);
    setFestForm({
      slug: f.slug,
      name: f.name,
      tagline: f.tagline ?? "",
      description: f.description ?? "",
      startsOn: f.startsOn,
      endsOn: f.endsOn,
      venue: f.venue ?? "",
      status: f.status,
    });
    setFestFile(null);
    setFestError("");
  }

  function cancelEditFest() {
    setEditingFestId(null);
    setFestForm(EMPTY_FEST_FORM);
    setFestFile(null);
    setFestError("");
  }

  async function handleFestSubmit(e: FormEvent) {
    e.preventDefault();
    setFestError("");
    if (!festForm.name.trim() || !festForm.startsOn || !festForm.endsOn) {
      setFestError("Name, start date, and end date are required.");
      return;
    }
    const slug = toSlug(festForm.slug || festForm.name);
    if (!slug) {
      setFestError("Could not derive a URL slug from that name — set one explicitly.");
      return;
    }
    setSavingFest(true);
    try {
      const payload = {
        name: festForm.name.trim(),
        tagline: festForm.tagline.trim() || null,
        description: festForm.description.trim() || null,
        startsOn: festForm.startsOn,
        endsOn: festForm.endsOn,
        venue: festForm.venue.trim() || null,
        status: festForm.status,
      };
      if (editingFestId) {
        await db.updateFest(editingFestId, payload, festFile);
      } else {
        await db.addFest({ ...payload, slug }, festFile);
      }
      cancelEditFest();
      load();
    } catch (err) {
      setFestError(err instanceof Error ? err.message : "Could not save this fest.");
    } finally {
      setSavingFest(false);
    }
  }

  async function handleDeleteFest(id: string) {
    if (!confirm("Delete this fest and ALL its events and registrations? This cannot be undone.")) return;
    await db.deleteFest(id);
    load();
  }

  // ---------- Event form ----------

  function startAddEvent(festId: string) {
    setEditingEventId(null);
    setEventForm({ ...EMPTY_EVENT_FORM, festId });
    setEventFile(null);
    setEventError("");
  }

  function startEditEvent(ev: FestEvent) {
    setEditingEventId(ev.id);
    setEventForm({
      festId: ev.festId,
      slug: ev.slug,
      name: ev.name,
      category: ev.category,
      summary: ev.summary ?? "",
      description: ev.description ?? "",
      startsAt: toLocalInput(ev.startsAt),
      endsAt: toLocalInput(ev.endsAt),
      venue: ev.venue ?? "",
      eligibility: ev.eligibility ?? "",
      registrationOpensAt: toLocalInput(ev.registrationOpensAt),
      registrationDeadline: toLocalInput(ev.registrationDeadline),
      capacity: ev.capacity === null ? "" : String(ev.capacity),
      waitlistEnabled: ev.waitlistEnabled,
      status: ev.status,
      customFields: fromCustomFieldDefs(ev.customFields),
    });
    setEventFile(null);
    setEventError("");
  }

  function addCustomFieldRow() {
    setEventForm((f) => ({ ...f, customFields: [...f.customFields, { ...EMPTY_CUSTOM_FIELD }] }));
  }

  function updateCustomFieldRow(index: number, patch: Partial<CustomFieldFormRow>) {
    setEventForm((f) => ({
      ...f,
      customFields: f.customFields.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function removeCustomFieldRow(index: number) {
    setEventForm((f) => ({ ...f, customFields: f.customFields.filter((_, i) => i !== index) }));
  }

  function cancelEditEvent() {
    setEditingEventId(null);
    setEventForm(EMPTY_EVENT_FORM);
    setEventFile(null);
    setEventError("");
  }

  async function handleEventSubmit(e: FormEvent) {
    e.preventDefault();
    setEventError("");
    if (!eventForm.festId || !eventForm.name.trim() || !eventForm.startsAt || !eventForm.registrationDeadline) {
      setEventError("Fest, name, start time, and registration deadline are required.");
      return;
    }
    const slug = toSlug(eventForm.slug || eventForm.name);
    if (!slug) {
      setEventError("Could not derive a URL slug from that name — set one explicitly.");
      return;
    }
    setSavingEvent(true);
    try {
      const payload = {
        name: eventForm.name.trim(),
        category: eventForm.category,
        summary: eventForm.summary.trim() || null,
        description: eventForm.description.trim() || null,
        startsAt: new Date(eventForm.startsAt).toISOString(),
        endsAt: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
        venue: eventForm.venue.trim() || null,
        eligibility: eventForm.eligibility.trim() || null,
        registrationOpensAt: eventForm.registrationOpensAt
          ? new Date(eventForm.registrationOpensAt).toISOString()
          : new Date().toISOString(),
        registrationDeadline: new Date(eventForm.registrationDeadline).toISOString(),
        capacity: eventForm.capacity.trim() === "" ? null : parseInt(eventForm.capacity, 10),
        waitlistEnabled: eventForm.waitlistEnabled,
        status: eventForm.status,
        customFields: toCustomFieldDefs(eventForm.customFields),
      };
      if (editingEventId) {
        await db.updateEvent(editingEventId, payload, eventFile);
      } else {
        await db.addEvent({ ...payload, festId: eventForm.festId, slug }, eventFile);
      }
      cancelEditEvent();
      load();
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Could not save this event.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event and all its registrations? This cannot be undone.")) return;
    await db.deleteEvent(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Fests &amp; Events</h2>
          <p>
            Organization &rarr; Fest &rarr; Event &rarr; Registration. Create
            a fest, add events under it, then publish both so they appear
            on /fests.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="admin-stat-cards">
          <div className="admin-stat-card">
            <div className="admin-stat-value">{fests.length}</div>
            <div className="admin-stat-label">Fests</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{events.length}</div>
            <div className="admin-stat-label">Events</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{registrations.length}</div>
            <div className="admin-stat-label">Total registrations</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{todaysSignups}</div>
            <div className="admin-stat-label">Today's sign-ups</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>{editingFestId ? "Edit fest" : "Add a fest"}</h3>
        </div>
        {festError && <div className="form-msg error">{festError}</div>}
        <form onSubmit={handleFestSubmit}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                value={festForm.name}
                onChange={(e) => setFestForm({ ...festForm, name: e.target.value })}
                placeholder="e.g. MMC Math Carnival 2026"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>URL slug</label>
              <input
                type="text"
                value={festForm.slug}
                onChange={(e) => setFestForm({ ...festForm, slug: e.target.value })}
                placeholder="auto from name if left blank"
              />
            </div>
          </div>
          <div className="form-field">
            <label>Tagline</label>
            <input
              type="text"
              value={festForm.tagline}
              onChange={(e) => setFestForm({ ...festForm, tagline: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea
              value={festForm.description}
              onChange={(e) => setFestForm({ ...festForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Starts on <span className="required">*</span></label>
              <input
                type="date"
                value={festForm.startsOn}
                onChange={(e) => setFestForm({ ...festForm, startsOn: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Ends on <span className="required">*</span></label>
              <input
                type="date"
                value={festForm.endsOn}
                onChange={(e) => setFestForm({ ...festForm, endsOn: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Venue</label>
              <input
                type="text"
                value={festForm.venue}
                onChange={(e) => setFestForm({ ...festForm, venue: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select
                value={festForm.status}
                onChange={(e) => setFestForm({ ...festForm, status: e.target.value as FestStatus })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Cover image</label>
            <input type="file" accept="image/*" onChange={(e) => setFestFile(e.target.files?.[0] ?? null)} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={savingFest}>
              {savingFest ? "Saving..." : editingFestId ? "Update fest" : "Add fest"}
            </button>
            {editingFestId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditFest}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>{editingEventId ? "Edit event" : "Add an event"}</h3>
        </div>
        {eventError && <div className="form-msg error">{eventError}</div>}
        <form onSubmit={handleEventSubmit}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Fest <span className="required">*</span></label>
              <select
                value={eventForm.festId}
                onChange={(e) => setEventForm({ ...eventForm, festId: e.target.value })}
                disabled={!!editingEventId}
              >
                <option value="">Select a fest...</option>
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Category</label>
              <select
                value={eventForm.category}
                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as EventCategory })}
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>URL slug</label>
              <input
                type="text"
                value={eventForm.slug}
                onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                placeholder="auto from name if left blank"
              />
            </div>
          </div>
          <div className="form-field">
            <label>Summary (shown on cards)</label>
            <input
              type="text"
              value={eventForm.summary}
              onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Starts at <span className="required">*</span></label>
              <input
                type="datetime-local"
                value={eventForm.startsAt}
                onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Ends at</label>
              <input
                type="datetime-local"
                value={eventForm.endsAt}
                onChange={(e) => setEventForm({ ...eventForm, endsAt: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Venue</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Eligibility</label>
              <input
                type="text"
                value={eventForm.eligibility}
                onChange={(e) => setEventForm({ ...eventForm, eligibility: e.target.value })}
                placeholder="e.g. Classes 6-10"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Registration opens</label>
              <input
                type="datetime-local"
                value={eventForm.registrationOpensAt}
                onChange={(e) => setEventForm({ ...eventForm, registrationOpensAt: e.target.value })}
                placeholder="now, if left blank"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Registration deadline <span className="required">*</span></label>
              <input
                type="datetime-local"
                value={eventForm.registrationDeadline}
                onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Capacity (blank = unlimited)</label>
              <input
                type="number"
                min={0}
                value={eventForm.capacity}
                onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as FestStatus })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>
              <input
                type="checkbox"
                checked={eventForm.waitlistEnabled}
                onChange={(e) => setEventForm({ ...eventForm, waitlistEnabled: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Enable a waitlist once this event is full
            </label>
          </div>
          <div className="form-field">
            <label>Custom registration fields (optional)</label>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: -4, marginBottom: 10 }}>
              Extra questions on this event's registration form — e.g. a team name
              and teammate names for a team event.
            </p>
            {eventForm.customFields.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                  padding: 10,
                  border: "1.5px solid #d3ead4",
                  borderRadius: 8,
                }}
              >
                <input
                  type="text"
                  placeholder="Field label, e.g. Team Name"
                  value={row.label}
                  onChange={(e) => updateCustomFieldRow(i, { label: e.target.value })}
                  style={{ flex: 2, minWidth: 160, padding: "8px 10px", borderRadius: 6, border: "1.5px solid #d3ead4" }}
                />
                <select
                  value={row.type}
                  onChange={(e) => updateCustomFieldRow(i, { type: e.target.value as CustomFieldType })}
                  style={{ flex: 1, minWidth: 110 }}
                >
                  <option value="text">Short text</option>
                  <option value="textarea">Paragraph</option>
                  <option value="select">Dropdown</option>
                </select>
                {row.type === "select" && (
                  <input
                    type="text"
                    placeholder="Options, comma-separated"
                    value={row.optionsText}
                    onChange={(e) => updateCustomFieldRow(i, { optionsText: e.target.value })}
                    style={{ flex: 2, minWidth: 160, padding: "8px 10px", borderRadius: 6, border: "1.5px solid #d3ead4" }}
                  />
                )}
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={(e) => updateCustomFieldRow(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCustomFieldRow(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomFieldRow}>
              + Add field
            </button>
          </div>
          <div className="form-field">
            <label>Cover image</label>
            <input type="file" accept="image/*" onChange={(e) => setEventFile(e.target.files?.[0] ?? null)} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={savingEvent}>
              {savingEvent ? "Saving..." : editingEventId ? "Update event" : "Add event"}
            </button>
            {editingEventId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEditEvent}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Fests &amp; their events</h3>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : fests.length === 0 ? (
          <div className="empty-state">No fests yet — add one above.</div>
        ) : (
          fests.map((f) => (
            <div key={f.id} className="fest-admin-group">
              <div className="fest-admin-group-head">
                <div>
                  <strong>{f.name}</strong>{" "}
                  <span className={`status-pill status-pill--${f.status}`}>{f.status}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startAddEvent(f.id)}>
                    + Event
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEditFest(f)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFest(f.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Category</th>
                      <th>Starts</th>
                      <th>Deadline</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(eventsByFest.get(f.id) ?? []).map((ev) => (
                      <tr key={ev.id}>
                        <td>{ev.name}</td>
                        <td>{ev.category}</td>
                        <td>{new Date(ev.startsAt).toLocaleString()}</td>
                        <td>{new Date(ev.registrationDeadline).toLocaleString()}</td>
                        <td>
                          {registrationCountByEvent.get(ev.id) ?? 0}
                          {ev.capacity !== null ? ` / ${ev.capacity}` : " / ∞"}
                        </td>
                        <td>
                          <span className={`status-pill status-pill--${ev.status}`}>{ev.status}</span>
                        </td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <Link className="btn btn-secondary btn-sm" to={`/admin/events/${ev.id}/participants`}>
                            Participants
                          </Link>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEditEvent(ev)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(ev.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(eventsByFest.get(f.id) ?? []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-state">No events under this fest yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
