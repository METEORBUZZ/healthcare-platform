import { describe, expect, it } from 'vitest';
import { computeSlots, generateSlotTimes } from '../src/modules/doctors/slots';

const window = { isAvailable: true, startTime: '09:00', endTime: '11:00', slotMinutes: 30 };

describe('generateSlotTimes', () => {
  it('creates back-to-back slots that fit inside the window', () => {
    expect(generateSlotTimes(window)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });
  it('drops a trailing partial slot', () => {
    expect(generateSlotTimes({ startTime: '09:00', endTime: '10:20', slotMinutes: 30 })).toEqual(['09:00', '09:30']);
  });
});

describe('computeSlots', () => {
  const base = { window, booked: new Set<string>(), date: '2026-10-12', today: '2026-10-10', nowHHMM: '12:00', minLeadMinutes: 60 };

  it('returns nothing when the doctor is off that day', () => {
    expect(computeSlots({ ...base, window: { ...window, isAvailable: false } })).toEqual([]);
    expect(computeSlots({ ...base, window: null })).toEqual([]);
  });
  it('marks booked slots unavailable but keeps them in the list', () => {
    const slots = computeSlots({ ...base, booked: new Set(['09:30']) });
    expect(slots.find((s) => s.time === '09:30')?.available).toBe(false);
    expect(slots.filter((s) => s.available)).toHaveLength(3);
  });
  it('hides slots inside the lead time on the current day only', () => {
    const sameDay = computeSlots({ ...base, date: '2026-10-10', nowHHMM: '09:20', minLeadMinutes: 30 });
    expect(sameDay.map((s) => [s.time, s.available])).toEqual([
      ['09:00', false], ['09:30', false], ['10:00', true], ['10:30', true],
    ]);
    const future = computeSlots({ ...base, nowHHMM: '23:00' });
    expect(future.every((s) => s.available)).toBe(true);
  });
});
