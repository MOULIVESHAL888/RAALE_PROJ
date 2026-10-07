import React from 'react';

interface Props {
  risk: string;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<Props> = ({ risk, size = 'sm' }) => {
  let style = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (risk?.toUpperCase()) {
    case 'LOW':
      style = 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40';
      break;
    case 'MEDIUM':
      style = 'bg-yellow-950/70 text-yellow-300 border-yellow-600/40';
      break;
    case 'HIGH':
      style = 'bg-orange-950/70 text-orange-300 border-orange-600/40';
      break;
    case 'CRITICAL':
      style = 'bg-rose-950/90 text-rose-200 border-rose-600/60 font-bold animate-pulse';
      break;
  }

  const py = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-mono rounded border ${style} ${py}`}>
      {risk} RISK
    </span>
  );
};
