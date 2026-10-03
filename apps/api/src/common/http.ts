import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import type { PageMeta } from '@healthcare/shared';
import { AppError, unauthorized } from './errors';

/** Express 4 does not catch rejected promises; this forwards them to the error handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Parse untrusted input with a zod schema, throwing a 400 with per-field messages. */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    (details[key] ??= []).push(issue.message);
  }
  const first = result.error.issues[0];
  throw new AppError(400, 'VALIDATION_ERROR', first?.message ?? 'Invalid request', details);
}

export function requireAuth(req: Request): NonNullable<Request['auth']> {
  if (!req.auth) throw unauthorized();
  return req.auth;
}

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export const offsetOf = (page: number, pageSize: number) => (page - 1) * pageSize;

/** Escape LIKE wildcards so user input is matched literally. */
export const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** "Rohan Sharma" -> "Rohan S." Used where patient names are shown publicly. */
export function maskName(name: string): string {
  const [first = '', ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]?.toUpperCase()}.` : first;
}

/** Tiny helper for building parameterised WHERE clauses. */
export class QueryBuilder {
  readonly params: unknown[] = [];
  private readonly clauses: string[] = [];

  /** Registers a value and returns its placeholder, e.g. `$3`. */
  add(value: unknown): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  where(clause: string) {
    this.clauses.push(clause);
  }

  get whereSql(): string {
    return this.clauses.length ? `WHERE ${this.clauses.join(' AND ')}` : '';
  }
}
