import { Router } from 'express';
import {
  availabilitySchema,
  doctorListQuerySchema,
  doctorProfileSchema,
  idParamSchema,
  paginationSchema,
  slotsQuerySchema,
} from '@healthcare/shared';
import { notFound } from '../../common/errors';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';
import * as repo from './doctors.repo';
import * as service from './doctors.service';

export const doctorRoutes = Router();

// ---- public directory
doctorRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(doctorListQuerySchema, req.query);
    const { rows, total } = await service.listPublic(q);
    res.json({ data: rows, meta: pageMeta(q.page, q.pageSize, total) });
  }),
);

doctorRoutes.get(
  '/specializations',
  asyncHandler(async (_req, res) => {
    res.json({ data: await repo.specializations(pool) });
  }),
);

// ---- signed-in doctor (must be declared before '/:id')
doctorRoutes.get(
  '/me',
  authenticate,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    res.json({ data: await service.getMine(requireAuth(req).userId) });
  }),
);

doctorRoutes.put(
  '/me',
  authenticate,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    const input = parse(doctorProfileSchema, req.body);
    res.json({ data: await service.updateMine(requireAuth(req).userId, input) });
  }),
);

doctorRoutes.put(
  '/me/availability',
  authenticate,
  requireRole('DOCTOR'),
  asyncHandler(async (req, res) => {
    const input = parse(availabilitySchema, req.body);
    res.json({ data: await service.replaceMyAvailability(requireAuth(req).userId, input) });
  }),
);

// ---- public doctor detail
doctorRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ data: await service.getPublicDetail(id) });
  }),
);

doctorRoutes.get(
  '/:id/slots',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { date } = parse(slotsQuerySchema, req.query);
    res.json({ data: await service.getSlots(id, date) });
  }),
);

doctorRoutes.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { page, pageSize } = parse(paginationSchema, req.query);
    if (!(await repo.findById(pool, id, { publicOnly: true }))) throw notFound('Doctor');
    const { rows, total } = await repo.listReviews(pool, id, page, pageSize);
    res.json({ data: rows, meta: pageMeta(page, pageSize, total) });
  }),
);
