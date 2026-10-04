import { Router } from 'express';
import type { ShiftAssignmentDto } from '@healthcare/shared';
import { asyncHandler, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';

export const shiftRoutes = Router();

shiftRoutes.get(
  '/me',
  authenticate,
  requireRole('DOCTOR', 'STAFF', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY_STAFF'),
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const { rows } = await pool.query<ShiftAssignmentDto>(
      `SELECT sa.target_email AS "targetEmail",
              sa.shift_name AS "shiftName",
              sa.shift_hours AS "shiftHours",
              sa.break_time AS "breakTime",
              sa.working_days AS "workingDays",
              sa.working_location AS "workingLocation",
              sa.room_area AS "roomArea",
              sa.updated_at AS "updatedAt"
         FROM staff_shift_assignments sa
         JOIN users u ON lower(u.email) = sa.target_email
        WHERE u.id = $1`,
      [userId],
    );
    res.json({ data: rows[0] ?? null });
  }),
);
