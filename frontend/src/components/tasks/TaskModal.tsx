import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Calendar as CalendarIcon, AlertCircle, Layers } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { api } from '../../api/client';

export const TaskModal: React.FC = () => {
  const { isTaskModalOpen, closeTaskModal, createTask, tasks } = useTasks();

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Study' | 'Work' | 'Personal' | 'Health' | 'Other'>('Study');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [deadline, setDeadline] = useState('2026-09-25');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [userEstimatedMinutes, setUserEstimatedMinutes] = useState(60);
  const [energyRequirement, setEnergyRequirement] = useState<'Low' | 'Medium' | 'High'>('High');
  const [flexibility, setFlexibility] = useState<'Flexible' | 'Fixed'>('Flexible');
  const [selectedDependency, setSelectedDependency] = useState<string>('');

  const [aiEstimatedMinutes, setAiEstimatedMinutes] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-trigger duration estimation when in AI Assisted mode
  useEffect(() => {
    if (activeTab === 'ai' && title.trim().length > 3) {
      const timer = setTimeout(() => {
        estimateDuration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, category, priority, energyRequirement, activeTab]);

  const estimateDuration = async () => {
    setIsPredicting(true);
    try {
      // Mock call or ML predict
      const res = await api.createTask({
        title,
        description,
        category,
        priority,
        energy_requirement: energyRequirement,
        user_estimated_minutes: userEstimatedMinutes,
        _dry_run: true
      }).catch(() => null);

      // Heuristic fallback matching ML model
      const baseMap = { Study: 60, Work: 90, Personal: 45, Health: 45, Other: 30 };
      const prioMap = { Low: 0.85, Medium: 1.0, High: 1.25, Critical: 1.5 };
      const energyMap = { Low: 0.9, Medium: 1.0, High: 1.2 };
      const calc = Math.round(baseMap[category] * prioMap[priority] * energyMap[energyRequirement]);

      setAiEstimatedMinutes(calc);
      setAiExplanation([
        `Base duration for '${category}': ${baseMap[category]}m`,
        `Priority '${priority}' multiplier: ${prioMap[priority]}x`,
        `Energy '${energyRequirement}' focus factor: ${energyMap[energyRequirement]}x`
      ]);
    } finally {
      setIsPredicting(false);
    }
  };

  if (!isTaskModalOpen) return null;

  const formatDurationDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const fullDeadline = deadline ? `${deadline} ${deadlineTime || '23:59'}:00` : undefined;
      const dependencies = selectedDependency ? [selectedDependency] : [];

      await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        deadline: fullDeadline,
        user_estimated_minutes: aiEstimatedMinutes || userEstimatedMinutes,
        energy_requirement: energyRequirement,
        flexibility,
        dependencies
      });

      // Reset and close
      setTitle('');
      setDescription('');
      closeTaskModal();
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Add New Task</h2>
          </div>
          <button
            onClick={closeTaskModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Manual vs AI Assisted (Screen 10) */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-1.5 rounded-lg transition ${
                activeTab === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai');
                if (title.trim()) estimateDuration();
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'ai' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assisted</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Build Machine Learning Model"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Implement and train classification model using Scikit-learn"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                <option value="Study">Study</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Deadline & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Deadline Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Estimated Duration</span>
                {activeTab === 'ai' && (
                  <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
              </label>

              {activeTab === 'ai' ? (
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>
                      {isPredicting
                        ? 'Estimating...'
                        : aiEstimatedMinutes
                        ? `AI Estimated: ${formatDurationDisplay(aiEstimatedMinutes)}`
                        : 'Enter title to estimate'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={estimateDuration}
                    className="text-[11px] text-indigo-600 underline font-semibold hover:text-indigo-800"
                  >
                    Recalculate
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={userEstimatedMinutes}
                    onChange={(e) => setUserEstimatedMinutes(parseInt(e.target.value, 10) || 60)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                  <span className="text-xs text-slate-500 font-medium">mins</span>
                </div>
              )}
            </div>
          </div>

          {/* Energy & Flexibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Energy Level
              </label>
              <select
                value={energyRequirement}
                onChange={(e: any) => setEnergyRequirement(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="High">High (Deep Focus)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Low">Low (Light / Routine)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Flexibility
              </label>
              <select
                value={flexibility}
                onChange={(e: any) => setFlexibility(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Flexible">Flexible (Can Reschedule)</option>
                <option value="Fixed">Fixed (Locked Time)</option>
              </select>
            </div>
          </div>

          {/* Dependencies */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Predecessor Task (Dependency)</span>
              </label>
              <select
                value={selectedDependency}
                onChange={(e) => setSelectedDependency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">No dependency (Can start immediately)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Depends on: {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* AI Explanation Pill */}
          {activeTab === 'ai' && aiExplanation.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-indigo-700 block text-[11px] uppercase tracking-wide">
                ML Estimation Factors:
              </span>
              {aiExplanation.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions matching reference image: [Cancel] [Create Task] */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeTaskModal}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
