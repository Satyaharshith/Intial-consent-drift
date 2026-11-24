import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Download,
  Plus,
  UploadCloud,
  FileText,
  Mail,
  Bell,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../api';
import { ConsentDetail as IConsentDetail, EvidenceCreateInput } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ConsentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const consentId = Number(id);

  const [consent, setConsent] = useState<IConsentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add evidence form state
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<'email' | 'policy' | 'notification' | 'sms' | 'other'>('email');
  const [evidenceSource, setEvidenceSource] = useState('');
  const [evidenceContent, setEvidenceContent] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConsentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getConsent(consentId);
      setConsent(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load consent details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (consentId) {
      loadConsentData();
    }
  }, [consentId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this consent record and all its associated analyses?')) {
      return;
    }
    try {
      await api.deleteConsent(consentId);
      navigate('/');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportConsent(consentId);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-record-${consentId}-${consent?.service_name.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      alert('Please upload a plain text (.txt) file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setEvidenceContent(text);
      if (!evidenceTitle) {
        setEvidenceTitle(file.name.replace(/\.txt$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim() || !evidenceContent.trim()) {
      setEvidenceError('Please enter both a title and the evidence content.');
      return;
    }

    try {
      setSubmittingEvidence(true);
      setEvidenceError(null);
      const payload: EvidenceCreateInput = {
        consent_id: consentId,
        title: evidenceTitle.trim(),
        evidence_type: evidenceType,
        source: evidenceSource.trim() || null,
        content: evidenceContent.trim()
      };
      const analysis = await api.submitEvidence(payload);
      // Immediately navigate to the newly generated analysis
      navigate(`/analyses/${analysis.id}`);
    } catch (err: any) {
      setEvidenceError(err.message || 'Failed to submit evidence and run analysis.');
      setSubmittingEvidence(false);
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'policy':
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading consent record details...</p>
      </div>
    );
  }

  if (error || !consent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Record Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Consent record does not exist.'}</p>
        <Link to="/" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{consent.service_name}</h1>
            <span className="text-sm text-slate-500 font-medium">({consent.organisation})</span>
            <RiskBadge risk={consent.latest_risk} />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition-colors"
            title="Export record, evidence, and analyses as JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs transition-colors"
            title="Delete this record and its analyses"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Baseline Consent Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            Baseline Purpose (Original Agreement)
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Source: {consent.source_type === 'official_text' ? 'Official Policy Text' : 'User Summary'}
          </span>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
          <p className="text-sm text-slate-800 font-medium leading-relaxed italic">
            "{consent.original_purpose}"
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600">Data Categories Agreed:</span>
            {consent.data_categories && consent.data_categories.length > 0 ? (
              consent.data_categories.map((cat, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-blue-100">
                  {cat}
                </span>
              ))
            ) : (
              <span className="italic text-slate-400">None specified</span>
            )}
          </div>
          {consent.consent_date && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Agreed Date: {consent.consent_date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Add Evidence Panel (Left) & Analyses Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Add Evidence Panel */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 sticky top-24">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Submit New Evidence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste newly received disclosure text or upload a plain text file.
            </p>
          </div>

          {evidenceError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {evidenceError}
            </div>
          )}

          <form onSubmit={handleSubmitEvidence} className="space-y-4">
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Evidence Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Terms Update email"
                  value={evidenceTitle}
                  onChange={e => setEvidenceTitle(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Evidence Type *</label>
                <select
                  value={evidenceType}
                  onChange={e => setEvidenceType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="email">Email</option>
                  <option value="policy">Privacy Policy snippet</option>
                  <option value="notification">Push Notification</option>
                  <option value="sms">SMS</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Source (optional)</label>
              <input
                type="text"
                placeholder="e.g. updates@organisation.com or URL"
                value={evidenceSource}
                onChange={e => setEvidenceSource(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Content Textarea & Drag-and-drop */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Evidence Text *</span>
                <span className="text-[11px] font-normal text-slate-400">Max 20,000 characters</span>
              </label>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-3 transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <textarea
                  rows={6}
                  placeholder="Paste the disclosure text here, or drag & drop a .txt file..."
                  value={evidenceContent}
                  onChange={e => setEvidenceContent(e.target.value)}
                  required
                  maxLength={20000}
                  className="w-full p-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span>Drag .txt file here or</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      browse
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  <span>{evidenceContent.length} / 20000 chars</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingEvidence}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submittingEvidence ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Purpose Drift...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyse Evidence</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Analyses Timeline */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Analyses Timeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                History of submitted evidence and purpose drift assessments.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
              {consent.analyses?.length || 0} Total
            </span>
          </div>

          {!consent.analyses || consent.analyses.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No evidence analyzed yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the form on the left to submit an email or policy disclosure to check for purpose drift.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {consent.analyses.map((analysis) => {
                const ev = consent.evidence.find(e => e.id === analysis.evidence_id);
                return (
                  <Link
                    key={analysis.id}
                    to={`/analyses/${analysis.id}`}
                    className="block py-4 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-lg">
                        <div className="flex items-center gap-2">
                          {getEvidenceIcon(ev?.evidence_type || 'other')}
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {ev?.title || `Evidence #${analysis.evidence_id}`}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 uppercase px-1.5 py-0.2 bg-slate-100 rounded">
                            {analysis.mode}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {analysis.explanation}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          {ev?.source && <span>Source: {ev.source}</span>}
                          <span>
                            {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                            {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <RiskBadge risk={analysis.risk} size="sm" />
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
