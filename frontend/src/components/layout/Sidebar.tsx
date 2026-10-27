import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Sparkles,
  BarChart3,
  Bot,
  Timer,
  History,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'AI Schedule', path: '/ai-schedule', icon: Sparkles, badge: 'New' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Focus Mode', path: '/focus', icon: Timer },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800 transition-transform">
      {/* Brand Header */}
      <div className="h-18 flex items-center px-6 gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
            TimeWeave
          </span>
          <span className="text-[10px] text-indigo-400 block font-medium tracking-wide">
            ADAPTIVE OPTIMIZER
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/25 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-indigo-400/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Shivani'}
              </p>
              <span className="inline-block text-[11px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded font-medium">
                Free Plan
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
