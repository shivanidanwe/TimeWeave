import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as authCtrl from '../controllers/authController';
import * as taskCtrl from '../controllers/taskController';
import * as schedCtrl from '../controllers/scheduleController';
import * as analyticsCtrl from '../controllers/analyticsController';
import * as historyCtrl from '../controllers/historyController';
import * as notifCtrl from '../controllers/notificationController';
import * as prefCtrl from '../controllers/preferenceController';
import * as chatCtrl from '../controllers/chatController';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TimeWeave API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes
apiRouter.post('/auth/register', authCtrl.register);
apiRouter.post('/auth/login', authCtrl.login);
apiRouter.get('/auth/me', authenticateToken, authCtrl.getMe);
apiRouter.patch('/auth/profile', authenticateToken, authCtrl.updateProfile);
apiRouter.post('/auth/change-password', authenticateToken, authCtrl.changePassword);
apiRouter.delete('/auth/account', authenticateToken, authCtrl.deleteAccount);

// Task Routes
apiRouter.get('/tasks', authenticateToken, taskCtrl.getTasks);
apiRouter.post('/tasks', authenticateToken, taskCtrl.createTask);
apiRouter.get('/tasks/:id', authenticateToken, taskCtrl.getTaskById);
apiRouter.patch('/tasks/:id', authenticateToken, taskCtrl.updateTask);
apiRouter.delete('/tasks/:id', authenticateToken, taskCtrl.deleteTask);
apiRouter.post('/tasks/:id/complete', authenticateToken, taskCtrl.completeTask);
apiRouter.post('/tasks/:id/start-timer', authenticateToken, taskCtrl.startTimer);
apiRouter.post('/tasks/:id/stop-timer', authenticateToken, taskCtrl.stopTimer);
apiRouter.post('/tasks/:id/interruptions', authenticateToken, taskCtrl.recordInterruption);

// Schedule Routes
apiRouter.post('/schedules/generate', authenticateToken, schedCtrl.generateSchedule);
apiRouter.post('/schedules/:id/accept', authenticateToken, schedCtrl.acceptSchedule);
apiRouter.get('/schedules/active', authenticateToken, schedCtrl.getActiveSchedule);
apiRouter.patch('/schedules/blocks/:blockId', authenticateToken, schedCtrl.updateScheduleBlock);

// Analytics Routes
apiRouter.get('/analytics/overview', authenticateToken, analyticsCtrl.getOverviewAnalytics);
apiRouter.get('/analytics/workload', authenticateToken, analyticsCtrl.getWorkloadAnalytics);

// History Routes
apiRouter.get('/history', authenticateToken, historyCtrl.getHistory);

// Notifications Routes
apiRouter.get('/notifications', authenticateToken, notifCtrl.getNotifications);
apiRouter.patch('/notifications/:id/read', authenticateToken, notifCtrl.markAsRead);
apiRouter.delete('/notifications', authenticateToken, notifCtrl.clearNotifications);

// Preferences Routes
apiRouter.get('/preferences', authenticateToken, prefCtrl.getPreferences);
apiRouter.put('/preferences', authenticateToken, prefCtrl.updatePreferences);

// AI Assistant Chat Route
apiRouter.post('/chat', authenticateToken, chatCtrl.handleChatMessage);
