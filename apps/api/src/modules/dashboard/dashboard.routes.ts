import { Router } from 'express';
import type {
  AdminDashboardDto,
  AppointmentStatus,
  DashboardDto,
  DoctorDashboardDto,
  PatientDashboardDto,
  StatusCounts,
} from '@healthcare/shared';
import { asyncHandler, requireAuth } from '../../common/http';
import { todayIn } from '../../common/time';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';
import * as appointments from '../appointments/appointments.repo';

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);

const base = { when: 'all', page: 1 } as const;

async function patientDashboard(userId: number, today: string): Promise<PatientDashboardDto> {
  const { patientId } = await appointments.profileIds(pool, userId);
  if (!patientId) return { role: 'PATIENT', upcoming: [], counts: { total: 0, completed: 0, cancelled: 0, upcoming: 0 } };

  const [counts, upcoming] = await Promise.all([
    pool.query<{ total: number; completed: number; cancelled: number; upcoming: number }>(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
              COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
              COUNT(*) FILTER (WHERE status IN ('PENDING', 'CONFIRMED') AND appointment_date >= $2) AS upcoming
         FROM appointments WHERE patient_id = $1`,
      [patientId, today],
    ),
    appointments.list(pool, { ...base, when: 'upcoming', pageSize: 3, patientId, today }),
  ]);
  return { role: 'PATIENT', upcoming: upcoming.rows, counts: counts.rows[0]! };
}

async function doctorDashboard(userId: number, today: string): Promise<DoctorDashboardDto> {
  const { doctorId } = await appointments.profileIds(pool, userId);
  if (!doctorId) {
    return { role: 'DOCTOR', isVerified: false, today: [], counts: { today: 0, upcoming: 0, completed: 0, pendingRequests: 0 } };
  }
  const [counts, schedule, doc] = await Promise.all([
    pool.query<DoctorDashboardDto['counts']>(
      `SELECT COUNT(*) FILTER (WHERE appointment_date = $2 AND status <> 'CANCELLED') AS today,
              COUNT(*) FILTER (WHERE appointment_date >= $2 AND status IN ('PENDING', 'CONFIRMED')) AS upcoming,
              COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
              COUNT(*) FILTER (WHERE status = 'PENDING' AND appointment_date >= $2) AS "pendingRequests"
         FROM appointments WHERE doctor_id = $1`,
      [doctorId, today],
    ),
    appointments.list(pool, { ...base, pageSize: 50, doctorId, date: today, today, sortAsc: true }),
    pool.query<{ is_verified: boolean }>('SELECT is_verified FROM doctors WHERE id = $1', [doctorId]),
  ]);
  return {
    role: 'DOCTOR',
    isVerified: doc.rows[0]?.is_verified ?? false,
    today: schedule.rows.filter((a) => a.status !== 'CANCELLED'),
    counts: counts.rows[0]!,
  };
}

async function adminDashboard(today: string): Promise<AdminDashboardDto> {
  const [users, awaiting, appts, byStatus, series, recent] = await Promise.all([
    pool.query<{ users: number; patients: number; doctors: number }>(
      `SELECT COUNT(*) AS users,
              COUNT(*) FILTER (WHERE role = 'PATIENT') AS patients,
              COUNT(*) FILTER (WHERE role = 'DOCTOR') AS doctors FROM users`,
    ),
    pool.query<{ count: number }>('SELECT COUNT(*) AS count FROM doctors WHERE NOT is_verified'),
    pool.query<{ count: number }>('SELECT COUNT(*) AS count FROM appointments'),
    pool.query<{ status: AppointmentStatus; count: number }>('SELECT status, COUNT(*) AS count FROM appointments GROUP BY status'),
    pool.query<{ date: string; count: number }>(
      `SELECT to_char(($1::date - i), 'YYYY-MM-DD') AS date, COUNT(a.id) AS count
         FROM generate_series(0, 6) AS i
         LEFT JOIN appointments a ON a.appointment_date = ($1::date - i) AND a.status <> 'CANCELLED'
        GROUP BY i ORDER BY i DESC`,
      [today],
    ),
    appointments.list(pool, { ...base, pageSize: 5, today }),
  ]);

  const counts: StatusCounts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const r of byStatus.rows) counts[r.status] = r.count;

  return {
    role: 'ADMIN',
    counts: {
      users: users.rows[0]?.users ?? 0,
      patients: users.rows[0]?.patients ?? 0,
      doctors: users.rows[0]?.doctors ?? 0,
      doctorsAwaitingVerification: awaiting.rows[0]?.count ?? 0,
      appointments: appts.rows[0]?.count ?? 0,
    },
    byStatus: counts,
    last7Days: series.rows,
    recent: recent.rows,
  };
}

dashboardRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const { userId, role } = requireAuth(req);
    const today = todayIn(env.CLINIC_TIMEZONE);
    const mode = req.query.mode as string | undefined;

    let data: DashboardDto;
    if (role === 'PATIENT') {
      data = await patientDashboard(userId, today);
    } else if (mode === 'admin' || (role === 'ADMIN' && mode !== 'doctor')) {
      data = await adminDashboard(today);
    } else {
      data = await doctorDashboard(userId, today);
    }
    res.json({ data });
  }),
);
