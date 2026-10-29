import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Calendar,
  Award,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../api/client';
import { AnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('This Month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getWorkloadAnalytics()
      .then(res => setData(res))
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  const hasData = Boolean(data?.has_data && (data?.time_distribution?.length || data?.completion_trend?.length));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header (Screen 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics &amp; Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-driven patterns, estimation accuracy, and productivity velocity
          </p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-xs"
        >
          <option>This Month</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block leading-none">
            {data?.productivity_percentage ?? 0}%
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Productivity
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 block leading-none">
            {data?.total_focus_hours ?? 0}h
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Total Focus Time
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block leading-none">
            {data?.task_completion_rate ?? 0}%
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Task Completion
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#6366F1] block leading-none">
            {data?.time_saved_hours ?? 0}h
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Time Saved (est.)
          </span>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Two Chart Panels (Screen 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Task Completion Trend */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Task Completion Velocity</h2>
                <span className="text-xs font-semibold text-slate-500">Completed items over time</span>
              </div>
              <div className="h-64 w-full">
                {data?.completion_trend && data.completion_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.completion_trend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tasksCompleted"
                        name="Tasks Completed"
                        stroke="#6366F1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366F1' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No task completions recorded in this range.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Time Distribution Donut Chart */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Time Distribution
              </h2>
              <div className="h-64 w-full flex items-center justify-center">
                {data?.time_distribution && data.time_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.time_distribution}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.time_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">No category hours logged yet.</div>
                )}
              </div>

              {/* Legend matching Screen 8 */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                {data?.time_distribution?.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-bold text-slate-800">{item.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Data-Driven Cognitive Insights */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Productivity Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.insights && data.insights.length > 0 ? (
                data.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6366F1] bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        {insight.impact}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{insight.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Insights will appear here once you complete multiple tasks across different categories.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Honest Empty State for New Users */
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Complete a few tasks to unlock your personalized insights.
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            TimeWeave tracks your actual focus minutes and completed task durations to generate genuine velocity charts and duration regression curves.
          </p>
          <div className="pt-2">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <span>View Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
