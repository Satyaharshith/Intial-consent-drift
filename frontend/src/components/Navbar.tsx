import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, PlusCircle, BarChart3, Database, RefreshCw, Cpu, Layers } from 'lucide-react';
import { api } from '../api';

interface NavbarProps {
  llmAvailable: boolean;
  onDataRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ llmAvailable, onDataRefresh }) => {
  const location = useLocation();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedMsg(null);
      await api.seedDemo();
      setSeedMsg('Demo scenarios loaded!');
      setTimeout(() => setSeedMsg(null), 3000);
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (err: any) {
      alert(`Failed to load demo scenarios: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-md">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  ConsentDrift
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
                  Purpose Drift Verifier
                </span>
              </div>
            </Link>

            {/* Mode badge */}
            <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-slate-200">
              {llmAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Cpu className="w-3.5 h-3.5" />
                  Hybrid (LLM + Rules)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Running in deterministic regex & rules mode (no LLM key configured)">
                  <Layers className="w-3.5 h-3.5" />
                  Rules-Only Mode
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex space-x-1 sm:space-x-2">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/consents/new"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  isActive('/consents/new')
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Consent
              </Link>
              <Link
                to="/evaluation"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  isActive('/evaluation')
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Evaluation
              </Link>
            </nav>

            {/* Seed Demo Button */}
            <div className="relative">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-colors border border-slate-200 disabled:opacity-50"
                title="Loads 3 realistic demo consent records and evidence items"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                {seeding ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load Demo</span>
                )}
              </button>
              {seedMsg && (
                <div className="absolute right-0 top-full mt-1 px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 rounded shadow-xs whitespace-nowrap">
                  {seedMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
