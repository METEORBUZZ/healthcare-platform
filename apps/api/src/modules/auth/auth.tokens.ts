import crypto from 'node:crypto';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@healthcare/shared';
import { env } from '../../config/env';
import { ACCESS_COOKIE, ADMIN_ACCESS_COOKIE } from '../../middleware/auth';

export const REFRESH_COOKIE = 'refresh_token';
/** The refresh cookie is only sent to the auth endpoints, never to regular API calls. */
const REFRESH_PATH = '/api/v1/auth';

export function signAccessToken(userId: number, role: Role, sessionId: number): string {
  return jwt.sign({ role, sid: sessionId }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const refreshExpiry = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

const cookieBase = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax' as const };

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieBase,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieBase,
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...cookieBase, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase, path: REFRESH_PATH });
}

export function setAdminAccessCookie(res: Response, accessToken: string): void {
  res.cookie(ADMIN_ACCESS_COOKIE, accessToken, {
    ...cookieBase,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000,
  });
}

export function clearAdminAccessCookie(res: Response): void {
  res.clearCookie(ADMIN_ACCESS_COOKIE, { ...cookieBase, path: '/' });
}
