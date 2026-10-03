import type { AppointmentDto, AppointmentListQuery, AppointmentStatus, Role } from '@healthcare/shared';
import { offsetOf, QueryBuilder } from '../../common/http';
import type { Db } from '../../db/pool';

interface Row {
  id: number;
  appointment_date: string;
  start_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: string;
  reason: string;
  notes: string | null;
  doctor_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: Role | null;
  created_at: Date;
  updated_at: Date;
  has_review: boolean;
  doctor_id: number;
  doctor_user_id: number;
  doctor_name: string;
  doctor_avatar: string | null;
  specialization: string;
  patient_id: number;
  patient_user_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
}

/** DTO plus the owning user ids, which services need for authorization but clients never see. */
export interface AppointmentRecord extends AppointmentDto {
  doctorUserId: number;
  patientUserId: number;
}

export const SELECT = `
  SELECT a.id, a.appointment_date, to_char(a.start_time, 'HH24:MI') AS start_time, a.duration_minutes,
         a.status, a.appointment_type, a.reason, a.notes, a.doctor_notes, a.cancellation_reason,
         a.cancelled_by, a.created_at, a.updated_at,
         EXISTS (SELECT 1 FROM reviews rv WHERE rv.appointment_id = a.id) AS has_review,
         d.id AS doctor_id, du.id AS doctor_user_id, du.name AS doctor_name, du.avatar_url AS doctor_avatar,
         d.specialization,
         p.id AS patient_id, pu.id AS patient_user_id, pu.name AS patient_name, pu.email AS patient_email,
         p.phone AS patient_phone
    FROM appointments a
    JOIN doctors  d  ON d.id = a.doctor_id
    JOIN users    du ON du.id = d.user_id
    JOIN patients p  ON p.id = a.patient_id
    JOIN users    pu ON pu.id = p.user_id`;

const toRecord = (r: Row): AppointmentRecord => ({
  id: r.id,
  date: r.appointment_date,
  time: r.start_time,
  durationMinutes: r.duration_minutes,
  status: r.status,
  type: r.appointment_type,
  reason: r.reason,
  notes: r.notes,
  doctorNotes: r.doctor_notes,
  cancellationReason: r.cancellation_reason,
  cancelledBy: r.cancelled_by,
  hasReview: r.has_review,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  doctor: { id: r.doctor_id, name: r.doctor_name, avatarUrl: r.doctor_avatar, specialization: r.specialization },
  patient: { id: r.patient_id, name: r.patient_name, email: r.patient_email, phone: r.patient_phone },
  doctorUserId: r.doctor_user_id,
  patientUserId: r.patient_user_id,
});

export const toDto = ({ doctorUserId: _d, patientUserId: _p, ...dto }: AppointmentRecord): AppointmentDto => dto;

export async function profileIds(db: Db, userId: number): Promise<{ patientId: number | null; doctorId: number | null }> {
  const { rows } = await db.query<{ patient_id: number | null; doctor_id: number | null }>(
    `SELECT (SELECT id FROM patients WHERE user_id = $1) AS patient_id,
            (SELECT id FROM doctors  WHERE user_id = $1) AS doctor_id`,
    [userId],
  );
  return { patientId: rows[0]?.patient_id ?? null, doctorId: rows[0]?.doctor_id ?? null };
}

export async function findById(db: Db, id: number, o: { forUpdate?: boolean } = {}): Promise<AppointmentRecord | null> {
  const { rows } = await db.query<Row>(`${SELECT} WHERE a.id = $1 ${o.forUpdate ? 'FOR UPDATE OF a' : ''}`, [id]);
  return rows[0] ? toRecord(rows[0]) : null;
}

const UPCOMING_SQL = "(a.appointment_date >= {today} AND a.status IN ('PENDING', 'CONFIRMED'))";

export async function list(
  db: Db,
  f: AppointmentListQuery & { patientId?: number; doctorId?: number; today: string; sortAsc?: boolean },
): Promise<{ rows: AppointmentDto[]; total: number }> {
  const qb = new QueryBuilder();
  if (f.patientId) qb.where(`a.patient_id = ${qb.add(f.patientId)}`);
  if (f.doctorId) qb.where(`a.doctor_id = ${qb.add(f.doctorId)}`);
  if (f.status) qb.where(`a.status = ${qb.add(f.status)}`);
  if (f.date) qb.where(`a.appointment_date = ${qb.add(f.date)}`);
  if (f.when !== 'all') {
    const upcoming = UPCOMING_SQL.replace('{today}', qb.add(f.today));
    qb.where(f.when === 'upcoming' ? upcoming : `NOT ${upcoming}`);
  }
  const countParams = [...qb.params];
  const dir = f.when === 'upcoming' || f.sortAsc ? 'ASC' : 'DESC';
  const limit = qb.add(f.pageSize);
  const offset = qb.add(offsetOf(f.page, f.pageSize));

  const [data, count] = await Promise.all([
    db.query<Row>(
      `${SELECT} ${qb.whereSql} ORDER BY a.appointment_date ${dir}, a.start_time ${dir}, a.id ${dir} LIMIT ${limit} OFFSET ${offset}`,
      qb.params,
    ),
    db.query<{ count: number }>(`SELECT COUNT(*) AS count FROM appointments a ${qb.whereSql}`, countParams),
  ]);
  return { rows: data.rows.map((r) => toDto(toRecord(r))), total: count.rows[0]?.count ?? 0 };
}

export async function insert(
  db: Db,
  a: {
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    durationMinutes: number;
    type: string;
    reason: string;
    notes?: string;
  },
): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, duration_minutes,
                               appointment_type, reason, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [a.patientId, a.doctorId, a.date, a.time, a.durationMinutes, a.type, a.reason, a.notes ?? null],
  );
  return rows[0]!.id;
}

export async function updateStatus(
  db: Db,
  id: number,
  u: { status: AppointmentStatus; doctorNotes?: string; cancellationReason?: string; cancelledBy?: Role },
): Promise<void> {
  await db.query(
    `UPDATE appointments
        SET status = $2,
            doctor_notes = COALESCE($3, doctor_notes),
            cancellation_reason = COALESCE($4, cancellation_reason),
            cancelled_by = COALESCE($5, cancelled_by)
      WHERE id = $1`,
    [id, u.status, u.doctorNotes ?? null, u.cancellationReason ?? null, u.cancelledBy ?? null],
  );
}

export async function insertReview(
  db: Db,
  r: { appointmentId: number; doctorId: number; patientId: number; rating: number; comment?: string },
): Promise<void> {
  await db.query(
    'INSERT INTO reviews (appointment_id, doctor_id, patient_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
    [r.appointmentId, r.doctorId, r.patientId, r.rating, r.comment ?? null],
  );
}
