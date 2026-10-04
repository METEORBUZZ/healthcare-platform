import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/common/errors';
import { pool } from '../src/db/pool';
import { authenticate } from '../src/middleware/auth';
import { generateTemporaryPassword, validatePasswordPolicy } from '../src/modules/auth/password';
import { signAccessToken } from '../src/modules/auth/auth.tokens';
import * as authService from '../src/modules/auth/auth.service';
import * as usersRepo from '../src/modules/users/users.repo';
import { changePasswordSchema } from '@healthcare/shared';

describe('First-Login Force Password Change Security Flow', () => {
  describe('Requirement 2 & 9: Temporary Password & Password Policy', () => {
    it('generates cryptographically secure temporary passwords meeting policy', () => {
      for (let i = 0; i < 20; i++) {
        const pass = generateTemporaryPassword(14);
        expect(pass.length).toBeGreaterThanOrEqual(14);
        expect(/[A-Za-z]/.test(pass)).toBe(true);
        expect(/\d/.test(pass)).toBe(true);
        expect(/[!@#$%^&*]/.test(pass)).toBe(true);
        const policy = validatePasswordPolicy(pass);
        expect(policy.valid).toBe(true);
      }
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = validatePasswordPolicy('Abc1!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/at least 8 characters/i);
    });

    it('rejects passwords without digits or without letters', () => {
      expect(validatePasswordPolicy('Abcdefghijk!').valid).toBe(false);
      expect(validatePasswordPolicy('1234567890!').valid).toBe(false);
    });

    it('rejects passwords identical to current password', () => {
      const res = validatePasswordPolicy('MyPass123!', undefined, 'MyPass123!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/different from current/i);
    });

    it('rejects passwords equal to user email or name', () => {
      const user = { email: 'nurse@hospital.com', name: 'Nurse Jane' };
      expect(validatePasswordPolicy('nurse@hospital.com', user).valid).toBe(false);
      expect(validatePasswordPolicy('nurse', user).valid).toBe(false);
      expect(validatePasswordPolicy('Nurse Jane', user).valid).toBe(false);
    });

    it('rejects trivial weak passwords', () => {
      expect(validatePasswordPolicy('password', undefined).valid).toBe(false);
      expect(validatePasswordPolicy('12345678', undefined).valid).toBe(false);
      expect(validatePasswordPolicy('admin123', undefined).valid).toBe(false);
    });

    it('validates changePasswordSchema constraints', () => {
      expect(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'NewPass123!' }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: 'OldPass123!', newPassword: 'short' }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: 'SamePass123!', newPassword: 'SamePass123!' }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: 'OldPass123!', newPassword: 'NewPass123!', confirmPassword: 'Mismatch123!' }).success).toBe(false);
      expect(changePasswordSchema.safeParse({ currentPassword: 'OldPass123!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' }).success).toBe(true);
    });
  });

  describe('Requirement 1, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15, 17: Security Verification', () => {
    interface MockUser {
      id: number;
      name: string;
      email: string;
      password_hash: string;
      role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'STAFF' | 'NURSE';
      status: 'ACTIVE' | 'INACTIVE';
      avatar_url: string | null;
      last_login_at: Date | null;
      must_change_password: boolean;
      created_at: Date;
    }

    interface MockRefreshToken {
      id: number;
      user_id: number;
      token_hash: string;
      expires_at: Date;
      revoked_at: Date | null;
      user_agent: string | null;
    }

    let mockUsers: MockUser[] = [];
    let mockRefreshTokens: MockRefreshToken[] = [];
    let nextUserId = 1;
    let nextSessionId = 1;

    beforeEach(() => {
      mockUsers = [];
      mockRefreshTokens = [];
      nextUserId = 1;
      nextSessionId = 1;

      // Seed newly created user with temporary password
      const tempHash = bcrypt.hashSync('TempPass123!', 10);
      mockUsers.push({
        id: nextUserId++,
        name: 'New Staff User',
        email: 'newstaff@clinic.test',
        password_hash: tempHash,
        role: 'STAFF',
        status: 'ACTIVE',
        avatar_url: null,
        last_login_at: null,
        must_change_password: true,
        created_at: new Date(),
      });

      // Seed existing user (mustChangePassword = false)
      const normalHash = bcrypt.hashSync('NormalPass123!', 10);
      mockUsers.push({
        id: nextUserId++,
        name: 'Existing Doctor',
        email: 'doctor@clinic.test',
        password_hash: normalHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
        avatar_url: null,
        last_login_at: new Date(),
        must_change_password: false,
        created_at: new Date(),
      });

      const mockQuery = vi.fn(async (sql: string | { text: string; values?: unknown[] }, params?: unknown[]) => {
        const queryText = typeof sql === 'string' ? sql : sql.text;
        const queryParams = typeof sql === 'string' ? params ?? [] : sql.values ?? [];

        // authenticate middleware query
        if (queryText.includes('FROM refresh_tokens rt') && queryText.includes('JOIN users u')) {
          const sid = queryParams[0] as number;
          const uid = queryParams[1] as number;
          const role = queryParams[2] as string;

          const session = mockRefreshTokens.find((t) => t.id === sid && t.user_id === uid && !t.revoked_at);
          const user = mockUsers.find((u) => u.id === uid && u.role === role && u.status === 'ACTIVE');

          if (session && user) {
            return {
              rows: [{ active: true, must_change_password: user.must_change_password }],
              rowCount: 1,
            };
          }
          return { rows: [], rowCount: 0 };
        }

        // findByEmail
        if (queryText.includes('FROM users WHERE lower(email) = lower($1)')) {
          const email = (queryParams[0] as string).toLowerCase();
          const user = mockUsers.find((u) => u.email.toLowerCase() === email);
          return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        // findById
        if (queryText.includes('FROM users WHERE id = $1')) {
          const id = queryParams[0] as number;
          const user = mockUsers.find((u) => u.id === id);
          return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        // findSessionUser
        if (queryText.includes('FROM users u') && queryText.includes('WHERE u.id = $1')) {
          const id = queryParams[0] as number;
          const user = mockUsers.find((u) => u.id === id);
          if (!user) return { rows: [], rowCount: 0 };
          return {
            rows: [
              {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar_url: user.avatar_url,
                must_change_password: user.must_change_password,
                doctor_id: null,
                is_verified: null,
                patient_id: null,
              },
            ],
            rowCount: 1,
          };
        }

        // touchLastLogin
        if (queryText.includes('UPDATE users SET last_login_at = now()')) {
          return { rows: [], rowCount: 1 };
        }

        // insert refresh_tokens
        if (queryText.includes('INSERT INTO refresh_tokens')) {
          const userId = queryParams[0] as number;
          const tokenHash = queryParams[1] as string;
          const expiresAt = queryParams[2] as Date;
          const userAgent = queryParams[3] as string | null;
          const id = nextSessionId++;
          mockRefreshTokens.push({
            id,
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
            revoked_at: null,
            user_agent: userAgent,
          });
          return { rows: [{ id }], rowCount: 1 };
        }

        // update users password
        if (queryText.includes('UPDATE users SET password_hash = $1, must_change_password = $2 WHERE id = $3')) {
          const hash = queryParams[0] as string;
          const mustChange = queryParams[1] as boolean;
          const id = queryParams[2] as number;
          const user = mockUsers.find((u) => u.id === id);
          if (user) {
            user.password_hash = hash;
            user.must_change_password = mustChange;
          }
          return { rows: [], rowCount: 1 };
        }

        // revokeAllSessions
        if (queryText.includes('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1')) {
          const uid = queryParams[0] as number;
          mockRefreshTokens.forEach((t) => {
            if (t.user_id === uid) t.revoked_at = new Date();
          });
          return { rows: [], rowCount: 1 };
        }

        // users.create
        if (queryText.includes('INSERT INTO users')) {
          const name = queryParams[0] as string;
          const email = queryParams[1] as string;
          const passwordHash = queryParams[2] as string;
          const role = queryParams[3] as MockUser['role'];
          const mustChange = Boolean(queryParams[4]);
          const user: MockUser = {
            id: nextUserId++,
            name,
            email,
            password_hash: passwordHash,
            role,
            status: 'ACTIVE',
            avatar_url: null,
            last_login_at: null,
            must_change_password: mustChange,
            created_at: new Date(),
          };
          mockUsers.push(user);
          return { rows: [user], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      });

      vi.spyOn(pool, 'query').mockImplementation(mockQuery as any);
      vi.spyOn(pool, 'connect').mockImplementation(async () => {
        return {
          query: mockQuery,
          release: vi.fn(),
        } as any;
      });
    });

    // Helper: invokes authenticate middleware with a mock request
    const runAuthenticate = async (req: Partial<Request>): Promise<{ req: Request; err?: unknown }> => {
      const fullReq = {
        headers: {},
        cookies: {},
        baseUrl: '',
        path: '/',
        method: 'GET',
        ...req,
      } as Request;

      return new Promise((resolve) => {
        authenticate(fullReq, {} as Response, (err) => {
          resolve({ req: fullReq, err });
        });
      });
    };

    it('Test 1: New user logs in using temporary password -> Login succeeds and returns mustChangePassword: true', async () => {
      const result = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      expect(result).toBeDefined();
      expect(result.mustChangePassword).toBe(true);
      expect(result.user.mustChangePassword).toBe(true);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      // Ensure plaintext passwords are never returned
      expect(JSON.stringify(result)).not.toMatch(/password_hash|TempPass123!/);
    });

    it('Test 2 & 3: New user calls GET /api/dashboard, GET /api/appointments, GET /api/profile -> Blocked with 403 PASSWORD_CHANGE_REQUIRED', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      const token = loginRes.accessToken;

      // Call GET /api/dashboard
      const dashboard = await runAuthenticate({
        baseUrl: '/api/v1/dashboard',
        path: '/',
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(dashboard.err).toBeInstanceOf(AppError);
      expect((dashboard.err as AppError).status).toBe(403);
      expect((dashboard.err as AppError).code).toBe('PASSWORD_CHANGE_REQUIRED');

      // Call GET /api/appointments
      const appointments = await runAuthenticate({
        baseUrl: '/api/v1/appointments',
        path: '/',
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(appointments.err).toBeInstanceOf(AppError);
      expect((appointments.err as AppError).status).toBe(403);
      expect((appointments.err as AppError).code).toBe('PASSWORD_CHANGE_REQUIRED');

      // Call GET /api/profile
      const profile = await runAuthenticate({
        baseUrl: '/api/v1/patients',
        path: '/profile',
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(profile.err).toBeInstanceOf(AppError);
      expect((profile.err as AppError).status).toBe(403);
      expect((profile.err as AppError).code).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('Allows password-change, logout, and GET /me while mustChangePassword is true', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      const token = loginRes.accessToken;

      // Allowed: POST /change-password
      const changePass = await runAuthenticate({
        baseUrl: '/api/v1/auth',
        path: '/change-password',
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(changePass.err).toBeUndefined();

      // Allowed: POST /logout
      const logoutReq = await runAuthenticate({
        baseUrl: '/api/v1/auth',
        path: '/logout',
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(logoutReq.err).toBeUndefined();

      // Allowed: GET /me
      const meReq = await runAuthenticate({
        baseUrl: '/api/v1/auth',
        path: '/me',
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(meReq.err).toBeUndefined();

      // Blocked: PATCH /me (normal user cannot modify profile before changing password)
      const patchMe = await runAuthenticate({
        baseUrl: '/api/v1/auth',
        path: '/me',
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(patchMe.err).toBeInstanceOf(AppError);
      expect((patchMe.err as AppError).status).toBe(403);
    });

    it('Test 4: New user calls POST /api/auth/change-password with correct temporary password -> Success', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      const updated = await authService.changePassword(loginRes.user.id, {
        currentPassword: 'TempPass123!',
        newPassword: 'BrandNewSecurePass1!',
      });

      expect(updated).toBeDefined();
      expect(updated.mustChangePassword).toBe(false);
      expect(updated.user.mustChangePassword).toBe(false);

      // Verify DB was updated
      const dbUser = mockUsers.find((u) => u.id === loginRes.user.id);
      expect(dbUser?.must_change_password).toBe(false);
      expect(bcrypt.compareSync('BrandNewSecurePass1!', dbUser!.password_hash)).toBe(true);
    });

    it('Test 5: After password change -> Access to normal endpoints succeeds', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      const changeRes = await authService.changePassword(loginRes.user.id, {
        currentPassword: 'TempPass123!',
        newPassword: 'BrandNewSecurePass1!',
      });

      // Use the newly issued access token
      const freshToken = changeRes.accessToken;

      const dashboard = await runAuthenticate({
        baseUrl: '/api/v1/dashboard',
        path: '/',
        method: 'GET',
        headers: { authorization: `Bearer ${freshToken}` },
      });
      expect(dashboard.err).toBeUndefined();

      const appointments = await runAuthenticate({
        baseUrl: '/api/v1/appointments',
        path: '/',
        method: 'GET',
        headers: { authorization: `Bearer ${freshToken}` },
      });
      expect(appointments.err).toBeUndefined();
    });

    it('Test 6: Try using the old temporary password again -> Authentication fails', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      await authService.changePassword(loginRes.user.id, {
        currentPassword: 'TempPass123!',
        newPassword: 'BrandNewSecurePass1!',
      });

      // Attempt login with old temporary password
      await expect(
        authService.login({
          email: 'newstaff@clinic.test',
          password: 'TempPass123!',
        }),
      ).rejects.toThrow(/incorrect email or password/i);

      // Login with new password succeeds
      const successfulLogin = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'BrandNewSecurePass1!',
      });
      expect(successfulLogin.mustChangePassword).toBe(false);
    });

    it('Test 7: Attempt password change with incorrect current password -> 401 Unauthorized', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      await expect(
        authService.changePassword(loginRes.user.id, {
          currentPassword: 'WrongTempPassword999!',
          newPassword: 'BrandNewSecurePass1!',
        }),
      ).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/current password is incorrect/i),
      });
    });

    it('Test 8: Attempt weak new password or same password -> 400 Bad Request validation error', async () => {
      const loginRes = await authService.login({
        email: 'newstaff@clinic.test',
        password: 'TempPass123!',
      });

      // Short password
      await expect(
        authService.changePassword(loginRes.user.id, {
          currentPassword: 'TempPass123!',
          newPassword: 'short',
        }),
      ).rejects.toMatchObject({ status: 400 });

      // Letters only
      await expect(
        authService.changePassword(loginRes.user.id, {
          currentPassword: 'TempPass123!',
          newPassword: 'lettersnodigits',
        }),
      ).rejects.toMatchObject({ status: 400 });

      // Equal to current temporary password
      await expect(
        authService.changePassword(loginRes.user.id, {
          currentPassword: 'TempPass123!',
          newPassword: 'TempPass123!',
        }),
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/different from current password/i),
      });
    });

    it('Test 9: Try to bypass /change-password through direct API requests -> Backend still blocks normal APIs', async () => {
      const testSessionId = nextSessionId++;
      mockRefreshTokens.push({
        id: testSessionId,
        user_id: 1, // User 1 has must_change_password = true
        token_hash: 'mockhash',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        user_agent: 'bypass-test',
      });

      const token = signAccessToken(1, 'STAFF', testSessionId);

      const endpoints = [
        { baseUrl: '/api/v1/dashboard', path: '/' },
        { baseUrl: '/api/v1/appointments', path: '/' },
        { baseUrl: '/api/v1/patients', path: '/profile' },
        { baseUrl: '/api/v1/shifts', path: '/me' },
      ];

      for (const ep of endpoints) {
        const res = await runAuthenticate({
          baseUrl: ep.baseUrl,
          path: ep.path,
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        });
        expect(res.err).toBeInstanceOf(AppError);
        expect((res.err as AppError).status).toBe(403);
        expect((res.err as AppError).code).toBe('PASSWORD_CHANGE_REQUIRED');
      }
    });

    it('Test 15 (Admin Security Test): Normal user cannot set mustChangePassword = false through profile API', async () => {
      const user = mockUsers.find((u) => u.id === 1)!;
      expect(user.must_change_password).toBe(true);

      // Attempt calling updateMe with malicious body
      await authService.updateMe(1, {
        name: 'Normal User Attempt',
        // @ts-expect-error simulating malicious client
        mustChangePassword: false,
      });

      // Verify the database record must_change_password is still TRUE
      expect(user.must_change_password).toBe(true);
    });

    it('Test 16 & 1: Admin User Creation flow sets mustChangePassword = true for new users', async () => {
      const tempPass = generateTemporaryPassword(14);
      const passwordHash = await bcrypt.hash(tempPass, 10);

      const created = await usersRepo.create(pool, {
        name: 'Nurse Created By Admin',
        email: 'nurse.admin@clinic.test',
        passwordHash,
        role: 'NURSE',
        mustChangePassword: true,
      });

      expect(created.must_change_password).toBe(true);
      const dto = usersRepo.toUserDto(created);
      expect(dto.mustChangePassword).toBe(true);

      // User logging in must be marked as requiring password change
      const login = await authService.login({
        email: 'nurse.admin@clinic.test',
        password: tempPass,
      });
      expect(login.mustChangePassword).toBe(true);
    });

    it('Test 17 (Backward Compatibility): Existing users have mustChangePassword = false and normal access is immediately permitted', async () => {
      const loginRes = await authService.login({
        email: 'doctor@clinic.test',
        password: 'NormalPass123!',
      });
      expect(loginRes.mustChangePassword).toBe(false);
      expect(loginRes.user.mustChangePassword).toBe(false);

      const dashboard = await runAuthenticate({
        baseUrl: '/api/v1/dashboard',
        path: '/',
        method: 'GET',
        headers: { authorization: `Bearer ${loginRes.accessToken}` },
      });
      expect(dashboard.err).toBeUndefined();
    });
  });
});
