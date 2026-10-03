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
    await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@t.test', $1, 'ADMIN')", [
      await bcrypt.hash(PASSWORD, 4),
    ]);
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
  const register = async (name: string, email: string, role: 'PATIENT' | 'DOCTOR' = 'PATIENT') => {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/register').send({ name, email, password: PASSWORD, role, specialization: 'Cardiologist' });
    expect(res.status).toBe(201);
    return agent;
  };

  it('rejects unauthenticated access', async () => {
    await request(app).get('/api/v1/appointments').expect(401);
  });

  it('validates registration input and blocks duplicate emails', async () => {
    await request(app).post('/api/v1/auth/register').send({ name: 'X', email: 'nope', password: '1' }).expect(400);
    await register('Pat One', 'p1@t.test');
    await request(app).post('/api/v1/auth/register').send({ name: 'Pat One', email: 'P1@t.test', password: PASSWORD }).expect(409);
  });

  it('does not list doctors until an admin verifies them', async () => {
    const doc = await register('Dr Test', 'd1@t.test', 'DOCTOR');
    const mine = await doc.get('/api/v1/doctors/me').expect(200);
    doctorId = mine.body.data.id;

    let list = await request(app).get('/api/v1/doctors').expect(200);
    expect(list.body.data).toHaveLength(0);

    const admin = await signIn('admin@t.test');
    await admin.patch(`/api/v1/admin/doctors/${doctorId}/verification`).send({ isVerified: true }).expect(200);

    list = await request(app).get('/api/v1/doctors').expect(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('lets a doctor open every weekday so tests are date-independent', async () => {
    const doc = await signIn('d1@t.test');
    const week = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, isAvailable: true, startTime: '09:00', endTime: '12:00', slotMinutes: 30 }));
    await doc.put('/api/v1/doctors/me/availability').send(week).expect(200);
    const slots = await request(app).get(`/api/v1/doctors/${doctorId}/slots?date=${date}`).expect(200);
    expect(slots.body.data.slots).toHaveLength(6);
  });

  it('prevents double booking and frees the slot after cancellation', async () => {
    const p1 = await signIn('p1@t.test');
    const p2 = await register('Pat Two', 'p2@t.test');
    const body = { doctorId, date, time: '09:00', reason: 'Routine checkup' };

    const first = await p1.post('/api/v1/appointments').send(body).expect(201);
    await p2.post('/api/v1/appointments').send(body).expect(409);

    await p1.patch(`/api/v1/appointments/${first.body.data.id}/status`).send({ status: 'CANCELLED' }).expect(200);
    await p2.post('/api/v1/appointments').send(body).expect(201);
  });

  it('rejects times outside the schedule and past dates', async () => {
    const p1 = await signIn('p1@t.test');
    await p1.post('/api/v1/appointments').send({ doctorId, date, time: '13:00', reason: 'Routine checkup' }).expect(400);
    await p1.post('/api/v1/appointments').send({ doctorId, date: '2020-01-01', time: '09:00', reason: 'Routine checkup' }).expect(400);
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

    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'CONFIRMED' }).expect(200);
    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'PENDING' }).expect(409);
    // Cannot complete a visit that hasn't happened yet.
    await doc.patch(`/api/v1/appointments/${id}/status`).send({ status: 'COMPLETED' }).expect(409);
  });

  it('rotates refresh tokens and logs out', async () => {
    const agent = await signIn('p1@t.test');
    await agent.post('/api/v1/auth/refresh').expect(200);
    await agent.get('/api/v1/auth/me').expect(200);
    await agent.post('/api/v1/auth/logout').expect(204);
    await agent.post('/api/v1/auth/refresh').expect(401);
  });

  it('blocks deactivated users from signing in', async () => {
    const admin = await signIn('admin@t.test');
    const users = await admin.get('/api/v1/admin/users?q=p2@t.test').expect(200);
    const id = users.body.data[0].id;
    await admin.patch(`/api/v1/admin/users/${id}/status`).send({ status: 'INACTIVE' }).expect(200);
    await request(app).post('/api/v1/auth/login').send({ email: 'p2@t.test', password: PASSWORD }).expect(403);
  });
});
