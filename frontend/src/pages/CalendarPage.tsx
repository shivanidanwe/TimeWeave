import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  Plus
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { ScheduleBlock } from '../types';

export const CalendarPage: React.FC = () => {
  const { tasks, openTaskModal, openTaskDetail } = useTasks();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState('2026-09-23');
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSchedule = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const data = await api.getActiveSchedule(dateStr);
      setScheduleBlocks(data.blocks || []);
    } catch (err) {
      console.error('Failed to fetch calendar schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, tasks]);

  const daysOfWeek = [
    { day: 'Mon', date: '20', full: '2026-09-20' },
    { day: 'Tue', date: '21', full: '2026-09-21' },
    { day: 'Wed', date: '22', full: '2026-09-22' },
    { day: 'Thu', date: '23', full: '2026-09-23' },
    { day: 'Fri', date: '24', full: '2026-09-24' },
    { day: 'Sat', date: '25', full: '2026-09-25' },
    { day: 'Sun', date: '26', full: '2026-09-26' }
  ];

  const timeSlots = [
    '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'
  ];

  // Map category to pastel colors matching Screen 6
  const getEventStyle = (category?: string, blockType?: string) => {
    if (blockType === 'break' || category === 'Break') {
      return 'bg-amber-100/90 text-amber-900 border-amber-300';
    }
    switch (category) {
      case 'Study':
        return 'bg-blue-100/90 text-blue-900 border-blue-300';
      case 'Work':
        return 'bg-emerald-100/90 text-emerald-900 border-emerald-300';
      case 'Health':
        return 'bg-rose-100/90 text-rose-900 border-rose-300';
      case 'Personal':
        return 'bg-purple-100/90 text-purple-900 border-purple-300';
      default:
        return 'bg-indigo-100/90 text-indigo-900 border-indigo-300';
    }
  };

  // Convert "HH:MM" to row offset in 8 AM - 6 PM grid (8 AM = 0, 9 AM = 60, etc.)
  const getBlockOffset = (startAt: string, durationMinutes: number) => {
    const parts = startAt.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    const totalMinutes = h * 60 + m;
    const startOfGrid = 8 * 60; // 8:00 AM
    const top = Math.max(0, (totalMinutes - startOfGrid));
    const height = Math.max(30, durationMinutes);
    return { top: `${(top / 60) * 56}px`, height: `${(height / 60) * 56}px` };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Top Navigation Header (Screen 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">September 2026</h1>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setSelectedDate('2026-09-20')}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-23')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-26')}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode toggle: [Day] [Week] [Month] */}
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'day' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'week' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'month' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={openTaskModal}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Timetable and Mini-Calendar Layout (Screen 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Schedule Grid (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Day Columns Header */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-center text-xs py-3 font-semibold text-slate-600">
            <div className="text-slate-400">Time</div>
            {daysOfWeek.map((d) => {
              const isSelected = selectedDate === d.full;
              return (
                <div
                  key={d.date}
                  onClick={() => setSelectedDate(d.full)}
                  className="cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="text-[11px] text-slate-400 font-bold">{d.day}</span>
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#6366F1] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timetable Rows */}
          <div className="relative min-h-[620px] overflow-y-auto">
            {timeSlots.map((time, idx) => (
              <div key={time} className="grid grid-cols-8 h-14 border-b border-slate-100">
                <div className="text-right pr-3 -mt-2 text-[11px] font-semibold text-slate-400 select-none">
                  {time}
                </div>
                <div className="border-l border-slate-100"></div>
                <div className="border-l border-slate-100"></div>
                <div className="border-l border-slate-100"></div>
                <div className="border-l border-slate-100 bg-indigo-50/20"></div>
                <div className="border-l border-slate-100"></div>
                <div className="border-l border-slate-100"></div>
                <div className="border-l border-slate-100"></div>
              </div>
            ))}

            {/* Event Blocks positioned on selected day (column 4: Wed 23) */}
            <div className="absolute inset-0 pointer-events-none">
              {scheduleBlocks.map((b, idx) => {
                const styleOffset = getBlockOffset(b.start_at, b.duration_minutes);
                const colorClass = getEventStyle(b.category, b.block_type);
                const task = tasks.find(t => t.id === b.task_id);

                return (
                  <div
                    key={b.id || idx}
                    onClick={() => task && openTaskDetail(task)}
                    style={{
                      top: styleOffset.top,
                      height: styleOffset.height,
                      left: 'calc(12.5% * 4 + 4px)', // Wed 23 column
                      width: 'calc(12.5% - 8px)'
                    }}
                    className={`absolute rounded-xl border p-2 text-left cursor-pointer pointer-events-auto transition hover:shadow-md hover:scale-[1.02] overflow-hidden ${colorClass}`}
                  >
                    <p className="text-xs font-bold truncate leading-tight">{b.title}</p>
                    <p className="text-[10px] opacity-80 mt-0.5 truncate font-medium">
                      {b.start_at} - {b.end_at}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Mini-Calendar & Legend (Screen 6 - 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mini Calendar Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-800">September 2026</span>
              <div className="flex items-center gap-1 text-slate-400">
                <ChevronLeft className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700" />
                <ChevronRight className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700" />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
              <span className="text-slate-300">30</span>
              <span className="text-slate-300">31</span>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
              <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
              <span>20</span><span>21</span><span>22</span>
              <span className="bg-[#6366F1] text-white rounded-full font-bold">23</span>
              <span>24</span><span>25</span><span>26</span>
              <span>27</span><span>28</span><span>29</span><span>30</span>
              <span className="text-slate-300">1</span><span className="text-slate-300">2</span><span className="text-slate-300">3</span>
            </div>
          </div>

          {/* Task Categories Legend (Screen 6) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Task Categories
            </h3>
            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Study</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Work</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span>Personal</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>Health</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Other</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
