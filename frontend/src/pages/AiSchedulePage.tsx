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
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { ScheduleGenerationResult, ScheduleBlock } from '../types';

export const AiSchedulePage: React.FC = () => {
  const { tasks } = useTasks();

  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
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

  const recommendations = scheduleResult?.recommendations || [];
  const isOvercommitted = scheduleResult?.status === 'Overcommitted' || (scheduleResult?.utilization_percentage || 0) > 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header matching Screen 7 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Schedule Recommendations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {recommendations.length} Optimizations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Optimized Schedule • Generated using Scikit-Learn predictions and constraint solver
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-xs"
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

      {/* Smart Optimizations Cards */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Smart Optimizations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec, idx) => {
              const isApplied = appliedSuggestions.includes(idx);
              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {rec.title}
                      </p>
                    </div>
                    {rec.impact && (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {rec.impact}
                      </span>
                    )}
                    {rec.description && (
                      <p className="text-xs text-slate-500 mt-2">{rec.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleApplySuggestion(idx)}
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
      )}

      {/* Dynamic Workload Status Banner */}
      {isOvercommitted ? (
        /* Overcommitment Alert Box */
        <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Overcommitment Warning: {scheduleResult?.utilization_percentage}% Workload Planned
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Requested tasks require {scheduleResult?.total_requested_minutes || scheduleResult?.planned_work_minutes}m, which exceeds your working capacity by {scheduleResult?.overload_minutes || 30}m.
                {scheduleResult?.unscheduled_tasks?.length ? ` ${scheduleResult.unscheduled_tasks.length} task(s) could not be safely placed.` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowOvercommitmentModal(true)}
            className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-700 text-xs font-bold rounded-xl transition self-start sm:self-auto shrink-0 shadow-xs"
          >
            View Unscheduled Tasks ({scheduleResult?.unscheduled_tasks?.length || 0})
          </button>
        </div>
      ) : (
        /* Balanced Workload Banner */
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Workload Feasible &amp; Balanced ({scheduleResult?.utilization_percentage || 0}% Capacity)
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                All planned tasks fit comfortably within your working day with {scheduleResult?.free_capacity_minutes || 0}m free capacity remaining.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Schedule Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recommended Daily Timeline ({targetDate})
            </h2>
            <p className="text-xs text-slate-500">
              Planned Work: {scheduleResult?.planned_work_minutes || 0}m • Free Capacity: {scheduleResult?.free_capacity_minutes || 0}m • Break Time: {scheduleResult?.break_minutes || 0}m
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAccepted ? (
              <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Schedule Saved &amp; Active</span>
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

        {/* Timeline Blocks */}
        <div className="space-y-3">
          {scheduleResult?.scheduled_blocks && scheduleResult.scheduled_blocks.length > 0 ? (
            scheduleResult.scheduled_blocks.map((b, idx) => (
              <div
                key={b.id || idx}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  b.block_type === 'break'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-white border-slate-200 hover:border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500 w-24 shrink-0">
                    {b.start_time_display || b.start_at}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{b.title}</span>
                      {b.block_type === 'break' && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                    </h3>
                    {b.reason && <p className="text-xs text-slate-500 mt-0.5">{b.reason}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {b.duration_minutes}m
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No tasks to schedule. Create pending tasks to generate an optimized daily timetable.
            </div>
          )}
        </div>
      </div>

      {/* Overcommitment Modal */}
      {showOvercommitmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <span>Unscheduled Tasks Due to Capacity Limits</span>
              </h3>
              <button
                onClick={() => setShowOvercommitmentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {scheduleResult?.unscheduled_tasks && scheduleResult.unscheduled_tasks.length > 0 ? (
                scheduleResult.unscheduled_tasks.map((u, i) => (
                  <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-rose-900">{u.title}</p>
                    <p className="text-[11px] text-rose-700">{u.unscheduled_reason || 'Working day capacity exceeded'}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">All tasks were successfully placed.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowOvercommitmentModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
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
