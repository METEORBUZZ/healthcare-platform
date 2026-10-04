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

const hasHighEntropy = (value: string): boolean => {
  const counts = new Map<string, number>();
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1);
  const entropy = [...counts.values()].reduce((sum, count) => {
    const probability = count / value.length;
    return sum - probability * Math.log2(probability);
  }, 0);
  return counts.size >= 16 && entropy >= 4.5;
};

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    /** disable | require (verify certificate) | no-verify (TLS without certificate verification) */
    DATABASE_SSL: z.enum(['disable', 'require', 'no-verify']).default('disable'),

    PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    ADMIN_APP_URL: z.string().url().default('http://localhost:3001'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),

    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((v) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    COOKIE_SECURE: bool(false),
    /** Number of reverse proxies in front of the API (nginx = 1). Needed for correct client IPs. */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    CLINIC_TIMEZONE: z.string().default('Asia/Kolkata'),
    BOOKING_WINDOW_DAYS: z.coerce.number().int().min(1).max(365).default(60),
    BOOKING_MIN_LEAD_MINUTES: z.coerce.number().int().min(0).max(1440).default(60),

    SEED_PASSWORD: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().optional(),
    ),
  })
  .superRefine((config, ctx) => {
    if (config.NODE_ENV === 'production') {
      for (const key of ['PUBLIC_APP_URL', 'ADMIN_APP_URL'] as const) {
        if (new URL(config[key]).protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} must use HTTPS in production`,
          });
        }
      }
      if (new URL(config.PUBLIC_APP_URL).origin === new URL(config.ADMIN_APP_URL).origin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_APP_URL'],
          message: 'ADMIN_APP_URL must use a separate origin from PUBLIC_APP_URL',
        });
      }
      if (
        config.JWT_ACCESS_SECRET.length < 64 ||
        !hasHighEntropy(config.JWT_ACCESS_SECRET) ||
        /change[_-]?me|example|secret/i.test(config.JWT_ACCESS_SECRET)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message:
            'Production JWT_ACCESS_SECRET must be a unique high-entropy 64+ character value generated with a cryptographic random generator',
        });
      }
      if (!config.COOKIE_SECURE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['COOKIE_SECURE'],
          message: 'COOKIE_SECURE must be true in production; serve the application over HTTPS',
        });
      }
      if (config.SEED_PASSWORD !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SEED_PASSWORD'],
          message: 'SEED_PASSWORD is for local demo seeding and must not be set in production',
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues)
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: [
    ...new Set([
      ...parsed.data.CORS_ORIGINS,
      new URL(parsed.data.PUBLIC_APP_URL).origin,
      new URL(parsed.data.ADMIN_APP_URL).origin,
    ]),
  ],
};
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
