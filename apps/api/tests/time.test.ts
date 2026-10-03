import { describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, formatWhen, nowHHMM, todayIn } from '../src/common/time';

describe('clinic time helpers', () => {
  // 2026-10-09 20:00 UTC == 2026-10-10 01:30 in Kolkata (UTC+5:30)
  const instant = new Date('2026-10-09T20:00:00Z');

  it('computes the date in the clinic timezone, not UTC', () => {
    expect(todayIn('Asia/Kolkata', instant)).toBe('2026-10-10');
    expect(todayIn('UTC', instant)).toBe('2026-10-09');
  });
  it('computes wall-clock time in the clinic timezone', () => {
    expect(nowHHMM('Asia/Kolkata', instant)).toBe('01:30');
  });
  it('does calendar arithmetic across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('returns weekday with Sunday = 0', () => {
    expect(dayOfWeek('2026-10-11')).toBe(0);
    expect(dayOfWeek('2026-10-12')).toBe(1);
  });
  it('formats notification text', () => {
    expect(formatWhen('2026-10-12', '10:00')).toBe('Mon, 12 Oct at 10:00');
  });
});
