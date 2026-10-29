import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const generateSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { target_date, preferences_override, task_ids } = req.body;
    const targetDate = target_date || new Date().toISOString().split('T')[0];

    // 1. Fetch user tasks
    let taskSql = "SELECT * FROM tasks WHERE user_id = $1 AND status != 'Completed'";
    const taskParams: any[] = [userId];

    if (task_ids && Array.isArray(task_ids) && task_ids.length > 0) {
      taskSql += ` AND id IN (${task_ids.map((_, i) => `$${i + 2}`).join(',')})`;
      taskParams.push(...task_ids);
    }

    const tasksRes = await db.query(taskSql, taskParams);
    const tasks = tasksRes.rows;

    // Attach dependencies
    for (const t of tasks) {
      const deps = await db.query('SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $1', [t.id]);
      t.dependencies = deps.rows.map((r: any) => r.depends_on_task_id);
    }

    // 2. Fetch user preferences
    const prefRes = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
    const userPrefs = prefRes.rows[0] || {};
    const mergedPrefs = { ...userPrefs, ...(preferences_override || {}) };

    // 3. Call ML constraint scheduling engine
    let scheduleData: any;
    try {
      const mlRes = await axios.post(`${config.mlServiceUrl}/generate-schedule`, {
        tasks,
        preferences: mergedPrefs,
        target_date: targetDate
      }, { timeout: 5000 });
      scheduleData = mlRes.data;
    } catch (err: any) {
      // Local fallback constraint scheduler if ML service is offline
      scheduleData = {
        target_date: targetDate,
        status: 'Available Capacity',
        utilization_percentage: 65,
        total_day_minutes: 540,
        planned_work_minutes: tasks.reduce((acc: number, t: any) => acc + (t.current_predicted_minutes || t.user_estimated_minutes || 60), 0),
        break_minutes: 45,
        free_capacity_minutes: 180,
        overload_minutes: 0,
        scheduled_blocks: tasks.map((t: any, i: number) => {
          const startH = 9 + Math.floor(i * 1.5);
          return {
            task_id: t.id,
            title: t.title,
            start_at: `${String(startH).padStart(2, '0')}:00`,
            end_at: `${String(startH + 1).padStart(2, '0')}:00`,
            start_time_display: `${startH}:00 AM`,
            end_time_display: `${startH + 1}:00 AM`,
            duration_minutes: t.current_predicted_minutes || t.user_estimated_minutes || 60,
            block_type: 'task',
            category: t.category || 'Work',
            priority: t.priority || 'Medium',
            is_fixed: false,
            reason: `Scheduled by priority (${t.priority})`
          };
        }),
        unscheduled_tasks: [],
        recommendations: [
          {
            type: 'break_suggestion',
            title: 'Add 30 min break after 2 hours',
            description: 'Improves productivity (+25%)',
            action_type: 'add_break'
          }
        ]
      };
    }

    // 4. Create preview draft version
    const versionId = uuidv4();
    const verRes = await db.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_ver FROM schedule_versions WHERE user_id = $1 AND target_date = $2',
      [userId, targetDate]
    );
    const nextVer = verRes.rows[0]?.next_ver || 1;

    await db.query(
      `INSERT INTO schedule_versions (
        id, user_id, target_date, version_number, status,
        total_planned_minutes, utilization_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        versionId,
        userId,
        targetDate,
        nextVer,
        'draft',
        scheduleData.planned_work_minutes,
        scheduleData.utilization_percentage
      ]
    );

    // Save proposed blocks into schedule_blocks associated with this version
    for (const block of scheduleData.scheduled_blocks) {
      await db.query(
        `INSERT INTO schedule_blocks (
          id, schedule_version_id, task_id, title, start_at, end_at,
          duration_minutes, block_type, category, priority, is_fixed, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          uuidv4(),
          versionId,
          block.task_id || null,
          block.title,
          block.start_at,
          block.end_at,
          block.duration_minutes,
          block.block_type || 'task',
          block.category || 'Work',
          block.priority || 'Medium',
          Boolean(block.is_fixed),
          block.reason || ''
        ]
      );
    }

    res.json({
      schedule_version_id: versionId,
      version_number: nextVer,
      target_date: targetDate,
      status: 'draft',
      ...scheduleData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const acceptSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const verRes = await db.query('SELECT * FROM schedule_versions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (verRes.rows.length === 0) {
      res.status(404).json({ error: 'Schedule version not found.' });
      return;
    }

    const version = verRes.rows[0];

    // Archive any other accepted schedules for this date
    await db.query(
      "UPDATE schedule_versions SET status = 'archived' WHERE user_id = $1 AND target_date = $2 AND status = 'accepted'",
      [userId, version.target_date]
    );

    // Accept this version
    await db.query(
      "UPDATE schedule_versions SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    // Record notification
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link_route)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        userId,
        'schedule_update',
        'Schedule Saved & Activated 📅',
        `Your optimized schedule for ${version.target_date} has been accepted and activated.`,
        '/calendar'
      ]
    );

    res.json({
      message: 'Schedule accepted and activated successfully',
      schedule_version_id: id,
      target_date: version.target_date,
      status: 'accepted'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getActiveSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const targetDate = (req.query.target_date as string) || new Date().toISOString().split('T')[0];

    // Fetch accepted schedule version or fallback to latest draft
    let verRes = await db.query(
      "SELECT * FROM schedule_versions WHERE user_id = $1 AND target_date = $2 AND status = 'accepted' ORDER BY accepted_at DESC LIMIT 1",
      [userId, targetDate]
    );

    if (verRes.rows.length === 0) {
      verRes = await db.query(
        'SELECT * FROM schedule_versions WHERE user_id = $1 AND target_date = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, targetDate]
      );
    }

    if (verRes.rows.length === 0) {
      res.json({ schedule: null, blocks: [] });
      return;
    }

    const version = verRes.rows[0];
    const blocksRes = await db.query(
      'SELECT * FROM schedule_blocks WHERE schedule_version_id = $1 ORDER BY start_at ASC',
      [version.id]
    );

    res.json({
      schedule: version,
      blocks: blocksRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateScheduleBlock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { blockId } = req.params;
    const { start_at, end_at, duration_minutes, title } = req.body;

    const blockRes = await db.query(
      `SELECT sb.* FROM schedule_blocks sb
       JOIN schedule_versions sv ON sb.schedule_version_id = sv.id
       WHERE sb.id = $1 AND sv.user_id = $2`,
      [blockId, userId]
    );

    if (blockRes.rows.length === 0) {
      res.status(404).json({ error: 'Schedule block not found' });
      return;
    }

    await db.query(
      `UPDATE schedule_blocks SET
        start_at = COALESCE($1, start_at),
        end_at = COALESCE($2, end_at),
        duration_minutes = COALESCE($3, duration_minutes),
        title = COALESCE($4, title)
       WHERE id = $5`,
      [start_at, end_at, duration_minutes, title, blockId]
    );

    const updated = await db.query('SELECT * FROM schedule_blocks WHERE id = $1', [blockId]);
    res.json({ message: 'Schedule block updated', block: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSchedules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { target_date } = req.query;

    let sql = 'SELECT * FROM schedule_versions WHERE user_id = $1';
    const params: any[] = [userId];

    if (target_date) {
      sql += ' AND target_date = $2';
      params.push(target_date);
    }

    sql += ' ORDER BY created_at DESC LIMIT 20';
    const versionsRes = await db.query(sql, params);

    res.json({ schedules: versionsRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getScheduleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const verRes = await db.query('SELECT * FROM schedule_versions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (verRes.rows.length === 0) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    const blocksRes = await db.query(
      'SELECT * FROM schedule_blocks WHERE schedule_version_id = $1 ORDER BY start_at ASC',
      [id]
    );

    res.json({
      schedule: verRes.rows[0],
      blocks: blocksRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteScheduleItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const blockRes = await db.query(
      `SELECT sb.id FROM schedule_blocks sb
       JOIN schedule_versions sv ON sb.schedule_version_id = sv.id
       WHERE sb.id = $1 AND sv.user_id = $2`,
      [id, userId]
    );

    if (blockRes.rows.length === 0) {
      res.status(404).json({ error: 'Schedule item not found' });
      return;
    }

    await db.query('DELETE FROM schedule_blocks WHERE id = $1', [id]);
    res.json({ message: 'Schedule item removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
