import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Flame,
  ShieldCheck,
  Coffee,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export const FocusPage: React.FC = () => {
  const { tasks, completeTask, recordInterruption } = useTasks();

  const [mode, setMode] = useState<'pomodoro' | 'custom' | 'stopwatch'>('pomodoro');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(4);
  const [distractionsCount, setDistractionsCount] = useState(0);

  // Set default task if available
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setPomodorosCompleted((prev) => prev + 1);
      alert('Focus session complete! Take a restorative break.');
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialMinutes * 60);
  };

  const skipTimer = () => {
    setIsRunning(false);
    setSecondsLeft(5 * 60); // 5 min break
  };

  const handleModeChange = (newMode: 'pomodoro' | 'custom' | 'stopwatch') => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'pomodoro') {
      setInitialMinutes(25);
      setSecondsLeft(25 * 60);
    } else if (newMode === 'custom') {
      setInitialMinutes(50);
      setSecondsLeft(50 * 60);
    } else {
      setInitialMinutes(0);
      setSecondsLeft(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAddDistraction = async () => {
    setDistractionsCount(prev => prev + 1);
    if (selectedTaskId) {
      await recordInterruption(selectedTaskId, 'Quick distraction in focus mode', 5);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#090D16] text-white p-6 sm:p-12 min-h-[750px] flex flex-col items-center justify-between shadow-2xl border border-indigo-900/40 animate-in fade-in duration-300">
      {/* Ambient Lighting Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header (Screen 9) */}
      <div className="text-center z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Deep Flow Zone</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Focus Mode</h1>
        <p className="text-sm text-slate-400">Stay focused. You can do it!</p>

        {/* Mode Tabs: [Pomodoro] [Custom] [Stopwatch] */}
        <div className="inline-flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mt-4 text-xs font-bold">
          <button
            onClick={() => handleModeChange('pomodoro')}
            className={`px-5 py-2 rounded-xl transition ${
              mode === 'pomodoro' ? 'bg-[#6366F1] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-5 py-2 rounded-xl transition ${
              mode === 'custom' ? 'bg-[#6366F1] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleModeChange('stopwatch')}
            className={`px-5 py-2 rounded-xl transition ${
              mode === 'stopwatch' ? 'bg-[#6366F1] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stopwatch
          </button>
        </div>
      </div>

      {/* Linked Task Selector */}
      {tasks.length > 0 && (
        <div className="z-10 w-full max-w-sm mt-4">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                Working on: {t.title} ({t.category})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Large Circular Timer (Screen 9) */}
      <div className="z-10 my-8 relative flex items-center justify-center">
        {/* Glow Ring */}
        <div className={`w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-indigo-500/20 flex flex-col items-center justify-center relative transition-all ${
          isRunning ? 'shadow-[0_0_50px_rgba(99,102,241,0.25)] border-indigo-500/40' : ''
        }`}>
          {/* Progress Ring Indicator */}
          <div className="absolute inset-2 rounded-full border border-dashed border-indigo-400/20"></div>

          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold mt-2">
            {isRunning ? 'Focus' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Control Buttons (Screen 9) */}
      <div className="z-10 flex items-center gap-4">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700 active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transition active:scale-90"
        >
          {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white translate-x-0.5" />}
        </button>

        <button
          onClick={skipTimer}
          className="w-12 h-12 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700 active:scale-95"
          title="Skip to break"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom 3 Stats Badges (Screen 9) */}
      <div className="z-10 mt-10 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg border-t border-slate-800/80 pt-6 text-center">
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          <span className="text-xl sm:text-2xl font-extrabold text-white block">
            {pomodorosCompleted}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">Pomodoros</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          <span className="text-xl sm:text-2xl font-extrabold text-indigo-400 block">
            2h
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">Focus Time</span>
        </div>

        <div
          onClick={handleAddDistraction}
          className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-indigo-500/50 transition group"
          title="Click to record an interruption"
        >
          <span className="text-xl sm:text-2xl font-extrabold text-rose-400 block">
            {distractionsCount}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold group-hover:text-rose-300">
            + Distraction
          </span>
        </div>
      </div>
    </div>
  );
};
