import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { filter } = req.query; // all, unread, system, mentions

    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];

    if (filter === 'unread') {
      sql += ' AND is_read = 0';
    } else if (filter === 'system') {
      sql += " AND type = 'system'";
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const resDb = await db.query(sql, params);
    const unreadCountRes = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      [userId]
    );

    res.json({
      notifications: resDb.rows,
      unread_count: parseInt(unreadCountRes.rows[0]?.count || '0', 10)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (id === 'all') {
      await db.query(
        'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    } else {
      await db.query(
        'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    }

    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const clearNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    res.json({ message: 'Notifications cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
