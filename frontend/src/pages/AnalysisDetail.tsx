import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Copy,
  Download,
  Check,
  Sparkles,
  FileCheck2,
  Users,
  Shield,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { AnalysisRead, ComplaintDraft, QuoteSpan } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreRing } from '../components/ScoreRing';

export const AnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const analysisId = Number(id);

  const [analysis, setAnalysis] = useState<AnalysisRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Clarification modal state
  const [showClarification, setShowClarification] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'general' | 'dpdp' | 'gdpr' | 'ccpa'>('general');
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAnalysis(analysisId);
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analysis details.');
      } finally {
        setLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  const handleGenerateDraft = async (templateType: 'general' | 'dpdp' | 'gdpr' | 'ccpa' = selectedTemplate) => {
    try {
      setGeneratingDraft(true);
      setSelectedTemplate(templateType);
      setShowClarification(true);
      const res = await api.createClarificationDraft(analysisId, templateType);
      setDraft(res);
    } catch (err: any) {
      alert(`Failed to generate clarification request: ${err.message}`);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleCopyText = () => {
    if (!draft) return;
    const full = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!draft) return;
    const full = `Subject: ${draft.subject}\n\n${draft.body}`;
    const blob = new Blob([full], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarification_${draft.template}_${analysis?.consent_service_name || 'request'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMailto = () => {
    if (!draft) return;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    window.location.href = mailtoUrl;
  };

  // Render Highlighted Content
  const renderHighlightedContent = (content: string, spans: QuoteSpan[] = []) => {
    if (!spans || spans.length === 0) {
      return <span>{content}</span>;
    }

    const sorted = [...spans].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let currentIdx = 0;

    sorted.forEach((span, i) => {
      if (span.start > currentIdx) {
        elements.push(<span key={`text-${i}`}>{content.slice(currentIdx, span.start)}</span>);
      }
      const matchText = content.slice(span.start, span.end);
      elements.push(
        <mark
          key={`mark-${i}`}
          className="bg-rose-500/25 text-rose-200 border-b-2 border-rose-500 px-1 py-0.5 rounded font-medium shadow-xs"
          title="Verified verbatim evidence quote"
        >
          {matchText}
        </mark>
      );
      currentIdx = span.end;
    });

    if (currentIdx < content.length) {
      elements.push(<span key="text-end">{content.slice(currentIdx)}</span>);
    }

    return elements;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white mb-2">Analysis Not Found</h2>
        <p className="text-xs text-slate-400 mb-5">{error || 'This analysis record could not be loaded.'}</p>
        <Link to="/consents" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
          &larr; Return to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back link */}
      <Link
        to={`/consents/${analysis.consent_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {analysis.consent_service_name || 'Application'}
      </Link>

      {/* Top Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <RiskBadge risk={analysis.risk} size="lg" />
              <span className="text-xs px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                mode: {analysis.mode}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded font-mono font-semibold border ${
                  analysis.integrity_status === 'unchanged'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                Integrity: {analysis.integrity_status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-2">
              Purpose Drift Analysis: {analysis.consent_service_name}
            </h1>
            <span className="text-xs text-slate-400">{analysis.consent_organisation}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleGenerateDraft('general')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Clarification Request</span>
            </button>
          </div>
        </div>

        {/* Score Ring & Engine Explanation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
          <div className="md:col-span-3 flex justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-5 md:pb-0 md:pr-6">
            <ScoreRing score={analysis.score} risk={analysis.risk} size={110} strokeWidth={9} />
          </div>

          <div className="md:col-span-9 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Analysis Explanation
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {analysis.explanation}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs">
              <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Recommended Action:</span>
                <span className="text-slate-300">{analysis.recommended_action}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Why This Score? */}
        <div className="pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className="w-full flex items-center justify-between text-xs font-semibold text-blue-400 hover:text-blue-300 transition py-1"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Why this score? ({analysis.score}/100) — View calculation breakdown & formula
            </span>
            {showScoreBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showScoreBreakdown && analysis.score_breakdown && (
            <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-semibold">Classification Formula:</span>
                <span className="font-mono text-slate-200 text-[11px]">{analysis.score_breakdown.formula}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-2">Signal Weights Breakdown:</span>
                {analysis.score_breakdown.signals && analysis.score_breakdown.signals.length > 0 ? (
                  <div className="space-y-1.5">
                    {analysis.score_breakdown.signals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{sig.signal}</span>
                          {sig.covered_by_baseline ? (
                            <span className="text-emerald-400 text-[10px] px-1.5 py-0.2 bg-emerald-500/10 rounded">
                              covered by baseline
                            </span>
                          ) : (
                            <span className="text-rose-400 text-[10px] px-1.5 py-0.2 bg-rose-500/10 rounded">
                              uncovered discrepancy
                            </span>
                          )}
                        </div>
                        <span className="text-slate-300">
                          {sig.score_contribution > 0 ? `+${sig.score_contribution}` : `${sig.score_contribution}`} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No secondary discrepancy signals detected.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Layout: Original Consent vs New Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Original Consent Baseline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Original Consent Baseline
            </h2>
            <span className="text-[11px] text-slate-500">Agreed Anchor</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Primary Purpose
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              "{analysis.consent_original_purpose}"
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Registered Data Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.data_categories_affected && analysis.data_categories_affected.length > 0 ? (
                analysis.data_categories_affected.map((cat, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[11px] border border-slate-800 font-mono"
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic text-xs">None specified</span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            <span>Application: {analysis.consent_service_name}</span>
          </div>
        </div>

        {/* Right Column: New Evidence with Verified Quotes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              New Evidence Disclosure
            </h2>
            <span className="text-[11px] text-rose-400 font-medium">Verified Quotes Highlighted</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
            {renderHighlightedContent(analysis.evidence_content || '', analysis.quote_spans || [])}
          </div>

          {/* Third Party Sharing Badge */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Third-Party Sharing Disclosed:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                analysis.third_party_sharing === 'yes'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : analysis.third_party_sharing === 'no'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {analysis.third_party_sharing}
            </span>
          </div>
        </div>
      </div>

      {/* Directly Stated vs AI / Rule Interpretation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Directly Stated Evidence vs. Interpretation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Directly Stated Quotes */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-2 uppercase text-[10px] tracking-wider">
              Directly Stated in Evidence (Verified Verbatim Quotes)
            </span>
            {analysis.statement_labels?.directly_stated && analysis.statement_labels.directly_stated.length > 0 ? (
              <ul className="space-y-2 list-disc list-inside text-slate-200">
                {analysis.statement_labels.directly_stated.map((quote, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="italic">"{quote}"</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No direct verbatim quotes extracted.</p>
            )}
          </div>

          {/* AI / Rule Interpretation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-blue-400 block mb-2 uppercase text-[10px] tracking-wider">
              Engine & Rule Interpretation
            </span>
            {analysis.statement_labels?.ai_interpretation && analysis.statement_labels.ai_interpretation.length > 0 ? (
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                {analysis.statement_labels.ai_interpretation.map((statement, idx) => (
                  <li key={idx} className="leading-relaxed">{statement}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No secondary interpretations generated.</p>
            )}
          </div>
        </div>
      </div>

      {/* Triggered Rule Signals & Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triggered Signals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Triggered Discrepancy Signals ({analysis.rule_signals.length})
          </span>
          <div className="space-y-1.5 text-xs font-mono">
            {analysis.rule_signals.length === 0 ? (
              <p className="text-slate-500 italic font-sans text-xs">No discrepancy signals triggered.</p>
            ) : (
              analysis.rule_signals.map((sig, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-rose-300 font-bold">{sig.signal}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                    "{sig.matched_text}"
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Engine Warnings & Safeguards ({analysis.warnings.length})
          </span>
          {analysis.warnings.length === 0 ? (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>All candidate quotes verified verbatim; zero hallucinations detected.</span>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-amber-300">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clarification Request Modal */}
      {showClarification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Draft Clarification Request Letter
                </h3>
                <span className="text-xs text-slate-400">
                  Polite, formal inquiry for {analysis.consent_service_name}
                </span>
              </div>
              <button
                onClick={() => setShowClarification(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/30 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Template:</span>
              {(['general', 'dpdp', 'gdpr', 'ccpa'] as const).map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleGenerateDraft(tmpl)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border transition ${
                    selectedTemplate === tmpl
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tmpl}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {generatingDraft ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                  Drafting clarification inquiry...
                </div>
              ) : draft ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={draft.subject}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Letter Body
                    </label>
                    <textarea
                      readOnly
                      rows={12}
                      value={draft.body}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">Select a template to generate a letter.</div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            {draft && (
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.txt</span>
                  </button>
                  <a
                    href={api.getDraftPdfUrl(draft.id)}
                    download
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>PDF</span>
                  </a>
                  <button
                    onClick={handleMailto}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Email App</span>
                  </button>
                </div>

                <Link
                  to="/drafts"
                  onClick={() => setShowClarification(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Manage in Complaint Drafts &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
