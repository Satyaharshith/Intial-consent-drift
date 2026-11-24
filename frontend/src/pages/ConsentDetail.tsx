import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Calendar,
  Tag,
  UploadCloud,
  Clock,
  Trash2,
  Download,
  AlertTriangle,
  GitCompare,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { ConsentDetail as ConsentDetailType, TimelineEvent } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ConsentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [consent, setConsent] = useState<ConsentDetailType | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'analyses' | 'timeline' | 'diff'>('analyses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Policy diff state (P2)
  const [policyEv1, setPolicyEv1] = useState<string>('');
  const [policyEv2, setPolicyEv2] = useState<string>('');
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const loadConsentData = async () => {
    if (!id) return;
    try {
      const [cData, tData] = await Promise.all([
        api.getConsent(parseInt(id, 10)),
        api.getConsentTimeline(parseInt(id, 10))
      ]);
      setConsent(cData);
      setTimeline(tData);

      // Pre-select policy diff items if available
      const policyItems = cData.evidence.filter((e) => e.evidence_type === 'policy');
      if (policyItems.length >= 2) {
        setPolicyEv1(String(policyItems[1].id));
        setPolicyEv2(String(policyItems[0].id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsentData();
  }, [id]);

  const handleDelete = async () => {
    if (!consent) return;
    if (confirm(`Are you sure you want to delete ${consent.service_name}? All associated evidence and analyses will be removed.`)) {
      try {
        await api.deleteConsent(consent.id);
        navigate('/consents');
      } catch (err: any) {
        alert(err.message || 'Failed to delete consent record.');
      }
    }
  };

  const handleExportJson = async () => {
    if (!consent) return;
    try {
      const exportData = await api.exportConsentJson(consent.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent_export_${consent.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export application data.');
    }
  };

  const handleRunPolicyDiff = async () => {
    if (!consent || !policyEv1 || !policyEv2) return;
    setDiffLoading(true);
    try {
      const diff = await api.comparePolicies(consent.id, parseInt(policyEv1, 10), parseInt(policyEv2, 10));
      setDiffResult(diff);
    } catch (err: any) {
      alert(err.message || 'Failed to compare policy versions.');
    } finally {
      setDiffLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (error || !consent) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white mb-2">Application Not Found</h2>
        <p className="text-xs text-slate-400 mb-5">{error || 'This application record could not be loaded.'}</p>
        <Link to="/consents" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
          &larr; Return to Applications
        </Link>
      </div>
    );
  }

  const policyEvidence = consent.evidence.filter((e) => e.evidence_type === 'policy');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <Link
        to="/consents"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      {/* Baseline Card at Top */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {consent.service_name}
              </h1>
              {consent.latest_risk && <RiskBadge risk={consent.latest_risk} size="sm" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{consent.organisation}</span>
              <span>&bull;</span>
              <span className="capitalize">{consent.source_type.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/evidence/new?consent_id=${consent.id}`}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Add Evidence</span>
            </Link>
            <button
              onClick={handleExportJson}
              className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition"
              title="Export JSON bundle"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl transition"
              title="Delete application"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Original Purpose Quote Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Original Stated Purpose Baseline
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            "{consent.original_purpose}"
          </p>
        </div>

        {/* Optional Full Original Consent Text */}
        {consent.original_consent_text && (
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Pasted Full Consent Policy Text
            </span>
            <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {consent.original_consent_text}
            </p>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Categories:</span>
            <div className="flex flex-wrap gap-1.5">
              {consent.data_categories.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Consent Date: {consent.consent_date || new Date(consent.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analyses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'analyses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Discrepancy Analyses ({consent.analyses.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline ({timeline.length})</span>
        </button>
        {policyEvidence.length >= 2 && (
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'diff'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-purple-400" />
            <span>Policy Diff (P2)</span>
          </button>
        )}
      </div>

      {/* TAB 1: Analyses List */}
      {activeTab === 'analyses' && (
        <div className="space-y-3">
          {consent.analyses.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
              No evidence submitted yet. Click "Add Evidence" above to analyze emails or policy snippets.
            </div>
          ) : (
            consent.analyses.map((an) => {
              const ev = consent.evidence.find((e) => e.id === an.evidence_id);
              return (
                <div
                  key={an.id}
                  onClick={() => navigate(`/analyses/${an.id}`)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                        {ev?.title || 'Evidence Analysis'}
                      </h3>
                      <RiskBadge risk={an.risk} size="sm" />
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Score: {an.score}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {an.explanation}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>{an.evidence_quotes?.length ?? 0} verified quotes</span>
                      <span>&bull;</span>
                      <span>{an.rule_signals?.length ?? 0} signals</span>
                      <span>&bull;</span>
                      <span>{new Date(an.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition shrink-0">
                    <span>Inspect</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
            {timeline.map((evt) => {
              let dotColor = 'bg-blue-500 border-slate-950';
              if (evt.risk === 'HIGH') dotColor = 'bg-rose-500 border-slate-950';
              else if (evt.risk === 'MEDIUM') dotColor = 'bg-amber-500 border-slate-950';
              else if (evt.risk === 'LOW') dotColor = 'bg-emerald-500 border-slate-950';

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 ${dotColor} shadow-md`}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      {evt.risk && <RiskBadge risk={evt.risk} size="sm" />}
                      {evt.score !== null && evt.score !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {evt.score}/100
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-normal">{evt.description}</p>

                    {evt.link && (
                      <Link
                        to={evt.link}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 mt-2 transition"
                      >
                        <span>View details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Policy Version Diff (P2) */}
      {activeTab === 'diff' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-400" />
                Policy Version Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare two policy versions to detect newly introduced sentences and highlight secondary purpose risks.
              </p>
            </div>
            <button
              onClick={handleRunPolicyDiff}
              disabled={diffLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition"
            >
              {diffLoading ? 'Comparing...' : 'Run Policy Diff'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Earlier Policy Version</label>
              <select
                value={policyEv1}
                onChange={(e) => setPolicyEv1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {policyEvidence.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({new Date(p.submitted_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Later Policy Version</label>
              <select
                value={policyEv2}
                onChange={(e) => setPolicyEv2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {policyEvidence.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({new Date(p.submitted_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {diffResult && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Added Sentences */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] block mb-2">
                    + Added Terms & Sentences ({diffResult.added_sentences.length})
                  </span>
                  {diffResult.added_sentences.length === 0 ? (
                    <p className="text-slate-500 italic">No new sentences added.</p>
                  ) : (
                    <div className="space-y-2">
                      {diffResult.added_sentences.map((item: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-slate-200">
                          <p>{item.sentence}</p>
                          {item.signals && item.signals.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.signals.map((s: any, j: number) => (
                                <span key={j} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {s.signal}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Removed Sentences */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px] block mb-2">
                    - Removed Terms ({diffResult.removed_sentences.length})
                  </span>
                  {diffResult.removed_sentences.length === 0 ? (
                    <p className="text-slate-500 italic">No sentences removed.</p>
                  ) : (
                    <div className="space-y-2">
                      {diffResult.removed_sentences.map((s: string, i: number) => (
                        <div key={i} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-slate-400 line-through">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
