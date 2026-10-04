import bcrypt from 'bcryptjs';
import { Router } from 'express';
import {
  adminAuditQuerySchema,
  adminCreateUserSchema,
  appointmentListQuerySchema,
  adminUserListQuerySchema,
  createStaffAccountSchema,
  doctorListQuerySchema,
  idParamSchema,
  shiftAssignmentSchema,
  updateDoctorVerificationSchema,
  updateUserStatusSchema,
} from '@healthcare/shared';
import { conflict, forbidden, notFound } from '../../common/errors';
import { asyncHandler, pageMeta, parse, requireAuth } from '../../common/http';
import { isUniqueViolation, pool, withTransaction } from '../../db/pool';
import { authenticate, requireRole } from '../../middleware/auth';
import { revokeAllSessions } from '../auth/auth.service';
import { generateTemporaryPassword } from '../auth/password';
import * as doctors from '../doctors/doctors.repo';
import * as appointments from '../appointments/appointments.service';
import * as notifications from '../notifications/notifications.repo';
import * as shifts from '../shifts/shifts.repo';
import * as users from '../users/users.repo';
import { adminAuditLog, recordAdminAuditEvent } from './admin.audit';
import { env } from '../../config/env';
import { todayIn } from '../../common/time';

export const adminRoutes = Router();
adminRoutes.use(adminAuditLog, authenticate, requireRole('ADMIN'));

adminRoutes.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const query = parse(adminAuditQuerySchema, req.query);
    const params: unknown[] = [];
    const filters: string[] = [];
    if (query.action) {
      params.push(query.action);
      filters.push(`action = $${params.length}`);
    }
    if (query.actorUserId) {
      params.push(query.actorUserId);
      filters.push(`actor_user_id = $${params.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (query.page - 1) * query.pageSize;
    const countResult = await pool.query<{ count: number }>(
      `SELECT count(*) FROM admin_audit_logs ${where}`,
      params,
    );
    params.push(query.pageSize, offset);
    const { rows } = await pool.query(
      `SELECT id, actor_user_id AS "actorUserId", action,
              target_type AS "targetType", target_id AS "targetId",
              outcome, request_id AS "requestId", ip_address AS "ipAddress",
              created_at AS "createdAt"
         FROM admin_audit_logs ${where}
        ORDER BY id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json({
      data: rows,
      meta: pageMeta(query.page, query.pageSize, countResult.rows[0]?.count ?? 0),
    });
  }),
);

adminRoutes.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const query = parse(appointmentListQuerySchema, req.query);
    const result = await appointments.list(
      { userId: requireAuth(req).userId, role: 'ADMIN' },
      query,
    );
    res.json({
      data: result.rows,
      meta: pageMeta(query.page, query.pageSize, result.total),
    });
  }),
);

adminRoutes.get(
  '/analytics',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<{
      totalUsers: number;
      totalDoctors: number;
      totalStaff: number;
      totalAppointments: number;
      appointmentsToday: number;
      pendingAppointments: number;
    }>(
      `SELECT
         (SELECT count(*) FROM users WHERE role <> 'ADMIN') AS "totalUsers",
         (SELECT count(*) FROM doctors) AS "totalDoctors",
         (SELECT count(*) FROM users WHERE role IN ('STAFF', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY_STAFF')) AS "totalStaff",
         (SELECT count(*) FROM appointments) AS "totalAppointments",
         (SELECT count(*) FROM appointments WHERE appointment_date = $1) AS "appointmentsToday",
         (SELECT count(*) FROM appointments WHERE status = 'PENDING') AS "pendingAppointments"`,
      [todayIn(env.CLINIC_TIMEZONE)],
    );
    res.json({ data: rows[0] });
  }),
);

adminRoutes.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        publicAppUrl: env.PUBLIC_APP_URL,
        adminAppUrl: env.ADMIN_APP_URL,
        clinicTimezone: env.CLINIC_TIMEZONE,
        bookingWindowDays: env.BOOKING_WINDOW_DAYS,
      },
    });
  }),
);

