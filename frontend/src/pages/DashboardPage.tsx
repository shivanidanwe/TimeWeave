import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Plus,
  Play,
  Square,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { DashboardOverview, ScheduleBlock } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, openTaskModal, completeTask, startTimer, stopTimer, activeTimerTaskId, openTaskDetail } = useTasks();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, scheduleData] = await Promise.all([
        api.getOverviewAnalytics(),
        api.getActiveSchedule()
      ]);
      setOverview(overviewData);
      setScheduleBlocks(scheduleData.blocks || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tasks]);

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  const categoryBadgeColors: Record<string, string> = {
    Study: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Work: 'bg-teal-50 text-teal-700 border-teal-200',
    Personal: 'bg-purple-50 text-purple-700 border-purple-200',
    Health: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Break: 'bg-amber-50 text-amber-700 border-amber-200',
    Other: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome & Context Header (Screen 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{timeGreeting}, {userName}!</span>
            <span className="text-2xl">{currentHour < 17 ? '☀️' : '🌙'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span className="font-semibold text-slate-700">{todayFormatted}</span>
            <span>•</span>
            <span className="italic">"Small steps every day lead to big results."</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ai-schedule"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] text-sm font-semibold rounded-xl border border-indigo-200/80 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Schedule</span>
          </Link>
          <button
            onClick={openTaskModal}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Screen 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tasks Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">
              {overview?.tasks_today ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold block mt-1">Tasks Today</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">
              {overview?.completed_today ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold block mt-1">Completed</span>
          </div>
        </div>

        {/* Card 3: Focus Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">
              {overview?.focus_time_display || '0h 0m'}
            </span>
            <span className="text-xs text-slate-500 font-semibold block mt-1">Focus Time</span>
          </div>
        </div>

        {/* Card 4: Productivity Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">
              {overview?.productivity_score ?? 0}%
            </span>
            <span className="text-xs text-slate-500 font-semibold block mt-1">Productivity Score</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Schedule */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Today's Schedule</h2>
            <Link
              to="/calendar"
              className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {scheduleBlocks.length > 0 ? (
              scheduleBlocks.map((block, idx) => {
                const badgeColor = categoryBadgeColors[block.category || 'Work'] || categoryBadgeColors['Work'];
                const task = tasks.find(t => t.id === block.task_id);
                const isCompleted = task?.status === 'Completed';

                return (
                  <div
                    key={block.id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isCompleted
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {block.task_id ? (
                        <button
                          onClick={() => completeTask(block.task_id!)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ) : (
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                          ☕
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-16 shrink-0">
                            {block.start_at}
                          </span>
                          <span
                            onClick={() => task && openTaskDetail(task)}
                            className={`text-sm font-semibold truncate cursor-pointer hover:text-[#6366F1] transition ${
                              isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
                            }`}
                          >
                            {block.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {block.category || 'Task'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 w-12 text-right">
                        {block.duration_minutes >= 60
                          ? `${Math.floor(block.duration_minutes / 60)}h${
                              block.duration_minutes % 60 ? ` ${block.duration_minutes % 60}m` : ''
                            }`
                          : `${block.duration_minutes}m`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Empty State
              <div className="py-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No active schedule for today</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Generate an AI-optimized schedule based on your available hours and task deadlines.
                </p>
                <Link
                  to="/ai-schedule"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6366F1] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#4F46E5] transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Schedule Now</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Weekly Overview Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Weekly Overview</h2>
            <select className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview?.weekly_overview || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="planned" fill="#93C5FD" name="Planned (h)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" fill="#6366F1" name="Actual (h)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width AI Insight Banner matching Screen 4 */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/90 to-purple-50/70 border border-indigo-100/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#6366F1] text-white rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Insight</span>
          </span>
          <p className="text-xs sm:text-sm text-indigo-950 font-medium">
            {overview?.ai_insight || 'Complete a few tasks to unlock your personalized insights.'}
          </p>
        </div>

        <Link
          to="/ai-schedule"
          className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1 shrink-0 ml-auto sm:ml-0"
        >
          <span>Optimize Schedule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
