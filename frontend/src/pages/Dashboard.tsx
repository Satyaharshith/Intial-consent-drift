import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  UploadCloud,
  FileEdit,
  ArrowRight,
  Search,
  Sparkles,
  HeartPulse,
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../api';
import { ConsentListItem, Alert as AlertType, AnalyticsData } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alerts' | 'applications'>('all');
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    try {
      const [cData, aData, stats] = await Promise.all([
        api.getConsents(),
        api.getAlerts(),
        api.getAnalytics()
      ]);
      setConsents(cData);
      setAlerts(aData);
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadData();
    } catch (err) {
      alert('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  // Onboarding checklist completion checks
  const hasApplication = consents.length > 0;
  const hasEvidence = (analytics?.summary?.total_evidence ?? 0) > 0;
  const hasReviewedAlert = alerts.some((a) => a.status !== 'new');
  const hasDraft = (analytics?.summary?.total_drafts ?? 0) > 0;
  const onboardingComplete = hasApplication && hasEvidence && hasReviewedAlert && hasDraft;

  // Filtered applications and alerts based on search & filter
  const filteredConsents = consents.filter((c) => {
    if (filterType === 'alerts') return false;
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return c.service_name.toLowerCase().includes(term) || c.organisation.toLowerCase().includes(term);
  });

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'applications') return false;
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (a.service_name && a.service_name.toLowerCase().includes(term)) ||
      (a.organisation && a.organisation.toLowerCase().includes(term)) ||
      (a.notes && a.notes.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Surveillance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time tracking of baseline privacy commitments versus subsequent disclosures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{seeding ? 'Seeding...' : 'Load Demo Scenarios'}</span>
          </button>
          <Link
            to="/evidence/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/25"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Evidence</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist (Disappears when complete) */}
      {!onboardingComplete && (
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Getting Started — Setup Surveillance
              </h3>
            </div>
            <span className="text-[11px] text-blue-400 font-semibold">
              {[hasApplication, hasEvidence, hasReviewedAlert, hasDraft].filter(Boolean).length}/4 Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <Link
              to="/consents/new"
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                hasApplication
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'bg-blue-600/10 border-blue-500/40 text-blue-200 hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasApplication ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>1. Add Application</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/evidence/new"
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                hasEvidence
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'bg-blue-600/10 border-blue-500/40 text-blue-200 hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasEvidence ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>2. Submit Evidence</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/alerts"
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                hasReviewedAlert
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'bg-blue-600/10 border-blue-500/40 text-blue-200 hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasReviewedAlert ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>3. Review Alert</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/drafts"
              className={`p-3 rounded-xl border transition flex items-center justify-between ${
                hasDraft
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : 'bg-blue-600/10 border-blue-500/40 text-blue-200 hover:bg-blue-600/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${hasDraft ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>4. Generate Letter</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Applications */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Applications</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{consents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Registered baselines</div>
        </div>

        {/* Evidence Submitted */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Evidence</span>
            <UploadCloud className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics?.summary?.total_evidence ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Disclosures analyzed</div>
        </div>

        {/* Mismatch Alerts */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mismatch Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{alerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {alerts.filter((a) => a.risk === 'HIGH').length} High, {alerts.filter((a) => a.risk === 'MEDIUM').length} Medium
          </div>
        </div>

        {/* Complaint Drafts */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Complaint Drafts</span>
            <FileEdit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics?.summary?.total_drafts ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Prepared inquiries</div>
        </div>

        {/* Consent Health Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <span>Consent Health</span>
              <div className="group relative inline-block">
                <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 shadow-2xl z-50 normal-case font-normal leading-snug">
                  {analytics?.consent_health?.formula || 'Percentage of evidence rated LOW risk.'}
                </div>
              </div>
            </span>
            <HeartPulse className="w-4 h-4 text-emerald-400" />
          </div>

          <div>
            {analytics?.consent_health?.percentage !== null && analytics?.consent_health?.percentage !== undefined ? (
              <div className="text-2xl font-black text-emerald-400">
                {analytics.consent_health.percentage}%
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-400 italic">No data yet</div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.consent_health?.status || 'No data yet'}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications or alerts..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('alerts')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'alerts' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('applications')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'applications' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Applications ({consents.length})
          </button>
        </div>
      </div>

      {/* Main Content Grid: Recent Alerts + Registered Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Mismatch Alerts Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Recent Mismatch Alerts
            </h2>
            <Link to="/alerts" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              View all ({alerts.length})
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                No alerts matching your criteria.
              </div>
            ) : (
              filteredAlerts.slice(0, 5).map((al) => (
                <div
                  key={al.id}
                  onClick={() => navigate('/alerts')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition cursor-pointer shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{al.service_name || 'Application'}</div>
                      <div className="text-xs text-slate-400">{al.organisation || 'Organisation'}</div>
                    </div>
                    <RiskBadge risk={al.risk} size="sm" />
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                    {al.notes || 'Automated purpose discrepancy flagged.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-950 font-medium">
                      Status: {al.status.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(al.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Registered Applications Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Registered Applications
            </h2>
            <Link to="/consents" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              View all ({consents.length})
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {filteredConsents.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                No applications registered yet. Click "Add Application" or "Load Demo Scenarios" above.
              </div>
            ) : (
              filteredConsents.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/consents/${c.id}`)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition cursor-pointer shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{c.service_name}</div>
                      <div className="text-xs text-slate-400 font-medium">{c.organisation}</div>
                    </div>
                    {c.latest_risk ? (
                      <RiskBadge risk={c.latest_risk} size="sm" />
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        No Evidence
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                    "{c.original_purpose}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>
                      {c.analyses_count} {c.analyses_count === 1 ? 'analysis' : 'analyses'} completed
                    </span>
                    <span className="capitalize">{c.source_type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
