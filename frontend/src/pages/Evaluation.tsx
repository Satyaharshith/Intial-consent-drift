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

  const currentMetrics: EvalModeResult | undefined = evalData?.metrics?.[activeTab] || evalData?.metrics?.rules_only;

  const getHeatmapColor = (value: number, totalInRow: number) => {
    if (!value || totalInRow === 0) return 'bg-slate-50 text-slate-400';
    const pct = value / totalInRow;
    if (pct >= 0.8) return 'bg-emerald-600 text-white font-bold';
    if (pct >= 0.5) return 'bg-emerald-200 text-emerald-950 font-semibold';
    if (pct >= 0.2) return 'bg-amber-100 text-amber-900';
    return 'bg-rose-100 text-rose-900';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Evaluation & Benchmark Harness
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical accuracy, confusion matrices, and precision/recall metrics evaluated across a 40-sample benchmark dataset.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEval}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Results
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-medium">Loading evaluation benchmark results...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 bg-white rounded-xl border border-rose-200">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600">{error}</p>
        </div>
      ) : !evalData || evalData.status === 'pending' || !evalData.metrics ? (
        <div className="p-12 text-center space-y-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">No Benchmark Results Yet</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Run the evaluation script in your terminal to evaluate all 40 labeled scenarios and generate live metrics:
            </p>
            <div className="mt-3 bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded-lg max-w-sm mx-auto text-left">
              python eval/run_eval.py
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('rules_only')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'rules_only'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'hybrid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
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
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(currentMetrics.accuracy * 100).toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Target: 70%+ baseline
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Evaluated</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {currentMetrics.total} samples
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Multi-domain dataset
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">False HIGH Alarms</p>
                  <p className={`text-2xl font-bold mt-1 ${currentMetrics.false_high_count === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentMetrics.false_high_count}
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Critical metric to avoid alert fatigue
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation Timestamp</p>
                  <p className="text-xs font-medium text-slate-800 mt-2 truncate">
                    {evalData.generated_at ? new Date(evalData.generated_at).toLocaleString() : 'Recent'}
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    eval/results.json
                  </span>
                </div>
              </div>

              {/* 4x4 Confusion Matrix Heatmap */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    4×4 Confusion Matrix Heatmap
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rows represent Ground Truth (Expected), Columns represent ConsentDrift Pipeline Predictions.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="p-3 text-left font-bold text-slate-700 bg-slate-50 border border-slate-200">
                          Expected \ Predicted
                        </th>
                        {CLASSES.map((cls) => (
                          <th key={cls} className="p-3 font-bold text-slate-700 bg-slate-50 border border-slate-200 min-w-24">
                            {cls}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CLASSES.map((expected) => {
                        const row = currentMetrics.confusion_matrix?.[expected] || {};
                        const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);

                        return (
                          <tr key={expected}>
                            <td className="p-3 text-left font-bold text-slate-800 bg-slate-50 border border-slate-200">
                              {expected}
                            </td>
                            {CLASSES.map((predicted) => {
                              const count = row[predicted] || 0;
                              const isDiagonal = expected === predicted;
                              return (
                                <td
                                  key={predicted}
                                  className={`p-3 border border-slate-200 transition-colors ${
                                    isDiagonal ? getHeatmapColor(count, rowTotal) : count > 0 ? 'bg-rose-50 text-rose-800 font-medium' : 'bg-slate-50/50 text-slate-400'
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
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    Per-Class Performance Metrics
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Breakdown of Precision, Recall, and F1-Score per risk category.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-bold text-slate-700">Class</th>
                        <th className="p-3 font-bold text-slate-700">Support (Count)</th>
                        <th className="p-3 font-bold text-slate-700">Precision</th>
                        <th className="p-3 font-bold text-slate-700">Recall</th>
                        <th className="p-3 font-bold text-slate-700">F1-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {CLASSES.map((cls) => {
                        const metrics = currentMetrics.per_class?.[cls];
                        if (!metrics) return null;
                        return (
                          <tr key={cls} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">{cls}</td>
                            <td className="p-3 text-slate-600">{metrics.support}</td>
                            <td className="p-3 text-slate-800 font-semibold">
                              {(metrics.precision * 100).toFixed(1)}%
                            </td>
                            <td className="p-3 text-slate-800 font-semibold">
                              {(metrics.recall * 100).toFixed(1)}%
                            </td>
                            <td className="p-3 text-blue-600 font-bold">
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-600">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider">Evaluation Methodology Notes</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
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
