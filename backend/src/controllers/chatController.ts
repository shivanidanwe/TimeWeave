import { Response } from 'express';
import axios from 'axios';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function dateForTimezone(timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
}

function taskDuration(task: any): number {
  const predicted = Number(task.current_predicted_minutes);
  const estimated = Number(task.user_estimated_minutes);
  return Math.max(1, predicted > 0 ? predicted : estimated > 0 ? estimated : 60);
}

function sortByUrgency(tasks: any[]): any[] {
  return [...tasks].sort((a, b) => {
    const priority = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    if (priority) return priority;
    return String(a.deadline || '9999-12-31').localeCompare(String(b.deadline || '9999-12-31'));
  });
}

function suggestionActions(labels: string[]) {
  return labels.map((label) => ({ label, action: label.toLowerCase().includes('schedule') ? 'plan_day' : 'ask', query: label }));
}

function formatTaskList(tasks: any[], limit = 8): string {
  return tasks.slice(0, limit).map((task) => {
    const due = task.deadline ? `, due ${String(task.deadline).slice(0, 10)}` : '';
    return `- ${task.title} (${task.priority || 'Medium'}, ${durationLabel(taskDuration(task))}${due})`;
  }).join('\n');
}

async function getWorkloadAnalysis(tasks: any[], preferences: any) {
  const workloadMinutes = tasks.reduce((sum, task) => sum + taskDuration(task), 0);
  const start = String(preferences.work_start_time || '09:00').split(':').map(Number);
  const end = String(preferences.work_end_time || '18:00').split(':').map(Number);
  const workdayMinutes = Math.max(0, (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]));
  const configuredCapacity = Number(preferences.daily_capacity_minutes);
  const capacityMinutes = Math.max(0, configuredCapacity > 0 ? configuredCapacity : workdayMinutes - Number(preferences.break_duration || 0));
  const local = {
    status: workloadMinutes > capacityMinutes ? 'Overcommitted' : workloadMinutes >= capacityMinutes * 0.8 ? 'Near Capacity' : 'Available Capacity',
    utilization_percentage: capacityMinutes > 0 ? Math.round((workloadMinutes / capacityMinutes) * 100) : (workloadMinutes ? 100 : 0),
    planned_work_minutes: workloadMinutes,
    total_day_minutes: capacityMinutes,
    overload_minutes: Math.max(0, workloadMinutes - capacityMinutes)
  };

  try {
    const response = await axios.post(`${config.mlServiceUrl}/analyze-workload`, {
      tasks,
      preferences
    }, { timeout: 3500 });
    return {
      ...local,
      ...response.data,
      status: local.status,
      planned_work_minutes: workloadMinutes,
      workload_minutes: workloadMinutes,
      total_day_minutes: capacityMinutes,
      utilization_percentage: local.utilization_percentage,
      overload_minutes: local.overload_minutes,
      source: 'scheduler'
    };
  } catch {
    return { ...local, source: 'local_calculation' };
  }
}

async function generateSchedule(tasks: any[], preferences: any, targetDate: string) {
  try {
    const response = await axios.post(`${config.mlServiceUrl}/generate-schedule`, {
      tasks,
      preferences,
      target_date: targetDate
    }, { timeout: 5000 });
    return { ...response.data, source: 'scheduler' };
  } catch {
    const [startHour, startMinute] = String(preferences.work_start_time || '09:00').split(':').map(Number);
    const [endHour, endMinute] = String(preferences.work_end_time || '18:00').split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    let cursor = startMinutes;
    const scheduled: any[] = [];
    const unscheduled: any[] = [];
    for (const task of sortByUrgency(tasks)) {
      const duration = taskDuration(task);
      if (cursor + duration > endMinutes) {
        unscheduled.push({ ...task, unscheduled_reason: 'This task does not fit in the remaining working hours.' });
        continue;
      }
      const start = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
      cursor += duration;
      const end = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
      scheduled.push({ task_id: task.id, title: task.title, start_at: start, end_at: end, duration_minutes: duration, block_type: 'task' });
    }
    const requested = tasks.reduce((sum, task) => sum + taskDuration(task), 0);
    const capacity = Math.max(0, endMinutes - startMinutes);
    return {
      target_date: targetDate,
      status: unscheduled.length ? 'Overcommitted' : 'Available Capacity',
      utilization_percentage: capacity ? Math.round((requested / capacity) * 100) : (requested ? 100 : 0),
      planned_work_minutes: scheduled.reduce((sum, block) => sum + block.duration_minutes, 0),
      total_requested_minutes: requested,
      scheduled_blocks: scheduled,
      unscheduled_tasks: unscheduled,
      recommendations: [],
      source: 'local_fallback'
    };
  }
}

