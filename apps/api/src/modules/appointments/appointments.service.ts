import {
  canTransition,
  type AppointmentDto,
  type AppointmentListQuery,
  type CreateAppointmentInput,
  type CreateReviewInput,
  type Role,
  type UpdateAppointmentStatusInput,
} from '@healthcare/shared';
import { badRequest, conflict, forbidden, notFound } from '../../common/errors';
import { formatWhen, nowHHMM, todayIn } from '../../common/time';
import { env } from '../../config/env';
import { isUniqueViolation, pool, withTransaction } from '../../db/pool';
import * as doctorsRepo from '../doctors/doctors.repo';
import * as doctorsService from '../doctors/doctors.service';
import * as notifications from '../notifications/notifications.repo';
import * as patientsRepo from '../patients/patients.repo';
import * as repo from './appointments.repo';

export interface Actor {
  userId: number;
  role: Role;
}

const notFoundAppointment = () => notFound('Appointment');

export async function list(actor: Actor, q: AppointmentListQuery) {
  const scope: { patientId?: number; doctorId?: number } = {};
  if (actor.role === 'PATIENT' || actor.role === 'DOCTOR') {
    const ids = await repo.profileIds(pool, actor.userId);
    if (actor.role === 'PATIENT') {
      if (!ids.patientId) return { rows: [], total: 0 };
      scope.patientId = ids.patientId;
    } else {
      if (!ids.doctorId) return { rows: [], total: 0 };
      scope.doctorId = ids.doctorId;
    }
  } else if (q.doctorId) {
    scope.doctorId = q.doctorId;
  }
  return repo.list(pool, { ...q, ...scope, today: todayIn(env.CLINIC_TIMEZONE) });
}

export async function get(actor: Actor, id: number): Promise<AppointmentDto> {
  const apt = await repo.findById(pool, id);
  // 404 (not 403) for other people's appointments so ids can't be probed.
  if (!apt || !canView(actor, apt)) throw notFoundAppointment();
  return repo.toDto(apt);
}

function canView(actor: Actor, apt: repo.AppointmentRecord): boolean {
  if (actor.role === 'ADMIN') return true;
  return actor.role === 'PATIENT' ? apt.patientUserId === actor.userId : apt.doctorUserId === actor.userId;
}

export async function create(actor: Actor, input: CreateAppointmentInput): Promise<AppointmentDto> {
  const patient = await patientsRepo.findByUserId(pool, actor.userId);
  if (!patient) throw notFound('Patient profile');

  // Validates doctor exists + is verified, date is inside the booking window, and the slot exists and is free.
  const { slots, durationMinutes } = await doctorsService.getSlots(input.doctorId, input.date);
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) throw badRequest("That time is not part of the doctor's schedule", 'INVALID_SLOT');
  if (!slot.available) throw conflict('That slot is no longer available. Pick another time.', 'SLOT_TAKEN');

  const doctor = await doctorsRepo.findById(pool, input.doctorId, { publicOnly: true });
  if (!doctor) throw notFound('Doctor');

  try {
    const id = await withTransaction(async (tx) => {
      const newId = await repo.insert(tx, {
        patientId: patient.id,
        doctorId: doctor.id,
        date: input.date,
        time: input.time,
        durationMinutes,
        type: input.type,
        reason: input.reason,
        notes: input.notes,
      });
      const when = formatWhen(input.date, input.time);
      await notifications.notify(tx, {
        userId: actor.userId,
        type: 'APPOINTMENT',
        title: 'Appointment requested',
        message: `Your request with ${doctor.name} for ${when} was sent. You'll be notified once it's confirmed.`,
      });
      await notifications.notify(tx, {
        userId: doctor.userId,
        type: 'APPOINTMENT',
        title: 'New appointment request',
        message: `${patient.name} requested a ${input.type.toLowerCase()} for ${when}.`,
      });
      await notifications.notifyAdmins(
        tx,
        'New appointment booking',
        `${patient.name} booked a ${input.type.toLowerCase()} with ${doctor.name} for ${when}.`,
      );
      return newId;
    });
    return get(actor, id);
  } catch (err) {
    // Two people can pass the availability check together; the partial unique indexes decide the winner.
    if (isUniqueViolation(err)) {
      if (err.constraint === 'appointments_patient_slot_active_key') {
        throw conflict('You already have an appointment at this time.', 'PATIENT_SLOT_TAKEN');
      }
      throw conflict('That slot was just booked by someone else. Pick another time.', 'SLOT_TAKEN');
    }
    throw err;
  }
}

