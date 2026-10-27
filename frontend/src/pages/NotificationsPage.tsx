import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  Clock,
  Award,
  AlertTriangle,
  FileText,
  Check,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'system'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications(filter);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
    );
  };

  const handleClearAll = async () => {
    await api.clearNotifications();
    setNotifications([]);
  };

  // Mock list matching Screen 13 if database is fresh
  const displayItems = notifications.length > 0 ? notifications : [
    {
      id: '1',
      user_id: 'u1',
      type: 'schedule_update',
      title: 'Schedule Update',
      message: 'Your schedule for tomorrow has been optimized.',
      created_at: '5 minutes ago',
      is_read: 0,
      link_route: '/calendar'
    },
    {
      id: '2',
      user_id: 'u1',
      type: 'task_reminder',
      title: 'Task Reminder',
      message: 'Project Meeting starts in 30 minutes.',
      created_at: '1 hour ago',
      is_read: 0,
      link_route: '/tasks'
    },
    {
      id: '3',
      user_id: 'u1',
      type: 'goal_achievement',
      title: 'Goal Achievement',
      message: 'You completed 15 tasks this week! 🎉',
      created_at: '3 hours ago',
      is_read: 1,
      link_route: '/analytics'
    },
    {
      id: '4',
      user_id: 'u1',
      type: 'overcommitment_alert',
      title: 'Overcommitment Alert',
      message: 'You have 120% workload on Tuesday. Consider moving 2 tasks.',
      created_at: 'Yesterday',
      is_read: 0,
      link_route: '/ai-schedule'
    },
    {
      id: '5',
      user_id: 'u1',
      type: 'weekly_report',
      title: 'Weekly Report',
      message: 'Your weekly productivity report is ready.',
      created_at: '1 day ago',
      is_read: 1,
      link_route: '/analytics'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'schedule_update':
        return <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>;
      case 'task_reminder':
        return <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Clock className="w-5 h-5" /></div>;
      case 'goal_achievement':
        return <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Award className="w-5 h-5" /></div>;
      case 'overcommitment_alert':
        return <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated with schedule optimizations and alerts</p>
        </div>

        <button
          onClick={handleClearAll}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Filter Tabs (Screen 13) */}
      <div className="flex items-center gap-2">
        {(['all', 'unread', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
              filter === tab
                ? 'bg-[#6366F1] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List (Screen 13) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {displayItems.map((n) => (
          <div
            key={n.id}
            className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50/70 ${
              !n.is_read ? 'bg-indigo-50/20' : ''
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {getIcon(n.type)}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#6366F1] shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                <span className="text-[11px] text-slate-400 mt-1.5 block font-medium">
                  {n.created_at}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {n.link_route && (
                <Link
                  to={n.link_route}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  View
                </Link>
              )}
              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