export const handleChatMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ success: false, error: 'Message must be 2000 characters or fewer.' });
    return;
  }

  try {
    const userId = req.user!.id;
    const [tasksResult, preferencesResult, userResult] = await Promise.all([
      db.query(
        `SELECT id, title, description, category, priority, status, deadline,
                user_estimated_minutes, current_predicted_minutes, actual_duration_minutes,
                created_at, completed_at
         FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]),
      db.query('SELECT timezone FROM users WHERE id = $1', [userId])
    ]);

    const tasks = tasksResult.rows;
    const preferences = preferencesResult.rows[0] || {};
    const timezone = userResult.rows[0]?.timezone;
    const today = dateForTimezone(timezone);
    const scheduleResult = await db.query(
      `SELECT sv.id AS schedule_id, sv.status AS schedule_status,
              sb.title, sb.start_at, sb.end_at, sb.duration_minutes
       FROM schedule_versions sv
       LEFT JOIN schedule_blocks sb ON sb.schedule_version_id = sv.id
       WHERE sv.user_id = $1 AND sv.target_date = $2 AND sv.status = 'accepted'
       ORDER BY sb.start_at ASC`,
      [userId, today]
    );
    const activeTasks = tasks.filter((task) => task.status !== 'Completed');
    const completedTasks = tasks.filter((task) => task.status === 'Completed');
    const dueToday = activeTasks.filter((task) => task.deadline && String(task.deadline).slice(0, 10) === today);
    const overdueTasks = activeTasks.filter((task) => task.deadline && String(task.deadline).slice(0, 10) < today);
    let workloadPromise: Promise<any> | null = null;
    const getWorkload = () => workloadPromise || (workloadPromise = getWorkloadAnalysis(activeTasks, preferences));
    const text = message.trim().toLowerCase();
    const suggestions = ['Generate my schedule', 'Show overdue tasks', 'Which task should I prioritize?'];
    let reply: string;
    let actions: any[] = suggestionActions(suggestions);
    let schedule: any;

    if (/\boverdue\b|\blate tasks?\b|missed deadline/.test(text)) {
      reply = overdueTasks.length
        ? `You have ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}:\n${formatTaskList(sortByUrgency(overdueTasks))}`
        : 'You have no overdue tasks in your records.';
      actions = suggestionActions(['Which task should I prioritize?', 'Generate my schedule']);
    } else if (/\bcompleted\b|\bfinished\b|how many tasks/.test(text)) {
      reply = `You have completed ${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'} in your task history.`;
      if (completedTasks.length) {
        const totalActual = completedTasks.reduce((sum, task) => sum + Math.max(0, Number(task.actual_duration_minutes || 0)), 0);
        reply += ` Recorded actual time: ${durationLabel(totalActual)}.`;
      }
      actions = suggestionActions(['What is my average task duration?', 'Show my productivity trend']);
    } else if (/average|avg|mean.*duration|duration.*average|how long.*usually/.test(text)) {
      const timedTasks = completedTasks.filter((task) => Number(task.actual_duration_minutes) > 0);
      const average = timedTasks.length
        ? Math.round(timedTasks.reduce((sum, task) => sum + Number(task.actual_duration_minutes), 0) / timedTasks.length)
        : 0;
      reply = timedTasks.length
        ? `Your average recorded task duration is ${durationLabel(average)}, based on ${timedTasks.length} completed task${timedTasks.length === 1 ? '' : 's'} with actual durations.`
        : 'There is not enough completed-task duration history to calculate an average yet. Record actual durations when completing tasks to build this metric.';
      actions = suggestionActions(['Show my productivity trend', 'What tasks do I have today?']);
    } else if (/productivity|trend|improve|better schedule|organize my day/.test(text)) {
      const workload = await getWorkload();
      const completedWithDates = completedTasks.filter((task) => task.completed_at);
      const now = Date.now();
      const recentCount = completedWithDates.filter((task) => now - new Date(task.completed_at).getTime() <= 7 * 86400000).length;
      const previousCount = completedWithDates.filter((task) => {
        const age = now - new Date(task.completed_at).getTime();
        return age > 7 * 86400000 && age <= 14 * 86400000;
      }).length;
      reply = `In the last 7 days you completed ${recentCount} task${recentCount === 1 ? '' : 's'}; in the prior 7 days, ${previousCount}.`;
      if (!completedWithDates.length) reply += ' There is not enough completion history yet to identify a trend.';
      if (workload.status === 'Overcommitted') reply += ` Your current pending load is ${durationLabel(workload.planned_work_minutes)} against ${durationLabel(workload.total_day_minutes)} of configured capacity. Move lower-priority work or extend the plan across more days.`;
      else if (activeTasks.length) reply += ` You have ${activeTasks.length} active task${activeTasks.length === 1 ? '' : 's'}; schedule the highest-priority work first and keep breaks between long focus blocks.`;
      const currentScheduleBlocks = scheduleResult.rows.filter((block: any) => block.title);
      if (currentScheduleBlocks.length) reply += ` Your accepted schedule today contains ${currentScheduleBlocks.length} block${currentScheduleBlocks.length === 1 ? '' : 's'}; compare it with your remaining active tasks and adjust any unfinished work.`;
      else reply += ' You do not have an accepted schedule for today yet.';
      actions = suggestionActions(['Generate my schedule', 'What is my total pending workload?']);
    } else if (/schedule|plan my day|organize|allocate.*task|time.*each task|how much time.*task/.test(text)) {
      schedule = await generateSchedule(activeTasks, preferences, today);
      const taskBlocks = (schedule.scheduled_blocks || []).filter((block: any) => block.block_type === 'task');
      const lines = taskBlocks.map((block: any) => `- ${block.start_at}–${block.end_at}: ${block.title} (${durationLabel(block.duration_minutes)})`);
      const unscheduled = schedule.unscheduled_tasks || [];
      reply = taskBlocks.length
        ? `Schedule preview for ${today} (${schedule.status}, ${schedule.utilization_percentage}% workload):\n${lines.join('\n')}`
        : 'You have no active tasks to schedule today.';
      if (unscheduled.length) reply += `\n\nCould not fit ${unscheduled.length} task${unscheduled.length === 1 ? '' : 's'}:\n${unscheduled.map((task: any) => `- ${task.title}: ${task.unscheduled_reason || 'No available slot'}`).join('\n')}`;
      if (schedule.source === 'local_fallback') reply += '\n\nThe ML scheduling service is unavailable; this preview uses the local duration-and-capacity fallback.';
      reply += '\n\nThis is a preview; use AI Planner to review and apply it.';
      actions = [
        { label: 'Apply this schedule', action: 'apply_schedule' },
        ...suggestionActions(['Which task should I prioritize?', 'What is my total pending workload?'])
      ];
    } else if (/overcommitted|too much|enough time|capacity/.test(text)) {
      const workload = await getWorkload();
      reply = `Your active workload is ${durationLabel(workload.planned_work_minutes)} against ${durationLabel(workload.total_day_minutes)} of configured daily capacity (${workload.utilization_percentage}%). Status: ${workload.status}.`;
      if (workload.overload_minutes > 0) reply += ` You are over capacity by ${durationLabel(workload.overload_minutes)}.`;
      if (workload.source === 'local_calculation') reply += ' The ML workload service is unavailable; this result is calculated from your task durations and saved preferences.';
      actions = suggestionActions(['Generate my schedule', 'Which task should I prioritize?']);
    } else if (/prioriti|focus on|what should i do next|next task/.test(text)) {
      const nextTask = sortByUrgency(activeTasks)[0];
      reply = nextTask
        ? `Prioritize “${nextTask.title}” (${nextTask.priority || 'Medium'} priority, ${durationLabel(taskDuration(nextTask))}${nextTask.deadline ? `, due ${String(nextTask.deadline).slice(0, 10)}` : ''}). Start with one focused block, then reassess your remaining capacity.`
        : 'You have no active tasks to prioritize. Add a task to get a recommendation.';
      actions = suggestionActions(['Generate my schedule', 'What tasks do I have today?']);
    } else if (/today|due today/.test(text)) {
      reply = dueToday.length
        ? `You have ${dueToday.length} active task${dueToday.length === 1 ? '' : 's'} due today (${today}):\n${formatTaskList(sortByUrgency(dueToday))}`
        : `You have no active tasks with a deadline today (${today}).`;
      if (!dueToday.length && activeTasks.length) reply += `\nYour next active tasks are:\n${formatTaskList(sortByUrgency(activeTasks), 5)}`;
      actions = suggestionActions(['Show overdue tasks', 'Generate my schedule']);
    } else if (/workload|pending tasks|remaining work|how much work/.test(text)) {
      const workload = await getWorkload();
      reply = `You have ${activeTasks.length} active task${activeTasks.length === 1 ? '' : 's'} with an estimated workload of ${durationLabel(workload.planned_work_minutes)}. Configured daily capacity is ${durationLabel(workload.total_day_minutes)} (${workload.utilization_percentage}%); status: ${workload.status}.`;
      actions = suggestionActions(['Am I overcommitted today?', 'Generate my schedule']);
    } else {
      reply = 'I can answer questions about today’s tasks, overdue work, workload, priorities, schedule previews, completed-task duration, and productivity trends. Try one of the suggestions below.';
      actions = suggestionActions(['What tasks do I have today?', 'What is my total pending workload?', 'Which task should I prioritize?']);
    }

    res.json({ success: true, reply, suggestions: actions.map((action) => action.label), actions, ...(schedule ? { schedule } : {}) });
  } catch (error) {
    console.error('[Assistant] Failed to build user context:', error);
    res.status(500).json({ success: false, error: 'The assistant could not load your data. Please try again.' });
  }
};