export async function updateStatus(actor: Actor, id: number, input: UpdateAppointmentStatusInput): Promise<AppointmentDto> {
  await withTransaction(async (tx) => {
    const apt = await repo.findById(tx, id, { forUpdate: true });
    if (!apt || !canView(actor, apt)) throw notFoundAppointment();

    if (actor.role === 'PATIENT' && input.status !== 'CANCELLED') {
      throw forbidden('Patients can only cancel appointments');
    }
    if (!canTransition(apt.status, input.status)) {
      throw conflict(
        `A ${apt.status.toLowerCase()} appointment can't be changed to ${input.status.toLowerCase()}`,
        'INVALID_TRANSITION',
      );
    }
    if (input.status === 'COMPLETED') {
      const now = new Date();
      const today = todayIn(env.CLINIC_TIMEZONE, now);
      const notStarted = apt.date > today || (apt.date === today && apt.time > nowHHMM(env.CLINIC_TIMEZONE, now));
      if (notStarted) throw conflict('You can complete an appointment only after it has started', 'TOO_EARLY');
    }

    const cancelling = input.status === 'CANCELLED';
    await repo.updateStatus(tx, id, {
      status: input.status,
      doctorNotes: actor.role === 'PATIENT' ? undefined : input.doctorNotes,
      cancellationReason: cancelling ? input.cancellationReason : undefined,
      cancelledBy: cancelling ? actor.role : undefined,
    });

    const when = formatWhen(apt.date, apt.time);
    const notify = (userId: number, title: string, message: string) =>
      notifications.notify(tx, { userId, type: 'APPOINTMENT', title, message });

    if (input.status === 'CONFIRMED') {
      await notify(apt.patientUserId, 'Appointment confirmed', `${apt.doctor.name} confirmed your visit on ${when}.`);
      await notify(apt.doctorUserId, 'Appointment confirmed', `You confirmed the appointment with ${apt.patient.name} for ${when}.`);
      await notifications.notifyAdmins(
        tx,
        'Appointment confirmed',
        `${apt.doctor.name} confirmed appointment with ${apt.patient.name} for ${when}.`,
      );
    } else if (input.status === 'COMPLETED') {
      await notify(apt.patientUserId, 'Visit completed', `Your visit with ${apt.doctor.name} is complete. You can now leave a review.`);
      await notify(apt.doctorUserId, 'Visit completed', `Visit with ${apt.patient.name} on ${when} was marked as completed.`);
      await notifications.notifyAdmins(
        tx,
        'Visit completed',
        `${apt.doctor.name} completed visit with ${apt.patient.name} on ${when}.`,
      );
    } else if (cancelling) {
      const reason = input.cancellationReason ? ` Reason: ${input.cancellationReason}` : '';
      const byWhomOther = actor.role === 'PATIENT' ? 'by patient' : actor.role === 'DOCTOR' ? 'by doctor' : 'by clinic admin';
      await notify(
        apt.patientUserId,
        'Appointment cancelled',
        actor.role === 'PATIENT'
          ? `You cancelled your visit with ${apt.doctor.name} on ${when}.${reason}`
          : `Your visit with ${apt.doctor.name} on ${when} was cancelled (${byWhomOther}).${reason}`,
      );
      await notify(
        apt.doctorUserId,
        'Appointment cancelled',
        actor.role === 'DOCTOR'
          ? `You cancelled the visit with ${apt.patient.name} on ${when}.${reason}`
          : `Visit with ${apt.patient.name} on ${when} was cancelled (${byWhomOther}).${reason}`,
      );
      await notifications.notifyAdmins(
        tx,
        'Appointment cancelled',
        `Appointment between ${apt.patient.name} and ${apt.doctor.name} on ${when} was cancelled (${byWhomOther}).${reason}`,
      );
    }
  });
  return get(actor, id);
}

export async function review(actor: Actor, id: number, input: CreateReviewInput): Promise<void> {
  try {
    await withTransaction(async (tx) => {
      const apt = await repo.findById(tx, id, { forUpdate: true });
      if (!apt || apt.patientUserId !== actor.userId) throw notFoundAppointment();
      if (apt.status !== 'COMPLETED') {
        throw conflict('You can review an appointment after the visit is completed', 'REVIEW_NOT_ALLOWED');
      }
      await repo.insertReview(tx, {
        appointmentId: apt.id,
        doctorId: apt.doctor.id,
        patientId: apt.patient.id,
        rating: input.rating,
        comment: input.comment,
      });
      await notifications.notify(tx, {
        userId: apt.doctorUserId,
        type: 'SYSTEM',
        title: 'New review received',
        message: `${apt.patient.name} rated your visit ${input.rating}/5${input.comment ? `: "${input.comment}"` : '.'}`,
      });
      await notifications.notifyAdmins(
        tx,
        'New patient review submitted',
        `${apt.patient.name} left a ${input.rating}/5 review for ${apt.doctor.name}.`,
      );
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict('You already reviewed this visit', 'ALREADY_REVIEWED');
    throw err;
  }
}
