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
    if (actor.role === 'DOCTOR' && !(await repo.isVerifiedDoctor(pool, actor.userId))) {
      await repo.auditClinicalAccess(pool, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'TRACKING_LIST_READ',
        outcome: 'DENIED',
      });
      throw forbidden('Doctor verification is required to view patient tracking');
    }
    const list =
      actor.role === 'ADMIN'
        ? await repo.listAllTracking(pool)
        : await repo.listDoctorTracking(pool, actor.userId);
    await repo.auditTrackingList(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      patientIds: list.map((tracking) => tracking.patient.id),
      action: 'TRACKING_LIST_READ',
    });
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
    await repo.auditClinicalAccess(pool, {
      actorUserId: userId,
      actorRole: requireAuth(req).role,
      action: 'PATIENT_TRACKING_READ',
      patientId: patient.id,
      outcome: 'ALLOWED',
    });
    res.json({ data: tracking });
  }),
);

// ── Specific patient tracking (Patient, Doctor, Admin) ────────────────────────
patientRoutes.get(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const actor = requireAuth(req);
    const { id } = parse(idParamSchema, req.params);
    if (actor.role === 'PATIENT') {
      const patient = await repo.findById(pool, id);
      if (!patient) throw notFound('Patient tracking');
      if (patient.userId !== actor.userId) {
        await repo.auditClinicalAccess(pool, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          action: 'PATIENT_TRACKING_READ',
          patientId: id,
          outcome: 'DENIED',
        });
        throw forbidden('You can only view your own health tracking panel');
      }
    } else if (actor.role === 'DOCTOR') {
      if (!(await repo.canDoctorAccessPatient(pool, actor.userId, id))) {
        await repo.auditClinicalAccess(pool, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          action: 'PATIENT_TRACKING_READ',
          patientId: id,
          outcome: 'DENIED',
        });
        throw forbidden(
          'You can only view tracking for patients assigned to your verified account',
        );
      }
    } else if (actor.role !== 'ADMIN') {
      throw forbidden();
    }

    const tracking = await repo.getTracking(pool, id);
    if (!tracking) throw notFound('Patient tracking');
    await repo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'PATIENT_TRACKING_READ',
      patientId: id,
      outcome: 'ALLOWED',
    });
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
    const vitals = await withTransaction(async (tx) => {
      const result = await repo.recordVitals(tx, patient.id, userId, input);
      await repo.auditClinicalAccess(tx, {
        actorUserId: userId,
        actorRole: requireAuth(req).role,
        action: 'PATIENT_VITALS_CREATE',
        patientId: patient.id,
        outcome: 'ALLOWED',
      });
      return result;
    });
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

    if (actor.role === 'PATIENT') {
      if (patient.userId !== actor.userId) {
        await repo.auditClinicalAccess(pool, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          action: 'PATIENT_VITALS_CREATE',
          patientId: id,
          outcome: 'DENIED',
        });
        throw forbidden('You can only record vitals for your own profile');
      }
    } else if (actor.role === 'DOCTOR') {
      if (!(await repo.canDoctorAccessPatient(pool, actor.userId, id))) {
        await repo.auditClinicalAccess(pool, {
          actorUserId: actor.userId,
          actorRole: actor.role,
          action: 'PATIENT_VITALS_CREATE',
          patientId: id,
          outcome: 'DENIED',
        });
        throw forbidden(
          'You can only record vitals for patients assigned to your verified account',
        );
      }
    } else if (actor.role !== 'ADMIN') {
      throw forbidden();
    }

    const input = parse(vitalsSchema, req.body);
    const vitals = await withTransaction(async (tx) => {
      const result = await repo.recordVitals(tx, id, actor.userId, input);
      await repo.auditClinicalAccess(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'PATIENT_VITALS_CREATE',
        patientId: id,
        outcome: 'ALLOWED',
      });
      return result;
    });
    res.status(201).json({ data: vitals });
  }),
);

// ── Current patient profile (Patient only) ───────────────────────────────────
patientRoutes.get(
  '/me',
  asyncHandler(async (req, res) => {
    const actor = requireAuth(req);
    const patient = await repo.findByUserId(pool, actor.userId);
    if (!patient) throw notFound('Patient profile');
    await repo.auditClinicalAccess(pool, {
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'PATIENT_PROFILE_READ',
      patientId: patient.id,
      outcome: 'ALLOWED',
    });
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
    await repo.auditClinicalAccess(pool, {
      actorUserId: userId,
      actorRole: requireAuth(req).role,
      action: 'PATIENT_PROFILE_UPDATE',
      patientId: patient.id,
      outcome: 'ALLOWED',
    });
    res.json({ data: patient });
  }),
);
