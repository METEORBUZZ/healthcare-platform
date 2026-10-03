import type { Role, SessionUser, UserDto, UserStatus } from '@healthcare/shared';
import { likeEscape, offsetOf, QueryBuilder } from '../../common/http';
import type { Db } from '../../db/pool';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  status: UserStatus;
  avatar_url: string | null;
  last_login_at: Date | null;
  created_at: Date;
}

const USER_COLUMNS = 'id, name, email, password_hash, role, status, avatar_url, last_login_at, created_at';

export const toUserDto = (r: UserRow): UserDto => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  status: r.status,
  avatarUrl: r.avatar_url,
  lastLoginAt: r.last_login_at?.toISOString() ?? null,
  createdAt: r.created_at.toISOString(),
});

export async function findByEmail(db: Db, email: string): Promise<UserRow | null> {
  const { rows } = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`, [email]);
  return rows[0] ?? null;
}

export async function findById(db: Db, id: number): Promise<UserRow | null> {
  const { rows } = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

interface SessionRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar_url: string | null;
  doctor_id: number | null;
  patient_id: number | null;
  is_verified: boolean | null;
}

/** User plus the ids of their role-specific profile rows, in one round trip. */
export async function findSessionUser(db: Db, id: number): Promise<(SessionUser & { status: UserStatus }) | null> {
  const { rows } = await db.query<SessionRow>(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar_url,
            d.id AS doctor_id, d.is_verified, p.id AS patient_id
       FROM users u
       LEFT JOIN doctors d  ON d.user_id = u.id
       LEFT JOIN patients p ON p.user_id = u.id
      WHERE u.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    avatarUrl: r.avatar_url,
    doctorId: r.doctor_id,
    patientId: r.patient_id,
    isVerified: r.doctor_id ? r.is_verified : null,
  };
}

export async function create(
  db: Db,
  input: { name: string; email: string; passwordHash: string; role: Role },
): Promise<UserRow> {
  const { rows } = await db.query<UserRow>(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING ${USER_COLUMNS}`,
    [input.name, input.email, input.passwordHash, input.role],
  );
  return rows[0]!;
}

export async function touchLastLogin(db: Db, id: number): Promise<void> {
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function setStatus(db: Db, id: number, status: UserStatus): Promise<UserRow | null> {
  const { rows } = await db.query<UserRow>(
    `UPDATE users SET status = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [id, status],
  );
  return rows[0] ?? null;
}

export async function list(
  db: Db,
  f: { q?: string; role?: Role; status?: UserStatus; page: number; pageSize: number },
): Promise<{ rows: UserRow[]; total: number }> {
  const qb = new QueryBuilder();
  if (f.role) qb.where(`role = ${qb.add(f.role)}`);
  if (f.status) qb.where(`status = ${qb.add(f.status)}`);
  if (f.q) {
    const p = qb.add(`%${likeEscape(f.q)}%`);
    qb.where(`(name ILIKE ${p} OR email ILIKE ${p})`);
  }
  const countParams = [...qb.params];
  const limit = qb.add(f.pageSize);
  const offset = qb.add(offsetOf(f.page, f.pageSize));

  const [data, count] = await Promise.all([
    db.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users ${qb.whereSql} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
      qb.params,
    ),
    db.query<{ count: number }>(`SELECT COUNT(*) AS count FROM users ${qb.whereSql}`, countParams),
  ]);
  return { rows: data.rows, total: count.rows[0]?.count ?? 0 };
}
