import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border-b border-sky-900/40 text-sky-200 text-xs px-4 py-2 flex items-center justify-between shadow-inner">
      <div className="flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="font-medium text-cyan-300">SIMULATION ONLY:</span>
        <span className="text-slate-300 hidden md:inline">No production hospital infrastructure is modified. All changes strictly simulated.</span>
      </div>
      <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="truncate">Synthetic 90-day hospital dataset & simulated cloud pricing</span>
      </div>
    </div>
  );
};
