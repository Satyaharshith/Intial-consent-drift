import React, { useEffect, useState } from 'react';
import {
  FileText,
  Mail,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  Clock,
  Globe,
  Scale
} from 'lucide-react';
import { api } from '../api';
import { ComplaintDraft, DraftTemplate, DraftStatus } from '../types';

export const Drafts: React.FC = () => {
  const [drafts, setDrafts] = useState<ComplaintDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDraft, setSelectedDraft] = useState<ComplaintDraft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [template, setTemplate] = useState<DraftTemplate>('general');
  const [status, setStatus] = useState<DraftStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDrafts();
      setDrafts(data);
      if (data.length > 0 && !selectedDraft) {
        selectDraft(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint drafts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const selectDraft = (d: ComplaintDraft) => {
    setSelectedDraft(d);
    setSubject(d.subject);
    setBody(d.body);
    setTemplate(d.template);
    setStatus(d.status);
    setCopied(false);
  };

  const handleSave = async () => {
    if (!selectedDraft) return;
    try {
      setSaving(true);
      const updated = await api.updateDraft(selectedDraft.id, {
        subject,
        body,
        template,
        status
      });
      setSelectedDraft(updated);
      setDrafts(prev => prev.map(d => (d.id === updated.id ? updated : d)));
    } catch (err: any) {
      alert(`Failed to save draft: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.deleteDraft(id);
      const remaining = drafts.filter(d => d.id !== id);
      setDrafts(remaining);
      if (selectedDraft?.id === id) {
        setSelectedDraft(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          selectDraft(remaining[0]);
        }
      }
    } catch (err: any) {
      alert(`Failed to delete draft: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCopy = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consentdrift_draft_${selectedDraft?.id || 'doc'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSwitchTemplate = async (newTemplate: DraftTemplate) => {
    if (!selectedDraft) return;
    if (newTemplate === selectedDraft.template) return;

    if (selectedDraft.analysis_id) {
      const ok = confirm(
        `Regenerate draft letter using the ${newTemplate.toUpperCase()} legal framework template? Any manual edits will be replaced.`
      );
      if (!ok) return;

      try {
        setSaving(true);
        const reloaded = await api.generateClarification(selectedDraft.analysis_id, newTemplate);
        selectDraft(reloaded);
        setDrafts(prev => prev.map(d => (d.id === reloaded.id ? reloaded : d)));
      } catch (err: any) {
        alert(`Failed to regenerate template: ${err.message || 'Unknown error'}`);
      } finally {
        setSaving(false);
      }
    } else {
      setTemplate(newTemplate);
    }
  };

  const getTemplateBadge = (tpl: DraftTemplate) => {
    switch (tpl) {
      case 'dpdp':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">India DPDP</span>;
      case 'gdpr':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">EU GDPR</span>;
      case 'ccpa':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">US CCPA</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">General</span>;
    }
  };

  const getStatusBadge = (st: DraftStatus) => {
    switch (st) {
      case 'sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>;
      case 'responded':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Responded</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-[#1F293D]">Draft</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-slate-100">Complaint & Clarification Drafts</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Formal statutory inquiries, grievance letters, and regulator escalations generated from detected drift.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-[#111927] border border-[#1F293D] rounded-xl text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
          Loading drafts...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-12 text-center bg-[#111927] border border-[#1F293D] rounded-xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-200">No Drafts Generated Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            When you view an Analysis detail page with MEDIUM or HIGH risk findings, click "Draft Clarification" to generate formal correspondence tailored to India DPDP, GDPR, CCPA, or general privacy laws.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Drafts List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Your Drafts ({drafts.length})
            </h2>

            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {drafts.map(d => {
                const isSelected = selectedDraft?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => selectDraft(d)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#182235] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-[#111927] border-[#1F293D] hover:border-[#2D3B55] hover:bg-[#141E2E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {getTemplateBadge(d.template)}
                      {getStatusBadge(d.status)}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">
                      {d.service_name || 'Service Clarification'}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {d.organisation ? `To: ${d.organisation}` : d.subject}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1F293D]/60 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-400">#{d.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Draft Editor & Actions */}
          {selectedDraft && (
            <div className="lg:col-span-8 bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-5 shadow-lg">
              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#1F293D]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Service:</span>
                    <span className="text-sm font-semibold text-slate-100">
                      {selectedDraft.service_name || 'Application'}
                    </span>
                    {selectedDraft.organisation && (
                      <span className="text-xs text-slate-400">({selectedDraft.organisation})</span>
                    )}
                  </div>
                </div>

                {/* Status Selector & Delete */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as DraftStatus)}
                    className="bg-[#0B0F19] border border-[#1F293D] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Status: Draft</option>
                    <option value="sent">Status: Sent</option>
                    <option value="responded">Status: Responded</option>
                  </select>

                  <button
                    onClick={() => handleDelete(selectedDraft.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Template Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Statutory Legal Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'general', label: 'General / Fiduciary' },
                    { id: 'dpdp', label: 'India DPDP (2023)' },
                    { id: 'gdpr', label: 'EU GDPR (Art. 13-21)' },
                    { id: 'ccpa', label: 'US CCPA / CPRA' }
                  ].map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSwitchTemplate(tpl.id as DraftTemplate)}
                      className={`p-2 rounded-lg border text-center font-medium transition ${
                        template === tpl.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-[#0B0F19] border-[#1F293D] text-slate-400 hover:text-slate-200 hover:bg-[#182235]'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Body Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Letter Contents (Editable)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Replace bracketed [Placeholders] before sending
                  </span>
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F293D]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#182235] hover:bg-[#202D45] text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  {/* Download .txt */}
                  <button
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#182235] hover:bg-[#202D45] text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export .txt</span>
                  </button>

                  {/* Download PDF via ReportLab backend */}
                  <a
                    href={api.getDraftPdfUrl(selectedDraft.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#182235] hover:bg-[#202D45] text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download PDF</span>
                  </a>

                  {/* Mailto */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Email</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Where to Escalate: Regulatory Grievance Panel */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">Where to Escalate</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            If the Data Fiduciary or service fails to respond or refuses to withdraw purpose drift, you may escalate your grievance to the competent statutory authority.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* India DPDP */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400">INDIA</span>
              <span className="text-[10px] text-slate-500 uppercase">DPDP Act 2023</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">
              Data Protection Board of India (DPBI)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Section 13 mandates exhausting the Data Fiduciary's internal Grievance Redressal mechanism first. If unresolved, an electronic complaint may be registered with the Board for inquiries into personal data breaches and non-consensual processing.
            </p>
            <div className="pt-2 border-t border-[#1F293D]/60 text-xs">
              <a
                href="https://www.meity.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                meity.gov.in / dpbi <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* EU GDPR */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">EUROPEAN UNION</span>
              <span className="text-[10px] text-slate-500 uppercase">GDPR Art. 77</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">
              National Data Protection Authorities (DPAs)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every EU data subject has the statutory right to lodge a complaint with a supervisory authority in their member state (e.g. CNIL France, BfDI Germany, DPC Ireland) under Article 77 or object to processing under Article 21.
            </p>
            <div className="pt-2 border-t border-[#1F293D]/60 text-xs">
              <a
                href="https://edpb.europa.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                edpb.europa.eu <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* US CCPA */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">UNITED STATES</span>
              <span className="text-[10px] text-slate-500 uppercase">CCPA / CPRA</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">
              California Privacy Protection Agency (CPPA)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consumers may submit enforcement complaints to the CPPA or California Office of the Attorney General regarding unauthorized sale/sharing of personal information or failure to honor opt-out preferences.
            </p>
            <div className="pt-2 border-t border-[#1F293D]/60 text-xs">
              <a
                href="https://cppa.ca.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                cppa.ca.gov <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="p-3.5 bg-[#0B0F19] border border-[#1F293D] rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-300 font-semibold">Important Filing Note:</strong> Regulatory procedures, statutory time limits, and official portal addresses are subject to legislative changes. Always verify the designated Grievance Officer address and official filing forms on the respective regulator's portal prior to legal escalation.
          </p>
        </div>
      </div>
    </div>
  );
};
