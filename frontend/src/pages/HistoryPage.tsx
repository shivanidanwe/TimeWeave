import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Filter
} from 'lucide-react';
import { api } from '../api/client';

export const HistoryPage: React.FC = () => {
  const [historyData, setHistoryData] = useState<{ events: any[]; completed_tasks: any[] }>({
    events: [],
    completed_tasks: []
  });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getHistory(categoryFilter !== 'All' ? { category: categoryFilter } : {})
      .then(res => setHistoryData(res))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [categoryFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Task & Schedule History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical task completions, duration variances, and model calibration audit trail
          </p>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:outline-none"
        >
          <option>All Categories</option>
          <option>Study</option>
          <option>Work</option>
          <option>Personal</option>
          <option>Health</option>
          <option>Other</option>
        </select>
      </div>

      {/* Completed Tasks Variance Calibration Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>Completed Tasks & Estimation Accuracy</span>
        </h2>

        {historyData.completed_tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Original Est.</th>
                  <th className="py-3 px-3">Predicted</th>
                  <th className="py-3 px-3">Actual Time</th>
                  <th className="py-3 px-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.completed_tasks.map((t) => {
                  const est = t.user_estimated_minutes || 60;
                  const actual = t.actual_duration_minutes || est;
                  const variance = actual - est;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">{t.title}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{est}m</td>
                      <td className="py-3 px-3 text-indigo-600 font-bold">{t.current_predicted_minutes || est}m</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{actual}m</td>
                      <td className="py-3 px-3">
                        {variance === 0 ? (
                          <span className="text-slate-400 font-semibold">Exact</span>
                        ) : variance > 0 ? (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{variance}m (under)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {variance}m (faster)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No completed task history recorded yet. Complete tasks to see personalized calibration variances!
          </div>
        )}
      </div>

      {/* Activity Event Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <span>Audit Event Log</span>
        </h2>

        {historyData.events.length > 0 ? (
          <div className="space-y-3">
            {historyData.events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <div>
                    <span className="font-bold text-slate-800 capitalize">
                      {e.event_type.replace('_', ' ')}
                    </span>
                    {e.task_title && (
                      <span className="text-slate-500 ml-1.5">• {e.task_title}</span>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{e.created_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No audit events found.
          </div>
        )}
      </div>
    </div>
  );
};
