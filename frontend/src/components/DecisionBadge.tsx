import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, XCircle, MinusCircle } from 'lucide-react';

interface Props {
  decision: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = 'md' }) => {
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <MinusCircle className="w-4 h-4 mr-1.5" />;

  switch (decision) {
    case 'SAFE TO RIGHTSIZE':
      bg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50 shadow-sm';
      icon = <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />;
      break;
    case 'REVIEW REQUIRED':
      bg = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-950/50 shadow-sm';
      icon = <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />;
      break;
    case 'HIGH RISK':
      bg = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-950/50 shadow-sm';
      icon = <ShieldAlert className="w-4 h-4 mr-1.5 text-rose-400" />;
      break;
    case 'BLOCKED':
      bg = 'bg-red-950/90 text-red-300 border-red-500/60 font-semibold shadow-red-950/50 shadow-sm';
      icon = <XCircle className="w-4 h-4 mr-1.5 text-red-400" />;
      break;
    case 'KEEP CURRENT INSTANCE':
      bg = 'bg-slate-800/90 text-slate-300 border-slate-600';
      icon = <MinusCircle className="w-4 h-4 mr-1.5 text-slate-400" />;
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm font-medium',
    lg: 'px-3.5 py-1.5 text-base font-semibold',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses[size]} tracking-wide uppercase`}>
      {icon}
      {decision}
    </span>
  );
};
