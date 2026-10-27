import { Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category, event_type, limit = '50' } = req.query;

    let sql = `
      SELECT th.*, t.title as task_title, t.category as task_category, t.priority as task_priority
      FROM task_history th
      LEFT JOIN tasks t ON th.task_id = t.id
      WHERE th.user_id = $1
    `;
    const params: any[] = [userId];
    let pIdx = 2;

    if (category) {
      sql += ` AND t.category = $${pIdx++}`;
      params.push(category);
    }

    if (event_type) {
      sql += ` AND th.event_type = $${pIdx++}`;
      params.push(event_type);
    }

    sql += ` ORDER BY th.created_at DESC LIMIT $${pIdx}`;
    params.push(parseInt(limit as string, 10));

    const historyRes = await db.query(sql, params);

    // Also fetch completed tasks with duration calibration
    const completedTasksRes = await db.query(
      `SELECT id, title, category, priority, user_estimated_minutes, current_predicted_minutes,
              actual_duration_minutes, completed_at, deadline
       FROM tasks WHERE user_id = $1 AND status = 'Completed'
       ORDER BY completed_at DESC LIMIT 20`,
      [userId]
    );

    res.json({
      events: historyRes.rows.map((r: any) => ({
        ...r,
        event_data: typeof r.event_data === 'string' ? JSON.parse(r.event_data || '{}') : r.event_data
      })),
      completed_tasks: completedTasksRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
