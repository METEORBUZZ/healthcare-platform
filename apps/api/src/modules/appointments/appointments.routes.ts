import { Router } from 'express';
import {
  appointmentListQuerySchema,
  createAppointmentSchema,
  createReviewSchema,
  idParamSchema,
  updateAppointmentStatusSchema,
} from '@healthcare/shared';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';
import * as service from './appointments.service';
import * as patientRepo from '../patients/patients.repo';

export const appointmentRoutes = Router();
appointmentRoutes.use(authenticate);

const actorOf = (req: Parameters<typeof requireAuth>[0]) => {
  const { userId, role } = requireAuth(req);
  return { userId, role };
};

appointmentRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(appointmentListQuerySchema, req.query);
    const actor = actorOf(req);
    const { rows, total } = await service.list(actor, q);
    await patientRepo.auditTrackingList(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      patientIds: [...new Set(rows.map((appointment) => appointment.patient.id))],
      action: 'APPOINTMENT_LIST_READ',
    });
    res.json({ data: rows, meta: pageMeta(q.page, q.pageSize, total) });
  }),
);

appointmentRoutes.post(
  '/',
  requireRole('PATIENT'),
  asyncHandler(async (req, res) => {
    const input = parse(createAppointmentSchema, req.body);
    const actor = actorOf(req);
    const appointment = await service.create(actor, input);
    await patientRepo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'APPOINTMENT_CREATE',
      patientId: appointment.patient.id,
      outcome: 'ALLOWED',
    });
    res.status(201).json({ data: appointment });
  }),
);

appointmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const actor = actorOf(req);
    const appointment = await service.get(actor, id);
    await patientRepo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'APPOINTMENT_READ',
      patientId: appointment.patient.id,
      outcome: 'ALLOWED',
    });
    res.json({ data: appointment });
  }),
);

appointmentRoutes.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(updateAppointmentStatusSchema, req.body);
    const actor = actorOf(req);
    const appointment = await service.updateStatus(actor, id, input);
    await patientRepo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'APPOINTMENT_STATUS_UPDATE',
      patientId: appointment.patient.id,
      outcome: 'ALLOWED',
    });
    res.json({ data: appointment });
  }),
);

appointmentRoutes.post(
  '/:id/review',
  requireRole('PATIENT'),
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(createReviewSchema, req.body);
    const actor = actorOf(req);
    const appointment = await service.get(actor, id);
    await service.review(actorOf(req), id, input);
    await patientRepo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'APPOINTMENT_REVIEW_CREATE',
      patientId: appointment.patient.id,
      outcome: 'ALLOWED',
    });
    res.status(201).json({ data: { ok: true } });
  }),
);
