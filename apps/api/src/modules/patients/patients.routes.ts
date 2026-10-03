import { Router } from 'express';
import { idParamSchema, patientProfileSchema, vitalsSchema } from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool, withTransaction } from '../../db/pool';
import { authenticate } from '../../middleware/auth';
import * as repo from './patients.repo';

export const patientRoutes = Router();
patientRoutes.use(authenticate);

// ── Tracking panel for all patients (Doctor & Admin) ─────────────────────────
patientRoutes.get(
  '/tracking/all',
  asyncHandler(async (req, res) => {
    const actor = requireAuth(req);
    if (actor.role !== 'DOCTOR' && actor.role !== 'ADMIN') {
      throw forbidden('Only doctors and administrators can view clinic patient tracking');
    }
    const list = await repo.listAllTracking(pool);
    res.json({ data: list });
  }),
);

// ── Current patient tracking ──────────────────────────────────────────────────
patientRoutes.get(
  '/me/tracking',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const patient = await repo.findByUserId(pool, userId);
    if (!patient) throw notFound('Patient profile');
    const tracking = await repo.getTracking(pool, patient.id);
    if (!tracking) throw notFound('Patient tracking');
    res.json({ data: tracking });
  }),
);

// ── Specific patient tracking (Patient, Doctor, Admin) ────────────────────────
patientRoutes.get(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const actor = requireAuth(req);
    const { id } = parse(idParamSchema, req.params);
    const tracking = await repo.getTracking(pool, id);
    if (!tracking) throw notFound('Patient tracking');

    // Patients can only view their own
    if (actor.role === 'PATIENT' && tracking.patient.userId !== actor.userId) {
      throw forbidden('You can only view your own health tracking panel');
    }

    res.json({ data: tracking });
  }),
);

// ── Record vitals for current patient ─────────────────────────────────────────
patientRoutes.post(
  '/me/vitals',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const patient = await repo.findByUserId(pool, userId);
    if (!patient) throw notFound('Patient profile');
    const input = parse(vitalsSchema, req.body);
    const vitals = await repo.recordVitals(pool, patient.id, userId, input);
    res.status(201).json({ data: vitals });
  }),
);

// ── Record vitals for specific patient (Doctor, Admin, or Patient) ────────────
patientRoutes.post(
  '/:id/vitals',
  asyncHandler(async (req, res) => {
    const actor = requireAuth(req);
    const { id } = parse(idParamSchema, req.params);
    const patient = await repo.findById(pool, id);
    if (!patient) throw notFound('Patient');

    if (actor.role === 'PATIENT' && patient.userId !== actor.userId) {
      throw forbidden('You can only record vitals for your own profile');
    }

    const input = parse(vitalsSchema, req.body);
    const vitals = await repo.recordVitals(pool, id, actor.userId, input);
    res.status(201).json({ data: vitals });
  }),
);

// ── Current patient profile (Patient only) ───────────────────────────────────
patientRoutes.get(
  '/me',
  asyncHandler(async (req, res) => {
    const patient = await repo.findByUserId(pool, requireAuth(req).userId);
    if (!patient) throw notFound('Patient profile');
    res.json({ data: patient });
  }),
);

patientRoutes.put(
  '/me',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const input = parse(patientProfileSchema, req.body);
    await withTransaction((tx) => repo.updateProfile(tx, userId, input));
    const patient = await repo.findByUserId(pool, userId);
    if (!patient) throw notFound('Patient profile');
    res.json({ data: patient });
  }),
);
