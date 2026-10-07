import React from 'react';
import { UserCheck, Shield, Eye, Settings, Terminal } from 'lucide-react';

interface Props {
  currentUser: string;
  onUserChange: (user: string) => void;
}

export const Login: React.FC<Props> = ({ currentUser, onUserChange }) => {
  const roles = [
    {
      id: 'cloud.engineer',
      name: 'Lead Cloud Engineer',
      roleTitle: 'CLOUD_ENGINEER',
      icon: Terminal,
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
      description: 'Full simulation capabilities, recommendation management, override permissions, and change initiation.'
    },
    {
      id: 'admin',
      name: 'System Administrator',
      roleTitle: 'ADMIN',
      icon: Settings,
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
      description: 'Superuser access with rightsizing policy configuration, change approval, and rollback control.'
    },
    {
      id: 'reviewer',
      name: 'FinOps Reviewer',
      roleTitle: 'REVIEWER',
      icon: Shield,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
      description: 'Financial optimization review, risk evaluation, and high-impact change request authorization.'
    },
    {
      id: 'viewer',
      name: 'Hospital IT Analyst',
      roleTitle: 'VIEWER',
      icon: Eye,
      color: 'border-slate-500/50 bg-slate-800/40 text-slate-300',
      description: 'Read-only access to hospital workloads, historical performance timelines, and audit records.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          Demo Role & Identity Management
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Select an active user role to simulate role-based authorization and approval controls across the rightsizing simulator.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentUser === r.id;

            return (
              <div
                key={r.id}
                onClick={() => onUserChange(r.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? `${r.color} ring-2 ring-cyan-500/40 shadow-lg`
                    : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">{r.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        {r.roleTitle}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
