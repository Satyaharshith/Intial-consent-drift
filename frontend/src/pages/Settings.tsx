import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  KeyRound,
  Download,
  FileText,
  AlertOctagon,
  Moon,
  Sun,
  Languages,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Preferences (P2)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>('en');

  // Danger Zone / Delete Account state
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must be at least 8 characters and include at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setExportLoading(true);
      const data = await api.exportAccountJson();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consentdrift_export_${user?.email || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      setDeleteError("Confirmation text must match 'DELETE MY ACCOUNT' exactly.");
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your current password to confirm account deletion.');
      return;
    }

    try {
      setDeleteLoading(true);
      await api.deleteAccount(deletePassword, confirmPhrase);
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Verify your password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-slate-100">Account & Privacy Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Manage your credentials, data portability rights, security posture, and account lifecycle.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          User Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-400">Full Name</span>
            <p className="text-sm font-medium text-slate-100">{user?.full_name || 'N/A'}</p>
          </div>

          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-400">Email Address</span>
            <p className="text-sm font-medium text-slate-100">{user?.email || 'N/A'}</p>
          </div>

          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-400">Phone Number</span>
            <p className="text-sm font-medium text-slate-100">{user?.phone || 'Not provided'}</p>
          </div>

          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-400">Account Created</span>
            <p className="text-sm font-medium text-slate-100">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          Change Password
        </h2>

        <p className="text-xs text-slate-400">
          Ensure your password contains at least 8 characters, including a letter and a number. Passwords are securely hashed with Argon2id.
        </p>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F293D] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Data Portability & Audit Reports */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Data Portability & Reports
        </h2>

        <p className="text-xs text-slate-400">
          Exercise your right to data portability. You can export all your data in structured JSON format or download a formal PDF Privacy Audit Report.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* JSON Export */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Download className="w-4 h-4 text-indigo-400" />
                Complete Data Export (JSON)
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Machine-readable bundle of your applications, submitted evidence, analyses, alerts, and drafts.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              disabled={exportLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#182235] hover:bg-[#202D45] text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              {exportLoading ? 'Generating Export...' : 'Download JSON Archive'}
            </button>
          </div>

          {/* PDF Audit Report */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <FileText className="w-4 h-4 text-emerald-400" />
                Privacy Audit Report (PDF)
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Printable statutory summary generated by ReportLab detailing your privacy health and flagged discrepancies.
              </p>
            </div>
            <a
              href={api.getAccountReportPdfUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Generate PDF Report
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Preferences & Localization (P2) */}
      <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Languages className="w-4 h-4 text-indigo-400" />
          Appearance & Language (P2 Preview)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Theme */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Theme</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border font-medium transition ${
                  theme === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-[#111927] border-[#1F293D] text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark Navy (Default)
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  alert('Light theme will be enabled across all views in the upcoming release.');
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border font-medium transition ${
                  theme === 'light'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-[#111927] border-[#1F293D] text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Slate Light
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Language</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'en', label: 'English' },
                { id: 'te', label: 'తెలుగు' },
                { id: 'hi', label: 'हिन्दी' }
              ].map(lng => (
                <button
                  key={lng.id}
                  type="button"
                  onClick={() => {
                    setLanguage(lng.id as any);
                    if (lng.id !== 'en') {
                      alert(`${lng.label} localization preview activated. Default English fallback loaded.`);
                    }
                  }}
                  className={`p-2 rounded-lg border text-center font-medium transition ${
                    language === lng.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-[#111927] border-[#1F293D] text-slate-400'
                  }`}
                >
                  {lng.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              ConsentDrift is configured with i18n scaffolding for statutory jurisdictions.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-rose-500/5 border border-rose-500/30 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          Danger Zone: Delete Account & Purge Data
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          Permanently delete your account and all associated data. This action immediately cascades and purges all your registered applications, uploaded evidence, analyses, alerts, and complaint drafts from the SQLite database. <strong className="text-rose-400">This action is irreversible.</strong>
        </p>

        {deleteError && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
            {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Confirm your password
            </label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full bg-[#0B0F19] border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              placeholder="Your current password"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Type <span className="font-mono text-rose-400">DELETE MY ACCOUNT</span> to confirm
            </label>
            <input
              type="text"
              required
              value={confirmPhrase}
              onChange={e => setConfirmPhrase(e.target.value)}
              className="w-full bg-[#0B0F19] border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              placeholder="DELETE MY ACCOUNT"
            />
          </div>

          <button
            type="submit"
            disabled={deleteLoading || confirmPhrase !== 'DELETE MY ACCOUNT'}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
          >
            {deleteLoading ? 'Purging Account Data...' : 'Permanently Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
