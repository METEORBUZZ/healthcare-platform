import { Router } from 'express';
import { adminAuditQuerySchema } from '@healthcare/shared';
import { asyncHandler, pageMeta, parse } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';

export const auditLogRoutes = Router();

auditLogRoutes.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const query = parse(adminAuditQuerySchema, req.query);
    const params: unknown[] = [];
    const filters: string[] = [];

    if (query.action) {
      params.push(query.action);
      filters.push(`al.action = $${params.length}`);
    }
    if (query.actorUserId) {
      params.push(query.actorUserId);
      filters.push(`al.actor_user_id = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (query.page - 1) * query.pageSize;

    const countResult = await pool.query<{ count: number }>(
      `SELECT count(*) FROM admin_audit_logs al ${where}`,
      params,
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    params.push(query.pageSize, offset);
    const { rows } = await pool.query(
      `
      SELECT al.id, al.actor_user_id AS "actorUserId", u.name AS "actorName",
             al.action, al.target_type AS "targetType", al.target_id AS "targetId",
             al.outcome, al.ip_address AS "ipAddress", al.created_at AS "createdAt"
        FROM admin_audit_logs al
   LEFT JOIN users u ON u.id = al.actor_user_id
       ${where}
    ORDER BY al.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params,
    );

    res.json({
      data: rows,
      meta: pageMeta(query.page, query.pageSize, total),
    });
  }),
);
