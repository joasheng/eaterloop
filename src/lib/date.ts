const DAY_MS = 86_400_000;

export function formatIssueMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(value),
  );
}

export function formatLongDate(value: string, timezone = "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatShortDate(value: string, timezone = "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

export function daysUntil(value: string, now = new Date()) {
  return Math.ceil((new Date(value).getTime() - now.getTime()) / DAY_MS);
}

export function firstMonday(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1, 17, 0, 0));
  const offset = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

export function nextFirstMonday(from = new Date()) {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const thisMonth = firstMonday(year, month);
  if (thisMonth.getTime() > from.getTime() + 7 * DAY_MS) return thisMonth;
  return firstMonday(month === 11 ? year + 1 : year, (month + 1) % 12);
}

export function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function releaseIsoFromDateInput(value: string) {
  return `${value}T17:00:00.000Z`;
}

export function localDateKey(value: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function calendarDaysBetween(from: Date, to: string, timezone: string) {
  const start = new Date(`${localDateKey(from, timezone)}T00:00:00Z`);
  const end = new Date(`${localDateKey(to, timezone)}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}
