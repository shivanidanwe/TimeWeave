import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Heart,
  Palette,
  MoreHorizontal,
  Clock,
  ArrowRight,
  ArrowLeft,
  Zap,
  Coffee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OnboardingPage: React.FC = () => {
  const { updatePreferences } = useAuth();
  const navigate = useNavigate();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Study / Learning', 'Work / Job']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [energyPreference, setEnergyPreference] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Flexible'>('Morning');
  const [breakDuration, setBreakDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalOptions = [
    { id: 'Study / Learning', label: 'Study / Learning', icon: GraduationCap, color: 'text-blue-500 bg-blue-50' },
    { id: 'Work / Job', label: 'Work / Job', icon: Briefcase, color: 'text-teal-500 bg-teal-50' },
    { id: 'Personal Projects', label: 'Personal Projects', icon: Lightbulb, color: 'text-amber-500 bg-amber-50' },
    { id: 'Fitness & Health', label: 'Fitness & Health', icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { id: 'Hobbies', label: 'Hobbies', icon: Palette, color: 'text-purple-500 bg-purple-50' },
    { id: 'Other', label: 'Other', icon: MoreHorizontal, color: 'text-slate-500 bg-slate-50' }
  ];

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSaveAndContinue = async () => {
    setIsSubmitting(true);
    try {
      await updatePreferences({
        work_start_time: startTime,
        work_end_time: endTime,
        energy_preference: energyPreference,
        break_duration: breakDuration,
        daily_capacity_minutes: 480
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF]/30 flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">TimeWeave</span>
      </div>

      {/* Main Container Card (Screen 3) */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-indigo-500/5">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1.5 flex-1 rounded-full bg-[#6366F1]"></div>
          <div className="h-1.5 flex-1 rounded-full bg-[#6366F1]"></div>
          <div className="h-1.5 flex-1 rounded-full bg-slate-200"></div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Let's Personalize Your Experience
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Help us understand you better to create smarter schedules.
          </p>
        </div>

        {/* Section 1: Goals */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-800 mb-3">
            What are your goals?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {goalOptions.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#6366F1] bg-indigo-50/50 shadow-sm ring-1 ring-[#6366F1]'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${goal.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {goal.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Preferred Working Hours */}
        <div className="mb-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
          <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Your preferred working hours</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1">Start time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1">End time</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Energy Peak & Break */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Peak Energy Window</span>
            </label>
            <select
              value={energyPreference}
              onChange={(e: any) => setEnergyPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Morning">Morning (09:00 AM - 12:00 PM)</option>
              <option value="Afternoon">Afternoon (01:00 PM - 05:00 PM)</option>
              <option value="Evening">Evening (06:00 PM - 10:00 PM)</option>
              <option value="Flexible">Flexible / Balanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-indigo-500" />
              <span>Preferred Break Duration</span>
            </label>
            <select
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="15">15 mins (Quick Refresh)</option>
              <option value="30">30 mins (Standard Restorative)</option>
              <option value="45">45 mins (Extended Pause)</option>
            </select>
          </div>
        </div>

        {/* Footer Navigation Buttons (Screen 3) */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Saving...' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
