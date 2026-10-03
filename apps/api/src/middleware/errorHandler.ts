import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../common/errors';
import { isUniqueViolation } from '../db/pool';
import { logger } from '../config/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};

// Express identifies error middleware by its 4-argument signature, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  // body-parser errors (malformed JSON, payload too large)
  const status = (err as { status?: number }).status;
  const type = (err as { type?: string }).type;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    return;
  }

  // Safety net for races that slip past service-level checks.
  if (isUniqueViolation(err)) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'This record already exists' } });
    return;
  }

  logger.error({ err, reqId: req.id, path: req.path }, 'Unhandled error');
  res.status(typeof status === 'number' && status >= 400 && status < 500 ? status : 500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Try again shortly.' },
  });
};
