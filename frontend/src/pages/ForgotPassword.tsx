import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Consent<span className="text-blue-400">Drift</span>
          </span>
        </Link>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Reset Password</h2>
        <p className="text-xs text-slate-400 mb-6">
          Enter your registered email address. If an account exists, a password reset link will be generated.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Instructions sent</span>
                <span>In development mode, check your server console log for the reset link token.</span>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition flex items-center justify-center text-xs"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Submitting...' : 'Send Reset Link'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200">
                Cancel and return to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
