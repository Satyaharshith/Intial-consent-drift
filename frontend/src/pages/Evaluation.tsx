import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { EvalResultsResponse, EvalModeResult } from '../types';

const CLASSES = ['LOW', 'MEDIUM', 'HIGH', 'INSUFFICIENT_EVIDENCE'];

export const Evaluation: React.FC = () => {
  const [evalData, setEvalData] = useState<EvalResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules_only' | 'hybrid'>('rules_only');

  const fetchEval = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvalResults();
      setEvalData(data);
      if (data?.metrics?.hybrid) {
        setActiveTab('hybrid');
      } else {
        setActiveTab('rules_only');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch evaluation results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEval();
  }, []);

  const currentMetrics: EvalModeResult | undefined =
    evalData?.metrics?.[activeTab] || evalData?.metrics?.rules_only;

  const getHeatmapColor = (value: number, totalInRow: number) => {
    if (!value || totalInRow === 0) return 'bg-[#0B0F19] text-slate-500';
    const pct = value / totalInRow;
    if (pct >= 0.8) return 'bg-emerald-600/30 text-emerald-300 font-bold border-emerald-500/40';
    if (pct >= 0.5) return 'bg-emerald-600/20 text-emerald-300 font-semibold border-emerald-500/30';
    if (pct >= 0.2) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-semibold text-slate-100">
              Evaluation & Benchmark Harness
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Empirical accuracy, confusion matrices, and precision/recall metrics evaluated across a 40-sample benchmark dataset.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEval}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#182235] hover:bg-[#202D45] text-slate-200 border border-[#1F293D] rounded-lg transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Results
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 bg-[#111927] border border-[#1F293D] rounded-xl text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
          Loading evaluation benchmark results...
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-3 bg-[#111927] rounded-xl border border-rose-500/30">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-rose-400">{error}</p>
        </div>
      ) : !evalData || evalData.status === 'pending' || !evalData.metrics ? (
        <div className="p-12 text-center space-y-4 bg-[#111927] rounded-xl border border-[#1F293D]">
          <div className="w-12 h-12 bg-[#0B0F19] border border-[#1F293D] rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-200">No Benchmark Results Yet</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Run the evaluation script in your terminal to evaluate all 40 labeled scenarios and generate live metrics:
            </p>
            <div className="mt-3 bg-[#0B0F19] text-indigo-300 border border-[#1F293D] font-mono text-xs p-3 rounded-lg max-w-sm mx-auto text-left">
              python eval/run_eval.py
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1F293D] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('rules_only')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'rules_only'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#111927] hover:bg-[#182235] text-slate-300 border border-[#1F293D]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Rules-Only Mode
              {evalData.metrics.rules_only && (
                <span className="ml-1 text-[11px] opacity-80">
                  ({(evalData.metrics.rules_only.accuracy * 100).toFixed(1)}%)
                </span>
              )}
            </button>

            {evalData.metrics.hybrid ? (
              <button
                type="button"
                onClick={() => setActiveTab('hybrid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'hybrid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#111927] hover:bg-[#182235] text-slate-300 border border-[#1F293D]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Hybrid (LLM + Rules) Mode
                <span className="ml-1 text-[11px] opacity-80">
                  ({(evalData.metrics.hybrid.accuracy * 100).toFixed(1)}%)
                </span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 italic px-3 py-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Hybrid mode not evaluated (set LLM_API_KEY in .env to run hybrid eval)
              </div>
            )}
          </div>

          {currentMetrics && (
            <>
              {/* Key High-Level Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#111927] p-5 rounded-xl border border-[#1F293D]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Accuracy</p>
                  <p className="text-3xl font-bold text-indigo-400 mt-1">
                    {(currentMetrics.accuracy * 100).toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Target: 70%+ baseline
                  </span>
                </div>

                <div className="bg-[#111927] p-5 rounded-xl border border-[#1F293D]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">
                    {currentMetrics.total} samples
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Multi-domain dataset
                  </span>
                </div>

                <div className="bg-[#111927] p-5 rounded-xl border border-[#1F293D]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">False HIGH Alarms</p>
                  <p className={`text-3xl font-bold mt-1 ${currentMetrics.false_high_count === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentMetrics.false_high_count}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Critical metric to avoid alert fatigue
                  </span>
                </div>

                <div className="bg-[#111927] p-5 rounded-xl border border-[#1F293D]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Timestamp</p>
                  <p className="text-xs font-medium text-slate-200 mt-2 truncate">
                    {evalData.generated_at ? new Date(evalData.generated_at).toLocaleString() : 'Recent'}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    eval/results.json
                  </span>
                </div>
              </div>

              {/* 4x4 Confusion Matrix Heatmap */}
              <div className="bg-[#111927] rounded-xl border border-[#1F293D] p-6 space-y-4">
                <div>
                  <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    4×4 Confusion Matrix Heatmap
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rows represent Ground Truth (Expected), Columns represent ConsentDrift Pipeline Predictions.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="p-3 text-left font-bold text-slate-300 bg-[#0B0F19] border border-[#1F293D]">
                          Expected \ Predicted
                        </th>
                        {CLASSES.map((cls) => (
                          <th key={cls} className="p-3 font-bold text-slate-300 bg-[#0B0F19] border border-[#1F293D] min-w-24">
                            {cls}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CLASSES.map((expected) => {
                        const row = currentMetrics.confusion_matrix?.[expected] || {};
                        const rowTotal = Object.values(row).reduce((a: number, b: number) => Number(a) + Number(b), 0);

                        return (
                          <tr key={expected}>
                            <td className="p-3 text-left font-bold text-slate-200 bg-[#0B0F19] border border-[#1F293D]">
                              {expected}
                            </td>
                            {CLASSES.map((predicted) => {
                              const count = Number(row[predicted] || 0);
                              const isDiagonal = expected === predicted;
                              return (
                                <td
                                  key={predicted}
                                  className={`p-3 border border-[#1F293D] transition ${
                                    isDiagonal
                                      ? getHeatmapColor(count, rowTotal)
                                      : count > 0
                                      ? 'bg-rose-500/20 text-rose-300 font-semibold'
                                      : 'bg-[#0B0F19]/40 text-slate-500'
                                  }`}
                                >
                                  <span className="text-sm font-bold">{count}</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-Class Precision, Recall, F1 Table */}
              <div className="bg-[#111927] rounded-xl border border-[#1F293D] p-6 space-y-4">
                <div>
                  <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Per-Class Performance Metrics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Breakdown of Precision, Recall, and F1-Score per risk category.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0B0F19] border-b border-[#1F293D]">
                        <th className="p-3 font-bold text-slate-300">Class</th>
                        <th className="p-3 font-bold text-slate-300">Support (Count)</th>
                        <th className="p-3 font-bold text-slate-300">Precision</th>
                        <th className="p-3 font-bold text-slate-300">Recall</th>
                        <th className="p-3 font-bold text-slate-300">F1-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F293D]/60">
                      {CLASSES.map((cls) => {
                        const metrics = currentMetrics.per_class?.[cls];
                        if (!metrics) return null;
                        return (
                          <tr key={cls} className="hover:bg-[#182235]/50 transition">
                            <td className="p-3 font-bold text-slate-200">{cls}</td>
                            <td className="p-3 text-slate-400">{metrics.support}</td>
                            <td className="p-3 text-slate-200 font-semibold">
                              {(metrics.precision * 100).toFixed(1)}%
                            </td>
                            <td className="p-3 text-slate-200 font-semibold">
                              {(metrics.recall * 100).toFixed(1)}%
                            </td>
                            <td className="p-3 text-indigo-400 font-bold">
                              {(metrics.f1 * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Limitations Note */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-5 space-y-2 text-xs text-slate-400">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider">Evaluation Methodology Notes</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>The dataset contains 40 curated scenarios across job portals, scholarships, edtech, e-commerce, banking, and government services.</li>
              <li>Tricky cases include legitimate operational emails using words like "partner" without sharing, pre-authorized marketing, and opt-in marketing.</li>
              <li>Zero false high alarms on benign emails is prioritized to ensure high user trust.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
