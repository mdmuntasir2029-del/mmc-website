import { useEffect, useMemo, useState } from "react";
import * as db from "../lib/db";
import type { Announcement } from "../lib/types";
import AnnouncementDetailModal from "../components/AnnouncementDetailModal";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";
import { getReadIds } from "../lib/announcementReadTracking";

type ViewMode = "calendar" | "week";

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // 0 = Monday
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnnouncementsPage() {
  const { sections, loaded: sectionsLoaded } = useSiteSections();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewMode>("calendar");
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [pickerDay, setPickerDay] = useState<string | null>(null);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    db.getAnnouncements()
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Announcement[]>();
    for (const a of announcements) {
      const key = dateKey(a.createdAt);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [announcements]);

  function dayHasUnread(list: Announcement[] | undefined): boolean {
    return !!list && list.some((a) => !readIds.has(a.id));
  }

  function openAnnouncement(a: Announcement) {
    setSelected(a);
    setPickerDay(null);
  }

  function closeModal() {
    setSelected(null);
    setReadIds(getReadIds());
  }

  function handleDayClick(key: string) {
    const list = byDay.get(key);
    if (!list || list.length === 0) return;
    if (list.length === 1) {
      openAnnouncement(list[0]);
    } else {
      setPickerDay(key);
    }
  }

  if (sectionsLoaded && !sections.announcements) {
    return <SectionUnavailable />;
  }

  // Calendar grid: Monday-start, 6 rows x 7 days, including the
  // leading/trailing days of adjacent months so the grid is always full.
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const weekGroups = useMemo(() => {
    const map = new Map<string, { weekStart: Date; items: Announcement[] }>();
    for (const a of announcements) {
      const ws = startOfWeek(new Date(a.createdAt));
      const key = ws.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { weekStart: ws, items: [] });
      map.get(key)!.items.push(a);
    }
    return [...map.values()].sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [announcements]);

  return (
    <div className="announcements-page">
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Stay in the loop</span>
            <h1>Announcements</h1>
            <p>Everything the club has posted, browsable by date.</p>
          </div>

          <div className="announcements-view-toggle">
            <button
              className={view === "calendar" ? "is-active" : ""}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
            <button
              className={view === "week" ? "is-active" : ""}
              onClick={() => setView("week")}
            >
              Week View
            </button>
          </div>

          {!loaded ? (
            <p style={{ textAlign: "center" }}>Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="empty-state">No announcements yet &mdash; check back soon.</p>
          ) : view === "calendar" ? (
            <div className="announcements-calendar">
              <div className="calendar-nav">
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(new Date(year, month - 1, 1))
                  }
                  aria-label="Previous month"
                >
                  &larr;
                </button>
                <h2>
                  {MONTH_NAMES[month]} {year}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(new Date(year, month + 1, 1))
                  }
                  aria-label="Next month"
                >
                  &rarr;
                </button>
              </div>

              <div className="calendar-grid calendar-grid-labels">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="calendar-weekday-label">
                    {w}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">
                {days.map((d) => {
                  const key = d.toISOString().slice(0, 10);
                  const list = byDay.get(key);
                  const inMonth = d.getMonth() === month;
                  const unread = dayHasUnread(list);
                  return (
                    <button
                      type="button"
                      key={key}
                      className={`calendar-day${inMonth ? "" : " is-outside"}${
                        list ? " has-announcements" : ""
                      }${unread ? " is-glowing" : ""}`}
                      onClick={() => handleDayClick(key)}
                      disabled={!list}
                    >
                      <span className="calendar-day-num">{d.getDate()}</span>
                      {list && <span className="calendar-day-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>

              {pickerDay && byDay.get(pickerDay) && (
                <div className="calendar-day-picker">
                  <h3>{pickerDay}</h3>
                  <div className="calendar-day-picker-list">
                    {byDay.get(pickerDay)!.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        className={`calendar-day-picker-item${
                          readIds.has(a.id) ? "" : " is-glowing"
                        }`}
                        onClick={() => openAnnouncement(a)}
                      >
                        <img src={a.imageUrl} alt="" />
                        <span>{a.caption ?? "Untitled announcement"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="announcements-weekly">
              {weekGroups.map(({ weekStart, items }) => (
                <div className="announcements-week-group" key={weekStart.toISOString()}>
                  <h2 className="announcements-week-title">
                    Week of{" "}
                    {weekStart.toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <div className="announcements-week-list">
                    {items.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        className={`announcements-week-card${
                          readIds.has(a.id) ? "" : " is-glowing"
                        }`}
                        onClick={() => openAnnouncement(a)}
                      >
                        <img src={a.imageUrl} srcSet={a.imageSrcSet} alt="" />
                        <div>
                          <div className="announcements-week-card-caption">
                            {a.caption ?? "Untitled announcement"}
                          </div>
                          <div className="announcements-week-card-date">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <AnnouncementDetailModal announcement={selected} onClose={closeModal} />
      )}
    </div>
  );
}
