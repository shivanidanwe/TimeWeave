import { Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const prefRes = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);

    if (prefRes.rows.length === 0) {
      res.json({
        preferences: {
          working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          work_start_time: '09:00',
          work_end_time: '18:00',
          daily_capacity_minutes: 480,
          break_duration: 30,
          max_continuous_work_minutes: 120,
          energy_preference: 'Morning',
          preferred_planning_horizon: 'Daily'
        }
      });
      return;
    }

    const row = prefRes.rows[0];
    res.json({
      preferences: {
        ...row,
        working_days: typeof row.working_days === 'string' ? JSON.parse(row.working_days) : row.working_days
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      working_days,
      work_start_time,
      work_end_time,
      daily_capacity_minutes,
      break_duration,
      max_continuous_work_minutes,
      energy_preference,
      preferred_planning_horizon
    } = req.body;

    const daysStr = Array.isArray(working_days) ? JSON.stringify(working_days) : (working_days || null);

    const updateRes = await db.query(
      `UPDATE user_preferences SET
        working_days = COALESCE($1, working_days),
        work_start_time = COALESCE($2, work_start_time),
        work_end_time = COALESCE($3, work_end_time),
        daily_capacity_minutes = COALESCE($4, daily_capacity_minutes),
        break_duration = COALESCE($5, break_duration),
        max_continuous_work_minutes = COALESCE($6, max_continuous_work_minutes),
        energy_preference = COALESCE($7, energy_preference),
        preferred_planning_horizon = COALESCE($8, preferred_planning_horizon),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $9`,
      [
        daysStr,
        work_start_time,
        work_end_time,
        daily_capacity_minutes,
        break_duration,
        max_continuous_work_minutes,
        energy_preference,
        preferred_planning_horizon,
        userId
      ]
    );

    if (updateRes.rowCount === 0) {
      await db.query(
        `INSERT INTO user_preferences (
          user_id, working_days, work_start_time, work_end_time,
          daily_capacity_minutes, break_duration, max_continuous_work_minutes,
          energy_preference, preferred_planning_horizon, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          userId,
          daysStr || JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
          work_start_time || '09:00',
          work_end_time || '18:00',
          daily_capacity_minutes || 480,
          break_duration || 30,
          max_continuous_work_minutes || 120,
          energy_preference || 'Morning',
          preferred_planning_horizon || 'Daily'
        ]
      );
    }

    const updated = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
    res.json({ message: 'Preferences saved', preferences: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
