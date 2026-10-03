import { Router } from 'express';
import { idParamSchema, notificationListQuerySchema } from '@healthcare/shared';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { notFound } from '../../common/errors';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';
import * as repo from './notifications.repo';

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);

notificationRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const q = parse(notificationListQuerySchema, req.query);
    const { rows, total, unread } = await repo.list(pool, userId, {
      unreadOnly: q.unread === 'true',
      page: q.page,
      pageSize: q.pageSize,
    });
    res.json({ data: rows, meta: { ...pageMeta(q.page, q.pageSize, total), unread } });
  }),
);

notificationRoutes.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    res.json({ data: { count: await repo.unreadCount(pool, requireAuth(req).userId) } });
  }),
);

notificationRoutes.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await repo.markAllRead(pool, requireAuth(req).userId);
    res.status(204).end();
  }),
);

notificationRoutes.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const ok = await repo.markRead(pool, id, requireAuth(req).userId);
    if (!ok) throw notFound('Notification');
    res.status(204).end();
  }),
);
