import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  Plus,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { ScheduleBlock } from '../types';

export const CalendarPage: React.FC = () => {
  const { tasks, openTaskModal, openTaskDetail } = useTasks();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentBaseDate, setCurrentBaseDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

  // Compute 7 days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const base = new Date(currentBaseDate);
    const day = base.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
    const monday = new Date(base);
    monday.setDate(base.getDate() + diff);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        day: dayNames[i],
        date: String(d.getDate()),
        full: iso,
        isToday: iso === new Date().toISOString().split('T')[0]
      };
    });
  }, [currentBaseDate]);

  const monthYearLabel = currentBaseDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  const handlePrev = () => {
    const next = new Date(currentBaseDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentBaseDate(next);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const next = new Date(currentBaseDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentBaseDate(next);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentBaseDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const timeSlots = [
    '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'
  ];

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{monthYearLabel}</h1>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Next"
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
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Weekday Columns Header */}
          <div className="grid grid-cols-8 border-b border-slate-100 bg-[#F8FAFC]">
            <div className="p-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">
              Time
            </div>
            {weekDays.map((d) => {
              const isSelected = d.full === selectedDate;
              return (
                <button
                  key={d.full}
                  onClick={() => setSelectedDate(d.full)}
                  className={`p-3 text-center border-r border-slate-100 transition ${
                    isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <span className={`text-xs font-bold block ${isSelected ? 'text-[#6366F1]' : 'text-slate-500'}`}>
                    {d.day}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold mt-1 ${
                      d.isToday
                        ? 'bg-[#6366F1] text-white shadow-xs'
                        : isSelected
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-800'
                    }`}
                  >
                    {d.date}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time Rows and Schedule Blocks */}
          <div className="divide-y divide-slate-100">
            {timeSlots.map((slot) => {
              // Parse slot hour (8 to 18)
              const hourNum = parseInt(slot.split(' ')[0], 10) + (slot.includes('PM') && !slot.startsWith('12') ? 12 : 0);
              const slotBlocks = scheduleBlocks.filter((b) => {
                const bHour = parseInt(b.start_at.split(':')[0], 10);
                return bHour === hourNum;
              });

              return (
                <div key={slot} className="grid grid-cols-8 min-h-[64px]">
                  {/* Time label */}
                  <div className="p-3 border-r border-slate-100 text-xs font-semibold text-slate-400 text-right pr-4">
                    {slot}
                  </div>

                  {/* 7 Day Slots */}
                  {weekDays.map((d) => {
                    const isSelected = d.full === selectedDate;
                    const dayBlocks = isSelected ? slotBlocks : [];

                    return (
                      <div
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`p-1.5 border-r border-slate-100 space-y-1.5 ${
                          isSelected ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {dayBlocks.map((block) => {
                          const task = tasks.find((t) => t.id === block.task_id);
                          return (
                            <div
                              key={block.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task) openTaskDetail(task);
                              }}
                              className={`p-2 rounded-xl border text-xs font-bold shadow-xs cursor-pointer transition hover:scale-[1.02] ${getEventStyle(
                                block.category,
                                block.block_type
                              )}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{block.title}</span>
                                {block.block_type === 'break' && <Coffee className="w-3 h-3 shrink-0" />}
                              </div>
                              <span className="text-[10px] opacity-80 block font-semibold mt-0.5">
                                {block.start_at} ({block.duration_minutes}m)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Schedule Timeline for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {scheduleBlocks.length} planned time blocks
            </span>
          </div>

          <div className="space-y-3">
            {scheduleBlocks.length > 0 ? (
              scheduleBlocks.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${getEventStyle(
                    b.category,
                    b.block_type
                  )}`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold opacity-75">{b.start_at} – {b.end_at}</span>
                      <span className="text-sm font-bold">{b.title}</span>
                    </div>
                    {b.reason && <p className="text-xs opacity-75 italic">{b.reason}</p>}
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white/60">
                    {b.duration_minutes}m
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active schedule blocks for this date. Click 'Add Task' or go to 'AI Planner' to generate.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase pb-2 border-b border-slate-100">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentBaseDate.getFullYear()}-${String(currentBaseDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const hasTask = tasks.some(t => t.deadline?.startsWith(dateStr));

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode('day');
                  }}
                  className={`p-3 min-h-[60px] rounded-2xl border text-left flex flex-col justify-between transition ${
                    isSelected ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">{dayNum}</span>
                  {hasTask && (
                    <span className="w-2 h-2 rounded-full bg-[#6366F1] self-end"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
