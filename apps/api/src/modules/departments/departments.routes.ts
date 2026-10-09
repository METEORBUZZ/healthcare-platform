import { Router } from 'express';
import {
  createDepartmentSchema,
  idParamSchema,
  updateDepartmentSchema,
} from '@healthcare/shared';
import { conflict, notFound } from '../../common/errors';
import { asyncHandler, parse } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';

export const departmentRoutes = Router();

// GET /api/departments - list all departments
departmentRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT d.id, d.name, d.code, d.description, d.head_doctor_id AS "headDoctorId",
             u.name AS "headDoctorName", d.created_at AS "createdAt", d.updated_at AS "updatedAt"
        FROM departments d
   LEFT JOIN doctors doc ON doc.id = d.head_doctor_id
   LEFT JOIN users u ON u.id = doc.user_id
    ORDER BY d.name ASC
    `);
    res.json({ data: rows });
  }),
);

// GET /api/departments/:id
departmentRoutes.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { rows } = await pool.query(
      `
      SELECT d.id, d.name, d.code, d.description, d.head_doctor_id AS "headDoctorId",
             u.name AS "headDoctorName", d.created_at AS "createdAt", d.updated_at AS "updatedAt"
        FROM departments d
   LEFT JOIN doctors doc ON doc.id = d.head_doctor_id
   LEFT JOIN users u ON u.id = doc.user_id
       WHERE d.id = $1
      `,
      [id],
    );
    if (!rows[0]) throw notFound('Department not found');
    res.json({ data: rows[0] });
  }),
);

// POST /api/departments (Admin only)
departmentRoutes.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const body = parse(createDepartmentSchema, req.body);
    try {
      const { rows } = await pool.query(
        `
        INSERT INTO departments (name, code, description, head_doctor_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, code, description, head_doctor_id AS "headDoctorId",
                  created_at AS "createdAt", updated_at AS "updatedAt"
        `,
        [body.name, body.code, body.description ?? null, body.headDoctorId ?? null],
      );
      res.status(201).json({ data: rows[0] });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
        throw conflict('Department name or code already exists');
      }
      throw err;
    }
  }),
);

// PATCH /api/departments/:id (Admin only)
departmentRoutes.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const body = parse(updateDepartmentSchema, req.body);

    const fields: string[] = [];
    const values: unknown[] = [];
    if (body.name !== undefined) {
      values.push(body.name);
      fields.push(`name = $${values.length}`);
    }
    if (body.code !== undefined) {
      values.push(body.code);
      fields.push(`code = $${values.length}`);
    }
    if (body.description !== undefined) {
      values.push(body.description);
      fields.push(`description = $${values.length}`);
    }
    if (body.headDoctorId !== undefined) {
      values.push(body.headDoctorId);
      fields.push(`head_doctor_id = $${values.length}`);
    }

    if (fields.length === 0) {
      const { rows } = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
      if (!rows[0]) throw notFound('Department not found');
      return res.json({ data: rows[0] });
    }

    values.push(id);
    const { rows } = await pool.query(
      `
      UPDATE departments
         SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${values.length}
      RETURNING id, name, code, description, head_doctor_id AS "headDoctorId",
                created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      values,
    );
    if (!rows[0]) throw notFound('Department not found');
    res.json({ data: rows[0] });
  }),
);
