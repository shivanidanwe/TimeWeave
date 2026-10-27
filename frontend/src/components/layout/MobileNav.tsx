import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  onOpenMore: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMore }) => {
  const tabs = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-3 py-2 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
                isActive ? 'text-[#6366F1] font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </NavLink>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>More</span>
      </button>
    </nav>
  );
};
