import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, Search, Filter, ExternalLink, PlayCircle } from 'lucide-react';
import { getResources } from '../services/api';
import { Resource } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResources()
      .then(setResources)
      .finally(() => setLoading(false));
  }, []);

  const departments = ['ALL', ...Array.from(new Set(resources.map((r) => r.department)))];

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.workload_type.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || r.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 text-sm">
        Loading Cloud Infrastructure Inventory...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-400" />
            Hospital Cloud Resources Inventory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Active cloud instances across Radiology, EHR, Pathology, Emergency, IT Infra, and Outpatient departments.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search workload or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Workload Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Cloud Account / Region</th>
                <th className="py-3 px-4">Current Instance</th>
                <th className="py-3 px-4">Monthly Cost</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredResources.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">{r.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{r.name}</td>
                  <td className="py-3 px-4 font-sans text-slate-400">{r.department}</td>
                  <td className="py-3 px-4 text-slate-400">
                    <div>{r.cloud_account}</div>
                    <div className="text-[10px] text-slate-500">{r.region}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                      {r.current_instance_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100">${r.monthly_cost.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <RiskBadge risk={r.risk_classification} />
                  </td>
                  <td className="py-3 px-4">
                    <DecisionBadge decision={r.status.replace(/_/g, ' ')} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/resources/${r.id}`}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md flex items-center space-x-1 border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Details</span>
                      </Link>
                      <Link
                        to={`/simulation?resource_id=${r.id}`}
                        className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs rounded-md flex items-center space-x-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Simulate</span>
                      </Link>
                    </div>
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
