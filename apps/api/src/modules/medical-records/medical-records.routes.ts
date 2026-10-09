import { Router } from 'express';
import { createMedicalRecordSchema, idParamSchema } from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';

export const medicalRecordRoutes = Router();

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

// GET /api/patients/:id/medical-records
medicalRecordRoutes.get(
  '/patients/:id/medical-records',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id: patientId } = parse(idParamSchema, req.params);

    if (auth.role === 'DOCTOR') {
      await verifyDoctorAssignment(auth.userId, patientId);
    } else if (auth.role === 'PATIENT') {
      const patRes = await pool.query<{ id: number }>('SELECT id FROM patients WHERE user_id = $1', [auth.userId]);
      if (!patRes.rows[0] || patRes.rows[0].id !== patientId) {
        throw forbidden('Access denied: You can only access your own medical records');
      }
    } else if (auth.role !== 'ADMIN') {
      throw forbidden('Access denied: Insufficient permissions for clinical records');
    }

    const { rows } = await pool.query(
      `
      SELECT mr.id, mr.patient_id AS "patientId", pu.name AS "patientName",
             mr.doctor_id AS "doctorId", du.name AS "doctorName",
             mr.record_type AS "recordType", mr.chief_complaint AS "chiefComplaint",
             mr.diagnosis, mr.soap_notes AS "soapNotes", mr.treatment_plan AS "treatmentPlan",
             mr.created_at AS "createdAt", mr.updated_at AS "updatedAt"
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
        JOIN users pu ON pu.id = p.user_id
        JOIN doctors d ON d.id = mr.doctor_id
        JOIN users du ON du.id = d.user_id
       WHERE mr.patient_id = $1
    ORDER BY mr.created_at DESC
      `,
      [patientId],
    );
    res.json({ data: rows });
  }),
);

// POST /api/patients/:id/medical-records - Add clinical note (Doctor or Admin only)
medicalRecordRoutes.post(
  '/patients/:id/medical-records',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id: patientId } = parse(idParamSchema, req.params);
    const body = parse(createMedicalRecordSchema, { ...req.body, patientId });

    let doctorId: number;
    if (auth.role === 'DOCTOR') {
      doctorId = await verifyDoctorAssignment(auth.userId, patientId);
    } else if (auth.role === 'ADMIN') {
      // Find head doctor or any doctor
      const d = await pool.query<{ id: number }>('SELECT id FROM doctors LIMIT 1');
      doctorId = d.rows[0]?.id ?? 1;
    } else {
      throw forbidden('Only authorized doctors can create clinical medical records');
    }

    const { rows } = await pool.query(
      `
      INSERT INTO medical_records (patient_id, doctor_id, record_type, chief_complaint, diagnosis, soap_notes, treatment_plan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, patient_id AS "patientId", doctor_id AS "doctorId",
                record_type AS "recordType", chief_complaint AS "chiefComplaint",
                diagnosis, soap_notes AS "soapNotes", treatment_plan AS "treatmentPlan",
                created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [
        patientId,
        doctorId,
        body.recordType,
        body.chiefComplaint ?? null,
        body.diagnosis ?? null,
        body.soapNotes,
        body.treatmentPlan ?? null,
      ],
    );
    res.status(201).json({ data: rows[0] });
  }),
);

// GET /api/medical-records/:id
medicalRecordRoutes.get(
  '/medical-records/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id } = parse(idParamSchema, req.params);

    const { rows } = await pool.query(
      `
      SELECT mr.id, mr.patient_id AS "patientId", pu.name AS "patientName",
             mr.doctor_id AS "doctorId", du.name AS "doctorName",
             mr.record_type AS "recordType", mr.chief_complaint AS "chiefComplaint",
             mr.diagnosis, mr.soap_notes AS "soapNotes", mr.treatment_plan AS "treatmentPlan",
             mr.created_at AS "createdAt", mr.updated_at AS "updatedAt"
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
        JOIN users pu ON pu.id = p.user_id
        JOIN doctors d ON d.id = mr.doctor_id
        JOIN users du ON du.id = d.user_id
       WHERE mr.id = $1
      `,
      [id],
    );
    if (!rows[0]) throw notFound('Medical record not found');
    const record = rows[0];

    if (auth.role === 'DOCTOR') {
      await verifyDoctorAssignment(auth.userId, record.patientId);
    } else if (auth.role === 'PATIENT') {
      const patRes = await pool.query<{ id: number }>('SELECT id FROM patients WHERE user_id = $1', [auth.userId]);
      if (!patRes.rows[0] || patRes.rows[0].id !== record.patientId) {
        throw forbidden('Access denied: You can only access your own medical records');
      }
    } else if (auth.role !== 'ADMIN') {
      throw forbidden('Access denied');
    }

    res.json({ data: record });
  }),
);
