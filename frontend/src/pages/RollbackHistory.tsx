import React, { useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2, History } from 'lucide-react';
import { getChanges, rollbackChange } from '../services/api';
import { Change } from '../types';
import { Modal } from '../components/Modal';

interface Props {
  currentUser: string;
}

export const RollbackHistory: React.FC<Props> = ({ currentUser }) => {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  // Rollback Modal
  const [activeChange, setActiveChange] = useState<Change | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');

  const fetchChanges = () => {
    setLoading(true);
    getChanges()
      .then(setChanges)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const handleOpenRollback = (c: Change) => {
    setActiveChange(c);
    setRollbackReason('');
  };

  const handleExecuteRollback = async () => {
    if (!activeChange || !rollbackReason) {
      alert('Please provide a reason for initiating rollback.');
      return;
    }
    try {
      await rollbackChange(activeChange.id, currentUser, rollbackReason);
      setActiveChange(null);
      fetchChanges();
    } catch (err: any) {
      alert('Rollback failed.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-sm">Loading Rollback Records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-400" />
            Infrastructure Change & Rollback Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Emergency safety rollback mechanism. Restores previous cloud instance configuration and decision state.
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
                <th className="py-3 px-4">Previous Instance</th>
                <th className="py-3 px-4">Applied Instance</th>
                <th className="py-3 px-4">Applied At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {changes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-cyan-400">#{c.id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-200">{c.resource_id}</td>
                  <td className="py-3.5 px-4 text-emerald-400">{c.old_instance}</td>
                  <td className="py-3.5 px-4 text-cyan-300">{c.new_instance}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {c.approved_at ? new Date(c.approved_at).toLocaleString() : new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        c.is_rolled_back || c.status === 'ROLLED_BACK'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {!c.is_rolled_back && c.status !== 'ROLLED_BACK' ? (
                      <button
                        onClick={() => handleOpenRollback(c)}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/80 text-xs font-bold rounded-md shadow-md inline-flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ROLLBACK</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-rose-400">
                        Rolled back by {c.rolled_back_by}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Rollback Confirmation Modal */}
      <Modal isOpen={!!activeChange} onClose={() => setActiveChange(null)} title="Confirm Emergency Infrastructure Rollback">
        {activeChange && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-lg flex items-start space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Restoring Original Instance State:</span>
                <p className="mt-1">
                  This action will restore <span className="font-mono text-cyan-300 font-bold">{activeChange.resource_id}</span> from instance{' '}
                  <span className="font-mono text-cyan-300">{activeChange.new_instance}</span> back to original{' '}
                  <span className="font-mono text-emerald-300 font-bold">{activeChange.old_instance}</span> (${activeChange.previous_cost.toFixed(2)}/mo).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Reason for Mandatory Rollback</label>
              <textarea
                rows={3}
                placeholder="e.g. Latency degradation during emergency department peak operation..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button onClick={() => setActiveChange(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
                Cancel
              </button>
              <button onClick={handleExecuteRollback} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-lg">
                Execute Rollback Now
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
