import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { api } from '../api';
import { AnalysisRead, RiskLevel } from '../types';
import { ScoreRing } from '../components/ScoreRing';
import { RiskBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

interface Preset {
  id: string;
  label: string;
  expectedRisk: RiskLevel;
  badgeColor: string;
  original: string;
  statement: string;
}

const PRESETS: Preset[] = [
  {
    id: 'scholarship',
    label: 'Scholarship / Ad Partners',
    expectedRisk: 'HIGH',
    badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-500/10',
    original: 'We collect your academic records and contact details solely to evaluate your scholarship eligibility and communicate application progress.',
    statement: 'We may disclose your registered personal email address and academic profile to our commercial advertising partners and sponsors for promotional opportunities.'
  },
  {
    id: 'telehealth',
    label: 'Telehealth / Insurance Brokers',
    expectedRisk: 'HIGH',
    badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-500/10',
    original: 'Your medical history and consultation records are utilized strictly by licensed clinicians to provide virtual healthcare consultations.',
    statement: 'To facilitate comprehensive coverage programs, we sell anonymized wellness records and disclose member contact details to partner insurance data brokers.'
  },
  {
    id: 'shopping',
    label: 'Shopping / Third Parties',
    expectedRisk: 'MEDIUM',
    badgeColor: 'border-amber-500/50 text-amber-300 bg-amber-500/10',
    original: 'We process your shipping address and payment method to fulfill your e-commerce orders and manage returns.',
    statement: 'To improve our services and analyze purchasing patterns, we share aggregated usage telemetry and behavioral insights with selected trusted partners.'
  },
  {
    id: 'delivery',
    label: 'Delivery / Status Notice',
    expectedRisk: 'LOW',
    badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10',
    original: 'Your contact telephone number is collected to provide real-time package dispatch alerts and delivery tracking.',
    statement: 'Your package is out for delivery with our courier driver. Verification receipt has been sent to your registered phone number.'
  }
];

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [originalPurpose, setOriginalPurpose] = useState<string>(PRESETS[0].original);
  const [statementText, setStatementText] = useState<string>(PRESETS[0].statement);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].id);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);

  const handleSelectPreset = (p: Preset) => {
    setActivePreset(p.id);
    setOriginalPurpose(p.original);
    setStatementText(p.statement);
    setResult(null);
    setError(null);
  };

  const handleRunSimulator = async () => {
    if (!originalPurpose.trim() || !statementText.trim()) {
      setError('Please provide both the original purpose and the evidence statement.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzePlayground(originalPurpose.trim(), statementText.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulator request failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSimulator = () => {
    const el = document.getElementById('interactive-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to highlight matched risky phrases inside the statement
  const renderHighlightedStatement = (content: string, quotes: string[]) => {
    if (!quotes || quotes.length === 0) {
      return <span>{content}</span>;
    }

    // Build regex from quotes
    try {
      const regexParts = quotes
        .filter((q) => q && q.trim().length > 3)
        .map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      if (regexParts.length === 0) return <span>{content}</span>;

      const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');
      const parts = content.split(regex);

      return (
        <span>
          {parts.map((part, i) => {
            const isMatch = quotes.some((q) => q.toLowerCase().trim() === part.toLowerCase().trim());
            return isMatch ? (
              <mark
                key={i}
                className="bg-rose-500/25 text-rose-200 border-b-2 border-rose-500 px-1 py-0.5 rounded font-medium"
              >
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            );
          })}
        </span>
      );
    } catch (e) {
      return <span>{content}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Consent<span className="text-blue-400">Drift</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-md shadow-blue-600/25"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-md shadow-blue-600/25"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Evidence-Backed Privacy Drift Detection
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Identify when your data is used for a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              different purpose.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ConsentDrift compares what you originally agreed to against subsequent privacy disclosures, emails, and notices — flagging purpose drift with verbatim quotes and transparent scores.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={scrollToSimulator}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center justify-center gap-2"
            >
              Try Live Interactive Simulator
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="interactive-simulator" className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/60 border-y border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Interactive Simulator
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Test statement comparison live in your browser. No account or login required.
            </p>

            {/* Preset Selection Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                    activePreset === p.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${p.badgeColor}`}>
                    {p.expectedRisk}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Box 1: Original Purpose */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Original Purpose Statement
                </label>
                <span className="text-[11px] text-slate-500">Agreed baseline</span>
              </div>
              <textarea
                value={originalPurpose}
                onChange={(e) => setOriginalPurpose(e.target.value)}
                rows={4}
                placeholder="e.g. We collect your data solely to evaluate scholarship eligibility..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-normal leading-relaxed"
              />
            </div>

            {/* Box 2: New Statement */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  New Notice / Email Statement
                </label>
                <span className="text-[11px] text-slate-500">Newly received text</span>
              </div>
              <textarea
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                rows={4}
                placeholder="e.g. We may share your information with commercial advertising partners..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-normal leading-relaxed"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleRunSimulator}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
            >
              {loading ? (
                <span>Comparing Statements...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compare Statements Now</span>
                </>
              )}
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <RiskBadge risk={result.risk} size="lg" />
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                    Mode: {result.mode}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => {
                      if (user) {
                        navigate('/evidence/new');
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow"
                  >
                    Save in Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid: Score Ring + Analysis Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 items-center">
                <div className="md:col-span-3 flex justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-5 md:pb-0 md:pr-6">
                  <ScoreRing score={result.score} risk={result.risk} size={110} strokeWidth={9} />
                </div>

                <div className="md:col-span-9 space-y-4">
                  {/* Difference Identified */}
                  <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Difference Identified (Highlighted Quotes)
                    </span>
                    <div className="text-sm text-slate-200 leading-relaxed font-sans">
                      {renderHighlightedStatement(statementText, result.evidence_quotes)}
                    </div>
                  </div>

                  {/* Plain Language Explanation */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Engine Explanation
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Why This Score? */}
              <div className="pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-blue-400 hover:text-blue-300 transition py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Why this score? (Calculation breakdown & formula)
                  </span>
                  {showScoreBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showScoreBreakdown && result.score_breakdown && (
                  <div className="mt-3 p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 font-semibold">Classification Formula:</span>
                      <span className="font-mono text-slate-200">{result.score_breakdown.formula}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block mb-2">Triggered Signal Weights:</span>
                      {result.score_breakdown.signals && result.score_breakdown.signals.length > 0 ? (
                        <div className="space-y-1.5">
                          {result.score_breakdown.signals.map((sig, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded border border-slate-800 font-mono text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{sig.signal}</span>
                                {sig.covered_by_baseline ? (
                                  <span className="text-emerald-400 text-[10px] px-1.5 py-0.2 bg-emerald-500/10 rounded">
                                    covered in baseline
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
          )}
        </div>
      </section>

      {/* 3-Step Explainer Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How ConsentDrift Protects You
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            A simple 3-step surveillance workflow to maintain continuous data sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-base mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-white mb-2">Register Baseline Purpose</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When applying for a scholarship, signing up for an app, or accepting terms, record the exact initial purpose and categories consented to.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-base mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-white mb-2">Submit Privacy Evidence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you receive emails, policy update notifications, or terms revisions, paste the snippet or upload the email. Our engine extracts verifiable evidence quotes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-base mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-white mb-2">Export Clarification Letters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate non-accusatory, formal clarification letters structured under DPDP Act, GDPR, or CCPA to inquire directly with the organization's privacy officer.
            </p>
          </div>
        </div>
      </section>

      {/* Transparency Notice */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Transparency Notice
          </span>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
            ConsentDrift does not read backend databases or inspect internal network flows. It compares disclosed texts to identify potential discrepancies. Findings do not constitute proof of misuse or a legal violation.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        Findings are potential discrepancies based on submitted evidence. They are not proof of misuse or a legal violation.
      </footer>
    </div>
  );
};
