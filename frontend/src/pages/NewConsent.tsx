import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Calendar, Building, Globe } from 'lucide-react';
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['name', 'email']);
  const [customCat, setCustomCat] = useState('');
  const [sourceType, setSourceType] = useState<'official_text' | 'user_summary'>('official_text');
  const [consentDate, setConsentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Record Original Consent Baseline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture what you originally consented to (from terms of service, signup disclosure, or your own summary)
            to benchmark future notices against.
          </p>
        </div>

        {error && (
          <div className="p-4 mx-6 mt-6 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organisation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Organisation / Company *
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Education Foundation"
                value={organisation}
                onChange={e => setOrganisation(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Service Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Service / Portal Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Scholarship Application Portal"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Original Purpose Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Original Purpose Baseline (verbatim or summary) *</span>
              <span className="text-[11px] font-normal text-slate-400">Max 20,000 characters</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Verify scholarship eligibility and communicate application updates."
              value={originalPurpose}
              onChange={e => setOriginalPurpose(e.target.value)}
              required
              maxLength={20000}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed"
            />
          </div>

          {/* Data Categories Multi-select Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Data Categories Covered
            </label>
            <p className="text-[11px] text-slate-500">Select all categories you provided or agreed to disclose:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Custom category input */}
            <div className="flex items-center gap-2 pt-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom category..."
                value={customCat}
                onChange={e => setCustomCat(e.target.value)}
                onKeyDown={handleAddCustomCat}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomCat}
                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Source Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Source Type</label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    value="official_text"
                    checked={sourceType === 'official_text'}
                    onChange={() => setSourceType('official_text')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Official Policy Text</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    value="user_summary"
                    checked={sourceType === 'user_summary'}
                    onChange={() => setSourceType('user_summary')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>User Summary</span>
                </label>
              </div>
            </div>

            {/* Consent Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date of Consent (optional)
              </label>
              <input
                type="date"
                value={consentDate}
                onChange={e => setConsentDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Link
              to="/"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving Baseline...' : 'Save Consent Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
