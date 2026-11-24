import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShieldAlert, AlertTriangle, FileText, ChevronRight, Search, Sparkles, Layers } from 'lucide-react';
import { api } from '../api';
import { ConsentListItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface DashboardProps {
  llmAvailable: boolean;
  refreshTrigger: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ llmAvailable, refreshTrigger }) => {
  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadConsents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listConsents();
      setConsents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch consent records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsents();
  }, [refreshTrigger]);

  // Compute stat card metrics
  const totalRecords = consents.length;
  const highRiskCount = consents.filter(c => c.latest_risk === 'HIGH').length;
  const mediumRiskCount = consents.filter(c => c.latest_risk === 'MEDIUM').length;
  const totalAnalyses = consents.reduce((acc, c) => acc + (c.analyses_count || 0), 0);

  const filteredConsents = consents.filter(c =>
    c.organisation.toLowerCase().includes(search.toLowerCase()) ||
    c.service_name.toLowerCase().includes(search.toLowerCase()) ||
    c.original_purpose.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Engine Mode Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        llmAvailable
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
          : 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            llmAvailable ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            {llmAvailable ? <Sparkles className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Analysis Engine Mode: {llmAvailable ? 'Hybrid Mode (LLM + Rules)' : 'Deterministic Rules-Only Mode'}
              </h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                llmAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {llmAvailable ? 'Active' : 'Fallback Active'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {llmAvailable
                ? 'Structured LLM extraction paired with strict verbatim quote validation and deterministic risk scoring.'
                : 'Deterministic regex signal detection and sentence-level quote validation active. (No LLM key configured or offline).'}
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap self-end sm:self-center">
          Backend: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">http://localhost:8000</code>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consent Records</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalRecords}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Evidence / Analyses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analyses Performed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalAnalyses}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk Flags */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk Drifts</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{highRiskCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Medium Risk Flags */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medium Risk Warnings</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{mediumRiskCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: Consent Records Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Tracked Consent Baselines</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Original purposes agreed with organisations, compared against newly received disclosures.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
              />
            </div>
            <Link
              to="/consents/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Consent Record
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border-b border-rose-100">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <p>Loading consent records...</p>
          </div>
        ) : filteredConsents.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No consent records found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Get started by creating a baseline consent record or load demo scenarios to explore the system.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/consents/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Record
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConsents.map((item) => (
              <Link
                key={item.id}
                to={`/consents/${item.id}`}
                className="block p-5 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.service_name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        by {item.organisation}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.source_type === 'official_text' ? 'Official Policy Text' : 'User Summary'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      <strong className="text-slate-700 font-medium">Original Purpose: </strong>
                      "{item.original_purpose}"
                    </p>

                    {item.data_categories && item.data_categories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">Categories:</span>
                        {item.data_categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-center">
                    <div className="text-right">
                      <RiskBadge risk={item.latest_risk} />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        {item.analyses_count} {item.analyses_count === 1 ? 'analysis' : 'analyses'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
