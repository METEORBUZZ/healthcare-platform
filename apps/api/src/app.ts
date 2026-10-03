import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { PublicMeta } from '@healthcare/shared';
import { todayIn } from './common/time';
import { env } from './config/env';
import { logger } from './config/logger';
import { pingDatabase } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { adminRoutes } from './modules/admin/admin.routes';
import { appointmentRoutes } from './modules/appointments/appointments.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { doctorRoutes } from './modules/doctors/doctors.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { patientRoutes } from './modules/patients/patients.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
      autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    }),
  );
  app.use(helmet());
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
  v1.use('/admin', adminRoutes);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
