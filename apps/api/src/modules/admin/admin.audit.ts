import type { Request, RequestHandler } from 'express';
import { logger } from '../../config/logger';
import { pool } from '../../db/pool';

interface AuditEvent {
  action: string;
  targetType: string;
  targetId?: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  actorUserId?: number | null;
}

export async function recordAdminAuditEvent(req: Request, event: AuditEvent): Promise<void> {
  await pool.query(
    `INSERT INTO admin_audit_logs (
       actor_user_id, action, target_type, target_id,
       outcome, request_id, ip_address
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      event.actorUserId ?? req.auth?.userId ?? null,
      event.action,
      event.targetType,
      event.targetId ?? null,
      event.outcome,
      req.id ?? req.get('x-request-id') ?? null,
      req.ip || null,
    ],
  );
}

export const adminAuditLog: RequestHandler = (req, res, next) => {
  res.once('finish', () => {
    const outcome =
      res.statusCode === 401 || res.statusCode === 403
        ? 'DENIED'
        : res.statusCode >= 400
          ? 'FAILURE'
          : 'SUCCESS';
    void recordAdminAuditEvent(req, {
      action: `ADMIN_API_${req.method}`,
      targetType: req.baseUrl || 'ADMIN_API',
      targetId: req.path.replace(/\/\d+(?=\/|$)/g, '/:id'),
      outcome,
    }).catch((err: unknown) =>
      logger.error({ err, reqId: req.id }, 'Failed to persist admin audit event'),
    );
  });
  next();
};
