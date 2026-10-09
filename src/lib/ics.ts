import type { FestEvent } from "./types";

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function buildIcsForEvent(event: FestEvent): string {
  // endsAt is optional in the data model (some events only record a start
  // time) — fall back to a 2-hour block so the calendar entry still has a
  // sensible duration instead of a zero-length event.
  const endIso = event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manarat Mathletes Club//Fest Hub//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@manaratmath.club`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startsAt)}`,
    `DTEND:${toIcsDate(endIso)}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
  ];
  if (event.venue) lines.push(`LOCATION:${escapeIcsText(event.venue)}`);
  if (event.summary) lines.push(`DESCRIPTION:${escapeIcsText(event.summary)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsForEvent(event: FestEvent): void {
  const blob = new Blob([buildIcsForEvent(event)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
