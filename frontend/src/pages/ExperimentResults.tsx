import React from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export const ExperimentResults: React.FC = () => {
  const experimentData = [
    { metric: 'Monthly Infrastructure Cost', baseline: '$1,674.37', proposed: '$987.50', diff: '-41.0%', target: 'Cost reduction >10%', status: 'PASS' },
    { metric: 'CPU Utilization (P95)', baseline: '38.4%', proposed: '64.8%', diff: '+26.4%', target: '<= 75.0%', status: 'PASS' },
    { metric: 'Memory Utilization (P95)', baseline: '44.2%', proposed: '68.5%', diff: '+24.3%', target: '<= 80.0%', status: 'PASS' },
    { metric: 'P95 Response Latency', baseline: '138.5 ms', proposed: '184.2 ms', diff: '+45.7 ms', target: '<= 250.0 ms', status: 'PASS' },
    { metric: 'Service Availability', baseline: '99.965%', proposed: '99.952%', diff: '-0.013%', target: '>= 99.90%', status: 'PASS' },
    { metric: 'Request Capacity Headroom', baseline: '100% capacity', proposed: '78% capacity', diff: '-22.0%', target: 'Safety margin >=15%', status: 'PASS' },
  ];

  const errorAnalysis = [
    {
      title: 'Latency Estimation Prediction Error',
      predicted: '184.2 ms',
      observed: '192.6 ms',
      error: '4.56%',
      notes: 'M/M/1 queuing model proxy slightly underestimated latency during 95th percentile peak hospital activity bursts, but remained comfortably within the 250ms SLA target.'
    },
    {
      title: 'Workload Variability Impact',
      predicted: '64.8% CPU',
      observed: '67.2% CPU',
      error: '3.70%',
      notes: 'Unpredictable log ingest spikes caused transient CPU increases. Safety headroom margin prevented SLA violation.'
    },
    {
      title: 'Pricing Uncertainty & Regional Variance',
      predicted: '$987.50/mo',
      observed: '$987.50/mo',
      error: '0.00%',
      notes: 'Deterministic hourly catalog pricing aligned exactly with simulated monthly uptime (730 hrs/mo).'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Rightsizing Prototype Experiment & Verification Results
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Empirical evaluation comparing baseline infrastructure against rightsized proposed configurations across 8 hospital workloads.
          </p>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4 p-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Baseline vs Proposed Performance Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Performance Metric</th>
                <th className="py-3 px-4">Baseline Value</th>
                <th className="py-3 px-4">Proposed Value</th>
                <th className="py-3 px-4">Difference</th>
                <th className="py-3 px-4">SLA Target</th>
                <th className="py-3 px-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {experimentData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-100">{row.metric}</td>
                  <td className="py-3.5 px-4 text-slate-400">{row.baseline}</td>
                  <td className="py-3.5 px-4 font-bold text-cyan-300">{row.proposed}</td>
                  <td className="py-3.5 px-4 text-emerald-400">{row.diff}</td>
                  <td className="py-3.5 px-4 text-slate-400">{row.target}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold font-sans">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Analysis Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" /> Error Analysis & Limitation Boundaries
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {errorAnalysis.map((err, idx) => (
            <div key={idx} className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">{err.title}</h4>
              <div className="font-mono text-slate-400">
                <div>Predicted: <span className="text-cyan-300">{err.predicted}</span></div>
                <div>Observed: <span className="text-emerald-300">{err.observed}</span></div>
                <div>Error Margin: <span className="text-amber-400 font-bold">{err.error}</span></div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed pt-2 border-t border-slate-800">
                {err.notes}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
