import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Root .env first (monorepo), then a local one. Existing process env always wins.
for (const p of ['../../.env', '.env']) dotenv.config({ path: path.resolve(process.cwd(), p) });

const bool = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** disable | require (verify certificate) | no-verify (TLS without certificate verification) */
  DATABASE_SSL: z.enum(['disable', 'require', 'no-verify']).default('disable'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  COOKIE_SECURE: bool(false),
  /** Number of reverse proxies in front of the API (nginx = 1). Needed for correct client IPs. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  CLINIC_TIMEZONE: z.string().default('Asia/Kolkata'),
  BOOKING_WINDOW_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  BOOKING_MIN_LEAD_MINUTES: z.coerce.number().int().min(0).max(1440).default(60),

  SEED_PASSWORD: z.string().default('Demo@12345'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (isProd) {
  if (/change[_-]?me|example|secret/i.test(env.JWT_ACCESS_SECRET)) {
    console.error('JWT_ACCESS_SECRET looks like a placeholder. Generate one with: openssl rand -base64 48');
    process.exit(1);
  }
  if (!env.COOKIE_SECURE) {
    console.warn('COOKIE_SECURE=false in production: auth cookies will be sent over plain HTTP.');
  }
}
