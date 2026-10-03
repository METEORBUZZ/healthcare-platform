/**
 * Clinic-timezone date helpers. Appointments are wall-clock events in the clinic's timezone,
 * so "today" and "now" must be computed there, never from the server's local zone.
 */

export function todayIn(tz: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function nowHHMM(tz: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h === '24' ? '00' : h}:${m}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday. Calendar dates have no timezone, so UTC arithmetic is exact. */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function formatWhen(date: string, time: string): string {
  const dt = new Date(`${date}T00:00:00Z`);
  const weekday = dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const day = dt.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' });
  const month = dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  return `${weekday}, ${day} ${month} at ${time}`;
}
