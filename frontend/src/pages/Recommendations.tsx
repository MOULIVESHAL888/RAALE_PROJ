import React, { useEffect, useState } from 'react';
import { Sparkles, Check, X, Settings2, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { getRecommendations, acceptRecommendation, rejectRecommendation, manualOverrideRecommendation, getInstances } from '../services/api';
import { Recommendation, InstanceCatalog } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Modal } from '../components/Modal';

interface Props {
  currentUser: string;
}

export const Recommendations: React.FC<Props> = ({ currentUser }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [instances, setInstances] = useState<InstanceCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Override Modal
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);
  const [overrideInstance, setOverrideInstance] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchRecs = () => {
    setLoading(true);
    Promise.all([getRecommendations(), getInstances()])
      .then(([recs, insts]) => {
        setRecommendations(recs);
        setInstances(insts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await acceptRecommendation(id, currentUser);
      fetchRecs();
    } catch (err: any) {
      alert('Failed to accept recommendation.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRecommendation(id, currentUser, 'Rejected via operator dashboard');
      fetchRecs();
    } catch (err: any) {
      alert('Failed to reject recommendation.');
    }
  };

  const handleOpenOverride = (rec: Recommendation) => {
    setActiveRec(rec);
    setOverrideInstance(rec.recommended_instance);
    setOverrideReason('');
  };

  const handleApplyOverride = async () => {
    if (!activeRec || !overrideInstance || !overrideReason) {
      alert('Please fill in candidate instance and override reason.');
      return;
    }
    try {
      await manualOverrideRecommendation(activeRec.id, overrideInstance, overrideReason, currentUser);
      setActiveRec(null);
      fetchRecs();
    } catch (err: any) {
      alert('Manual override failed.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Loading Rightsizing Recommendations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Rightsizing Recommendations Queue
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Automated rightsizing actions evaluated against 90-day workload history and SLA rules.
          </p>
        </div>
      </div>

      {/* Grid of Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {rec.resource_id}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {rec.current_instance} &rarr;{' '}
                  <span className="text-cyan-300">{rec.recommended_instance}</span>
                </h3>
              </div>
              <RiskBadge risk={rec.risk_level} />
            </div>

            <div className="flex items-center justify-between bg-slate-850 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500">Monthly Savings:</span>
                <p className="text-emerald-400 font-bold text-sm">${rec.monthly_savings.toFixed(2)} ({rec.savings_pct.toFixed(1)}%)</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Annual Savings:</span>
                <p className="text-emerald-300 font-bold text-sm">${rec.annual_savings.toFixed(2)}/yr</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                <span className="text-slate-500">Latency (Baseline vs Pred):</span>
                <span className="text-sky-300">
                  {rec.latency_baseline.toFixed(1)}ms &rarr; {rec.latency_predicted.toFixed(1)}ms (SLA &le;{rec.latency_target}ms)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                <span className="text-slate-500">Availability:</span>
                <span className="text-emerald-400">{rec.availability_predicted.toFixed(4)}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-sans">Status:</span>
                <span className="font-bold text-slate-200">{rec.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <DecisionBadge decision={rec.decision} size="sm" />
              <p className="text-xs text-slate-400 mt-2">{rec.reason}</p>
            </div>

            {/* Action Toolbar */}
            {rec.status === 'PENDING' && (
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleAccept(rec.id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleReject(rec.id)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenOverride(rec)}
                  className="py-2 px-3 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Override</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Manual Override Modal */}
      <Modal isOpen={!!activeRec} onClose={() => setActiveRec(null)} title="Manual Override Rightsizing Recommendation">
        {activeRec && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Override automatically computed recommendation for <span className="font-mono text-cyan-400 font-bold">{activeRec.resource_id}</span>.
            </p>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Select Custom Candidate Instance</label>
              <select
                value={overrideInstance}
                onChange={(e) => setOverrideInstance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-mono cursor-pointer"
              >
                {instances.map((i) => (
                  <option key={i.instance_type} value={i.instance_type}>
                    {i.instance_type} ({i.vcpu} vCPU, {i.memory_gb}GB RAM) - ${i.monthly_price.toFixed(2)}/mo
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Override Reason & Operational Justification</label>
              <textarea
                rows={3}
                placeholder="e.g. Workload requires additional vCPU headroom for clinical peak bursts..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button onClick={() => setActiveRec(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
                Cancel
              </button>
              <button onClick={handleApplyOverride} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded-lg">
                Apply Override & Submit Change
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
