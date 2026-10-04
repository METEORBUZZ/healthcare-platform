import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES, type Role } from '@healthcare/shared';
import { env } from '../config/env';
import { forbidden, unauthorized } from '../common/errors';
import { pool } from '../db/pool';

export const ACCESS_COOKIE = 'access_token';
export const ADMIN_ACCESS_COOKIE = 'admin_access_token';

const isRole = (v: unknown): v is Role =>
  typeof v === 'string' && (ROLES as readonly string[]).includes(v);

/** Reads the access token from the httpOnly cookie (browser) or a Bearer header (API clients/tests). */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const isAdminRequest = req.baseUrl.startsWith('/api/v1/admin');
  const token: string | undefined =
    (isAdminRequest
      ? (req.cookies?.[ADMIN_ACCESS_COOKIE] ?? req.cookies?.[ACCESS_COOKIE])
      : req.cookies?.[ACCESS_COOKIE]) ??
    (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next(unauthorized());

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  } catch {
    return next(unauthorized('Your session has expired. Sign in again.', 'TOKEN_EXPIRED'));
  }
  if (
    typeof payload === 'string' ||
    !payload.sub ||
    !isRole(payload.role) ||
    typeof payload.sid !== 'number' ||
    !Number.isSafeInteger(payload.sid) ||
    payload.sid <= 0
  ) {
    return next(unauthorized('Invalid session', 'INVALID_TOKEN'));
  }

  if (
    isAdminRequest &&
    !req.cookies?.[ADMIN_ACCESS_COOKIE] &&
    !header?.startsWith('Bearer ') &&
    payload.role === 'ADMIN'
  ) {
    return next(
      unauthorized('Sign in through the administrator application.', 'ADMIN_LOGIN_REQUIRED'),
    );
  }

  void (async () => {
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return next(unauthorized('Invalid session', 'INVALID_TOKEN'));
    }
    const { rows } = await pool.query<{ active: boolean; must_change_password: boolean }>(
      `SELECT true AS active, u.must_change_password
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
        WHERE rt.id = $1
          AND rt.user_id = $2
          AND rt.revoked_at IS NULL
          AND rt.expires_at > now()
          AND u.status = 'ACTIVE'
          AND u.role = $3`,
      [payload.sid, userId, payload.role],
    );
    if (!rows[0]?.active) {
      return next(
        unauthorized('Your session is no longer active. Sign in again.', 'INVALID_SESSION'),
      );
    }
    const mustChangePassword = Boolean(rows[0].must_change_password);
    req.auth = { userId, role: payload.role, mustChangePassword };

    if (mustChangePassword) {
      const path = req.path || '';
      const baseUrl = req.baseUrl || '';
      const originalUrl = req.originalUrl || '';

      const isAllowed =
        (baseUrl.endsWith('/auth') &&
          (path === '/change-password' || path === '/logout' || (req.method === 'GET' && path === '/me'))) ||
        originalUrl.endsWith('/auth/change-password') ||
        originalUrl.endsWith('/auth/logout') ||
        (req.method === 'GET' && originalUrl.endsWith('/auth/me')) ||
        (path === '/change-password' && (baseUrl === '' || baseUrl.endsWith('/auth')));

      if (!isAllowed) {
        return next(
          forbidden(
            'Password change required before accessing the application.',
            'PASSWORD_CHANGE_REQUIRED',
          ),
        );
      }
    }

    next();
  })().catch(next);
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
  };
