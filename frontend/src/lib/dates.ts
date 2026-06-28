// All date math is done in UTC so it never drifts a day in +/- timezones.

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function isWeekend(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 6;
}

// Step one *weekday* in a direction, skipping Sat/Sun.
export function stepWeekday(iso: string, dir: 1 | -1): string {
  let next = addDays(iso, dir);
  while (isWeekend(next)) next = addDays(next, dir);
  return next;
}

// Nearest bookable weekday at or after the given date (used for defaults/snapping).
export function snapForward(iso: string): string {
  let d = iso;
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
}

export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(iso: string): { weekday: string; rest: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
    rest: dt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

// The next `count` bookable weekdays starting at/after `fromIso`.
export function upcomingWeekdays(count: number, fromIso: string = todayIso()): string[] {
  const out: string[] = [];
  let d = snapForward(fromIso);
  while (out.length < count) {
    out.push(d);
    d = stepWeekday(d, 1);
  }
  return out;
}

// Friendly relative label for a weekday ISO date.
export function relativeLabel(iso: string): string {
  const t = todayIso();
  if (iso === t) return "Today";
  if (iso === addDays(t, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
}
