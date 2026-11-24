import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UploadCloud, FileText, AlertTriangle, ArrowRight, Sparkles, Paperclip, X } from 'lucide-react';
import { api } from '../api';
import { ConsentListItem } from '../types';

const EXAMPLE_SNIPPETS = [
  {
    label: 'Normal Status (LOW)',
    badge: 'LOW',
    color: 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10',
    type: 'email' as const,
    title: 'Routine Account Verification Notice',
    content: 'Dear applicant, your documents have been successfully verified and your application status is now Under Review. We will email you regarding interview scheduled.'
  },
  {
    label: 'Advertising Discrepancy (HIGH)',
    badge: 'HIGH',
    color: 'border-rose-500/50 text-rose-300 bg-rose-500/10',
    type: 'email' as const,
    title: 'Partner Marketing & Promotions Update',
    content: 'Please note that we may share your registered personal email address with advertising partners and third parties for promotional communications, special deals, and partner offers.'
  },
  {
    label: 'Third-Party Analytics (MEDIUM)',
    badge: 'MEDIUM',
    color: 'border-amber-500/50 text-amber-300 bg-amber-500/10',
    type: 'policy' as const,
    title: 'Terms of Service Auxiliary Analytics Update',
    content: 'To improve our services and analyze platform usage, we share aggregated telemetry insights with selected trusted partners to enhance platform performance.'
  },
  {
    label: 'Insufficient Detail',
    badge: 'INSUFFICIENT',
    color: 'border-slate-500/50 text-slate-400 bg-slate-500/10',
    type: 'notification' as const,
    title: 'Short Mobile Notification',
    content: 'Hello, please check the app.'
  }
];

export const AddEvidence: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(true);

  const initialConsentId = searchParams.get('consent_id') || '';
  const [consentId, setConsentId] = useState<string>(initialConsentId);
  const [title, setTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<'email' | 'policy' | 'notification' | 'sms' | 'other'>('email');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchConsents = async () => {
      try {
        const data = await api.getConsents();
        setConsents(data);
        if (!consentId && data.length > 0) {
          setConsentId(String(data[0].id));
        }
      } catch (err) {
        console.error('Failed to load consents', err);
      } finally {
        setLoadingConsents(false);
      }
    };
    fetchConsents();
  }, []);

  const handleApplySnippet = (snippet: typeof EXAMPLE_SNIPPETS[0]) => {
    setTitle(snippet.title);
    setEvidenceType(snippet.type);
    setContent(snippet.content);
    setSelectedFile(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentId) {
      setError('Please select an application.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an evidence title.');
      return;
    }
    if (!selectedFile && !content.trim()) {
      setError('Please enter evidence text or upload a file.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let analysisId: number;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('consent_id', consentId);
        formData.append('title', title.trim());
        formData.append('evidence_type', evidenceType);
        if (source.trim()) formData.append('source', source.trim());
        formData.append('file', selectedFile);

        const res = await api.uploadEvidenceFile(formData);
        analysisId = res.analysis.id;
      } else {
        const res = await api.submitEvidence({
          consent_id: parseInt(consentId, 10),
          title: title.trim(),
          evidence_type: evidenceType,
          content: content.trim(),
          source: source.trim() || undefined
        });
        analysisId = res.analysis.id;
      }
      navigate(`/analyses/${analysisId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit and analyze evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loadingConsents && consents.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-fadeIn">
        <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">No Applications Registered Yet</h2>
        <p className="text-xs text-slate-400 mb-6">
          Evidence must be linked to a baseline consent record. Please register an application first before submitting evidence.
        </p>
        <Link
          to="/consents/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
        >
          Add Your First Application
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-400" />
          Submit Privacy Evidence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Paste an email body, policy update, or upload a .txt/.pdf/.eml disclosure to evaluate purpose drift.
        </p>
      </div>

      {/* 1-Click Example Chips */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          1-Click Example Scenarios
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_SNIPPETS.map((snip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySnippet(snip)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition">
                  {snip.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{snip.title}</div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${snip.color}`}>
                {snip.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Consent Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Target Application *
          </label>
          <select
            value={consentId}
            onChange={(e) => setConsentId(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          >
            {consents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.service_name} ({c.organisation})
              </option>
            ))}
          </select>
        </div>

        {/* Title & Evidence Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Evidence Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Terms Update Notification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Evidence Type
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="email">Email Notice</option>
              <option value="policy">Policy / Terms Snippet</option>
              <option value="notification">In-App Notification</option>
              <option value="sms">SMS Notice</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Source info */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Source URL or Sender <span className="text-slate-500 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. privacy@company.com or https://company.com/terms"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Drag and Drop File Upload Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            File Upload (.txt, .pdf, .eml — max 2 MB)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-white">
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-slate-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Drag and drop your file here, or{' '}
                  <label className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline">
                    browse files
                    <input
                      type="file"
                      accept=".txt,.pdf,.eml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <span className="text-[10px] text-slate-500">Supports .txt, .pdf, and raw .eml emails up to 2MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Content Area */}
        {!selectedFile && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Evidence Content (Paste text verbatim) *
            </label>
            <textarea
              rows={5}
              required={!selectedFile}
              placeholder="Paste email text, privacy policy section, or notification message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Content is stored exactly as submitted and verified via SHA-256 for cryptographic integrity.
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-600/25"
          >
            {submitting ? 'Analyzing Purpose Drift...' : 'Analyze Evidence'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
