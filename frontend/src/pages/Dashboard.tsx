import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Server,
  Activity,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getDashboardData } from '../services/api';
import { DashboardData } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading Hospital Rightsizing Analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data.summary;

  // Prepare chart data
  const accountChartData = Object.entries(data.cost_by_account).map(([account, val]) => ({
    account,
    Current: val.current,
    Optimized: val.optimized,
  }));

  const deptSavingsData = Object.entries(data.savings_by_department).map(([dept, val]) => ({
    department: dept,
    Savings: val,
  }));

  const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Infrastructure Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time performance-safe rightsizing optimization across hospital cloud workloads.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/simulation"
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-slate-950 font-semibold text-xs rounded-lg shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition-all"
          >
            <span>Run Rightsizing Simulation</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Cost */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Monthly Spend</p>
            <p className="text-2xl font-extrabold text-slate-100 mt-1">${summary.current_monthly_cost.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">across {summary.total_resources} active workloads</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <DollarSign className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        {/* Potential Monthly Savings */}
        <div className="bg-slate-900 border border-emerald-900/50 p-5 rounded-xl flex items-center justify-between shadow-emerald-950/20">
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Monthly Cost Reduction</p>
            <p className="text-2xl font-extrabold text-emerald-300 mt-1">${summary.potential_monthly_savings.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-500 mt-1">
              <span className="font-bold">{summary.savings_percentage}% savings</span> (${summary.annual_savings.toLocaleString()}/yr)
            </p>
          </div>
          <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-800/60">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Safe to Resize */}
        <div className="bg-slate-900 border border-cyan-900/50 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Safe to Resize</p>
            <p className="text-2xl font-extrabold text-cyan-300 mt-1">{summary.resources_safe_count} Workloads</p>
            <p className="text-[11px] text-cyan-500/80 mt-1">Zero performance SLA violations</p>
          </div>
          <div className="p-3 bg-cyan-950/80 rounded-xl border border-cyan-800/60">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Review Required & High Risk */}
        <div className="bg-slate-900 border border-amber-900/50 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Review / High Risk</p>
            <p className="text-2xl font-extrabold text-amber-300 mt-1">
              {summary.resources_review_count + summary.resources_high_risk_count} Workloads
            </p>
            <p className="text-[11px] text-amber-500/80 mt-1">
              {summary.resources_review_count} review • {summary.resources_high_risk_count} blocked
            </p>
          </div>
          <div className="p-3 bg-amber-950/80 rounded-xl border border-amber-800/60">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Comparison by Cloud Account */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Current vs Optimized Monthly Cost by Account</h3>
            <span className="text-[11px] text-slate-500">USD / Month</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="account" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val: any) => [`$${val}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Current" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Optimized" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Savings by Hospital Department */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Potential Monthly Savings by Hospital Department</h3>
            <span className="text-[11px] text-emerald-400 font-mono">USD / Month</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptSavingsData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="department" type="category" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val: any) => [`$${val}`, 'Monthly Savings']}
                />
                <Bar dataKey="Savings" radius={[0, 4, 4, 0]}>
                  {deptSavingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Recent Simulation & Governance Audit Trail
          </h3>
          <Link to="/audit" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            View All Audit Events →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Details / Reason</th>
                <th className="py-2.5 px-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {data.recent_audit_logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{log.user}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.resource_id || '—'}</td>
                  <td className="py-2.5 px-3 max-w-xs truncate font-sans text-slate-400">{log.reason}</td>
                  <td className="py-2.5 px-3">
                    <RiskBadge risk={log.risk_level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
