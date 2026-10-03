import pg from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Return DATE as 'YYYY-MM-DD' (not a JS Date, which would shift with the server timezone),
// NUMERIC as number and BIGINT (COUNT) as number.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

const ssl =
  env.DATABASE_SSL === 'disable'
    ? undefined
    : { rejectUnauthorized: env.DATABASE_SSL === 'require' };

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => logger.error({ err }, 'Unexpected error on idle PostgreSQL client'));

/** Anything that can run a query: the pool or a client checked out for a transaction. */
export type Db = Pick<pg.Pool | pg.PoolClient, 'query'>;

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export function isUniqueViolation(err: unknown): err is pg.DatabaseError {
  return err instanceof pg.DatabaseError && err.code === '23505';
}

export async function pingDatabase(): Promise<void> {
  await pool.query('SELECT 1');
}