adminRoutes.get(
  '/shift-assignments',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT target_email AS "targetEmail",
              shift_name AS "shiftName",
              shift_hours AS "shiftHours",
              break_time AS "breakTime",
              working_days AS "workingDays",
              working_location AS "workingLocation",
              room_area AS "roomArea",
              updated_at AS "updatedAt"
         FROM staff_shift_assignments
        ORDER BY target_email`,
    );
    res.json({ data: rows });
  }),
);

adminRoutes.put(
  '/shift-assignments',
  asyncHandler(async (req, res) => {
    const assignment = parse(shiftAssignmentSchema, req.body);
    const actorUserId = requireAuth(req).userId;
    const result = await withTransaction((tx) => shifts.save(tx, actorUserId, assignment));
    await recordAdminAuditEvent(req, {
      action: 'STAFF_SHIFT_UPDATED',
      targetType: 'STAFF_ACCOUNT',
      targetId: assignment.targetEmail,
      outcome: 'SUCCESS',
    });
    res.json({ data: result });
  }),
);

adminRoutes.post(
  '/staff-users',
  asyncHandler(async (req, res) => {
    const input = parse(createStaffAccountSchema, req.body);
    const actorUserId = requireAuth(req).userId;
    const initialPassword = input.password || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    try {
      const created = await withTransaction(async (tx) => {
        const user = await users.create(tx, {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          mustChangePassword: true,
        });
        const shiftAssignment = await shifts.save(tx, actorUserId, {
          targetEmail: input.email,
          ...input.shiftAssignment,
        });
        return {
          user: users.toUserDto(user),
          shiftAssignment,
          temporaryPassword: initialPassword,
        };
      });
      await recordAdminAuditEvent(req, {
        action: 'STAFF_CREATED',
        targetType: 'USER',
        targetId: String(created.user.id),
        outcome: 'SUCCESS',
      });
      res.status(201).json({
        message: 'User created successfully. User must change password on first login.',
        mustChangePassword: true,
        data: created,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
      }
      throw err;
    }
  }),
);

adminRoutes.post(
  '/users',
  asyncHandler(async (req, res) => {
    const input = parse(adminCreateUserSchema, req.body);
    const initialPassword = input.password || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    try {
      const created = await withTransaction(async (tx) => {
        const user = await users.create(tx, {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          mustChangePassword: true,
        });
        if (input.role === 'DOCTOR') {
          await doctors.createProfile(tx, user.id, input.specialization ?? 'General Physician');
        } else if (input.role === 'PATIENT') {
          await tx.query('INSERT INTO patients (user_id, phone) VALUES ($1, $2)', [
            user.id,
            input.phone ?? null,
          ]);
        }
        return {
          user: users.toUserDto(user),
          temporaryPassword: initialPassword,
        };
      });
      await recordAdminAuditEvent(req, {
        action: 'USER_CREATED',
        targetType: 'USER',
        targetId: String(created.user.id),
        outcome: 'SUCCESS',
      });
      res.status(201).json({
        message: 'User created successfully. User must change password on first login.',
        mustChangePassword: true,
        data: created,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
      }
      throw err;
    }
  }),
);

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
    if (id === requireAuth(req).userId)
      throw forbidden("You can't deactivate your own account", 'SELF_DEACTIVATION');

    const updated = await withTransaction(async (tx) => {
      const user = await users.setStatus(tx, id, status);
      // A deactivated user must not be able to mint new access tokens from an old refresh token.
      if (user && status === 'INACTIVE') await revokeAllSessions(tx, id);
      return user;
    });
    if (!updated) throw notFound('User');
    await recordAdminAuditEvent(req, {
      action: status === 'INACTIVE' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      targetType: 'USER',
      targetId: String(id),
      outcome: 'SUCCESS',
    });
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
    await recordAdminAuditEvent(req, {
      action: isVerified ? 'DOCTOR_ACTIVATED' : 'DOCTOR_UNLISTED',
      targetType: 'DOCTOR',
      targetId: String(id),
      outcome: 'SUCCESS',
    });
    res.json({ data: doctor });
  }),
);
