import React, { useEffect, useState } from 'react';
import { Sliders, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getResources, getSensitivityAnalysis } from '../services/api';
import { Resource, SensitivityAnalysisResponse } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';

export const SensitivityAnalysis: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState('res-pats-02');
  const [sensitivity, setSensitivity] = useState<SensitivityAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  useEffect(() => {
    if (!selectedResourceId) return;
    setLoading(true);
    getSensitivityAnalysis({
      resource_id: selectedResourceId,
      scenario_id: 'normal',
      latency_targets: [120, 160, 200, 250, 300],
      cpu_thresholds: [60, 70, 75, 80, 85],
      peak_multipliers: [1.0, 1.25, 1.5, 1.75, 2.0],
    })
      .then(setSensitivity)
      .finally(() => setLoading(false));
  }, [selectedResourceId]);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Computing Sensitivity Sweeps...</div>;
  }

  const latData = sensitivity?.sensitivity_data
    .filter((d) => d.parameter === 'latency_target')
    .map((d) => ({
      Target: `${d.value}ms`,
      Latency: d.predicted_latency,
      Decision: d.decision,
    }));

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Rightsizing Sensitivity Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Test how recommendations change when SLA targets, safety margins, or peak traffic multipliers are varied.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Select Resource:</span>
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {sensitivity && (
        <>
          {/* Decision-Changing Assumptions Alert Box */}
          <div className="bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-slate-900 border border-amber-800/80 rounded-xl p-5 space-y-3 shadow-lg">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Decision-Changing Assumptions Identified
            </h3>
            <ul className="space-y-2 text-xs text-amber-200/90 font-mono">
              {sensitivity.decision_changing_assumptions.map((ass, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold">&rarr;</span>
                  <span>{ass}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sweeps Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Latency SLA Target Sweep
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="Target" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="Latency" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Parameter Sweeps Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" /> Parameter Sweep Results
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Predicted Latency</th>
                      <th className="py-2 px-3">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {sensitivity.sensitivity_data.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{pt.parameter}</td>
                        <td className="py-2 px-3 font-bold text-cyan-300">{pt.value}</td>
                        <td className="py-2 px-3 text-sky-300">{pt.predicted_latency.toFixed(1)} ms</td>
                        <td className="py-2 px-3">
                          <DecisionBadge decision={pt.decision} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
