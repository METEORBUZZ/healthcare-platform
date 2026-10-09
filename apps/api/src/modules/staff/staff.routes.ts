import { Router } from 'express';
import { idParamSchema } from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';

export const staffRoutes = Router();

// GET /api/staff/me - current staff profile
staffRoutes.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { rows } = await pool.query(
      `
      SELECT s.id, s.user_id AS "userId", u.name, u.email, u.role, u.status,
             s.department_id AS "departmentId", d.name AS "departmentName",
             s.designation, s.employee_code AS "employeeCode", s.phone,
             s.assigned_area AS "assignedArea", s.created_at AS "createdAt",
             ssa.shift_name AS "shiftName", ssa.shift_hours AS "shiftHours",
             ssa.working_location AS "workingLocation", ssa.room_area AS "roomArea"
        FROM staff s
        JOIN users u ON u.id = s.user_id
   LEFT JOIN departments d ON d.id = s.department_id
   LEFT JOIN staff_shift_assignments ssa ON ssa.target_email = lower(u.email)
       WHERE s.user_id = $1
      `,
      [auth.userId],
    );
    if (!rows[0]) throw notFound('Staff profile not found');
    res.json({ data: rows[0] });
  }),
);

// GET /api/staff - list all staff (Admin or internal staff)
staffRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot view staff roster');
    }

    const { rows } = await pool.query(`
      SELECT s.id, s.user_id AS "userId", u.name, u.email, u.role, u.status,
             s.department_id AS "departmentId", d.name AS "departmentName",
             s.designation, s.employee_code AS "employeeCode", s.phone,
             s.assigned_area AS "assignedArea", s.created_at AS "createdAt",
             ssa.shift_name AS "shiftName", ssa.shift_hours AS "shiftHours",
             ssa.working_location AS "workingLocation", ssa.room_area AS "roomArea"
        FROM staff s
        JOIN users u ON u.id = s.user_id
   LEFT JOIN departments d ON d.id = s.department_id
   LEFT JOIN staff_shift_assignments ssa ON ssa.target_email = lower(u.email)
    ORDER BY u.name ASC
    `);
    res.json({ data: rows });
  }),
);

// GET /api/staff/:id
staffRoutes.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot view staff profiles');
    }
    const { id } = parse(idParamSchema, req.params);
    const { rows } = await pool.query(
      `
      SELECT s.id, s.user_id AS "userId", u.name, u.email, u.role, u.status,
             s.department_id AS "departmentId", d.name AS "departmentName",
             s.designation, s.employee_code AS "employeeCode", s.phone,
             s.assigned_area AS "assignedArea", s.created_at AS "createdAt",
             ssa.shift_name AS "shiftName", ssa.shift_hours AS "shiftHours",
             ssa.working_location AS "workingLocation", ssa.room_area AS "roomArea"
        FROM staff s
        JOIN users u ON u.id = s.user_id
   LEFT JOIN departments d ON d.id = s.department_id
   LEFT JOIN staff_shift_assignments ssa ON ssa.target_email = lower(u.email)
       WHERE s.id = $1
      `,
      [id],
    );
    if (!rows[0]) throw notFound('Staff member not found');
    res.json({ data: rows[0] });
  }),
);

// PATCH /api/staff/:id (Admin only)
staffRoutes.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { departmentId, designation, assignedArea, phone } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (departmentId !== undefined) {
      values.push(departmentId);
      fields.push(`department_id = $${values.length}`);
    }
    if (designation !== undefined) {
      values.push(designation);
      fields.push(`designation = $${values.length}`);
    }
    if (assignedArea !== undefined) {
      values.push(assignedArea);
      fields.push(`assigned_area = $${values.length}`);
    }
    if (phone !== undefined) {
      values.push(phone);
      fields.push(`phone = $${values.length}`);
    }

    if (fields.length === 0) {
      const { rows } = await pool.query('SELECT * FROM staff WHERE id = $1', [id]);
      if (!rows[0]) throw notFound('Staff member not found');
      return res.json({ data: rows[0] });
    }

    values.push(id);
    const { rows } = await pool.query(
      `
      UPDATE staff
         SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${values.length}
      RETURNING id, user_id AS "userId", department_id AS "departmentId",
                designation, employee_code AS "employeeCode", phone,
                assigned_area AS "assignedArea", updated_at AS "updatedAt"
      `,
      values,
    );
    if (!rows[0]) throw notFound('Staff member not found');
    res.json({ data: rows[0] });
  }),
);
