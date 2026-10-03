import type { NotificationDto } from '@healthcare/shared';
import { offsetOf } from '../../common/http';
import type { Db } from '../../db/pool';

interface Row {
  id: number;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'SYSTEM';
  is_read: boolean;
  created_at: Date;
}

const toDto = (r: Row): NotificationDto => ({
  id: r.id,
  title: r.title,
  message: r.message,
  type: r.type,
  isRead: r.is_read,
  createdAt: r.created_at.toISOString(),
});

export async function notify(
  db: Db,
  n: { userId: number; title: string; message: string; type?: 'APPOINTMENT' | 'SYSTEM' },
): Promise<void> {
  await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', [
    n.userId,
    n.title,
    n.message,
    n.type ?? 'SYSTEM',
  ]);
}

export async function notifyAdmins(db: Db, title: string, message: string): Promise<void> {
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type)
     SELECT id, $1, $2, 'SYSTEM' FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`,
    [title, message],
  );
}

export async function list(
  db: Db,
  userId: number,
  o: { unreadOnly: boolean; page: number; pageSize: number },
): Promise<{ rows: NotificationDto[]; total: number; unread: number }> {
  const filter = o.unreadOnly ? 'AND is_read = false' : '';
  const [data, counts] = await Promise.all([
    db.query<Row>(
      `SELECT id, title, message, type, is_read, created_at FROM notifications
        WHERE user_id = $1 ${filter} ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
      [userId, o.pageSize, offsetOf(o.page, o.pageSize)],
    ),
    db.query<{ total: number; unread: number }>(
      `SELECT COUNT(*) FILTER (WHERE true ${filter}) AS total, COUNT(*) FILTER (WHERE is_read = false) AS unread
         FROM notifications WHERE user_id = $1`,
      [userId],
    ),
  ]);
  return { rows: data.rows.map(toDto), total: counts.rows[0]?.total ?? 0, unread: counts.rows[0]?.unread ?? 0 };
}

export async function unreadCount(db: Db, userId: number): Promise<number> {
  const { rows } = await db.query<{ count: number }>(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId],
  );
  return rows[0]?.count ?? 0;
}

export async function markRead(db: Db, id: number, userId: number): Promise<boolean> {
  const r = await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
  return (r.rowCount ?? 0) > 0;
}

export async function markAllRead(db: Db, userId: number): Promise<void> {
  await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [userId]);
}
