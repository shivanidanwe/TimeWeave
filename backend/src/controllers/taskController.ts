import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

async function fetchDurationPrediction(taskData: any, userHistoryCount: number, userId: string) {
  try {
    const res = await axios.post(`${config.mlServiceUrl}/predict-duration`, {
      ...taskData,
      user_id: userId,
      user_history_count: userHistoryCount
    }, { timeout: 3000 });
    return res.data;
  } catch (err: any) {
    // Fallback baseline calculation if ML service is unreachable
    const cat = taskData.category || 'Work';
    const baselines: Record<string, number> = { Study: 60, Work: 90, Personal: 45, Health: 45, Other: 30 };
    const base = baselines[cat] || 60;
    const est = taskData.user_estimated_minutes || base;
    return {
      predicted_minutes: est,
      baseline_minutes: base,
      confidence_lower: Math.max(15, Math.round(est * 0.8)),
      confidence_upper: Math.round(est * 1.25),
      prediction_source: 'baseline_local',
      model_version: 'baseline-local',
      explanations: [`Category '${cat}' standard baseline: ${base} mins`]
    };
  }
}

async function retrainUserDurationModel(userId: string): Promise<void> {
  try {
    const historyRes = await db.query(
      `SELECT title, description, category, priority, energy_requirement, flexibility,
              user_estimated_minutes, actual_duration_minutes, completed_at
       FROM tasks
       WHERE user_id = $1 AND status = 'Completed' AND actual_duration_minutes > 0
       ORDER BY completed_at ASC`,
      [userId]
    );
    const records = historyRes.rows.map((task: any) => {
      const completedAt = task.completed_at ? new Date(task.completed_at) : new Date();
      return {
        ...task,
        day_of_week: completedAt.getDay(),
        hour_of_day: completedAt.getHours()
      };
    });

    if (records.length < 5) return;

    const statusRes = await axios.get(`${config.mlServiceUrl}/model-info`, {
      params: { user_id: userId },
      timeout: 3000
    });
    const trainedSamples = Number(statusRes.data.training_samples || 0);
    if (records.length - trainedSamples < 5) return;

    await axios.post(`${config.mlServiceUrl}/train`, { user_id: userId, records }, { timeout: 10000 });
  } catch {
    console.warn('[ML] User model refresh skipped; the ML service is unavailable.');
  }
}

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, category, priority, search, due } = req.query;

    let sql = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [userId];
    let pIdx = 2;

    if (status && status !== 'all') {
      sql += ` AND LOWER(status) = LOWER($${pIdx++})`;
      params.push(status);
    }

    if (category && category !== 'All Categories') {
      sql += ` AND LOWER(category) = LOWER($${pIdx++})`;
      params.push(category);
    }

    if (priority && priority !== 'All') {
      sql += ` AND LOWER(priority) = LOWER($${pIdx++})`;
      params.push(priority);
    }

    if (search) {
      sql += ` AND (LOWER(title) LIKE LOWER($${pIdx}) OR LOWER(description) LIKE LOWER($${pIdx}))`;
      params.push(`%${search}%`);
      pIdx++;
    }

    sql += ' ORDER BY created_at DESC';

    const tasksRes = await db.query(sql, params);
    const tasks = tasksRes.rows;

    // Attach dependencies to tasks
    const taskIds = tasks.map((t: any) => t.id);
    let depsMap: Record<string, string[]> = {};
    if (taskIds.length > 0) {
      const depsRes = await db.query(
        `SELECT task_id, depends_on_task_id FROM task_dependencies WHERE task_id IN (${taskIds.map((_, i) => `$${i + 1}`).join(',')})`,
        taskIds
      );
      for (const d of depsRes.rows) {
        if (!depsMap[d.task_id]) depsMap[d.task_id] = [];
        depsMap[d.task_id].push(d.depends_on_task_id);
      }
    }

    const enriched = tasks.map((t: any) => ({
      ...t,
      dependencies: depsMap[t.id] || []
    }));

    res.json({ tasks: enriched, total: enriched.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (taskRes.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = taskRes.rows[0];

    const [depsRes, sessionsRes, interruptionsRes, predictionsRes] = await Promise.all([
      db.query('SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $1', [id]),
      db.query('SELECT * FROM task_time_sessions WHERE task_id = $1 ORDER BY started_at DESC', [id]),
      db.query('SELECT * FROM task_interruptions WHERE task_id = $1 ORDER BY occurred_at DESC', [id]),
      db.query('SELECT * FROM model_predictions WHERE task_id = $1 ORDER BY created_at DESC LIMIT 1', [id])
    ]);

    res.json({
      task: {
        ...task,
        dependencies: depsRes.rows.map((r: any) => r.depends_on_task_id),
        time_sessions: sessionsRes.rows,
        interruptions: interruptionsRes.rows,
        latest_prediction: predictionsRes.rows[0] || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      category,
      priority,
      deadline,
      user_estimated_minutes,
      energy_requirement,
      flexibility,
      dependencies
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    // Count user's completed history to calibrate cold-start vs ML model
    const histRes = await db.query(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status = 'Completed'",
      [userId]
    );
    const historyCount = parseInt(histRes.rows[0]?.count || '0', 10);

    const prediction = await fetchDurationPrediction({
      title,
      description,
      category: category || 'Work',
      priority: priority || 'Medium',
      energy_requirement: energy_requirement || 'Medium',
      flexibility: flexibility || 'Flexible',
      user_estimated_minutes: parseInt(user_estimated_minutes || '60', 10)
    }, historyCount, userId);

    const taskId = uuidv4();
    const predictedMins = prediction.predicted_minutes;

    await db.query(
      `INSERT INTO tasks (
        id, user_id, title, description, category, priority, status,
        deadline, user_estimated_minutes, current_predicted_minutes,
        energy_requirement, flexibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        taskId,
        userId,
        title.trim(),
        description || '',
        category || 'Work',
        priority || 'Medium',
        'Pending',
        deadline || null,
        user_estimated_minutes ? parseInt(user_estimated_minutes, 10) : 60,
        predictedMins,
        energy_requirement || 'Medium',
        flexibility || 'Flexible'
      ]
    );

    // Save prediction provenance for adaptive feedback
    await db.query(
      `INSERT INTO model_predictions (
        id, user_id, task_id, predicted_minutes, baseline_minutes,
        confidence_lower, confidence_upper, model_version, prediction_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(),
        userId,
        taskId,
        prediction.predicted_minutes,
        prediction.baseline_minutes,
        prediction.confidence_lower,
        prediction.confidence_upper,
        prediction.model_version,
        prediction.prediction_source
      ]
    );

    // Save task dependencies if provided
    if (dependencies && Array.isArray(dependencies)) {
      for (const depId of dependencies) {
        if (depId && depId !== taskId) {
          await db.query(
            'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2) ON CONFLICT (task_id, depends_on_task_id) DO NOTHING',
            [taskId, depId]
          );
        }
      }
    }

    // Log history event
    await db.query(
      `INSERT INTO task_history (id, user_id, task_id, event_type, event_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        userId,
        taskId,
        'task_created',
        JSON.stringify({ title, category, priority, predicted_minutes: predictedMins })
      ]
    );

    const created = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...created.rows[0],
        prediction
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      deadline,
      user_estimated_minutes,
      energy_requirement,
      flexibility,
      dependencies
    } = req.body;

    const existing = await db.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await db.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        deadline = COALESCE($6, deadline),
        user_estimated_minutes = COALESCE($7, user_estimated_minutes),
        energy_requirement = COALESCE($8, energy_requirement),
        flexibility = COALESCE($9, flexibility),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11`,
      [
        title,
        description,
        category,
        priority,
        status,
        deadline,
        user_estimated_minutes,
        energy_requirement,
        flexibility,
        id,
        userId
      ]
    );

    if (dependencies && Array.isArray(dependencies)) {
      await db.query('DELETE FROM task_dependencies WHERE task_id = $1', [id]);
      for (const depId of dependencies) {
        if (depId && depId !== id) {
          await db.query(
            'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2) ON CONFLICT (task_id, depends_on_task_id) DO NOTHING',
            [id, depId]
          );
        }
      }
    }

    const updated = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task updated', task: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const resDel = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (resDel.rowCount === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const completeTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { actual_duration_minutes } = req.body;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (taskRes.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = taskRes.rows[0];
    const finalActual = actual_duration_minutes !== undefined 
      ? parseInt(actual_duration_minutes, 10) 
      : (task.actual_duration_minutes || task.current_predicted_minutes || task.user_estimated_minutes || 60);
    if (!Number.isFinite(finalActual) || finalActual <= 0 || finalActual > 1440) {
      res.status(400).json({ error: 'Actual duration must be between 1 and 1440 minutes.' });
      return;
    }

    await db.query(
      `UPDATE tasks SET
        status = 'Completed',
        completed_at = CURRENT_TIMESTAMP,
        actual_duration_minutes = $1,
        is_active_timer = FALSE,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [finalActual, id, userId]
    );

    // Record completed event in history for future ML retraining
    const predError = finalActual - (task.current_predicted_minutes || task.user_estimated_minutes);
    await db.query(
      `INSERT INTO task_history (id, user_id, task_id, event_type, event_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        userId,
        id,
        'task_completed',
        JSON.stringify({
          title: task.title,
          category: task.category,
          priority: task.priority,
          estimated: task.user_estimated_minutes,
          predicted: task.current_predicted_minutes,
          actual: finalActual,
          prediction_error_minutes: predError
        })
      ]
    );

    await retrainUserDurationModel(userId);

    res.json({
      message: 'Task marked as completed',
      task_id: id,
      actual_duration_minutes: finalActual,
      prediction_error_minutes: predError
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const startTimer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (taskRes.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Stop any existing active timers for this user to maintain single focus
    await db.query(
      `UPDATE tasks SET is_active_timer = FALSE WHERE user_id = $1 AND is_active_timer = TRUE`,
      [userId]
    );

    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO task_time_sessions (id, task_id, user_id, started_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [sessionId, id, userId]
    );

    await db.query(
      `UPDATE tasks SET
        is_active_timer = TRUE,
        status = CASE WHEN status = 'Pending' THEN 'In Progress' ELSE status END,
        timer_started_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Focus timer started', session_id: sessionId, task_id: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const stopTimer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (taskRes.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Find the active session
    const sessRes = await db.query(
      'SELECT id, started_at FROM task_time_sessions WHERE task_id = $1 AND user_id = $2 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
      [id, userId]
    );

    let sessionDuration = 0;
    if (sessRes.rows.length > 0) {
      const sess = sessRes.rows[0];
      const startMs = new Date(sess.started_at).getTime();
      const endMs = Date.now();
      sessionDuration = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));

      await db.query(
        'UPDATE task_time_sessions SET ended_at = CURRENT_TIMESTAMP, duration_minutes = $1 WHERE id = $2',
        [sessionDuration, sess.id]
      );
    }

    await db.query(
      `UPDATE tasks SET
        is_active_timer = FALSE,
        actual_duration_minutes = actual_duration_minutes + $1,
        timer_started_at = NULL,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [sessionDuration, id]
    );

    const updated = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Timer stopped', session_minutes: sessionDuration, task: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const recordInterruption = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason, duration_minutes } = req.body;

    const interruptionId = uuidv4();
    await db.query(
      `INSERT INTO task_interruptions (id, task_id, user_id, duration_minutes, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [interruptionId, id, userId, parseInt(duration_minutes || '5', 10), reason || 'Unplanned interruption']
    );

    res.status(201).json({ message: 'Interruption recorded', id: interruptionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
