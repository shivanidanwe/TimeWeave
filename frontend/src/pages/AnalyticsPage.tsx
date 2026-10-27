import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Calendar,
  Award
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
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  const defaultDistribution = [
    { name: 'Study', value: 16, color: '#6366F1' },
    { name: 'Work', value: 14, color: '#06B6D4' },
    { name: 'Personal', value: 5, color: '#A855F7' },
    { name: 'Health', value: 4, color: '#10B981' },
    { name: 'Other', value: 3, color: '#F59E0B' }
  ];

  const defaultTrend = [
    { date: '1 Sep', completionRate: 65 },
    { date: '8 Sep', completionRate: 72 },
    { date: '15 Sep', completionRate: 85 },
    { date: '21 Sep', completionRate: 79 },
    { date: '28 Sep', completionRate: 92 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header (Screen 8) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics & Insights
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

      {/* Top 4 KPI Cards (Screen 8) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block leading-none">
            {data?.productivity_percentage || 78}%
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Productivity
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 block leading-none">
            {data?.total_focus_hours || 42}h
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Total Focus Time
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block leading-none">
            {data?.task_completion_rate || 85}%
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Task Completion
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#6366F1] block leading-none">
            {data?.time_saved_hours || 25}h
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            Time Saved (est.)
          </span>
        </div>
      </div>

      {/* Two Chart Panels (Screen 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Task Completion Trend */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Task Completion Trend
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.completion_trend || defaultTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[50, 100]} />
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
                  dataKey="completionRate"
                  name="Completion %"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel: Time Distribution Donut Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Time Distribution
          </h2>
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.time_distribution || defaultDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {(data?.time_distribution || defaultDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total Label matching Screen 8 */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 block leading-none">
                {data?.total_focus_hours || 42}h
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Total</span>
            </div>
          </div>

          {/* Category Mini Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-600">
            {(data?.time_distribution || defaultDistribution).map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 3 Insight Cards (Screen 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Insight 1
          </span>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            Your most productive time: 9 AM - 12 PM
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            +40% Focus efficiency
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Insight 2
          </span>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            You complete tasks 32% faster than your initial estimate
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Calibrated with ML
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Insight 3
          </span>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            You work best on Tuesday & Thursday
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            Optimal cognitive flow
          </span>
        </div>
      </div>
    </div>
  );
};
