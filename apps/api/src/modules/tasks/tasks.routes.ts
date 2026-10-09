import { Router } from 'express';
import {
  createTaskSchema,
  idParamSchema,
  updateTaskStatusSchema,
} from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';

export const taskRoutes = Router();

// GET /api/tasks/my - current user's assigned tasks
taskRoutes.get(
  '/my',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { rows } = await pool.query(
      `
      SELECT t.id, t.title, t.description, t.assigned_to_user_id AS "assignedToUserId",
             u.name AS "assignedToName", t.ward, t.status, t.priority,
             t.patient_id AS "patientId", pu.name AS "patientName",
             t.due_date AS "dueDate", t.created_at AS "createdAt", t.updated_at AS "updatedAt"
        FROM tasks t
   LEFT JOIN users u ON u.id = t.assigned_to_user_id
   LEFT JOIN patients p ON p.id = t.patient_id
   LEFT JOIN users pu ON pu.id = p.user_id
       WHERE t.assigned_to_user_id = $1
    ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
             t.created_at DESC
      `,
      [auth.userId],
    );
    res.json({ data: rows });
  }),
);

// GET /api/tasks - list tasks
taskRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot access internal task queues');
    }

    const { status, ward } = req.query;
    const filters: string[] = [];
    const params: unknown[] = [];

    if (status && typeof status === 'string') {
      params.push(status);
      filters.push(`t.status = $${params.length}`);
    }
    if (ward && typeof ward === 'string') {
      params.push(ward);
      filters.push(`t.ward = $${params.length}`);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `
      SELECT t.id, t.title, t.description, t.assigned_to_user_id AS "assignedToUserId",
             u.name AS "assignedToName", t.ward, t.status, t.priority,
             t.patient_id AS "patientId", pu.name AS "patientName",
             t.due_date AS "dueDate", t.created_at AS "createdAt", t.updated_at AS "updatedAt"
        FROM tasks t
   LEFT JOIN users u ON u.id = t.assigned_to_user_id
   LEFT JOIN patients p ON p.id = t.patient_id
   LEFT JOIN users pu ON pu.id = p.user_id
       ${where}
    ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
             t.created_at DESC
      `,
      params,
    );
    res.json({ data: rows });
  }),
);

// POST /api/tasks - create task
taskRoutes.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot create internal tasks');
    }
    const body = parse(createTaskSchema, req.body);

    const { rows } = await pool.query(
      `
      INSERT INTO tasks (title, description, assigned_to_user_id, ward, priority, patient_id, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, description, assigned_to_user_id AS "assignedToUserId",
                ward, status, priority, patient_id AS "patientId",
                due_date AS "dueDate", created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [
        body.title,
        body.description ?? null,
        body.assignedToUserId ?? auth.userId,
        body.ward ?? null,
        body.priority,
        body.patientId ?? null,
        body.dueDate ? new Date(body.dueDate) : null,
        auth.userId,
      ],
    );
    res.status(201).json({ data: rows[0] });
  }),
);

// PATCH /api/tasks/:id/status - update task status
taskRoutes.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot update internal task status');
    }
    const { id } = parse(idParamSchema, req.params);
    const body = parse(updateTaskStatusSchema, req.body);

    const { rows } = await pool.query(
      `
      UPDATE tasks
         SET status = $1, updated_at = now()
       WHERE id = $2
      RETURNING id, title, description, assigned_to_user_id AS "assignedToUserId",
                ward, status, priority, patient_id AS "patientId",
                due_date AS "dueDate", created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [body.status, id],
    );
    if (!rows[0]) throw notFound('Task not found');
    res.json({ data: rows[0] });
  }),
);
