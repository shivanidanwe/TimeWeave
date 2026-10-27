import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password, role, timezone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, name.trim(), email.toLowerCase().trim(), passwordHash, role || 'Student', timezone || 'UTC']
    );

    // Initialize default preferences
    await db.query(
      `INSERT INTO user_preferences (user_id, working_days, work_start_time, work_end_time, daily_capacity_minutes, break_duration, energy_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        '09:00',
        '18:00',
        480,
        30,
        'Morning'
      ]
    );

    // Add welcoming system notification
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link_route)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        userId,
        'system',
        'Welcome to TimeWeave! 🎉',
        'Welcome aboard! Start by adding your tasks or running your first schedule optimization.',
        '/tasks'
      ]
    );

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim() },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role || 'Student',
        timezone: timezone || 'UTC'
      }
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Failed to create user account. ' + err.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const userRes = await db.query(
      'SELECT id, name, email, password_hash, role, timezone FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Login failed. ' + err.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRes = await db.query(
      'SELECT id, name, email, role, timezone, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const prefRes = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);

    res.json({
      user: userRes.rows[0],
      preferences: prefRes.rows[0] || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, role, timezone, bio } = req.body;

    await db.query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), timezone = COALESCE($3, timezone), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [name, role, timezone, userId]
    );

    const updated = await db.query(
      'SELECT id, name, email, role, timezone FROM users WHERE id = $1',
      [userId]
    );

    res.json({ message: 'Profile updated', user: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Valid current password and new password (min 6 chars) are required.' });
      return;
    }

    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);

    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Account and associated data deleted permanently.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
