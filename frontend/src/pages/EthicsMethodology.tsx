import React from 'react';
import { BookOpen, ShieldAlert, Lock, CheckCircle2, Cpu, DollarSign } from 'lucide-react';

export const EthicsMethodology: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Ethics, Safety Standards & Methodology
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Mathematical rightsizing framework, non-clinical scope boundary, patient data privacy guarantees, and human oversight principles.
          </p>
        </div>
      </div>

      {/* Ethics & Safety Directives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> Non-Clinical Scope & Human Oversight
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li>This system provides cloud infrastructure decision-support for hospital IT administrators.</li>
            <li>It does <span className="text-rose-400 font-bold uppercase">NOT</span> make medical or clinical patient care decisions.</li>
            <li>No production cloud resources are modified automatically; all operations remain strictly simulated.</li>
            <li>High-impact and high-risk rightsizing changes mandate explicit human approval before authorization.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" /> Patient Data Privacy Guarantee
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li>No real hospital patient data or Protected Health Information (PHI) is processed by this prototype.</li>
            <li>All metrics are derived from a synthetic 90-day demonstration dataset.</li>
            <li>All cloud instance prices use realistic simulated demonstration rates.</li>
            <li>Complete audit logging is maintained for every simulation, approval, and rollback action.</li>
          </ul>
        </div>
      </div>

      {/* Mathematical Formulas & Methodology */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" /> Mathematical Methodology & Estimation Formulas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Monthly Cost Formula */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold font-sans flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> 1. Cost & Savings Formulas
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-200">
              <p>Monthly Cost = hourly_price &times; 730 hours</p>
              <p className="mt-1">Monthly Savings = Current Cost - Proposed Cost</p>
              <p className="mt-1">Savings % = ((Current Cost - Proposed Cost) / Current Cost) &times; 100</p>
            </div>
          </div>

          {/* Performance Impact Formula */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold font-sans flex items-center gap-1">
              <Cpu className="w-4 h-4" /> 2. Compute Prediction & Latency
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-200">
              <p>Predicted CPU = (Baseline P95 CPU / vCPU Ratio) &times; Peak Multiplier</p>
              <p className="mt-1">Predicted Memory = (Baseline P95 Memory / Memory Ratio) &times; Peak Multiplier</p>
              <p className="mt-1">Predicted Latency = Baseline Latency &times; Queuing Factor + Latency Adder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
