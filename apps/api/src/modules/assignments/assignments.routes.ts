import { Router } from 'express';
import { assignPatientSchema, idParamSchema } from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';

export const assignmentRoutes = Router();

// GET /api/assignments
assignmentRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot view doctor assignment rosters');
    }

    let doctorFilter = '';
    const params: unknown[] = [];

    if (auth.role === 'DOCTOR') {
      const docRes = await pool.query<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [auth.userId]);
      if (!docRes.rows[0]) {
        return res.json({ data: [] });
      }
      params.push(docRes.rows[0].id);
      doctorFilter = `WHERE pa.doctor_id = $${params.length}`;
    }

    const { rows } = await pool.query(
      `
      SELECT pa.id, pa.doctor_id AS "doctorId", doc_user.name AS "doctorName",
             pa.patient_id AS "patientId", pat_user.name AS "patientName",
             pa.assigned_by AS "assignedBy", pa.is_active AS "isActive",
             pa.notes, pa.assigned_at AS "assignedAt"
        FROM patient_assignments pa
        JOIN doctors d ON d.id = pa.doctor_id
        JOIN users doc_user ON doc_user.id = d.user_id
        JOIN patients p ON p.id = pa.patient_id
        JOIN users pat_user ON pat_user.id = p.user_id
       ${doctorFilter}
    ORDER BY pa.assigned_at DESC
      `,
      params,
    );
    res.json({ data: rows });
  }),
);

// POST /api/assignments (Admin only)
assignmentRoutes.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role !== 'ADMIN') {
      throw forbidden('Only administrators can assign patients to doctors');
    }
    const body = parse(assignPatientSchema, req.body);

    const { rows } = await pool.query(
      `
      INSERT INTO patient_assignments (doctor_id, patient_id, assigned_by, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (doctor_id, patient_id)
      DO UPDATE SET is_active = true, notes = EXCLUDED.notes, assigned_at = now()
      RETURNING id, doctor_id AS "doctorId", patient_id AS "patientId",
                assigned_by AS "assignedBy", is_active AS "isActive", notes,
                assigned_at AS "assignedAt"
      `,
      [body.doctorId, body.patientId, auth.userId, body.notes ?? null],
    );
    res.status(201).json({ data: rows[0] });
  }),
);

// DELETE /api/assignments/:id (Admin only)
assignmentRoutes.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role !== 'ADMIN') {
      throw forbidden('Only administrators can remove patient assignments');
    }
    const { id } = parse(idParamSchema, req.params);
    const { rows } = await pool.query(
      `
      UPDATE patient_assignments
         SET is_active = false
       WHERE id = $1
      RETURNING id, doctor_id AS "doctorId", patient_id AS "patientId", is_active AS "isActive"
      `,
      [id],
    );
    if (!rows[0]) throw notFound('Assignment not found');
    res.json({ data: rows[0] });
  }),
);
