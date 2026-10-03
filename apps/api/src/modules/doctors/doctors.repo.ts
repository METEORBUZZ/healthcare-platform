import type {
  AvailabilityDayDto,
  AvailabilityInput,
  DoctorDto,
  DoctorListQuery,
  DoctorProfileInput,
  ReviewDto,
} from '@healthcare/shared';
import { likeEscape, maskName, offsetOf, QueryBuilder } from '../../common/http';
import type { Db } from '../../db/pool';

interface DoctorRow {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  specialization: string;
  experience_years: number;
  qualification: string;
  consultation_fee: number;
  bio: string | null;
  languages: string[];
  hospital_affiliation: string | null;
  is_verified: boolean;
  rating: number | null;
  review_count: number;
}

const SELECT = `
  SELECT d.id, d.user_id, u.name, u.email, u.avatar_url, d.specialization, d.experience_years,
         d.qualification, d.consultation_fee, d.bio, d.languages, d.hospital_affiliation, d.is_verified,
         r.rating, COALESCE(r.review_count, 0) AS review_count
    FROM doctors d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*) AS review_count
        FROM reviews WHERE doctor_id = d.id
    ) r ON true`;

const toDto = (r: DoctorRow, withEmail: boolean): DoctorDto => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  ...(withEmail ? { email: r.email } : {}),
  avatarUrl: r.avatar_url,
  specialization: r.specialization,
  experienceYears: r.experience_years,
  qualification: r.qualification,
  consultationFee: r.consultation_fee,
  bio: r.bio,
  languages: r.languages,
  hospitalAffiliation: r.hospital_affiliation,
  isVerified: r.is_verified,
  rating: r.rating,
  reviewCount: r.review_count,
});

const SORTS: Record<DoctorListQuery['sort'], string> = {
  rating: 'r.rating DESC NULLS LAST, r.review_count DESC NULLS LAST, u.name ASC',
  experience: 'd.experience_years DESC, u.name ASC',
  fee_asc: 'd.consultation_fee ASC, u.name ASC',
  name: 'u.name ASC',
};

