import { Router } from 'express';
import { loginSchema } from '@healthcare/shared';
import { forbidden, unauthorized } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { authenticate, requireRole } from '../../middleware/auth';
import { adminLoginAccountLimiter, adminLoginLimiter } from '../../middleware/rateLimit';
import { pool } from '../../db/pool';
import * as auth from '../auth/auth.service';
import { clearAdminAccessCookie, setAdminAccessCookie } from '../auth/auth.tokens';
import { recordAdminAuditEvent } from './admin.audit';

export const adminAuthRoutes = Router();

adminAuthRoutes.get(
  '/me',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await auth.me(requireAuth(req).userId);
    res.json({ data: user });
  }),
);

adminAuthRoutes.post(
  '/login',
  adminLoginLimiter,
  adminLoginAccountLimiter,
  asyncHandler(async (req, res) => {
    const credentials = parse(loginSchema, req.body);
    try {
      const result = await auth.login(credentials, req.get('user-agent'));
      if (result.user.role !== 'ADMIN') {
        await auth.logout(result.refreshToken);
        await recordAdminAuditEvent(req, {
          action: 'ADMIN_LOGIN_FAILURE',
          targetType: 'ADMIN_SESSION',
          outcome: 'DENIED',
          actorUserId: result.user.id,
        });
        clearAdminAccessCookie(res);
        throw forbidden('Invalid email or password', 'ADMIN_ACCESS_DENIED');
      }
      await recordAdminAuditEvent(req, {
        action: 'ADMIN_LOGIN_SUCCESS',
        targetType: 'ADMIN_SESSION',
        outcome: 'SUCCESS',
        actorUserId: result.user.id,
      });
      setAdminAccessCookie(res, result.accessToken);
      if (result.user.mustChangePassword) {
        res.json({
          authenticated: true,
          mustChangePassword: true,
          message: 'Password change required',
          data: result.user,
          accessToken: result.accessToken,
        });
        return;
      }
      res.json({ data: result.user });
    } catch (err) {
      if (err instanceof Error && 'status' in err && (err.status === 401 || err.status === 403)) {
        if ('code' in err && err.code === 'ADMIN_ACCESS_DENIED') {
          throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        await recordAdminAuditEvent(req, {
          action: 'ADMIN_LOGIN_FAILURE',
          targetType: 'ADMIN_SESSION',
          outcome: 'DENIED',
        });
        clearAdminAccessCookie(res);
        throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
      }
      throw err;
    }
  }),
);

adminAuthRoutes.post(
  '/logout',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await auth.revokeAllSessions(pool, requireAuth(req).userId);
    await recordAdminAuditEvent(req, {
      action: 'ADMIN_LOGOUT',
      targetType: 'ADMIN_SESSION',
      outcome: 'SUCCESS',
      actorUserId: requireAuth(req).userId,
    });
    clearAdminAccessCookie(res);
    res.status(204).end();
  }),
);
