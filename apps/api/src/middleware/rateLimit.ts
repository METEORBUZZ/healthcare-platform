import { createHash } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';

const limiter = (
  windowMs: number,
  limit: number,
  message: string,
  skipSuccessfulRequests = false,
) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
    },
  });

export const apiLimiter = limiter(60_000, 300, 'Too many requests. Try again in a minute.');

/** Brute-force protection: only failed attempts count against the login limit. */
export const loginLimiter = limiter(
  15 * 60_000,
  10,
  'Too many sign-in attempts. Try again in 15 minutes.',
  true,
);
export const adminLoginLimiter = limiter(
  15 * 60_000,
  5,
  'Too many administrator sign-in attempts. Try again in 15 minutes.',
  true,
);
export const adminLoginAccountLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return createHash('sha256').update(email).digest('hex');
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many administrator sign-in attempts. Try again in 15 minutes.',
      },
    });
  },
});
export const registerLimiter = limiter(
  60 * 60_000,
  10,
  'Too many sign-ups from this address. Try again later.',
);
