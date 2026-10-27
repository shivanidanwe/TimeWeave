import { Response } from 'express';
import axios from 'axios';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const handleChatMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { message, conversation_history } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    // 1. Fetch active user tasks
    const tasksRes = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 AND status != 'Completed' ORDER BY priority DESC",
      [userId]
    );

    // 2. Fetch user preferences
    const prefRes = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);

    try {
      const mlRes = await axios.post(`${config.mlServiceUrl}/chat-assistant`, {
        message,
        tasks: tasksRes.rows,
        preferences: prefRes.rows[0] || {},
        conversation_history
      }, { timeout: 5000 });

      res.json(mlRes.data);
    } catch (err: any) {
      // Local fallback chat response
      const count = tasksRes.rows.length;
      res.json({
        reply: `Based on your past data and ${count} pending tasks, I can help you plan realistically. Would you like me to optimize your day with smart breaks?`,
        actions: [
          { label: 'Yes, create schedule', action: 'apply_schedule' },
          { label: 'Show alternatives', action: 'show_alternatives' },
          { label: 'No, keep as is', action: 'dismiss' }
        ]
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
