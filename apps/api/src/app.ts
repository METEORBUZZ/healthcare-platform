import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { PublicMeta } from '@healthcare/shared';
import { todayIn } from './common/time';
import { env, isProd } from './config/env';
import { logger } from './config/logger';
import { pingDatabase } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';
import { adminRoutes } from './modules/admin/admin.routes';
import { adminAuthRoutes } from './modules/admin/admin-auth.routes';
import { appointmentRoutes } from './modules/appointments/appointments.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { doctorRoutes } from './modules/doctors/doctors.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { patientRoutes } from './modules/patients/patients.routes';
import { shiftRoutes } from './modules/shifts/shifts.routes';
import { departmentRoutes } from './modules/departments/departments.routes';
import { staffRoutes } from './modules/staff/staff.routes';
import { assignmentRoutes } from './modules/assignments/assignments.routes';
import { taskRoutes } from './modules/tasks/tasks.routes';
import { medicalRecordRoutes } from './modules/medical-records/medical-records.routes';
import { prescriptionRoutes } from './modules/prescriptions/prescriptions.routes';
import { reportRoutes } from './modules/reports/reports.routes';
import { auditLogRoutes } from './modules/audit-logs/audit-logs.routes';
import { blockchainRoutes } from './modules/blockchain/blockchain.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
      autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    next();
  });
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Liveness (is the process up) and readiness (can it reach the database). Not rate limited.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/api/health/ready', async (_req, res) => {
    try {
      await pingDatabase();
      res.json({ status: 'ready' });
    } catch (err) {
      logger.error({ err }, 'Readiness check failed');
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/api', apiLimiter);

  const v1 = Router();
  v1.get('/meta', (_req, res) => {
    const meta: PublicMeta = {
      today: todayIn(env.CLINIC_TIMEZONE),
      timezone: env.CLINIC_TIMEZONE,
      bookingWindowDays: env.BOOKING_WINDOW_DAYS,
    };
    res.json({ data: meta });
  });
  v1.use('/auth', authRoutes);
  v1.use('/doctors', doctorRoutes);
  v1.use('/patients', patientRoutes);
  v1.use('/appointments', appointmentRoutes);
  v1.use('/notifications', notificationRoutes);
  v1.use('/dashboard', dashboardRoutes);
  v1.use('/shifts', shiftRoutes);
  v1.use('/departments', departmentRoutes);
  v1.use('/staff', staffRoutes);
  v1.use('/assignments', assignmentRoutes);
  v1.use('/tasks', taskRoutes);
  v1.use('/prescriptions', prescriptionRoutes);
  v1.use('/reports', reportRoutes);
  v1.use('/audit-logs', auditLogRoutes);
  v1.use('/blockchain', blockchainRoutes);
  v1.use('/', medicalRecordRoutes);
  v1.use('/admin/auth', adminAuthRoutes);
  v1.use('/admin', adminRoutes);

  v1.get('/profile', authenticate, (req, res) => {
    res.json({ data: { message: 'Profile accessed successfully', userId: req.auth?.userId } });
  });

  app.use('/api/v1', v1);
  app.use('/api', v1);

  // Serve static files from web client in production
  const candidatePaths = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    fileURLToPath(new URL('../../web/dist', import.meta.url)),
    fileURLToPath(new URL('../../../apps/web/dist', import.meta.url)),
  ];
  const clientDist = candidatePaths.find((p) => fs.existsSync(p));
  if (clientDist) {
    logger.info({ clientDist }, 'Serving web client static build');
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    logger.warn('Web client dist not found; API only mode');
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
