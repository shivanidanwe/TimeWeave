import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const createFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { task_id, duration_minutes, session_status } = req.body;

    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO task_time_sessions (id, task_id, user_id, started_at, duration_minutes, session_status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)`,
      [sessionId, task_id || null, userId, parseInt(duration_minutes || '25', 10), session_status || 'completed']
    );

    // If task_id provided, add to task's actual_duration_minutes
    if (task_id) {
      await db.query(
        `UPDATE tasks SET actual_duration_minutes = actual_duration_minutes + $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3`,
        [parseInt(duration_minutes || '25', 10), task_id, userId]
      );
    }

    res.status(201).json({
      message: 'Focus session recorded',
      session_id: sessionId,
      duration_minutes: parseInt(duration_minutes || '25', 10)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFocusSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { duration_minutes, session_status } = req.body;

    await db.query(
      `UPDATE task_time_sessions SET
        ended_at = CURRENT_TIMESTAMP,
        duration_minutes = COALESCE($1, duration_minutes),
        session_status = COALESCE($2, session_status)
       WHERE id = $3 AND user_id = $4`,
      [duration_minutes, session_status, id, userId]
    );

    const updated = await db.query('SELECT * FROM task_time_sessions WHERE id = $1', [id]);
    res.json({ message: 'Session updated', session: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getFocusSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = '20' } = req.query;

    const sessionsRes = await db.query(
      `SELECT s.*, t.title as task_title, t.category as task_category
       FROM task_time_sessions s
       LEFT JOIN tasks t ON s.task_id = t.id
       WHERE s.user_id = $1
       ORDER BY s.started_at DESC LIMIT $2`,
      [userId, parseInt(limit as string, 10)]
    );

    const countRes = await db.query(
      'SELECT COUNT(*) as total_count, COALESCE(SUM(duration_minutes), 0) as total_minutes FROM task_time_sessions WHERE user_id = $1',
      [userId]
    );

    res.json({
      sessions: sessionsRes.rows,
      total_count: parseInt(countRes.rows[0]?.total_count || '0', 10),
      total_minutes: parseInt(countRes.rows[0]?.total_minutes || '0', 10)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
