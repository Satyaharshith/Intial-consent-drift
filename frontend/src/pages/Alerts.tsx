import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  History,
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { Alert, AlertStatus } from '../types';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Detail Modal / Drawer
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAlerts({
        risk: selectedRisk !== 'all' ? selectedRisk : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        q: searchQuery.trim() || undefined
      });
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedRisk, selectedStatus]);

  // Handle client-side search filtering if API returned full list
  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts;
    const q = searchQuery.toLowerCase().trim();
    return alerts.filter(a =>
      (a.service_name && a.service_name.toLowerCase().includes(q)) ||
      (a.organisation && a.organisation.toLowerCase().includes(q)) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    );
  }, [alerts, searchQuery]);

  const handleStatusChange = async (alertId: number, newStatus: AlertStatus) => {
    try {
      setStatusUpdating(alertId);
      const updated = await api.updateAlert(alertId, { status: newStatus });
      setAlerts(prev => prev.map(a => (a.id === alertId ? updated : a)));
      if (activeAlert?.id === alertId) {
        setActiveAlert(updated);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setStatusUpdating(null);
    }
  };

  const openDrawer = (alert: Alert) => {
    setActiveAlert(alert);
    setNotesInput(alert.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!activeAlert) return;
    try {
      setSavingNotes(true);
      const updated = await api.updateAlert(activeAlert.id, { notes: notesInput });
      setAlerts(prev => prev.map(a => (a.id === activeAlert.id ? updated : a)));
      setActiveAlert(updated);
    } catch (err: any) {
      alert(`Failed to save notes: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">New</span>;
      case 'acknowledged':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Acknowledged</span>;
      case 'clarification_sent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Clarification Sent</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case 'dismissed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">Dismissed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h1 className="text-2xl font-semibold text-slate-100">Purpose Drift Alerts</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated alerts raised whenever new evidence reveals potential purpose drift or third-party sharing.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by organisation, service name, or notes..."
              className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Clear */}
          {(selectedRisk !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRisk('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg bg-[#182235] transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filters pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1F293D]/60 text-xs">
          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium mr-1">Risk:</span>
            {['all', 'HIGH', 'MEDIUM'].map(risk => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  selectedRisk === risk
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 hover:bg-[#182235]'
                }`}
              >
                {risk === 'all' ? 'All Risks' : risk}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#1F293D]" />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'new', label: 'New' },
              { id: 'acknowledged', label: 'Acknowledged' },
              { id: 'clarification_sent', label: 'Clarification Sent' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'dismissed', label: 'Dismissed' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  selectedStatus === st.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 hover:bg-[#182235]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-[#111927] border border-[#1F293D] rounded-xl text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
          Loading alerts...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-[#111927] border border-[#1F293D] rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-medium text-slate-200">No alerts found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {selectedRisk !== 'all' || selectedStatus !== 'all' || searchQuery
              ? 'No alerts match the chosen filters. Try clearing or broadening your search.'
              : 'All clear! No HIGH or MEDIUM purpose drift alerts currently open in your registered applications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const isHigh = alert.risk === 'HIGH';
            return (
              <div
                key={alert.id}
                className={`bg-[#111927] border rounded-xl p-5 transition hover:border-[#2D3B55] ${
                  isHigh ? 'border-rose-500/30' : 'border-amber-500/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${
                          isHigh
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {alert.risk} RISK
                      </span>

                      {alert.score !== undefined && alert.score !== null && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#182235] text-slate-300 border border-[#2D3B55]">
                          Drift Score: {alert.score}/100
                        </span>
                      )}

                      {getStatusBadge(alert.status)}

                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                        {alert.service_name || 'Application Service'}
                        <span className="text-xs font-normal text-slate-400">
                          by {alert.organisation || 'Unknown Organisation'}
                        </span>
                      </h2>
                    </div>

                    {alert.notes && (
                      <p className="text-xs text-slate-300 bg-[#0B0F19] px-3 py-2 rounded-lg border border-[#1F293D] italic line-clamp-2">
                        "{alert.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2 lg:self-center">
                    {/* Status selector */}
                    <div className="relative">
                      <select
                        value={alert.status}
                        disabled={statusUpdating === alert.id}
                        onChange={e => handleStatusChange(alert.id, e.target.value as AlertStatus)}
                        className="bg-[#0B0F19] border border-[#1F293D] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="new">Mark New</option>
                        <option value="acknowledged">Acknowledge</option>
                        <option value="clarification_sent">Clarification Sent</option>
                        <option value="resolved">Resolve</option>
                        <option value="dismissed">Dismiss</option>
                      </select>
                    </div>

                    {/* Activity log / Notes button */}
                    <button
                      onClick={() => openDrawer(alert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#182235] text-slate-300 hover:text-slate-100 hover:bg-[#202D45] transition"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      Activity Log
                      {alert.events && alert.events.length > 0 && (
                        <span className="ml-1 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded-full">
                          {alert.events.length}
                        </span>
                      )}
                    </button>

                    {/* View Analysis */}
                    <Link
                      to={`/analyses/${alert.analysis_id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                    >
                      View Analysis
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Activity Log & Notes Drawer / Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[#0F172A] border-l border-[#1F293D] h-full overflow-y-auto flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1F293D]">
              <div>
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                  Alert #{activeAlert.id} Management
                </span>
                <h2 className="text-lg font-semibold text-slate-100">
                  {activeAlert.service_name || 'Application'}
                </h2>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-[#1F293D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6 flex-1">
              {/* Alert Quick Specs */}
              <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Risk Severity:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded uppercase ${
                      activeAlert.risk === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activeAlert.risk}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Status:</span>
                  <div>{getStatusBadge(activeAlert.status)}</div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Analysis Reference:</span>
                  <Link
                    to={`/analyses/${activeAlert.analysis_id}`}
                    className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                  >
                    Analysis #{activeAlert.analysis_id} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Status Update Quick Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Change Alert Status
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'acknowledged', label: 'Acknowledge' },
                    { id: 'clarification_sent', label: 'Clarification Sent' },
                    { id: 'resolved', label: 'Mark Resolved' },
                    { id: 'dismissed', label: 'Dismiss' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => handleStatusChange(activeAlert.id, btn.id as AlertStatus)}
                      disabled={activeAlert.status === btn.id || statusUpdating === activeAlert.id}
                      className={`p-2 rounded-lg border text-left font-medium transition ${
                        activeAlert.status === btn.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-[#111927] border-[#1F293D] text-slate-300 hover:bg-[#182235]'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Investigation Notes</span>
                  <span className="text-slate-500 font-normal">Internal record</span>
                </label>
                <textarea
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="Record your notes, communication attempts, or observations here..."
                  rows={3}
                  className="w-full bg-[#111927] border border-[#1F293D] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notesInput === (activeAlert.notes || '')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
                >
                  {savingNotes ? 'Saving...' : 'Update Notes'}
                </button>
              </div>

              {/* Activity Log Timeline */}
              <div className="space-y-3 pt-4 border-t border-[#1F293D]">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-400" />
                  Activity History
                </h3>

                {activeAlert.events && activeAlert.events.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F293D]">
                    {activeAlert.events.map(ev => (
                      <div key={ev.id} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#0F172A]" />
                        <p className="text-slate-200 font-medium">{ev.event}</p>
                        <span className="text-[11px] text-slate-500">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No activity recorded yet.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#1F293D] flex justify-end">
              <button
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2 bg-[#182235] hover:bg-[#202D45] text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
