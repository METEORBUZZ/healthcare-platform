import { describe, expect, it } from 'vitest';
import { canTransition } from './constants';
import {
  availabilitySchema,
  changePasswordSchema,
  createAppointmentSchema,
  passwordSchema,
  registerSchema,
} from './schemas';

describe('passwordSchema', () => {
  it('rejects short and letter-only passwords', () => {
    expect(passwordSchema.safeParse('abc1').success).toBe(false);
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
  });
  it('accepts letters + digits', () => {
    expect(passwordSchema.safeParse('abcdefg1').success).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('rejects empty current password', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'ValidPassword123',
    });
    expect(res.success).toBe(false);
  });
  it('rejects weak new password', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'weak',
    });
    expect(res.success).toBe(false);
  });
  it('rejects new password equal to current password', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'SamePassword123',
      newPassword: 'SamePassword123',
    });
    expect(res.success).toBe(false);
  });
  it('rejects mismatched confirmation password', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'DifferentPassword123',
    });
    expect(res.success).toBe(false);
  });
  it('accepts valid password change payload', () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });
    expect(res.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('requires specialization for doctors', () => {
    const r = registerSchema.safeParse({ name: 'Dr A', email: 'a@b.co', password: 'abcdefg1', role: 'DOCTOR' });
    expect(r.success).toBe(false);
  });
  it('does not allow self-registering as admin', () => {
    const r = registerSchema.safeParse({ name: 'Eve', email: 'e@b.co', password: 'abcdefg1', role: 'ADMIN' });
    expect(r.success).toBe(false);
  });
  it('normalises email', () => {
    const r = registerSchema.parse({ name: 'Eve', email: '  Eve@B.CO ', password: 'abcdefg1' });
    expect(r.email).toBe('eve@b.co');
    expect(r.role).toBe('PATIENT');
  });
});

describe('createAppointmentSchema', () => {
  it('rejects impossible dates', () => {
    const r = createAppointmentSchema.safeParse({ doctorId: 1, date: '2026-02-30', time: '10:00', reason: 'Checkup please' });
    expect(r.success).toBe(false);
  });
});

describe('availabilitySchema', () => {
  const day = (dayOfWeek: number, over = {}) => ({
    dayOfWeek, isAvailable: true, startTime: '09:00', endTime: '17:00', slotMinutes: 30, ...over,
  });
  it('requires all seven days', () => {
    expect(availabilitySchema.safeParse([day(0)]).success).toBe(false);
  });
  it('rejects end before start', () => {
    const week = [0, 1, 2, 3, 4, 5, 6].map((d) => day(d, d === 2 ? { endTime: '08:00' } : {}));
    expect(availabilitySchema.safeParse(week).success).toBe(false);
  });
  it('accepts a valid week', () => {
    expect(availabilitySchema.safeParse([0, 1, 2, 3, 4, 5, 6].map((d) => day(d))).success).toBe(true);
  });
});

describe('canTransition', () => {
  it('follows the lifecycle', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(true);
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });
});
