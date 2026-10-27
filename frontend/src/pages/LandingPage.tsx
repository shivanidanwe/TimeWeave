import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  Clock,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TimeWeave</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
          <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          <a href="#about" className="hover:text-indigo-600 transition">About</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-white transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section matching Screen 1 */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 pt-12 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Adaptive Scheduling Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-3xl">
          Plan Smarter. <br className="hidden sm:inline" />
          Work Better. <br className="hidden sm:inline" />
          <span className="text-[#6366F1]">Live Balanced.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          An intelligent personal scheduling app that learns from your habits, estimates task duration, detects overcommitment and creates realistic schedules for you.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-7 py-3.5 text-base font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login"
            className="px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm flex items-center gap-2 transition"
          >
            <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            <span>Watch Demo</span>
          </Link>
        </div>

        {/* Hero Visual Mockup with Floating Badges (Screen 1) */}
        <div className="mt-14 relative w-full max-w-4xl bg-gradient-to-b from-indigo-50/50 to-white p-6 sm:p-10 rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
          {/* Floating Pastel Pills matching Reference */}
          <div className="absolute top-6 left-8 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hidden sm:flex items-center gap-1.5 animate-bounce" style={{ animationDuration: '4s' }}>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Study • ML Lecture</span>
          </div>

          <div className="absolute top-12 right-10 bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hidden sm:flex items-center gap-1.5 animate-bounce" style={{ animationDuration: '5s' }}>
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>Work • API Sprint</span>
          </div>

          <div className="absolute bottom-8 left-12 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hidden sm:flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-emerald-500" />
            <span>Gym Workout • 45m</span>
          </div>

          <div className="absolute bottom-10 right-14 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>AI Optimized Schedule</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-md mx-auto text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Today's Schedule</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Realistic & Balanced
              </span>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="font-semibold text-indigo-900">09:00 AM — Machine Learning Lecture</span>
                <span className="text-xs text-indigo-700 font-bold">1h</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/60 border border-teal-100">
                <span className="font-semibold text-teal-900">10:30 AM — Project Development</span>
                <span className="text-xs text-teal-700 font-bold">1h 30m</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="font-semibold text-amber-900">01:00 PM — Restorative Lunch Break</span>
                <span className="text-xs text-amber-700 font-bold">45m</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bottom Feature Highlights matching Screen 1 */}
        <div id="features" className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">AI Powered Scheduling</h3>
            <p className="text-xs text-slate-500 mt-1">
              Constraint-based optimizer respects deadlines, energy cycles, and breaks.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Predicts Task Duration</h3>
            <p className="text-xs text-slate-500 mt-1">
              Scikit-learn model calibrates predictions using historical task velocity.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Detects Overcommitment</h3>
            <p className="text-xs text-slate-500 mt-1">
              Warns early when planned workload exceeds realistic working capacity.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Adapts to Your Lifestyle</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dynamically reschedules after interruptions, unexpected delays, or early finishes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © 2026 TimeWeave — Adaptive Personal Time and Workload Optimizer. All rights reserved.
      </footer>
    </div>
  );
};
