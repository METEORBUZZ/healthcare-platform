import { Router } from 'express';
import {
  adminUserListQuerySchema,
  doctorListQuerySchema,
  idParamSchema,
  updateDoctorVerificationSchema,
  updateUserStatusSchema,
} from '@healthcare/shared';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { pool, withTransaction } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';
import { revokeAllSessions } from '../auth/auth.service';
import * as doctors from '../doctors/doctors.repo';
import * as notifications from '../notifications/notifications.repo';
import * as users from '../users/users.repo';

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireRole('ADMIN', 'DOCTOR'));

adminRoutes.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = parse(adminUserListQuerySchema, req.query);
    const { rows, total } = await users.list(pool, q);
    res.json({ data: rows.map(users.toUserDto), meta: pageMeta(q.page, q.pageSize, total) });
  }),
);

adminRoutes.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { status } = parse(updateUserStatusSchema, req.body);
    if (id === requireAuth(req).userId) throw forbidden("You can't deactivate your own account", 'SELF_DEACTIVATION');

    const updated = await withTransaction(async (tx) => {
      const user = await users.setStatus(tx, id, status);
      // A deactivated user must not be able to mint new access tokens from an old refresh token.
      if (user && status === 'INACTIVE') await revokeAllSessions(tx, id);
      return user;
    });
    if (!updated) throw notFound('User');
    res.json({ data: users.toUserDto(updated) });
  }),
);

// Doctors, including those awaiting verification (?verified=false).
adminRoutes.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const q = parse(doctorListQuerySchema, req.query);
    const { rows, total } = await doctors.list(pool, { ...q, publicOnly: false });
    res.json({ data: rows, meta: pageMeta(q.page, q.pageSize, total) });
  }),
);

adminRoutes.patch(
  '/doctors/:id/verification',
  asyncHandler(async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { isVerified } = parse(updateDoctorVerificationSchema, req.body);
    await withTransaction(async (tx) => {
      const doc = await doctors.setVerified(tx, id, isVerified);
      if (!doc) throw notFound('Doctor');
      const docDetails = await doctors.findById(tx, id, { publicOnly: false });
      const doctorName = docDetails?.name ?? `ID #${id}`;
      await notifications.notify(tx, {
        userId: doc.userId,
        title: isVerified ? 'Your profile is verified' : 'Your profile is no longer listed',
        message: isVerified
          ? 'Patients can now find you in the directory and book appointments.'
          : 'An administrator removed your listing. Contact support if this is unexpected.',
      });
      await notifications.notifyAdmins(
        tx,
        isVerified ? 'Doctor verified' : 'Doctor unlisted',
        `Doctor verification status updated for ${doctorName}: ${isVerified ? 'VERIFIED' : 'UNLISTED'}.`,
      );
    });
    const doctor = await doctors.findById(pool, id, { publicOnly: false });
    res.json({ data: doctor });
  }),
);
