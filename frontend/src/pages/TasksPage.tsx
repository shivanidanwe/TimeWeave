import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Play,
  Square,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    openTaskModal,
    completeTask,
    deleteTask,
    startTimer,
    stopTimer,
    activeTimerTaskId,
    openTaskDetail,
    isLoading
  } = useTasks();

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedPriority, setSelectedPriority] = useState('Priority');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // 1. Tab filter
    if (activeTab === 'completed' && t.status !== 'Completed') return false;
    if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      const match = t.deadline?.includes(today) || t.created_at?.includes(today);
      if (!match) return false;
    }
    if (activeTab === 'upcoming' && t.status === 'Completed') return false;

    // 2. Category filter
    if (selectedCategory !== 'All Categories' && t.category !== selectedCategory) return false;

    // 3. Priority filter
    if (selectedPriority !== 'Priority' && t.priority !== selectedPriority) return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  const categoryPills: Record<string, string> = {
    Study: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Work: 'bg-teal-50 text-teal-700 border-teal-200',
    Personal: 'bg-purple-50 text-purple-700 border-purple-200',
    Health: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Other: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const priorityPills: Record<string, string> = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-300',
    High: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return 'No deadline';
    const date = new Date(deadlineStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header (Screen 5) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your daily tasks, durations, and priorities
          </p>
        </div>

        <button
          onClick={openTaskModal}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs (Screen 5: All Tasks | Today | Upcoming | Completed) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'today', label: 'Today' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-[#6366F1] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Dropdowns Filter Bar (Screen 5) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option>All Categories</option>
            <option>Study</option>
            <option>Work</option>
            <option>Personal</option>
            <option>Health</option>
            <option>Other</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option>Priority</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* Task List Table (Screen 5) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              const catClass = categoryPills[task.category] || categoryPills['Other'];
              const prioClass = priorityPills[task.priority] || priorityPills['Medium'];
              const isTimerRunning = activeTimerTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition ${
                    isCompleted ? 'bg-slate-50/40 opacity-70' : ''
                  }`}
                >
                  {/* Left: Checkbox & Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => completeTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
                      <p
                        className={`text-sm font-bold text-slate-800 truncate hover:text-[#6366F1] transition ${
                          isCompleted ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right Badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Category Pill */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catClass}`}>
                      {task.category}
                    </span>

                    {/* Deadline */}
                    <span className="text-xs font-semibold text-slate-500 hidden md:inline-block w-28 text-center">
                      {formatDeadline(task.deadline)}
                    </span>

                    {/* Duration with ML indicator */}
                    <div className="text-xs text-slate-600 font-semibold hidden sm:flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{task.current_predicted_minutes || task.user_estimated_minutes || 60}m</span>
                    </div>

                    {/* Priority Pill */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${prioClass}`}>
                      {task.priority}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {isTimerRunning ? (
                        <button
                          onClick={() => stopTimer(task.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Stop focus timer"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      ) : (
                        !isCompleted && (
                          <button
                            onClick={() => startTimer(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Start focus timer"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )
                      )}

                      <button
                        onClick={() => openTaskDetail(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Task details"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">No tasks found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All Categories'
                ? 'Try clearing your search query or filter tags to see all tasks.'
                : 'Create your first task to see AI duration estimates and realistic schedules.'}
            </p>
            <button
              onClick={openTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6366F1] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#4F46E5] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
