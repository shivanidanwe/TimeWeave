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
  Heart,
  Sliders,
  Flame,
  Check,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">TimeWeave</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">How It Works</a>
            <a href="#benefits" className="hover:text-indigo-600 transition">Benefits</a>
            <a href="#preview" className="hover:text-indigo-600 transition">Dashboard</a>
            <a href="#about" className="hover:text-indigo-600 transition">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl w-full mx-auto px-6 pt-12 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#6366F1] text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Adaptive Personal Time &amp; Workload Optimizer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-4xl">
          Plan Smarter. <br className="hidden sm:inline" />
          Work Better. <br className="hidden sm:inline" />
          <span className="text-[#6366F1] bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Live Balanced.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          TimeWeave learns from your real task history to predict realistic durations, detect overcommitment before burnout, and create constraint-optimized daily schedules that adapt to your personal energy rhythms.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-7 py-3.5 text-base font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#how-it-works"
            className="px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-xs flex items-center gap-2 transition"
          >
            <span>See How It Works</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Hero Illustration (Person planning their day with adaptive schedule) */}
        <div className="mt-12 w-full max-w-4xl relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white">
          <img
            src="/assets/hero-planner.svg"
            alt="Person planning their day with adaptive timeline, duration prediction, and workload balance metrics in TimeWeave"
            loading="lazy"
            className="w-full h-auto object-cover max-h-[520px]"
          />
        </div>
      </section>

      {/* 3. Core Feature Cards Section */}
      <section id="features" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-[#6366F1] uppercase tracking-wider">Intelligent Features</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Everything You Need for Realistic Scheduling
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Moving beyond static to-do lists to machine learning estimation and constraint-based scheduling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: AI Scheduling */}
            <div className="p-6 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">AI Scheduling Engine</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Constraint-based optimizer schedules your tasks around working hours, deadlines, dependencies, and cognitive recovery breaks.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-4 flex items-center gap-1">
                Zero Overlaps Guaranteed →
              </span>
            </div>

            {/* Card 2: Duration Prediction */}
            <div className="p-6 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Task Duration Prediction</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Scikit-learn Random Forest regression calibrates duration estimates using your actual completed task velocity without target leakage.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 mt-4 flex items-center gap-1">
                94% Accurate Confidence Bounds →
              </span>
            </div>

            {/* Card 3: Workload Balancing */}
            <div className="p-6 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-rose-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Workload Balancing</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Early overcommitment detection sounds the alarm when planned hours exceed working capacity, proposing realistic deferrals.
                </p>
              </div>
              <span className="text-xs font-bold text-rose-600 mt-4 flex items-center gap-1">
                Burnout Protection Active →
              </span>
            </div>

            {/* Card 4: Personalized Planning */}
            <div className="p-6 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-purple-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Personalized Energy Planning</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Aligns high-focus tasks with your natural peak energy windows (morning, afternoon, or evening) and shifts lighter tasks automatically.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 mt-4 flex items-center gap-1">
                Syncs with Natural Rhythm →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three-Step Workflow: How It Works */}
      <section id="how-it-works" className="py-20 max-w-7xl w-full mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-[#6366F1] uppercase tracking-wider">Simple 3-Step Workflow</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            How TimeWeave Optimizes Your Workday
          </p>
          <p className="text-sm text-slate-500 mt-2">
            An adaptive feedback loop that gets smarter with every completed task.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm relative flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-indigo-500/20">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Add Tasks &amp; Goals</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Create your tasks with priority, category, deadline, and energy requirement. TimeWeave provides instant ML duration estimates based on historical patterns.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm relative flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#06B6D4] text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-teal-500/20">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Generate Feasible Schedule</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              One click runs the constraint optimizer. It packs tasks into available hours, positions breaks, detects overload, and produces a preview you can review and accept.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm relative flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-emerald-500/20">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Focus &amp; Adaptive Learning</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Track focus sessions with timestamp recovery. When you complete tasks, actual durations calibrate future ML predictions to make tomorrow even smoother.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Benefits Section with Work-Life Balance & Smart Calendar Visuals */}
      <section id="benefits" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl w-full mx-auto px-6 space-y-16">
          {/* Benefit 1: Balanced Work and Personal Life */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold inline-block">
                Work-Life Harmony
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Productive Work Sprints Without Sacrificing Downtime
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Most scheduling apps overload your calendar until burnout strikes. TimeWeave enforces strict working-hour boundaries, protects your lunch and breaks, and keeps personal evenings peaceful.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Mandatory 30-minute cognitive reset after continuous deep work</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dedicated exercise, hobby, and health blocks protected daily</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Early overcommitment alerts prevent impossible workloads</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-slate-50">
              <img
                src="/assets/work-life-balance.svg"
                alt="TimeWeave Work-Life Harmony illustration balancing deep work sprints with restorative living"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Benefit 2: Smart Calendar & Timetable Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
            <div className="lg:col-span-7 order-2 lg:order-1 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-slate-50">
              <img
                src="/assets/smart-calendar.svg"
                alt="TimeWeave Adaptive Calendar Timetable with energy-aware task blocks and breaks"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold inline-block">
                Constraint-Based Scheduling
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                A Calendar That Actively Protects Your Focus
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Color-coded categories, dependency chains, and real-time conflict indicators give you complete clarity on how each day unfolds. Reschedule easily after unexpected interruptions.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6366F1] shrink-0" />
                  <span>Daily, weekly, and monthly timetable views with time block editing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6366F1] shrink-0" />
                  <span>Real-time duration tracking and interruption recovery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6366F1] shrink-0" />
                  <span>Generates preview schedules before committing any changes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Product Preview (Real Dashboard Design) */}
      <section id="preview" className="py-20 max-w-7xl w-full mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto mb-12">
          <span className="px-3 py-1 bg-indigo-50 text-[#6366F1] border border-indigo-200 rounded-full text-xs font-bold inline-block mb-3">
            Product Experience
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Real Analytics &amp; Personal Productivity Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every displayed metric comes directly from your real records in PostgreSQL, visualized with clean pastel aesthetics.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white max-w-5xl mx-auto">
          <img
            src="/assets/dashboard-preview.svg"
            alt="Real TimeWeave Dashboard preview with KPI metrics, task lists, and weekly completion trends"
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* 7. Call To Action Banner */}
      <section className="bg-gradient-to-tr from-[#1E1B4B] via-[#312E81] to-[#4338CA] py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take Control of Your Time?
          </h2>
          <p className="text-base text-indigo-200 max-w-xl mx-auto">
            Join TimeWeave today. Start with zero-configuration, set your preferred hours, and experience adaptive personal scheduling.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-bold text-sm shadow-xl transition active:scale-95"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-400/30 rounded-2xl font-bold text-sm transition"
            >
              Sign In to Your Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer id="about" className="bg-[#0F172A] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>TimeWeave</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adaptive Personal Time and Workload Optimizer. Machine learning duration regression, constraint satisfaction scheduling, and cognitive burnout prevention.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#benefits" className="hover:text-white transition">Benefits</a></li>
              <li><a href="#preview" className="hover:text-white transition">Dashboard Preview</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Technology</h3>
            <ul className="space-y-2 text-xs">
              <li><span>React 19 &amp; Vite</span></li>
              <li><span>Node.js Express REST API</span></li>
              <li><span>PostgreSQL 15+ &amp; Migrations</span></li>
              <li><span>Python FastAPI &amp; Scikit-Learn</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Security &amp; Privacy</h3>
            <ul className="space-y-2 text-xs">
              <li><span>bcrypt Password Hashing</span></li>
              <li><span>JWT-based Authentication</span></li>
              <li><span>User Data Isolation</span></li>
              <li><span>Zero Cross-User ML Leakage</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 TimeWeave — Adaptive Personal Time and Workload Optimizer. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
