import React from 'react';
import { Activity, UserCheck, ShieldCheck } from 'lucide-react';

interface Props {
  currentUser: string;
  onUserChange: (user: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentUser, onUserChange }) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Hospital Cloud Operations
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              v1.0-PROTOTYPE
            </span>
          </h1>
          <p className="text-xs text-slate-400">Performance-Safe Infrastructure Rightsizing Simulator</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-2 text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SLA Safety Engine Active</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">User:</span>
          <select
            value={currentUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="cloud.engineer" className="bg-slate-900 text-slate-200">Cloud Engineer (Default)</option>
            <option value="admin" className="bg-slate-900 text-slate-200">System Admin</option>
            <option value="reviewer" className="bg-slate-900 text-slate-200">FinOps Reviewer</option>
            <option value="viewer" className="bg-slate-900 text-slate-200">Hospital Viewer</option>
          </select>
        </div>
      </div>
    </header>
  );
};
