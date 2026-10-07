import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlayCircle, Sliders, AlertTriangle, ShieldCheck, ArrowRight, DollarSign, Check, X, Settings2 } from 'lucide-react';
import { getResources, getInstances, getScenarios, runSimulation, acceptRecommendation, rejectRecommendation } from '../services/api';
import { Resource, InstanceCatalog, Scenario, SimulationResponse } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Modal } from '../components/Modal';

interface Props {
  currentUser: string;
}

export const Simulation: React.FC<Props> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const initialResourceId = searchParams.get('resource_id') || 'res-pacs-01';

  const [resources, setResources] = useState<Resource[]>([]);
  const [instances, setInstances] = useState<InstanceCatalog[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Simulator Inputs
  const [selectedResourceId, setSelectedResourceId] = useState(initialResourceId);
  const [selectedScenarioId, setSelectedScenarioId] = useState('normal');
  const [candidateInstanceType, setCandidateInstanceType] = useState<string>('');
  
  const [cpuThreshold, setCpuThreshold] = useState(75);
  const [memoryThreshold, setMemoryThreshold] = useState(80);
  const [latencyTarget, setLatencyTarget] = useState(250);
  const [availabilityTarget, setAvailabilityTarget] = useState(99.90);
  const [safetyMargin, setSafetyMargin] = useState(15);
  const [minSavings, setMinSavings] = useState(10);
  const [peakMultiplier, setPeakMultiplier] = useState(1.0);

  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Manual Override State
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideInstance, setOverrideInstance] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    Promise.all([getResources(), getInstances(), getScenarios()]).then(([resData, instData, scenData]) => {
      setResources(resData);
      setInstances(instData);
      setScenarios(scenData);
      
      const targetRes = resData.find((r) => r.id === initialResourceId);
      if (targetRes) {
        const smaller = instData.filter((i) => i.monthly_price < targetRes.monthly_cost);
        if (smaller.length > 0) {
          setCandidateInstanceType(smaller[0].instance_type);
        }
      }
    });
  }, [initialResourceId]);

  const currentResource = resources.find((r) => r.id === selectedResourceId);

  const handleResourceChange = (resId: string) => {
    setSelectedResourceId(resId);
    const res = resources.find((r) => r.id === resId);
    if (res) {
      const smaller = instances.filter((i) => i.monthly_price < res.monthly_cost);
      if (smaller.length > 0) {
        setCandidateInstanceType(smaller[0].instance_type);
      } else {
        setCandidateInstanceType(res.current_instance_type);
      }
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedResourceId) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await runSimulation(
        {
          resource_id: selectedResourceId,
          scenario_id: selectedScenarioId,
          candidate_instance_type: candidateInstanceType || undefined,
          cpu_threshold: cpuThreshold,
          memory_threshold: memoryThreshold,
          latency_target: latencyTarget,
          availability_target: availabilityTarget,
          safety_margin: safetyMargin,
          min_savings: minSavings,
          peak_multiplier: peakMultiplier,
        },
        currentUser
      );
      setSimulationResult(res);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!simulationResult?.id) return;
    try {
      const res = await acceptRecommendation(simulationResult.id, currentUser);
      setActionMessage(res.message);
    } catch (err: any) {
      alert('Failed to accept recommendation.');
    }
  };

  const handleReject = async () => {
    if (!simulationResult?.id) return;
    try {
      const res = await rejectRecommendation(simulationResult.id, currentUser);
      setActionMessage(res.message);
    } catch (err: any) {
      alert('Failed to reject recommendation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-cyan-400" />
            Performance-Safe Rightsizing Simulator
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulate proposed infrastructure changes against 90-day workload history and SLA targets before applying decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Simulation Parameters
          </h3>

          {/* Resource Selector */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Target Hospital Workload</label>
            <select
              value={selectedResourceId}
              onChange={(e) => handleResourceChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.current_instance_type} - ${r.monthly_cost}/mo)
                </option>
              ))}
            </select>
          </div>

          {/* Operating Scenario */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Operating Scenario</label>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate Instance */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Candidate Instance Type</label>
            <select
              value={candidateInstanceType}
              onChange={(e) => setCandidateInstanceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
            >
              {instances.map((i) => (
                <option key={i.instance_type} value={i.instance_type}>
                  {i.instance_type} ({i.vcpu} vCPU, {i.memory_gb}GB) - ${i.monthly_price.toFixed(2)}/mo
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Sliders */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Max CPU Target:</span>
                <span className="font-mono text-cyan-400 font-bold">{cpuThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Max Memory Target:</span>
                <span className="font-mono text-cyan-400 font-bold">{memoryThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={memoryThreshold}
                onChange={(e) => setMemoryThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">P95 Latency SLA Target:</span>
                <span className="font-mono text-sky-400 font-bold">{latencyTarget} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={latencyTarget}
                onChange={(e) => setLatencyTarget(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Peak Traffic Multiplier:</span>
                <span className="font-mono text-amber-400 font-bold">{peakMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={peakMultiplier}
                onChange={(e) => setPeakMultiplier(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{loading ? 'Running Performance Models...' : 'RUN SIMULATION'}</span>
          </button>
        </div>

        {/* Simulation Output Column */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header Badge & Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-3">
                    <DecisionBadge decision={simulationResult.decision} size="lg" />
                    <RiskBadge risk={simulationResult.risk_level} size="md" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{simulationResult.reason}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-extrabold text-emerald-400">
                    ${simulationResult.monthly_savings.toFixed(2)}/mo
                  </div>
                  <div className="text-xs text-emerald-500">
                    {simulationResult.savings_pct.toFixed(1)}% Cost Reduction
                  </div>
                </div>
              </div>

              {actionMessage && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg">
                  {actionMessage}
                </div>
              )}

              {/* Before vs After View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE Card */}
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>BEFORE (CURRENT)</span>
                    <span className="font-mono text-slate-300">{simulationResult.current_instance_type}</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Compute Headroom:</span>
                      <span className="text-slate-200">
                        {simulationResult.current_vcpu} vCPU / {simulationResult.current_memory_gb}GB RAM
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Monthly Cost:</span>
                      <span className="text-slate-200">${simulationResult.current_monthly_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Baseline P95 CPU:</span>
                      <span className="text-cyan-400">{simulationResult.baseline_cpu_p95.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Baseline P95 Latency:</span>
                      <span className="text-sky-400">{simulationResult.baseline_latency_p95.toFixed(1)} ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Baseline Availability:</span>
                      <span className="text-emerald-400">{simulationResult.baseline_availability.toFixed(4)}%</span>
                    </div>
                  </div>
                </div>

                {/* AFTER Card */}
                <div className="bg-slate-850 p-4 rounded-xl border border-cyan-900/60 space-y-3 shadow-inner">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                    <span>AFTER (PREDICTED)</span>
                    <span className="font-mono text-cyan-300">{simulationResult.candidate_instance_type}</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Compute Headroom:</span>
                      <span className="text-slate-200">
                        {simulationResult.candidate_vcpu} vCPU / {simulationResult.candidate_memory_gb}GB RAM
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Monthly Cost:</span>
                      <span className="text-emerald-400 font-bold">${simulationResult.candidate_monthly_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Predicted P95 CPU:</span>
                      <span className={simulationResult.predicted_cpu_p95 <= cpuThreshold ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                        {simulationResult.predicted_cpu_p95.toFixed(1)}% (Target &le;{cpuThreshold}%)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Predicted P95 Latency:</span>
                      <span className={simulationResult.predicted_latency_p95 <= latencyTarget ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                        {simulationResult.predicted_latency_p95.toFixed(1)} ms (SLA &le;{latencyTarget}ms)
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Predicted Availability:</span>
                      <span className="text-emerald-400">{simulationResult.predicted_availability.toFixed(4)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanations & Warnings */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Engine Explainability</h4>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300">
                  {simulationResult.detailed_explanation.map((exp, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>

                {simulationResult.warnings.length > 0 && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> Active Warnings:
                    </span>
                    {simulationResult.warnings.map((w, idx) => (
                      <p key={idx} className="pl-5 text-rose-300/90">• {w}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Recommendation</span>
                </button>

                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Recommendation</span>
                </button>

                <button
                  onClick={() => setIsOverrideOpen(true)}
                  className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Manual Override</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
              <PlayCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm">Adjust simulation parameters and click <span className="text-cyan-400 font-bold">RUN SIMULATION</span> to compute rightsizing recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
