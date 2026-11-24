import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  AlertTriangle,
  Copy,
  Download,
  Check,
  Sparkles,
  FileCheck2,
  Users,
  Shield,
  X
} from 'lucide-react';
import { api } from '../api';
import { AnalysisRead, ClarificationResponse, QuoteSpan } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const AnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const analysisId = Number(id);

  const [analysis, setAnalysis] = useState<AnalysisRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clarification modal state
  const [showClarification, setShowClarification] = useState(false);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [generatingClarification, setGeneratingClarification] = useState(false);
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

  const handleGenerateClarification = async () => {
    try {
      setGeneratingClarification(true);
      setShowClarification(true);
      const res = await api.generateClarification(analysisId);
      setClarification(res);
    } catch (err: any) {
      alert(`Failed to generate clarification request: ${err.message}`);
      setShowClarification(false);
    } finally {
      setGeneratingClarification(false);
    }
  };

  const handleCopyClarification = () => {
    if (!clarification) return;
    const fullText = `Subject: ${clarification.subject}\n\n${clarification.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClarification = () => {
    if (!clarification) return;
    const fullText = `Subject: ${clarification.subject}\n\n${clarification.body}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarification-request-${analysis?.consent_service_name?.replace(/\s+/g, '-').toLowerCase() || 'service'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to render highlighted text
  const renderHighlightedContent = (content: string, spans: QuoteSpan[] = []) => {
    if (!spans || spans.length === 0) {
      return <span>{content}</span>;
    }

    // Sort spans by start
    const sorted = [...spans].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let currentIdx = 0;

    sorted.forEach((span, i) => {
      // Non-highlighted segment
      if (span.start > currentIdx) {
        elements.push(
          <span key={`text-${i}`}>
            {content.substring(currentIdx, span.start)}
          </span>
        );
      }
      // Highlighted quote
      const start = Math.max(currentIdx, span.start);
      const end = Math.min(content.length, span.end);
      if (start < end) {
        elements.push(
          <mark
            key={`mark-${i}`}
            className="bg-amber-200 text-amber-950 font-medium px-1 py-0.5 rounded border border-amber-300 shadow-2xs"
            title="Validated quote from evidence"
          >
            {content.substring(start, end)}
          </mark>
        );
        currentIdx = end;
      }
    });

    if (currentIdx < content.length) {
      elements.push(
        <span key="text-end">
          {content.substring(currentIdx)}
        </span>
      );
    }

    return elements;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Running purpose drift analysis...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Analysis Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Could not retrieve analysis details.'}</p>
        <Link to="/" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/consents/${analysis.consent_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {analysis.consent_service_name || 'Consent Record'}
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">Purpose Drift Analysis</h1>
            <span className="text-xs text-slate-500 font-medium">
              for {analysis.consent_service_name} ({analysis.consent_organisation})
            </span>
            <RiskBadge risk={analysis.risk} size="lg" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
              Mode: {analysis.mode}
            </span>
          </div>
        </div>

        {/* Generate clarification CTA */}
        <button
          type="button"
          onClick={handleGenerateClarification}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Share2 className="w-4 h-4" />
          Generate Clarification Request
        </button>
      </div>

      {/* Warnings Banner if any */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Analysis Notifications & Downgrades</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-700 pl-2 space-y-0.5">
            {analysis.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-Column Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Original Baseline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Original Consent Baseline
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Agreed Baseline
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60 min-h-[140px]">
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed italic">
                "{analysis.consent_original_purpose || (analysis.original_purposes && analysis.original_purposes[0])}"
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            This represents what you initially authorized the organisation to collect and use your data for.
          </div>
        </div>

        {/* Right Column: Newly Received Evidence with Highlighted Quotes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Submitted Evidence (with highlighted quotes)
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {analysis.evidence_quotes?.length || 0} Quotes Validated
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60 min-h-[140px] max-h-96 overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                {renderHighlightedContent(analysis.evidence_content || '', analysis.quote_spans)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Highlighted text shows exact validated quotes detected by the pipeline.</span>
          </div>
        </div>
      </div>

      {/* Structured Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Plain-Language Explanation */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Explanation of Findings
          </h2>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {analysis.explanation}
            </p>
          </div>

          {/* Recommended Action */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" />
              Recommended Action
            </h3>
            <p className="text-xs text-slate-600 bg-blue-50/50 border border-blue-100 p-3 rounded-lg font-medium">
              {analysis.recommended_action}
            </p>
          </div>
        </div>

        {/* Card 2: Key Risk Indicators */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Data & Sharing Indicators
          </h2>

          <div className="space-y-3">
            {/* Third Party Sharing */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Third-Party Sharing:
              </span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                analysis.third_party_sharing === 'yes'
                  ? 'bg-rose-100 text-rose-800'
                  : analysis.third_party_sharing === 'no'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {analysis.third_party_sharing}
              </span>
            </div>

            {/* Affected Data Categories */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-medium text-slate-600 block">
                Data Categories Mentioned:
              </span>
              <div className="flex flex-wrap gap-1">
                {analysis.data_categories_affected && analysis.data_categories_affected.length > 0 ? (
                  analysis.data_categories_affected.map((cat, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">None specifically detected</span>
                )}
              </div>
            </div>

            {/* Triggered Signals */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-medium text-slate-600 block">
                Signals Triggered ({analysis.rule_signals?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1">
                {analysis.rule_signals && analysis.rule_signals.length > 0 ? (
                  analysis.rule_signals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono font-medium bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded"
                      title={`Matched: "${sig.matched_text}"`}
                    >
                      {sig.signal}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No signals triggered</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directly Stated vs AI Interpretation Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Directly Stated vs AI Interpretation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear separation between verbatim quoted evidence and analytical interpretation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Directly Stated Quotes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Directly Stated (Verbatim Evidence Quotes)
            </h3>
            {analysis.statement_labels?.directly_stated && analysis.statement_labels.directly_stated.length > 0 ? (
              <div className="space-y-2">
                {analysis.statement_labels.directly_stated.map((quote, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs text-emerald-950 font-mono">
                    "{quote}"
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                No verbatim quotes directly substantiated in evidence.
              </p>
            )}
          </div>

          {/* AI / Rule Interpretation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Analytical Interpretation
            </h3>
            {analysis.statement_labels?.ai_interpretation && analysis.statement_labels.ai_interpretation.length > 0 ? (
              <div className="space-y-2">
                {analysis.statement_labels.ai_interpretation.map((statement, idx) => (
                  <div key={idx} className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg text-xs text-blue-950">
                    {statement}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                No extra analytical interpretations.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Clarification Request Modal / Drawer */}
      {showClarification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Clarification Request Generator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClarification(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {generatingClarification ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-xs">Generating formal clarification draft...</p>
                </div>
              ) : clarification ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subject</label>
                    <input
                      type="text"
                      value={clarification.subject}
                      onChange={e => setClarification({ ...clarification, subject: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Body</label>
                    <textarea
                      rows={12}
                      value={clarification.body}
                      onChange={e => setClarification({ ...clarification, body: e.target.value })}
                      className="w-full p-3 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Neutral, non-accusatory inquiry based on evidence quotes.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyClarification}
                  disabled={!clarification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadClarification}
                  disabled={!clarification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
