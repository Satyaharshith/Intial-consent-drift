import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Calendar, Building, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

const PRESET_CATEGORIES = [
  'name',
  'email',
  'phone',
  'address',
  'location',
  'family income',
  'resume',
  'id_number',
  'date_of_birth',
  'academic_records',
  'financial',
  'learning_activity'
];

export const NewConsent: React.FC = () => {
  const navigate = useNavigate();
  const [organisation, setOrganisation] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [originalPurpose, setOriginalPurpose] = useState('');
  const [originalConsentText, setOriginalConsentText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['name', 'email']);
  const [customCat, setCustomCat] = useState('');
  const [sourceType, setSourceType] = useState<'official_text' | 'user_summary'>('official_text');
  const [consentDate, setConsentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCat = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customCat.trim().toLowerCase();
    if (trimmed && !selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed]);
      setCustomCat('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation.trim() || !serviceName.trim() || !originalPurpose.trim()) {
      setError('Organisation, Service Name, and Original Purpose are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createConsent({
        organisation: organisation.trim(),
        service_name: serviceName.trim(),
        original_purpose: originalPurpose.trim(),
        original_consent_text: originalConsentText.trim() || undefined,
        data_categories: selectedCategories,
        source_type: sourceType,
        consent_date: consentDate ? consentDate : null,
      });
      navigate(`/consents/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create consent record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <Link
        to="/consents"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-950/60">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Register Consent Baseline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture what you originally consented to (terms of service, signup disclosure, or your own summary) to benchmark future disclosures against.
          </p>
        </div>

        {error && (
          <div className="p-4 mx-6 mt-6 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organisation / Company *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Education Foundation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service / Program Name *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Application Portal"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Original Purpose Core Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Primary Purpose of Consent *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Verify scholarship eligibility and communicate application status."
              value={originalPurpose}
              onChange={(e) => setOriginalPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The primary purpose you agreed to. This is the main anchor used to detect secondary purpose drift.
            </p>
          </div>

          {/* Paste the original consent text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Paste Original Consent Text <span className="text-slate-500 font-normal lowercase">(optional full terms)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Paste the full paragraph or terms of service snippet from signup..."
              value={originalConsentText}
              onChange={(e) => setOriginalConsentText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y font-mono"
            />
          </div>

          {/* Source Type & Consent Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Source Type
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'official_text'}
                    onChange={() => setSourceType('official_text')}
                    className="text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>Official disclosure text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'user_summary'}
                    onChange={() => setSourceType('user_summary')}
                    className="text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>My own summary</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Date of Consent <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  value={consentDate}
                  onChange={(e) => setConsentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Data Category Selection Chips */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Consented Data Categories</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Category input */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add other category..."
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                onKeyDown={handleAddCustomCat}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={handleAddCustomCat}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <Link
              to="/consents"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Baseline...' : 'Save Baseline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
