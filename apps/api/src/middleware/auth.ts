import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES, type Role } from '@healthcare/shared';
import { env } from '../config/env';
import { forbidden, unauthorized } from '../common/errors';

export const ACCESS_COOKIE = 'access_token';

const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLES as readonly string[]).includes(v);

/** Reads the access token from the httpOnly cookie (browser) or a Bearer header (API clients/tests). */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token: string | undefined =
    req.cookies?.[ACCESS_COOKIE] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub || !isRole(payload.role)) {
      return next(unauthorized('Invalid session', 'INVALID_TOKEN'));
    }
    req.auth = { userId: Number(payload.sub), role: payload.role };
    next();
  } catch {
    next(unauthorized('Your session has expired. Sign in again.', 'TOKEN_EXPIRED'));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
  };
