import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Plus, Play, Pause, Square, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { api } from '../../api/client';

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const { openTaskModal, activeTimerTaskId, timerSeconds, stopTimer, tasks } = useTasks();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.getNotifications().then(res => {
      setUnreadCount(res.unread_count || 0);
    }).catch(() => {});
  }, []);

  const activeTask = tasks.find(t => t.id === activeTimerTaskId);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, schedule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Focus Timer Pill if timer is running */}
        {activeTimerTaskId && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse-subtle">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Focus: {formatTimer(timerSeconds)}</span>
            <span className="truncate max-w-[120px] text-slate-600 hidden sm:inline">
              ({activeTask?.title})
            </span>
            <button
              onClick={() => stopTimer(activeTimerTaskId)}
              title="Stop timer and save focus session"
              className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 transition text-indigo-900"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Notifications Icon with Badge */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          )}
        </Link>

        {/* Create Task Button matching reference top right */}
        <button
          onClick={openTaskModal}
          className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>

        {/* User Avatar */}
        <Link
          to="/settings"
          className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-indigo-300 transition shrink-0"
          title="Profile & Settings"
        >
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </Link>
      </div>
    </header>
  );
};
