import React, { useEffect, useState } from 'react';
import { History, Download, Filter, Search } from 'lucide-react';
import { getAuditLogs, exportAuditCsv } from '../services/api';
import { AuditLog } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const actions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  const filteredLogs = logs.filter((l) => actionFilter === 'ALL' || l.action === actionFilter);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Loading System Audit Logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            System Audit Trail & Compliance Log
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of all simulation runs, recommendation approvals, manual overrides, threshold updates, and rollbacks.
          </p>
        </div>

        <a
          href={exportAuditCsv()}
          download="audit_trail.csv"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export CSV</span>
        </a>
      </div>

      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400">Filter Action:</span>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Transition (Old &rarr; New)</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500">#{l.id}</td>
                  <td className="py-3.5 px-4 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-bold text-cyan-400">{l.user}</td>
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-200">{l.action}</td>
                  <td className="py-3.5 px-4 text-slate-300">{l.resource_id || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {l.old_value || l.new_value ? `${l.old_value || 'N/A'} → ${l.new_value || 'N/A'}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-400 max-w-xs truncate">{l.reason}</td>
                  <td className="py-3.5 px-4">
                    <RiskBadge risk={l.risk_level} />
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
