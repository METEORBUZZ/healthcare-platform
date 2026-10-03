import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput, SessionUser, UpdateMeInput } from '@healthcare/shared';
import { conflict, forbidden, unauthorized } from '../../common/errors';
import { isUniqueViolation, pool, withTransaction, type Db } from '../../db/pool';
import * as doctorsRepo from '../doctors/doctors.repo';
import * as notifications from '../notifications/notifications.repo';
import * as users from '../users/users.repo';
import { generateRefreshToken, hashToken, refreshExpiry, signAccessToken } from './auth.tokens';

const BCRYPT_ROUNDS = 12;
// Two tabs may refresh at the same moment; the loser presents a token that was revoked milliseconds ago.
const REUSE_GRACE_MS = 10_000;
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export interface AuthResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(db: Db, userId: number, role: SessionUser['role'], userAgent?: string) {
  const refreshToken = generateRefreshToken();
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent) VALUES ($1, $2, $3, $4)',
    [userId, hashToken(refreshToken), refreshExpiry(), userAgent?.slice(0, 255) ?? null],
  );
  return { accessToken: signAccessToken(userId, role), refreshToken };
}

async function sessionOrThrow(db: Db, userId: number): Promise<SessionUser> {
  const s = await users.findSessionUser(db, userId);
  if (!s) throw unauthorized();
  if (s.status !== 'ACTIVE') throw forbidden('This account has been deactivated. Contact an administrator.', 'ACCOUNT_DISABLED');
  const { status: _status, ...user } = s;
  return user;
}

export async function register(input: RegisterInput, userAgent?: string): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    return await withTransaction(async (tx) => {
      const user = await users.create(tx, {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      });

      if (input.role === 'DOCTOR') {
        const doctorId = await doctorsRepo.createProfile(tx, user.id, input.specialization ?? 'General Physician');
        await doctorsRepo.replaceAvailability(tx, doctorId, doctorsRepo.defaultAvailability());
        await notifications.notifyAdmins(tx, 'Doctor awaiting verification', `${user.name} registered as a ${input.specialization}.`);
        await notifications.notify(tx, {
          userId: user.id,
          title: 'Welcome to HealthCare+',
          message: 'Complete your profile. Patients can book you once an administrator verifies your account.',
        });
      } else {
        await tx.query('INSERT INTO patients (user_id) VALUES ($1)', [user.id]);
        await notifications.notify(tx, {
          userId: user.id,
          title: 'Welcome to HealthCare+',
          message: 'Complete your medical profile to speed up future bookings.',
        });
      }

      const tokens = await issueTokens(tx, user.id, user.role, userAgent);
      return { user: await sessionOrThrow(tx, user.id), ...tokens };
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
    throw err;
  }
}

export async function login(input: LoginInput, userAgent?: string): Promise<AuthResult> {
  const user = await users.findByEmail(pool, input.email);
  const ok = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') {
    throw forbidden('This account has been deactivated. Contact an administrator.', 'ACCOUNT_DISABLED');
  }

  return withTransaction(async (tx) => {
    await users.touchLastLogin(tx, user.id);
    const tokens = await issueTokens(tx, user.id, user.role, userAgent);
    return { user: await sessionOrThrow(tx, user.id), ...tokens };
  });
}

/**
 * Rotating refresh tokens: every refresh invalidates the presented token and issues a new one.
 * Presenting an already-revoked token means it was likely stolen, so all sessions are revoked.
 */
