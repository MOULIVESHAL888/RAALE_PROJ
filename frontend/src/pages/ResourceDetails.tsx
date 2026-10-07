import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Server, ArrowLeft, PlayCircle, AlertTriangle, ShieldCheck, Clock, Cpu, HardDrive, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getResourceById, getResourceMetrics } from '../services/api';
import { Resource, BaselineMetrics, Metric } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

export const ResourceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [anomaly, setAnomaly] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getResourceById(id), getResourceMetrics(id, 500)])
      .then(([resData, metricData]) => {
        setResource(resData);
        setBaseline(metricData.baseline);
        setMetrics(metricData.recent_metrics || []);
        setAnomaly(metricData.anomaly_detected);
        setWarnings(metricData.warnings || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !resource || !baseline) {
    return <div className="text-center py-20 text-slate-400 text-sm">Loading Resource Details...</div>;
  }

  // Reverse metrics for chronological chart plotting
  const chartData = [...metrics].reverse().map((m) => ({
    time: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
    CPU: m.cpu_utilization,
    Memory: m.memory_utilization,
    Latency: m.p95_latency,
    Requests: m.request_volume,
  }));

  return (
    <div className="space-y-6">
      {/* Back & Title */}
      <div className="flex items-center justify-between">
        <Link to="/resources" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources Inventory
        </Link>

        <Link
          to={`/simulation?resource_id=${resource.id}`}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-slate-950 font-semibold text-xs rounded-lg shadow-lg flex items-center space-x-1.5"
        >
          <PlayCircle className="w-4 h-4 text-slate-950" />
          <span>Launch Rightsizing Simulation</span>
        </Link>
      </div>

      {/* Resource Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                {resource.id}
              </span>
              <h2 className="text-xl font-bold text-slate-100">{resource.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Department: <span className="text-slate-200">{resource.department}</span> • Account:{' '}
              <span className="text-slate-200">{resource.cloud_account}</span> ({resource.region})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <RiskBadge risk={resource.risk_classification} />
            <DecisionBadge decision={resource.status.replace(/_/g, ' ')} size="md" />
          </div>
        </div>

        {anomaly && warnings.length > 0 && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-200 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Workload Data Anomaly Warning:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-300/90">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Current Instance Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Current Instance</span>
            <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{resource.current_instance_type}</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Monthly Cost</span>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">${resource.monthly_cost.toFixed(2)}/mo</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Historical P95 CPU</span>
            <p className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{baseline.p95_cpu.toFixed(1)}%</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Historical P95 Latency</span>
            <p className="text-sm font-bold text-sky-300 font-mono mt-0.5">{baseline.p95_latency.toFixed(1)} ms</p>
          </div>
        </div>
      </div>

      {/* Historical Metrics Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" /> Historical CPU & Memory Utilization Timeline (%)
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="CPU" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Memory" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Timeline Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-400" /> P95 Latency Performance Timeline (ms)
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="Latency" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
