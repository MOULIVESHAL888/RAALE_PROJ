import React, { useEffect, useState } from 'react';
import { GitCompare, Activity, CheckCircle2, AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';
import { getResources, getScenarioComparison } from '../services/api';
import { Resource, ScenarioComparisonResponse } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

export const ScenarioComparison: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState('res-emer-06');
  const [comparison, setComparison] = useState<ScenarioComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getResources().then((data) => {
      setResources(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedResourceId) return;
    setLoading(true);
    getScenarioComparison(selectedResourceId)
      .then(setComparison)
      .finally(() => setLoading(false));
  }, [selectedResourceId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-cyan-400" />
            Operating Scenario Comparison Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Compare candidate rightsizing safety across Normal Workload, Peak Hospital Activity, Bursty Workload, and Over-Provisioned Backup scenarios.
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

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Evaluating Operating Scenarios...</div>
      ) : comparison ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-6 p-6">
          <h3 className="text-base font-bold text-slate-200">
            Workload: <span className="text-cyan-400 font-mono">{comparison.resource_name}</span> ({comparison.resource_id})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-4">Current Cost</th>
                  <th className="py-3 px-4">Recommended Instance</th>
                  <th className="py-3 px-4">Recommended Cost</th>
                  <th className="py-3 px-4">Savings</th>
                  <th className="py-3 px-4">Predicted Latency (P95)</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Decision Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {comparison.scenarios.map((sc) => (
                  <tr key={sc.scenario_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-100">{sc.scenario_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">${sc.current_cost.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-300">{sc.recommended_instance}</td>
                    <td className="py-3.5 px-4 text-emerald-400">${sc.recommended_cost.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-300">
                      ${sc.savings_monthly.toFixed(2)} ({sc.savings_pct.toFixed(1)}%)
                    </td>
                    <td className="py-3.5 px-4 text-sky-300">{sc.predicted_latency_p95.toFixed(1)} ms</td>
                    <td className="py-3.5 px-4 text-emerald-400">{sc.predicted_availability.toFixed(4)}%</td>
                    <td className="py-3.5 px-4">
                      <RiskBadge risk={sc.risk_level} />
                    </td>
                    <td className="py-3.5 px-4">
                      <DecisionBadge decision={sc.decision} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider">Scenario Insight Note:</span>
            <p>
              In peak hospital activity or bursty scenarios, latency increases due to queuing contention. The simulator automatically flags or blocks rightsizing recommendations when peak activity exceeds SLA headroom.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
