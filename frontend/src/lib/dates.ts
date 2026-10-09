// Date helpers for API timestamps (FD10).
//
// The API sends timestamps in UTC with no zone marker ("2026-10-05T01:30:00").
// `new Date()` would read that as the browser's local time, so everything goes
// through parseApiTimestamp, which reads it as UTC. Display is always in
// Philippine time, whatever the browser's zone is.

const PH_TIME_ZONE = "Asia/Manila";
// The Philippines has no daylight saving time, so the offset is fixed.
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses an API timestamp as UTC. A value that already carries a zone ("Z" or
 * an offset) is respected. Returns null for null, empty, or unparseable input.
 */
export function parseApiTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = value.trim().replace(" ", "T");
  if (!text) return null;
  const date = new Date(HAS_ZONE.test(text) || DATE_ONLY.test(text) ? text : `${text}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: PH_TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: PH_TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// Calendar dates carry no time or zone; formatting them in UTC keeps the day as written.
const calendarDateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** An API timestamp as a Philippine date, e.g. "Oct 5, 2026". Null when there is no value. */
export function formatDate(value: string | null | undefined): string | null {
  const date = parseApiTimestamp(value);
  return date ? dateFormat.format(date) : null;
}

/** An API timestamp as a Philippine date and time, e.g. "Oct 5, 2026, 9:30 AM". Null when there is no value. */
export function formatDateTime(value: string | null | undefined): string | null {
  const date = parseApiTimestamp(value);
  return date ? dateTimeFormat.format(date) : null;
}

/**
 * A calendar date from the API ("2026-06-01", e.g. a cohort's start_date) as
 * "Jun 1, 2026". These are dates, not instants, so no zone shift is applied.
 */
export function formatCalendarDate(value: string | null | undefined): string | null {
  if (!value || !DATE_ONLY.test(value.trim())) return null;
  const date = new Date(`${value.trim()}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : calendarDateFormat.format(date);
}

/** Which Philippine calendar day an instant falls on, as a day count (only differences are meaningful). */
function philippineDayIndex(date: Date): number {
  return Math.floor((date.getTime() + PH_OFFSET_MS) / DAY_MS);
}

/**
 * How many Philippine calendar days ago an API timestamp was: 0 for today, 1
 * for yesterday. Null when there is no value. A timestamp in the future (clock
 * skew) counts as today.
 */
export function philippineDaysAgo(value: string | null | undefined, now: Date = new Date()): number | null {
  const date = parseApiTimestamp(value);
  if (!date) return null;
  return Math.max(0, philippineDayIndex(now) - philippineDayIndex(date));
}

/**
 * The relative "last active" label: Today, Yesterday, N days ago, or Never.
 * Day boundaries are Philippine calendar days, not 24-hour windows.
 */
export function formatLastActive(value: string | null | undefined, now: Date = new Date()): string {
  const days = philippineDaysAgo(value, now);
  if (days === null) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
