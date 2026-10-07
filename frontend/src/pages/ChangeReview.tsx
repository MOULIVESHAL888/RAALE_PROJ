import React, { useEffect, useState } from 'react';
import { CheckSquare, CheckCircle2, XCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { getChanges, approveChange } from '../services/api';
import { Change } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface Props {
  currentUser: string;
}

export const ChangeReview: React.FC<Props> = ({ currentUser }) => {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChanges = () => {
    setLoading(true);
    getChanges()
      .then(setChanges)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveChange(id, currentUser, 'Approved during governance change review meeting.');
      fetchChanges();
    } catch (err: any) {
      alert('Approval failed.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Loading Change Requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            Change Review & Governance Workflow
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            High-impact and high-risk rightsizing changes require explicit authorization prior to implementation.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Change ID</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Old Instance</th>
                <th className="py-3 px-4">New Instance</th>
                <th className="py-3 px-4">Monthly Savings</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {changes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-cyan-400">#{c.id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-200">{c.resource_id}</td>
                  <td className="py-3.5 px-4 text-slate-400">{c.old_instance}</td>
                  <td className="py-3.5 px-4 font-bold text-cyan-300">{c.new_instance}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">${c.monthly_savings.toFixed(2)}/mo</td>
                  <td className="py-3.5 px-4">
                    <RiskBadge risk={c.risk_level} />
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        c.status === 'APPROVED' || c.status === 'APPLIED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : c.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {c.status === 'PENDING_APPROVAL' ? (
                      <button
                        onClick={() => handleApprove(c.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-md shadow-md inline-flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-xs">Completed</span>
                    )}
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
