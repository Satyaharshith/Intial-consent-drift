import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@consentdrift.app');
    setPassword('Demo@1234');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Left Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Brand header */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Consent<span className="text-blue-400">Drift</span>
            </span>
          </Link>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Log in to monitor your privacy baselines and active surveillance alerts.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? 'Logging in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Account Button */}
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill demo account (demo@consentdrift.app)</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Pitch Banner */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border-l border-slate-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="max-w-md space-y-6 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Know what you agreed to.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Understand what changed.
            </span>
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            ConsentDrift gives you personal evidence verification against vague terms, corporate policy updates, and undisclosed commercial partner sharing.
          </p>
          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Zero external trackers or analytics</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Strict quote verification to prevent hallucination</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Local or self-hosted deployment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
