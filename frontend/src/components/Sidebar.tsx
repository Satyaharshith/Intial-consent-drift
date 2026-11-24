import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  PlusCircle,
  BellRing,
  FileEdit,
  Sliders,
  Settings,
  Shield,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile, alertsCount = 0 }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
    }`;

  const content = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-2.5" onClick={onCloseMobile}>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-md shadow-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            Consent<span className="text-blue-400">Drift</span>
          </span>
        </NavLink>
        {mobileOpen && (
          <button onClick={onCloseMobile} className="p-1.5 text-slate-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Section 1: OVERVIEW */}
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
            Overview
          </span>
          <div className="space-y-1">
            <NavLink to="/dashboard" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Section 2: SURVEILLANCE */}
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
            Surveillance
          </span>
          <div className="space-y-1">
            <NavLink to="/consents" end className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Applications</span>
              </div>
            </NavLink>
            <NavLink to="/evidence/new" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-blue-400" />
                <span>Add Evidence</span>
              </div>
            </NavLink>
            <NavLink to="/alerts" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4" />
                <span>Alerts</span>
              </div>
              {alertsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                  {alertsCount}
                </span>
              )}
            </NavLink>
          </div>
        </div>

        {/* Section 3: ACTIONS */}
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
            Actions
          </span>
          <div className="space-y-1">
            <NavLink to="/drafts" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <FileEdit className="w-4 h-4" />
                <span>Complaint Drafts</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Section 4: BENCHMARK & SYSTEM */}
        <div>
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
            System
          </span>
          <div className="space-y-1">
            <NavLink to="/evaluation" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Evaluation</span>
              </div>
            </NavLink>
            <NavLink to="/settings" className={navLinkClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mode & Build Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-semibold text-slate-300">Surveillance Mode</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer (width >= 360px supported) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-[85vw] h-full shadow-2xl animate-fadeIn">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
