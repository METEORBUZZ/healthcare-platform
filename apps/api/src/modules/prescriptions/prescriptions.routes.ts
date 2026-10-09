import { Router } from 'express';
import {
  createPrescriptionSchema,
  idParamSchema,
  updatePrescriptionStatusSchema,
} from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';

export const prescriptionRoutes = Router();

// Helper to check doctor assignment boundary (Rule 2)
async function verifyDoctorAssignment(userId: number, patientId: number): Promise<number> {
  const docRes = await pool.query<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [userId]);
  if (!docRes.rows[0]) throw forbidden('Doctor profile not found');
  const doctorId = docRes.rows[0].id;

  const { rows } = await pool.query(
    `SELECT 1 FROM patient_assignments WHERE doctor_id = $1 AND patient_id = $2 AND is_active = true
     UNION
     SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2`,
    [doctorId, patientId],
  );
  if (rows.length === 0) {
    throw forbidden('Access denied: You are not assigned to this patient');
  }
  return doctorId;
}

// GET /api/prescriptions - Queue / listing
prescriptionRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const params: unknown[] = [];
    let filter = '';

    if (auth.role === 'PATIENT') {
      const patRes = await pool.query<{ id: number }>('SELECT id FROM patients WHERE user_id = $1', [auth.userId]);
      if (!patRes.rows[0]) return res.json({ data: [] });
      params.push(patRes.rows[0].id);
      filter = `WHERE pr.patient_id = $${params.length}`;
    } else if (auth.role === 'DOCTOR') {
      const docRes = await pool.query<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [auth.userId]);
      if (!docRes.rows[0]) return res.json({ data: [] });
      params.push(docRes.rows[0].id);
      filter = `WHERE pr.doctor_id = $${params.length}`;
    }

    const { rows } = await pool.query(
      `
      SELECT pr.id, pr.patient_id AS "patientId", pu.name AS "patientName",
             pr.doctor_id AS "doctorId", du.name AS "doctorName",
             pr.medication_name AS "medicationName", pr.dosage, pr.frequency,
             pr.duration, pr.instructions, pr.status,
             pr.created_at AS "createdAt", pr.updated_at AS "updatedAt"
        FROM prescriptions pr
        JOIN patients p ON p.id = pr.patient_id
        JOIN users pu ON pu.id = p.user_id
        JOIN doctors d ON d.id = pr.doctor_id
        JOIN users du ON du.id = d.user_id
       ${filter}
    ORDER BY pr.created_at DESC
      `,
      params,
    );
    res.json({ data: rows });
  }),
);

// GET /api/patients/:id/prescriptions
prescriptionRoutes.get(
  '/patients/:id/prescriptions',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id: patientId } = parse(idParamSchema, req.params);

    if (auth.role === 'DOCTOR') {
      await verifyDoctorAssignment(auth.userId, patientId);
    } else if (auth.role === 'PATIENT') {
      const patRes = await pool.query<{ id: number }>('SELECT id FROM patients WHERE user_id = $1', [auth.userId]);
      if (!patRes.rows[0] || patRes.rows[0].id !== patientId) {
        throw forbidden('Access denied: You can only access your own prescriptions');
      }
    }

    const { rows } = await pool.query(
      `
      SELECT pr.id, pr.patient_id AS "patientId", pu.name AS "patientName",
             pr.doctor_id AS "doctorId", du.name AS "doctorName",
             pr.medication_name AS "medicationName", pr.dosage, pr.frequency,
             pr.duration, pr.instructions, pr.status,
             pr.created_at AS "createdAt", pr.updated_at AS "updatedAt"
        FROM prescriptions pr
        JOIN patients p ON p.id = pr.patient_id
        JOIN users pu ON pu.id = p.user_id
        JOIN doctors d ON d.id = pr.doctor_id
        JOIN users du ON du.id = d.user_id
       WHERE pr.patient_id = $1
    ORDER BY pr.created_at DESC
      `,
      [patientId],
    );
    res.json({ data: rows });
  }),
);

// POST /api/patients/:id/prescriptions (Doctor or Admin)
prescriptionRoutes.post(
  '/patients/:id/prescriptions',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id: patientId } = parse(idParamSchema, req.params);
    const body = parse(createPrescriptionSchema, { ...req.body, patientId });

    let doctorId: number;
    if (auth.role === 'DOCTOR') {
      doctorId = await verifyDoctorAssignment(auth.userId, patientId);
    } else if (auth.role === 'ADMIN') {
      const d = await pool.query<{ id: number }>('SELECT id FROM doctors LIMIT 1');
      doctorId = d.rows[0]?.id ?? 1;
    } else {
      throw forbidden('Only doctors can issue prescriptions');
    }

    const { rows } = await pool.query(
      `
      INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, patient_id AS "patientId", doctor_id AS "doctorId",
                medication_name AS "medicationName", dosage, frequency,
                duration, instructions, status, created_at AS "createdAt",
                updated_at AS "updatedAt"
      `,
      [
        patientId,
        doctorId,
        body.medicationName,
        body.dosage,
        body.frequency,
        body.duration,
        body.instructions ?? null,
      ],
    );
    res.status(201).json({ data: rows[0] });
  }),
);

// PATCH /api/prescriptions/:id/status (e.g. Dispense or Discontinue)
prescriptionRoutes.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot alter prescription statuses');
    }
    const { id } = parse(idParamSchema, req.params);
    const body = parse(updatePrescriptionStatusSchema, req.body);

    const { rows } = await pool.query(
      `
      UPDATE prescriptions
         SET status = $1, updated_at = now()
       WHERE id = $2
      RETURNING id, patient_id AS "patientId", doctor_id AS "doctorId",
                medication_name AS "medicationName", dosage, frequency,
                duration, instructions, status, created_at AS "createdAt",
                updated_at AS "updatedAt"
      `,
      [body.status, id],
    );
    if (!rows[0]) throw notFound('Prescription not found');
    res.json({ data: rows[0] });
  }),
);
