import type { FestEvent } from "./types";

export type EventPill = "Open" | "Closing soon" | "Full" | "Closed" | "Not yet open";

const CLOSING_SOON_MS = 24 * 60 * 60 * 1000;

/** The status pill shown on event cards/pages — derived live from the
 *  event's own window/capacity, not a stored field, so it's always
 *  accurate without a cron job flipping a status column. */
export function eventPill(event: FestEvent, seatsTaken: number): EventPill {
  const now = Date.now();
  const opens = new Date(event.registrationOpensAt).getTime();
  const deadline = new Date(event.registrationDeadline).getTime();

  if (now < opens) return "Not yet open";
  if (now > deadline) return "Closed";
  if (event.capacity !== null && seatsTaken >= event.capacity) return "Full";
  if (deadline - now <= CLOSING_SOON_MS) return "Closing soon";
  return "Open";
}

export function seatsLeftLabel(event: FestEvent, seatsTaken: number): string {
  if (event.capacity === null) return "Unlimited seats";
  const left = Math.max(0, event.capacity - seatsTaken);
  return `${left} seat${left === 1 ? "" : "s"} left`;
}

export function canRegister(event: FestEvent, seatsTaken: number): boolean {
  const pill = eventPill(event, seatsTaken);
  if (pill === "Closed" || pill === "Not yet open") return false;
  if (pill === "Full") return event.waitlistEnabled;
  return true;
}

export function festPhase(festStartsOn: string, festEndsOn: string): "upcoming" | "ongoing" | "past" {
  const today = new Date().toISOString().slice(0, 10);
  if (today < festStartsOn) return "upcoming";
  if (today > festEndsOn) return "past";
  return "ongoing";
}