export async function refresh(rawToken: string | undefined, userAgent?: string): Promise<AuthResult> {
  const expired = () => unauthorized('Session expired. Sign in again.', 'INVALID_REFRESH_TOKEN');
  if (!rawToken) throw expired();

  const outcome = await withTransaction(async (tx) => {
    const { rows } = await tx.query<{ id: number; user_id: number; expires_at: Date; revoked_at: Date | null }>(
      'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE',
      [hashToken(rawToken)],
    );
    const row = rows[0];
    if (!row || row.expires_at.getTime() < Date.now()) return { kind: 'invalid' } as const;
    if (row.revoked_at && Date.now() - row.revoked_at.getTime() > REUSE_GRACE_MS) {
      return { kind: 'reused', userId: row.user_id } as const;
    }

    const user = await sessionOrThrow(tx, row.user_id);
    await tx.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [row.id]);
    const tokens = await issueTokens(tx, user.id, user.role, userAgent);
    return { kind: 'ok', result: { user, ...tokens } } as const;
  });

  if (outcome.kind === 'ok') return outcome.result;
  // Done outside the transaction above so the revocation is committed, not rolled back.
  if (outcome.kind === 'reused') await revokeAllSessions(pool, outcome.userId);
  throw expired();
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [hashToken(rawToken)]);
}

export async function me(userId: number): Promise<SessionUser> {
  return sessionOrThrow(pool, userId);
}

export async function revokeAllSessions(db: Db, userId: number): Promise<void> {
  await db.query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}

export async function updateMe(userId: number, input: UpdateMeInput): Promise<SessionUser> {
  return withTransaction(async (tx) => {
    const user = await sessionOrThrow(tx, userId);

    // Update user table
    const updates: string[] = [];
    const params: unknown[] = [userId];
    let idx = 2;
    if (input.name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(input.name);
    }
    if (input.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      params.push(input.avatarUrl || null);
    }
    if (updates.length > 0) {
      await tx.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $1`, params);
    }

    // Role-specific updates
    if (user.role === 'PATIENT') {
      const pUpdates: string[] = [];
      const pParams: unknown[] = [userId];
      let pIdx = 2;
      if (input.phone !== undefined) { pUpdates.push(`phone = $${pIdx++}`); pParams.push(input.phone); }
      if (input.gender !== undefined) { pUpdates.push(`gender = $${pIdx++}`); pParams.push(input.gender); }
      if (input.dateOfBirth !== undefined) { pUpdates.push(`date_of_birth = $${pIdx++}`); pParams.push(input.dateOfBirth || null); }
      if (input.bloodGroup !== undefined) { pUpdates.push(`blood_group = $${pIdx++}`); pParams.push(input.bloodGroup || null); }
      if (input.emergencyContact !== undefined) { pUpdates.push(`emergency_contact = $${pIdx++}`); pParams.push(input.emergencyContact || null); }
      if (input.address !== undefined) { pUpdates.push(`address = $${pIdx++}`); pParams.push(input.address || null); }
      if (input.medicalHistory !== undefined) { pUpdates.push(`medical_history = $${pIdx++}`); pParams.push(input.medicalHistory || null); }
      if (pUpdates.length > 0) {
        await tx.query(`UPDATE patients SET ${pUpdates.join(', ')} WHERE user_id = $1`, pParams);
      }
    } else if (user.role === 'DOCTOR') {
      const dUpdates: string[] = [];
      const dParams: unknown[] = [userId];
      let dIdx = 2;
      if (input.specialization !== undefined) { dUpdates.push(`specialization = $${dIdx++}`); dParams.push(input.specialization); }
      if (input.bio !== undefined) { dUpdates.push(`bio = $${dIdx++}`); dParams.push(input.bio || null); }
      if (input.qualification !== undefined) { dUpdates.push(`qualification = $${dIdx++}`); dParams.push(input.qualification || null); }
      if (input.consultationFee !== undefined) { dUpdates.push(`consultation_fee = $${dIdx++}`); dParams.push(input.consultationFee); }
      if (input.hospitalAffiliation !== undefined) { dUpdates.push(`hospital_affiliation = $${dIdx++}`); dParams.push(input.hospitalAffiliation || null); }
      if (dUpdates.length > 0) {
        await tx.query(`UPDATE doctors SET ${dUpdates.join(', ')} WHERE user_id = $1`, dParams);
      }
    }

    return sessionOrThrow(tx, userId);
  });
}
