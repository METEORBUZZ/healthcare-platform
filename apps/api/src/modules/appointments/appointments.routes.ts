import { Router } from 'express';
import {
  appointmentListQuerySchema,
  createAppointmentSchema,
  createReviewSchema,
  idParamSchema,
  updateAppointmentStatusSchema,
} from '@healthcare/shared';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { authenticate, requireRole } from '../../middleware/auth';
import * as service from './appointments.service';

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
    const { rows, total } = await service.list(actorOf(req), q);
    res.json({ data: rows, meta: pageMeta(q.page, q.pageSize, total) });
  }),
);

appointmentRoutes.post(
  '/',
  requireRole('PATIENT'),
  asyncHandler(async (req, res) => {
    const input = parse(createAppointmentSchema, req.body);
    res.status(201).json({ data: await service.create(actorOf(req), input) });
  }),
);

appointmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ data: await service.get(actorOf(req), id) });
  }),
);

appointmentRoutes.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(updateAppointmentStatusSchema, req.body);
    res.json({ data: await service.updateStatus(actorOf(req), id, input) });
  }),
);

appointmentRoutes.post(
  '/:id/review',
  requireRole('PATIENT'),
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(createReviewSchema, req.body);
    await service.review(actorOf(req), id, input);
    res.status(201).json({ data: { ok: true } });
  }),
);