export async function list(
  db: Db,
  f: DoctorListQuery & { publicOnly: boolean; availableDow?: number },
): Promise<{ rows: DoctorDto[]; total: number }> {
  const qb = new QueryBuilder();
  if (f.publicOnly) {
    qb.where("u.status = 'ACTIVE'");
    qb.where('d.is_verified = true');
  } else if (f.verified === 'true' || f.verified === 'false') {
    qb.where(`d.is_verified = ${qb.add(f.verified === 'true')}`);
  }
  if (f.q) {
    const p = qb.add(`%${likeEscape(f.q)}%`);
    qb.where(`(u.name ILIKE ${p} OR d.specialization ILIKE ${p} OR d.hospital_affiliation ILIKE ${p})`);
  }
  if (f.specialization) qb.where(`lower(d.specialization) = lower(${qb.add(f.specialization)})`);
  if (f.availableDow !== undefined) {
    qb.where(
      `EXISTS (SELECT 1 FROM doctor_availability a WHERE a.doctor_id = d.id AND a.is_available AND a.day_of_week = ${qb.add(f.availableDow)})`,
    );
  }
  const countParams = [...qb.params];
  const limit = qb.add(f.pageSize);
  const offset = qb.add(offsetOf(f.page, f.pageSize));

  const [data, count] = await Promise.all([
    db.query<DoctorRow>(`${SELECT} ${qb.whereSql} ORDER BY ${SORTS[f.sort]} LIMIT ${limit} OFFSET ${offset}`, qb.params),
    db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM doctors d JOIN users u ON u.id = d.user_id ${qb.whereSql}`,
      countParams,
    ),
  ]);
  return { rows: data.rows.map((r) => toDto(r, !f.publicOnly)), total: count.rows[0]?.count ?? 0 };
}

export async function findById(db: Db, id: number, o: { publicOnly: boolean }): Promise<DoctorDto | null> {
  const extra = o.publicOnly ? "AND u.status = 'ACTIVE' AND d.is_verified = true" : '';
  const { rows } = await db.query<DoctorRow>(`${SELECT} WHERE d.id = $1 ${extra}`, [id]);
  return rows[0] ? toDto(rows[0], !o.publicOnly) : null;
}

export async function findByUserId(db: Db, userId: number): Promise<DoctorDto | null> {
  const { rows } = await db.query<DoctorRow>(`${SELECT} WHERE d.user_id = $1`, [userId]);
  return rows[0] ? toDto(rows[0], true) : null;
}

export async function specializations(db: Db): Promise<string[]> {
  const { rows } = await db.query<{ specialization: string }>(
    `SELECT DISTINCT d.specialization FROM doctors d JOIN users u ON u.id = d.user_id
      WHERE d.is_verified AND u.status = 'ACTIVE' ORDER BY d.specialization`,
  );
  return rows.map((r) => r.specialization);
}

export async function createProfile(db: Db, userId: number, specialization: string): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    'INSERT INTO doctors (user_id, specialization) VALUES ($1, $2) RETURNING id',
    [userId, specialization],
  );
  return rows[0]!.id;
}

export async function updateProfile(db: Db, doctorId: number, userId: number, p: DoctorProfileInput): Promise<void> {
  await db.query('UPDATE users SET name = $2 WHERE id = $1', [userId, p.name]);
  await db.query(
    `UPDATE doctors SET specialization = $2, experience_years = $3, qualification = $4, consultation_fee = $5,
            bio = $6, languages = $7, hospital_affiliation = $8 WHERE id = $1`,
    [doctorId, p.specialization, p.experienceYears, p.qualification, p.consultationFee, p.bio ?? null, p.languages, p.hospitalAffiliation ?? null],
  );
}

export async function setVerified(db: Db, doctorId: number, isVerified: boolean): Promise<{ userId: number } | null> {
  const { rows } = await db.query<{ user_id: number }>(
    `UPDATE doctors SET is_verified = $2, verified_at = CASE WHEN $2 THEN now() ELSE NULL END
      WHERE id = $1 RETURNING user_id`,
    [doctorId, isVerified],
  );
  return rows[0] ? { userId: rows[0].user_id } : null;
}

// ------------------------------------------------------------------ availability

export function defaultAvailability(): AvailabilityInput {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 30,
  }));
}

export async function getAvailability(db: Db, doctorId: number): Promise<AvailabilityDayDto[]> {
  const { rows } = await db.query<{
    day_of_week: number;
    is_available: boolean;
    start_time: string;
    end_time: string;
    slot_minutes: number;
  }>(
    `SELECT day_of_week, is_available, to_char(start_time, 'HH24:MI') AS start_time,
            to_char(end_time, 'HH24:MI') AS end_time, slot_minutes
       FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week`,
    [doctorId],
  );
  return rows.map((r) => ({
    dayOfWeek: r.day_of_week,
    isAvailable: r.is_available,
    startTime: r.start_time,
    endTime: r.end_time,
    slotMinutes: r.slot_minutes,
  }));
}

/** Caller supplies the transaction so delete + insert is atomic. */
export async function replaceAvailability(db: Db, doctorId: number, days: AvailabilityInput): Promise<void> {
  await db.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);
  // A day switched off keeps its previous hours in the UI; the table requires end > start regardless.
  const safe = days.map((d) => (d.startTime < d.endTime ? d : { ...d, startTime: '09:00', endTime: '17:00' }));
  await db.query(
    `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_available)
     SELECT $1, t.d, t.s::time, t.e::time, t.m, t.a
       FROM unnest($2::int[], $3::text[], $4::text[], $5::int[], $6::bool[]) AS t(d, s, e, m, a)`,
    [
      doctorId,
      safe.map((d) => d.dayOfWeek),
      safe.map((d) => d.startTime),
      safe.map((d) => d.endTime),
      safe.map((d) => d.slotMinutes),
      safe.map((d) => d.isAvailable),
    ],
  );
}

export async function bookedTimes(db: Db, doctorId: number, date: string): Promise<Set<string>> {
  const { rows } = await db.query<{ time: string }>(
    `SELECT to_char(start_time, 'HH24:MI') AS time FROM appointments
      WHERE doctor_id = $1 AND appointment_date = $2 AND status <> 'CANCELLED'`,
    [doctorId, date],
  );
  return new Set(rows.map((r) => r.time));
}

// ------------------------------------------------------------------ reviews

export async function listReviews(
  db: Db,
  doctorId: number,
  page: number,
  pageSize: number,
): Promise<{ rows: ReviewDto[]; total: number }> {
  const [data, count] = await Promise.all([
    db.query<{ id: number; rating: number; comment: string | null; created_at: Date; name: string }>(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name
         FROM reviews r JOIN patients p ON p.id = r.patient_id JOIN users u ON u.id = p.user_id
        WHERE r.doctor_id = $1 ORDER BY r.created_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
      [doctorId, pageSize, offsetOf(page, pageSize)],
    ),
    db.query<{ count: number }>('SELECT COUNT(*) AS count FROM reviews WHERE doctor_id = $1', [doctorId]),
  ]);
  return {
    rows: data.rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: maskName(r.name),
      createdAt: r.created_at.toISOString(),
    })),
    total: count.rows[0]?.count ?? 0,
  };
}
