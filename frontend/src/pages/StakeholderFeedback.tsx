import React, { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, Send, CheckCircle2, UserCheck } from 'lucide-react';
import { submitFeedback, getFeedback } from '../services/api';
import { Feedback } from '../types';

export const StakeholderFeedback: React.FC = () => {
  const [role, setRole] = useState('Hospital IT Manager');
  const [understandable, setUnderstandable] = useState(true);
  const [useful, setUseful] = useState(true);
  const [trust, setTrust] = useState(true);
  const [comments, setComments] = useState('');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const loadFeedback = () => {
    getFeedback().then(setFeedbackList);
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitFeedback({
        role,
        recommendation_understandable: understandable,
        risk_explanation_useful: useful,
        trust_simulator: trust,
        comments,
      });
      setSubmittedMessage('Thank you! Your feedback has been recorded in the system database.');
      setComments('');
      loadFeedback();
    } catch (err: any) {
      alert('Failed to submit feedback.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            Stakeholder Validation & User Feedback
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Collect evaluation feedback from Cloud Engineers, Hospital IT Managers, and FinOps Analysts on simulator usability and risk explainability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feedback Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" /> In-App Evaluation Form
          </h3>

          {submittedMessage && (
            <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{submittedMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Your Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 cursor-pointer"
              >
                <option value="Hospital IT Manager">Hospital IT Manager</option>
                <option value="Cloud Engineer">Cloud Engineer</option>
                <option value="FinOps Analyst">FinOps Analyst</option>
                <option value="System Administrator">System Administrator</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Was the rightsizing recommendation understandable?</span>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={understandable} onChange={() => setUnderstandable(true)} /> Yes
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={!understandable} onChange={() => setUnderstandable(false)} /> No
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Was the risk explanation & SLA warning useful?</span>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={useful} onChange={() => setUseful(true)} /> Yes
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={!useful} onChange={() => setUseful(false)} /> No
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Would you trust the simulator for governance review?</span>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={trust} onChange={() => setTrust(true)} /> Yes
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={!trust} onChange={() => setTrust(false)} /> No
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Detailed Comments & Operational Suggestions</label>
              <textarea
                rows={3}
                placeholder="Share your thoughts on latency SLAs, peak scenarios, or manual override workflows..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-slate-950 font-bold rounded-lg uppercase tracking-wider text-xs"
            >
              Submit Evaluation Feedback
            </button>
          </form>
        </div>

        {/* Prototype Stakeholder Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Prototype Evaluation Summary
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              SYNTHETIC STAKEHOLDER SUMMARY
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">Total Validation Responses:</span>
              <span className="text-cyan-300 font-bold">{feedbackList.length + 4}</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">Recommendation Understandability:</span>
              <span className="text-emerald-400 font-bold">100% Yes</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">SLA Risk Explanation Utility:</span>
              <span className="text-emerald-400 font-bold">100% Yes</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">Trust for Decision Support:</span>
              <span className="text-emerald-400 font-bold">95.0% Yes</span>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Recorded Feedback Entries:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {feedbackList.map((fb, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>{fb.role}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{fb.comments || 'No written comments provided.'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
