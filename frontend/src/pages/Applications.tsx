import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { api } from '../api';
import { ConsentListItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  const loadConsents = async () => {
    try {
      const data = await api.getConsents();
      setConsents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsents();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadConsents();
    } catch (err) {
      alert('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const filtered = consents.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.service_name.toLowerCase().includes(term) || c.organisation.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Registered Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Baseline privacy terms consented to across services, platforms, and programs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {consents.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{seeding ? 'Seeding...' : 'Load Demo'}</span>
            </button>
          )}
          <Link
            to="/consents/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by organisation or service name..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Applications Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {search ? 'No registered applications match your search term.' : 'Register your first privacy baseline to start monitoring purpose drift.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/consents/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Add New Application
            </Link>
            {consents.length === 0 && (
              <button
                onClick={handleSeed}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
              >
                Load Demo Scenarios
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/consents/${c.id}`)}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition cursor-pointer shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                      {c.service_name}
                    </h3>
                    <span className="text-xs font-medium text-slate-400">{c.organisation}</span>
                  </div>
                  {c.latest_risk ? (
                    <RiskBadge risk={c.latest_risk} size="sm" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-slate-500 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      No Evidence
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed font-normal">
                  "{c.original_purpose}"
                </p>

                {c.data_categories && c.data_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.data_categories.slice(0, 3).map((cat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] border border-slate-800 font-mono"
                      >
                        {cat}
                      </span>
                    ))}
                    {c.data_categories.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-mono">
                        +{c.data_categories.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  {c.analyses_count} {c.analyses_count === 1 ? 'analysis' : 'analyses'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {c.consent_date ? c.consent_date : new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
