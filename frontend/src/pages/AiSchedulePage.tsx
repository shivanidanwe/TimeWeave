import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  RefreshCw,
  Sliders,
  Layers,
  Zap,
  Coffee,
  AlertTriangle
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { ScheduleGenerationResult, ScheduleBlock } from '../types';

export const AiSchedulePage: React.FC = () => {
  const { tasks } = useTasks();

  const [targetDate, setTargetDate] = useState('2026-09-24');
  const [scheduleResult, setScheduleResult] = useState<ScheduleGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<number[]>([]);
  const [showOvercommitmentModal, setShowOvercommitmentModal] = useState(false);

  const generateSchedule = async (dateStr: string) => {
    setIsGenerating(true);
    setIsAccepted(false);
    try {
      const data = await api.generateSchedule(dateStr);
      setScheduleResult(data);
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateSchedule(targetDate);
  }, [targetDate]);

  const handleApplySuggestion = (idx: number) => {
    setAppliedSuggestions(prev => [...prev, idx]);
  };

  const handleAcceptSchedule = async () => {
    if (!scheduleResult?.schedule_version_id) return;
    setIsAccepting(true);
    try {
      await api.acceptSchedule(scheduleResult.schedule_version_id);
      setIsAccepted(true);
    } catch (err) {
      console.error('Failed to accept schedule:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const suggestions = [
    {
      id: 0,
      title: "Move 'Research Paper Reading' from 2:00 PM to 11:00 AM",
      benefit: "Better energy match (+40% focus)",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: 1,
      title: "Add 30 min break after 2 hours",
      benefit: "Improves productivity (+25%)",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      id: 2,
      title: "Reschedule 'Gym' to 5:00 PM",
      benefit: "Lower conflict with other tasks",
      color: "bg-purple-50 text-purple-700 border-purple-200"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header matching Screen 7 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Schedule Recommendations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              3 Suggestions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Optimized Schedule for Tomorrow • Based on your past data and current workload
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          />
          <button
            onClick={() => generateSchedule(targetDate)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* 3 Interactive Recommendations matching Screen 7 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Smart Optimizations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((s) => {
            const isApplied = appliedSuggestions.includes(s.id);
            return (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {s.title}
                    </p>
                  </div>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {s.benefit}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleApplySuggestion(s.id)}
                    disabled={isApplied}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isApplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overcommitment Alert Box matching Screen 7 */}
      <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">Overcommitment Alert</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              You have 120% workload on Wednesday. Consider moving 2 tasks to other days.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowOvercommitmentModal(true)}
          className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-700 text-xs font-bold rounded-xl transition self-start sm:self-auto shrink-0"
        >
          View Options
        </button>
      </div>

      {/* Recommended Schedule Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recommended Daily Timeline ({targetDate})
            </h2>
            <p className="text-xs text-slate-500">
              Planned Work: {scheduleResult?.planned_work_minutes || 0}m • Free Capacity: {scheduleResult?.free_capacity_minutes || 0}m
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAccepted ? (
              <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Schedule Active</span>
              </span>
            ) : (
              <button
                onClick={handleAcceptSchedule}
                disabled={isAccepting || !scheduleResult}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isAccepting ? 'Saving...' : 'Accept & Save Schedule'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedule Blocks */}
        <div className="space-y-2.5">
          {scheduleResult?.scheduled_blocks && scheduleResult.scheduled_blocks.length > 0 ? (
            scheduleResult.scheduled_blocks.map((block, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition bg-slate-50/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-16 shrink-0">
                    {block.start_at}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {block.title}
                    </p>
                    {block.reason && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {block.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {block.duration_minutes}m
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {block.category || 'Task'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Click Regenerate to propose a new schedule.
            </div>
          )}
        </div>
      </div>

      {/* Overcommitment Options Modal */}
      {showOvercommitmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Overcommitment Resolution</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Wednesday has 6.5 hours of planned work against a 5-hour available window.
              Recommended actions:
            </p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  alert('Moved "Grocery Shopping" to Thursday.');
                  setShowOvercommitmentModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition font-medium"
              >
                1. Move 1 low-priority task (Grocery Shopping) to Thursday
              </button>
              <button
                onClick={() => {
                  alert('Compressed research session to 45m.');
                  setShowOvercommitmentModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition font-medium"
              >
                2. Compress Research Paper reading from 90m to 45m
              </button>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowOvercommitmentModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
