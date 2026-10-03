import type { SlotDto } from '@healthcare/shared';
import { fromMinutes, toMinutes } from '../../common/time';

export interface DayWindow {
  isAvailable: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotMinutes: number;
}

/** Every slot start time inside a working window, e.g. 09:00–11:00 @ 30min -> 09:00, 09:30, 10:00, 10:30. */
export function generateSlotTimes(w: Pick<DayWindow, 'startTime' | 'endTime' | 'slotMinutes'>): string[] {
  const times: string[] = [];
  const end = toMinutes(w.endTime);
  for (let t = toMinutes(w.startTime); t + w.slotMinutes <= end; t += w.slotMinutes) {
    times.push(fromMinutes(t));
  }
  return times;
}

/**
 * Slots for one calendar day. A slot is bookable when it is not already taken and starts
 * at least `minLeadMinutes` from now (only relevant when the date is today).
 */
export function computeSlots(opts: {
  window: DayWindow | null;
  booked: ReadonlySet<string>;
  date: string;
  today: string;
  nowHHMM: string;
  minLeadMinutes: number;
}): SlotDto[] {
  const { window, booked, date, today, nowHHMM, minLeadMinutes } = opts;
  if (!window?.isAvailable) return [];
  const earliest = date === today ? toMinutes(nowHHMM) + minLeadMinutes : Number.NEGATIVE_INFINITY;
  return generateSlotTimes(window).map((time) => ({
    time,
    available: !booked.has(time) && toMinutes(time) >= earliest,
  }));
}
