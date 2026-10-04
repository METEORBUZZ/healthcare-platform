/**
 * End-to-end API tests against a real PostgreSQL database.
 * Skipped unless TEST_DATABASE_URL is set (CI provides one). WARNING: the target database is wiped.
 */
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Express } from 'express';
import type { Pool } from 'pg';

const enabled = Boolean(process.env.TEST_DATABASE_URL);

const cookieValue = (header: string | string[] | undefined, name: string) =>
  (Array.isArray(header) ? header : (header?.split(/,(?=[^;,]+=)/) ?? []))
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(';', 1)[0]
    ?.slice(name.length + 1);

describe.skipIf(!enabled)('API', () => {
  let app: Express;
  let pool: Pool;

  const PASSWORD = 'Passw0rd!x';
  let doctorId = 0;
  let date = '';

  beforeAll(async () => {
    const [{ createApp }, poolMod, { migrate }, time] = await Promise.all([
      import('../src/app'),
      import('../src/db/pool'),
      import('../src/db/migrate'),
      import('../src/common/time'),
    ]);
    pool = poolMod.pool;
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await migrate();
    app = createApp();

    // Admin accounts can't self-register, so create one directly.
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@t.test', $1, 'ADMIN')",
      [await bcrypt.hash(PASSWORD, 4)],
    );
    date = time.addDays(time.todayIn('Asia/Kolkata'), 3);
  });

  afterAll(async () => {
    await pool?.end();
  });

  const signIn = async (email: string) => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email, password: PASSWORD }).expect(200);
    return agent;
  };
  const signInAdmin = async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@t.test', password: PASSWORD })
      .expect(200);
    return agent;
  };
  const register = async (name: string, email: string, role: 'PATIENT' | 'DOCTOR' = 'PATIENT') => {
    const agent = request.agent(app);
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ name, email, password: PASSWORD, role, specialization: 'Cardiologist' });
    expect(res.status).toBe(201);
    return agent;
  };

  it('rejects unauthenticated access', async () => {
    await request(app).get('/api/v1/appointments').expect(401);
  });

  it('allows configured browser origins and does not grant untrusted origins CORS access', async () => {
    const trusted = await request(app)
      .get('/api/v1/meta')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(trusted.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const trustedAdmin = await request(app)
      .get('/api/v1/meta')
      .set('Origin', 'http://localhost:3001')
      .expect(200);
    expect(trustedAdmin.headers['access-control-allow-origin']).toBe('http://localhost:3001');

    const untrusted = await request(app)
      .get('/api/v1/meta')
      .set('Origin', 'https://untrusted.example')
      .expect(200);
    expect(untrusted.headers['access-control-allow-origin']).toBeUndefined();

    const preflight = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(200);
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('validates registration input and blocks duplicate emails', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'X', email: 'nope', password: '1' })
      .expect(400);
    await register('Pat One', 'p1@t.test');
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Pat One', email: 'P1@t.test', password: PASSWORD })
      .expect(409);
  });

  it('does not list doctors until an admin verifies them', async () => {
    const doc = await register('Dr Test', 'd1@t.test', 'DOCTOR');
    const mine = await doc.get('/api/v1/doctors/me').expect(200);
    doctorId = mine.body.data.id;
    await doc.get('/api/v1/patients/tracking/all').expect(403);
    await doc.get('/api/v1/admin/users').expect(403);

    let list = await request(app).get('/api/v1/doctors').expect(200);
    expect(list.body.data).toHaveLength(0);

    const admin = await signInAdmin();
    await admin
      .patch(`/api/v1/admin/doctors/${doctorId}/verification`)
      .send({ isVerified: true })
      .expect(200);

    list = await request(app).get('/api/v1/doctors').expect(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('shares admin shift assignments with the matching signed-in doctor and staff account', async () => {
    const admin = await signInAdmin();
    const assignment = {
      shiftName: 'Night Shift',
      shiftHours: '08:00 PM - 08:00 AM',
      breakTime: '01:00 AM - 01:30 AM',
      workingDays: 'Mon - Fri',
      workingLocation: 'ICU',
      roomArea: 'ICU Station 2',
    };
    await admin
      .post('/api/v1/admin/staff-users')
      .send({
        name: 'Nurse Test',
        email: 'nurse@t.test',
        password: PASSWORD,
        role: 'NURSE',
        shiftAssignment: assignment,
      })
      .expect(201);
    const doctor = await signIn('d1@t.test');
    const nurse = await signIn('nurse@t.test');

    await admin
      .post('/api/v1/admin/staff-users')
      .send({
        name: 'Duplicate Nurse',
        email: 'nurse@t.test',
        password: PASSWORD,
        role: 'NURSE',
        shiftAssignment: assignment,
      })
      .expect(409);
    const ownShift = await nurse.get('/api/v1/shifts/me').expect(200);
    expect(ownShift.body.data).toMatchObject({
      ...assignment,
      targetEmail: 'nurse@t.test',
    });
    expect(ownShift.body.data.updatedAt).toBeTruthy();
    await doctor.get('/api/v1/shifts/me').expect(200, { data: null });
    await (await signIn('p1@t.test')).get('/api/v1/shifts/me').expect(403);

    await admin
      .put('/api/v1/admin/shift-assignments')
      .send({ targetEmail: 'NURSE@T.TEST', ...assignment, shiftName: 'Evening Shift' })
      .expect(200);
    expect((await nurse.get('/api/v1/shifts/me').expect(200)).body.data.shiftName).toBe(
      'Evening Shift',
    );
    await nurse.put('/api/v1/admin/shift-assignments').send(assignment).expect(403);
    await admin
      .put('/api/v1/admin/shift-assignments')
      .send({ targetEmail: 'nurse@t.test', ...assignment, shiftHours: 'x' })
      .expect(400);

    const audit = await pool.query<{ previous_assignment: unknown }>(
      `SELECT previous_assignment
         FROM staff_shift_assignment_audit
        WHERE target_email = 'nurse@t.test'
        ORDER BY id`,
    );
    expect(audit.rows).toHaveLength(2);
    expect(audit.rows[0]?.previous_assignment).toBeNull();
    expect(audit.rows[1]?.previous_assignment).toMatchObject({ shiftName: 'Night Shift' });
  });

  it('lets a doctor open every weekday so tests are date-independent', async () => {
    const doc = await signIn('d1@t.test');
    const week = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      isAvailable: true,
      startTime: '09:00',
      endTime: '12:00',
      slotMinutes: 30,
    }));
    await doc.put('/api/v1/doctors/me/availability').send(week).expect(200);
    const slots = await request(app)
      .get(`/api/v1/doctors/${doctorId}/slots?date=${date}`)
      .expect(200);
    expect(slots.body.data.slots).toHaveLength(6);
  });

  it('prevents double booking and frees the slot after cancellation', async () => {
    const p1 = await signIn('p1@t.test');
    const p2 = await register('Pat Two', 'p2@t.test');
    const body = { doctorId, date, time: '09:00', reason: 'Routine checkup' };

    const first = await p1.post('/api/v1/appointments').send(body).expect(201);
    await p2.post('/api/v1/appointments').send(body).expect(409);

    await p1
      .patch(`/api/v1/appointments/${first.body.data.id}/status`)
      .send({ status: 'CANCELLED' })
      .expect(200);
    const second = await p2.post('/api/v1/appointments').send(body).expect(201);
    const audit = await pool.query<{ action: string; patient_id: number }>(
      `SELECT action, patient_id
         FROM clinical_access_audit
        WHERE actor_user_id = (SELECT id FROM users WHERE email = 'p2@t.test')
          AND action = 'APPOINTMENT_CREATE'`,
    );
    expect(audit.rows).toEqual([
      { action: 'APPOINTMENT_CREATE', patient_id: second.body.data.patient.id },
    ]);
  });

  it('rejects times outside the schedule and past dates', async () => {
    const p1 = await signIn('p1@t.test');
    await p1
      .post('/api/v1/appointments')
      .send({ doctorId, date, time: '13:00', reason: 'Routine checkup' })
      .expect(400);
    await p1
      .post('/api/v1/appointments')
      .send({ doctorId, date: '2020-01-01', time: '09:00', reason: 'Routine checkup' })
      .expect(400);
  });

  it("hides other patients' appointments and enforces role rules", async () => {
    const p1 = await signIn('p1@t.test');
    const p2 = await signIn('p2@t.test');
    const doc = await signIn('d1@t.test');

    const mine = await p2.get('/api/v1/appointments').expect(200);
    const id = mine.body.data[0].id;

    await p1.get(`/api/v1/appointments/${id}`).expect(404);
    await p2.patch(`/api/v1/appointments/${id}/status`).send({ status: 'CONFIRMED' }).expect(403);
    await p1.get('/api/v1/admin/users').expect(403);
    await doc.get('/api/v1/admin/users').expect(403);
    await doc.get('/api/v1/admin/audit-logs').expect(403);
    await doc.get('/api/v1/admin/audit-logs').expect(403);

    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'CONFIRMED' }).expect(200);
    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'PENDING' }).expect(409);
    // Cannot complete a visit that hasn't happened yet.
    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'COMPLETED' }).expect(409);

    const [ownProfile, otherProfile] = await Promise.all([
      p2.get('/api/v1/patients/me').expect(200),
      p1.get('/api/v1/patients/me').expect(200),
    ]);
    const assignedPatientId = ownProfile.body.data.id;
    const otherPatientId = otherProfile.body.data.id;
    await p2.get(`/api/v1/appointments/${id}`).expect(200);
    const tracking = await doc.get('/api/v1/patients/tracking/all').expect(200);
    expect(
      tracking.body.data.map((patient: { patient: { id: number } }) => patient.patient.id),
    ).toEqual([assignedPatientId]);
    await doc.get(`/api/v1/patients/${assignedPatientId}/tracking`).expect(200);
    await doc.get(`/api/v1/patients/${otherPatientId}/tracking`).expect(403);
    await doc
      .post(`/api/v1/patients/${assignedPatientId}/vitals`)
      .send({ bloodPressure: '120/80', heartRate: 75 })
      .expect(201);
    await doc
      .post(`/api/v1/patients/${otherPatientId}/vitals`)
      .send({ bloodPressure: '120/80', heartRate: 75 })
      .expect(403);

    const audit = await pool.query<{
      action: string;
      outcome: string;
      patient_id: number | null;
    }>(
      `SELECT action, outcome, patient_id
         FROM clinical_access_audit
        WHERE actor_user_id = (SELECT id FROM users WHERE email = 'd1@t.test')`,
    );
    expect(audit.rows).toEqual(
      expect.arrayContaining([
        { action: 'TRACKING_LIST_READ', outcome: 'ALLOWED', patient_id: assignedPatientId },
        { action: 'PATIENT_TRACKING_READ', outcome: 'ALLOWED', patient_id: assignedPatientId },
        { action: 'PATIENT_TRACKING_READ', outcome: 'DENIED', patient_id: otherPatientId },
        { action: 'PATIENT_VITALS_CREATE', outcome: 'ALLOWED', patient_id: assignedPatientId },
        { action: 'PATIENT_VITALS_CREATE', outcome: 'DENIED', patient_id: otherPatientId },
        { action: 'APPOINTMENT_STATUS_UPDATE', outcome: 'ALLOWED', patient_id: assignedPatientId },
      ]),
    );

    const patientAudit = await pool.query<{ action: string; patient_id: number | null }>(
      `SELECT action, patient_id
         FROM clinical_access_audit
        WHERE actor_user_id = (SELECT id FROM users WHERE email = 'p2@t.test')`,
    );
    expect(patientAudit.rows).toEqual(
      expect.arrayContaining([
        { action: 'APPOINTMENT_LIST_READ', patient_id: assignedPatientId },
        { action: 'APPOINTMENT_READ', patient_id: assignedPatientId },
      ]),
    );
  });

  it('revokes access tokens when sessions are rotated or logged out', async () => {
    const agent = request.agent(app);
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'p1@t.test', password: PASSWORD })
      .expect(200);
    const loginAccessToken = cookieValue(login.headers['set-cookie'], 'access_token');
    expect(loginAccessToken).toBeTruthy();
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/access_token=.*HttpOnly.*SameSite=Lax/i)]),
    );
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/refresh_token=.*HttpOnly.*SameSite=Lax/i)]),
    );

    const refresh = await agent.post('/api/v1/auth/refresh').expect(200);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginAccessToken}`)
      .expect(401);
    await agent.get('/api/v1/auth/me').expect(200);

    const rotatedAccessToken = cookieValue(refresh.headers['set-cookie'], 'access_token');
    expect(rotatedAccessToken).toBeTruthy();
    await agent.post('/api/v1/auth/logout').expect(204);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${rotatedAccessToken}`)
      .expect(401);
    await agent.post('/api/v1/auth/refresh').expect(401);
  });

  it('restricts admin sign-in, records auth events, and revokes the admin session at logout', async () => {
    const admin = request.agent(app);
    const login = await admin
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@t.test', password: PASSWORD })
      .expect(200);
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/admin_access_token=.*HttpOnly.*SameSite=Lax/i),
      ]),
    );
    expect(login.headers['set-cookie']).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=/i),
        expect.stringMatching(/^refresh_token=/i),
      ]),
    );
    await admin.get('/api/v1/admin/auth/me').expect(200);
    await admin.get('/api/v1/auth/me').expect(401);
    await admin.get('/api/v1/admin/users').expect(200);

    const publicAdmin = request.agent(app);
    await publicAdmin
      .post('/api/v1/auth/login')
      .send({ email: 'admin@t.test', password: PASSWORD })
      .expect(200);
    await publicAdmin.get('/api/v1/admin/users').expect(401);

    await admin.get('/api/v1/admin/audit-logs?page=0').expect(400);
    const audits = await admin.get('/api/v1/admin/audit-logs?pageSize=100').expect(200);
    expect(audits.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'ADMIN_LOGIN_SUCCESS',
          outcome: 'SUCCESS',
        }),
        expect.objectContaining({
          action: 'ADMIN_API_GET',
          outcome: 'DENIED',
        }),
      ]),
    );

    await admin.post('/api/v1/admin/auth/logout').expect(204);
    await admin.get('/api/v1/admin/users').expect(401);

    await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'p1@t.test', password: PASSWORD })
      .expect(401)
      .expect(({ body }) => {
        expect(body.error.message).toBe('Invalid email or password');
      });
    const invalidLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'missing@t.test', password: PASSWORD })
      .expect(401);
    expect(invalidLogin.body.error.message).toBe('Invalid email or password');

    const auditor = request.agent(app);
    await auditor
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@t.test', password: PASSWORD })
      .expect(200);
    const failedLogins = await auditor
      .get('/api/v1/admin/audit-logs?action=ADMIN_LOGIN_FAILURE')
      .expect(200);
    expect(failedLogins.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'ADMIN_LOGIN_FAILURE', outcome: 'DENIED' }),
      ]),
    );
    expect(JSON.stringify(failedLogins.body)).not.toMatch(/password|token|missing@t\.test/i);
  });

  it('returns safe admin analytics/settings and baseline security headers', async () => {
    const admin = await signInAdmin();
    const analytics = await admin.get('/api/v1/admin/analytics').expect(200);
    expect(analytics.body.data).toEqual(
      expect.objectContaining({
        totalUsers: expect.anything(),
        totalAppointments: expect.anything(),
      }),
    );
    const settings = await admin.get('/api/v1/admin/settings').expect(200);
    expect(settings.body.data).toMatchObject({
      publicAppUrl: expect.any(String),
      adminAppUrl: expect.any(String),
      clinicTimezone: expect.any(String),
    });
    expect(JSON.stringify(settings.body)).not.toMatch(/secret|password|token/i);
    const response = await request(app).get('/api/v1/meta').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['permissions-policy']).toBe('camera=(), geolocation=(), microphone=()');
  });

  it('blocks deactivated users from signing in', async () => {
    const patient = request.agent(app);
    const login = await patient
      .post('/api/v1/auth/login')
      .send({ email: 'p2@t.test', password: PASSWORD })
      .expect(200);
    const accessToken = cookieValue(login.headers['set-cookie'], 'access_token');
    expect(accessToken).toBeTruthy();

    const admin = await signInAdmin();
    const users = await admin.get('/api/v1/admin/users?q=p2@t.test').expect(200);
    const id = users.body.data[0].id;
    await admin.patch(`/api/v1/admin/users/${id}/status`).send({ status: 'INACTIVE' }).expect(200);
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'p2@t.test', password: PASSWORD })
      .expect(403);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('restricts admin sign-in, records auth events, and revokes the admin session at logout', async () => {
    const admin = request.agent(app);
    const login = await admin
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@t.test', password: PASSWORD })
      .expect(200);
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/admin_access_token=.*HttpOnly.*SameSite=Lax/i),
      ]),
    );
    expect(login.headers['set-cookie']).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=/i),
        expect.stringMatching(/^refresh_token=/i),
      ]),
    );
    await admin.get('/api/v1/admin/auth/me').expect(200);
    await admin.get('/api/v1/auth/me').expect(401);
    await admin.get('/api/v1/admin/users').expect(200);
    await admin.get('/api/v1/admin/audit-logs?page=0').expect(400);
    const audits = await admin.get('/api/v1/admin/audit-logs?pageSize=100').expect(200);
    expect(audits.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'ADMIN_LOGIN_SUCCESS',
          outcome: 'SUCCESS',
        }),
      ]),
    );

    await admin.post('/api/v1/admin/auth/logout').expect(204);
    await admin.get('/api/v1/admin/users').expect(401);

    await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'p1@t.test', password: PASSWORD })
      .expect(401)
      .expect(({ body }) => {
        expect(body.error.message).toBe('Invalid email or password');
      });
    const invalidLogin = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'missing@t.test', password: PASSWORD })
      .expect(401);
    expect(invalidLogin.body.error.message).toBe('Invalid email or password');
  });

  it('returns safe admin analytics/settings and baseline security headers', async () => {
    const admin = await signInAdmin();
    const analytics = await admin.get('/api/v1/admin/analytics').expect(200);
    expect(analytics.body.data).toEqual(
      expect.objectContaining({
        totalUsers: expect.anything(),
        totalAppointments: expect.anything(),
      }),
    );
    const settings = await admin.get('/api/v1/admin/settings').expect(200);
    expect(settings.body.data).toMatchObject({
      publicAppUrl: expect.any(String),
      adminAppUrl: expect.any(String),
      clinicTimezone: expect.any(String),
    });
    expect(JSON.stringify(settings.body)).not.toMatch(/secret|password|token/i);
    const response = await request(app).get('/api/v1/meta').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('rejects a session immediately after the account role changes', async () => {
    const patient = request.agent(app);
    const login = await patient
      .post('/api/v1/auth/login')
      .send({ email: 'p1@t.test', password: PASSWORD })
      .expect(200);
    const accessToken = cookieValue(login.headers['set-cookie'], 'access_token');
    expect(accessToken).toBeTruthy();

    await pool.query(`UPDATE users SET role = 'DOCTOR' WHERE email = 'p1@t.test'`);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
