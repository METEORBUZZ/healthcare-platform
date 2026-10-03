import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';

const limiter = (windowMs: number, limit: number, message: string, skipSuccessfulRequests = false) =>
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
export const loginLimiter = limiter(15 * 60_000, 10, 'Too many sign-in attempts. Try again in 15 minutes.', true);
export const registerLimiter = limiter(60 * 60_000, 10, 'Too many sign-ups from this address. Try again later.');
