import { Router } from 'express';
import { changePasswordSchema, loginSchema, registerSchema, updateMeSchema } from '@healthcare/shared';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { authenticate } from '../../middleware/auth';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimit';
import * as service from './auth.service';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAdminAccessCookie,
  setAuthCookies,
} from './auth.tokens';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(registerSchema, req.body);
    const { user, ...tokens } = await service.register(input, req.get('user-agent'));
    setAuthCookies(res, tokens);
    res.status(201).json({ data: user });
  }),
);

authRoutes.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(loginSchema, req.body);
    const { user, ...tokens } = await service.login(input, req.get('user-agent'));
    setAuthCookies(res, tokens);
    if (user.mustChangePassword) {
      res.json({
        authenticated: true,
        mustChangePassword: true,
        message: 'Password change required',
        data: user,
        accessToken: tokens.accessToken,
      });
      return;
    }
    res.json({ data: user });
  }),
);

authRoutes.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const input = parse(changePasswordSchema, req.body);
    const { user, ...tokens } = await service.changePassword(
      userId,
      { currentPassword: input.currentPassword, newPassword: input.newPassword },
      req.get('user-agent'),
    );
    setAuthCookies(res, tokens);
    if (user.role === 'ADMIN') {
      setAdminAccessCookie(res, tokens.accessToken);
    }
    res.json({
      message: 'Password changed successfully',
      mustChangePassword: false,
      data: user,
      accessToken: tokens.accessToken,
    });
  }),
);

authRoutes.get(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const user = await service.me(userId);
    res.json({
      data: {
        mustChangePassword: Boolean(user.mustChangePassword),
      },
    });
  }),
);

authRoutes.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    try {
      const { user, ...tokens } = await service.refresh(req.cookies?.[REFRESH_COOKIE], req.get('user-agent'));
      setAuthCookies(res, tokens);
      res.json({ data: user });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }),
);

authRoutes.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await service.logout(req.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

authRoutes.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ data: await service.me(requireAuth(req).userId) });
  }),
);

authRoutes.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = requireAuth(req);
    const input = parse(updateMeSchema, req.body);
    const updated = await service.updateMe(userId, input);
    res.json({ data: updated });
  }),
);
