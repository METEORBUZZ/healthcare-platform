import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { emailSchema } from '@healthcare/shared';
import { pool, withTransaction } from './pool';
import * as users from '../modules/users/users.repo';

const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema.refine((email) => !email.endsWith('@demo.test'), 'Use a real administrator email address'),
  password: z
    .string()
    .min(14, 'Use a unique password with at least 14 characters')
    .max(72)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes')
    .refine((password) => /[A-Za-z]/.test(password) && /\d/.test(password), 'Password must include a letter and a number'),
});

async function main() {
  const input = inputSchema.safeParse({
    name: process.env.ADMIN_BOOTSTRAP_NAME,
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  if (!input.success) {
    throw new Error(input.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  }

  const passwordHash = await bcrypt.hash(input.data.password, 12);
  await withTransaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(782349102)');
    const { rows } = await tx.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') AS exists`,
    );
    if (rows[0]?.exists) {
      throw new Error('An administrator already exists; bootstrap can only create the first administrator.');
    }
    await users.create(tx, {
      name: input.data.name,
      email: input.data.email,
      passwordHash,
      role: 'ADMIN',
    });
  });
  console.info('Initial administrator created. Remove the bootstrap credentials from the environment.');
}

try {
  await main();
} catch (err: unknown) {
  console.error('Initial administrator bootstrap failed:', err instanceof Error ? err.message : 'Unknown error');
  process.exitCode = 1;
} finally {
  await pool.end();
}
