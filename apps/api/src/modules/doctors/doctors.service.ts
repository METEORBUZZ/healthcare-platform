import type { AvailabilityInput, DoctorDetailDto, DoctorListQuery, DoctorProfileInput, SlotsDto } from '@healthcare/shared';
import { badRequest, notFound } from '../../common/errors';
import { addDays, dayOfWeek, nowHHMM, todayIn } from '../../common/time';
import { env } from '../../config/env';
import { pool, withTransaction } from '../../db/pool';
import * as repo from './doctors.repo';
import { computeSlots } from './slots';

const today = () => todayIn(env.CLINIC_TIMEZONE);

export async function listPublic(q: DoctorListQuery) {
  let availableDow: number | undefined;
  if (q.availableOn) {
    availableDow = dayOfWeek(addDays(today(), q.availableOn === 'tomorrow' ? 1 : 0));
  }
  return repo.list(pool, { ...q, publicOnly: true, availableDow });
}

export async function getPublicDetail(id: number): Promise<DoctorDetailDto> {
  const doctor = await repo.findById(pool, id, { publicOnly: true });
  if (!doctor) throw notFound('Doctor');
  return { ...doctor, availability: await repo.getAvailability(pool, id) };
}

/** Bookable slots for one day. Also used by the booking flow to validate the chosen time. */
export async function getSlots(doctorId: number, date: string): Promise<SlotsDto> {
  const doctor = await repo.findById(pool, doctorId, { publicOnly: true });
  if (!doctor) throw notFound('Doctor');

  const now = new Date();
  const t = todayIn(env.CLINIC_TIMEZONE, now);
  if (date < t) throw badRequest('Choose today or a future date', 'DATE_IN_PAST');
  if (date > addDays(t, env.BOOKING_WINDOW_DAYS)) {
    throw badRequest(`Appointments can be booked up to ${env.BOOKING_WINDOW_DAYS} days ahead`, 'DATE_OUT_OF_RANGE');
  }

  const [availability, booked] = await Promise.all([
    repo.getAvailability(pool, doctorId),
    repo.bookedTimes(pool, doctorId, date),
  ]);
  const window = availability.find((a) => a.dayOfWeek === dayOfWeek(date)) ?? null;

  return {
    date,
    durationMinutes: window?.slotMinutes ?? 30,
    slots: computeSlots({
      window,
      booked,
      date,
      today: t,
      nowHHMM: nowHHMM(env.CLINIC_TIMEZONE, now),
      minLeadMinutes: env.BOOKING_MIN_LEAD_MINUTES,
    }),
  };
}

export async function getMine(userId: number): Promise<DoctorDetailDto> {
  const doctor = await repo.findByUserId(pool, userId);
  if (!doctor) throw notFound('Doctor profile');
  return { ...doctor, availability: await repo.getAvailability(pool, doctor.id) };
}

export async function updateMine(userId: number, input: DoctorProfileInput): Promise<DoctorDetailDto> {
  const doctor = await repo.findByUserId(pool, userId);
  if (!doctor) throw notFound('Doctor profile');
  await repo.updateProfile(pool, doctor.id, userId, input);
  return getMine(userId);
}

export async function replaceMyAvailability(userId: number, input: AvailabilityInput): Promise<DoctorDetailDto> {
  const doctor = await repo.findByUserId(pool, userId);
  if (!doctor) throw notFound('Doctor profile');
  await withTransaction((tx) => repo.replaceAvailability(tx, doctor.id, input));
  return getMine(userId);
}
