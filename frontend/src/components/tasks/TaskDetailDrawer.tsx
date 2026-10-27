import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  Sparkles,
  Play,
  Square,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Layers,
  Flame
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const TaskDetailDrawer: React.FC = () => {
  const {
    selectedTaskDetail,
    closeTaskDetail,
    startTimer,
    stopTimer,
    completeTask,
    deleteTask,
    recordInterruption,
    activeTimerTaskId,
    timerSeconds
  } = useTasks();

  const [interruptionReason, setInterruptionReason] = useState('');
  const [interruptionMinutes, setInterruptionMinutes] = useState(10);
  const [showInterruptionForm, setShowInterruptionForm] = useState(false);

  if (!selectedTaskDetail) return null;

  const t = selectedTaskDetail;
  const isTimerActive = activeTimerTaskId === t.id;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const categoryPills: Record<string, { bg: string; text: string }> = {
    Study: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    Work: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
    Personal: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    Health: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    Other: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' }
  };

  const priorityPills: Record<string, { bg: string; text: string }> = {
    Critical: { bg: 'bg-rose-100 text-rose-800', text: 'text-rose-700' },
    High: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600' },
    Medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
    Low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' }
  };

  const catStyle = categoryPills[t.category] || categoryPills['Other'];
  const prioStyle = priorityPills[t.priority] || priorityPills['Medium'];

  const handleInterruptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interruptionReason.trim()) return;
    await recordInterruption(t.id, interruptionReason, interruptionMinutes);
    setInterruptionReason('');
    setShowInterruptionForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${catStyle.bg} ${catStyle.text}`}>
              {t.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${prioStyle.bg}`}>
              {t.priority}
            </span>
          </div>
          <button
            onClick={closeTaskDetail}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{t.title}</h1>
            {t.description && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {t.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block mb-1">Estimated Time</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{t.user_estimated_minutes || 60}m</span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <span className="text-xs text-indigo-700 font-semibold block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>ML Predicted</span>
              </span>
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-sm">
                <span>{t.current_predicted_minutes || t.user_estimated_minutes || 60}m</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block mb-1">Time Spent</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{t.actual_duration_minutes || 0}m</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block mb-1">Deadline</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs truncate">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{t.deadline ? t.deadline.split(' ')[0] : 'None'}</span>
              </div>
            </div>
          </div>

          {/* Timer Action Block */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Focus Session Timer
              </span>
              {isTimerActive && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight">
                  {isTimerActive ? formatTimer(timerSeconds) : '00:00'}
                </p>
                <span className="text-xs text-slate-400">
                  {isTimerActive ? 'Tracking active focus' : 'Ready to begin session'}
                </span>
              </div>

              {isTimerActive ? (
                <button
                  onClick={() => stopTimer(t.id)}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => startTimer(t.id)}
                  className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Focus</span>
                </button>
              )}
            </div>
          </div>

          {/* Record Interruption Trigger */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interruptions & Log
              </span>
              <button
                type="button"
                onClick={() => setShowInterruptionForm(!showInterruptionForm)}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                {showInterruptionForm ? 'Cancel' : '+ Record Interruption'}
              </button>
            </div>

            {showInterruptionForm && (
              <form onSubmit={handleInterruptionSubmit} className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <input
                  type="text"
                  placeholder="Reason (e.g. Urgent Slack message, Phone call)"
                  value={interruptionReason}
                  onChange={(e) => setInterruptionReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={interruptionMinutes}
                    onChange={(e) => setInterruptionMinutes(parseInt(e.target.value, 10) || 5)}
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-xs text-slate-500">minutes delayed</span>
                  <button
                    type="submit"
                    className="ml-auto bg-slate-800 text-white text-xs px-3 py-1 rounded-lg font-medium hover:bg-slate-900"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.confirm('Delete this task?')) {
                deleteTask(t.id);
              }
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => completeTask(t.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Completed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
