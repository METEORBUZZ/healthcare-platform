// Runs before any test file imports application code (env.ts validates at import time).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/healthcare_test';
process.env.JWT_ACCESS_SECRET ??= 'test-only-secret-that-is-at-least-32-chars-long';
process.env.CLINIC_TIMEZONE = 'Asia/Kolkata';
process.env.BOOKING_MIN_LEAD_MINUTES = '0';
