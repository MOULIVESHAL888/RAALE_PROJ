import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  PlayCircle,
  GitCompare,
  Sliders,
  Sparkles,
  CheckSquare,
  History,
  RotateCcw,
  BarChart3,
  MessageSquare,
  BookOpen,
  ClipboardCheck,
  LogIn
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resources', label: 'Resources Inventory', icon: Server },
    { to: '/simulation', label: 'Rightsizing Simulator', icon: PlayCircle },
    { to: '/scenario-comparison', label: 'Scenario Comparison', icon: GitCompare },
    { to: '/sensitivity', label: 'Sensitivity Analysis', icon: Sliders },
    { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/changes', label: 'Change Review', icon: CheckSquare },
    { to: '/audit', label: 'Audit Trail', icon: History },
    { to: '/rollback-history', label: 'Rollback History', icon: RotateCcw },
    { to: '/experiment-results', label: 'Experiment Results', icon: BarChart3 },
    { to: '/feedback', label: 'Stakeholder Feedback', icon: MessageSquare },
    { to: '/ethics', label: 'Ethics & Methodology', icon: BookOpen },
    { to: '/checklist', label: 'Deployment Checklist', icon: ClipboardCheck },
    { to: '/login', label: 'User Roles & Login', icon: LogIn },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 shrink-0 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Core Simulator Pages
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 shadow-sm shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 p-3 rounded-lg bg-slate-850 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Hospital Cloud Group</div>
        <div>Multi-Account AWS Infrastructure</div>
        <div className="text-[10px] text-slate-500 pt-1">8 Core Department Services</div>
      </div>
    </aside>
  );
};
