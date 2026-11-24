import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  ShieldAlert,
  FileCheck,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../api';

const RISK_COLORS: Record<string, string> = {
  LOW: '#10B981', // emerald-500
  MEDIUM: '#F59E0B', // amber-500
  HIGH: '#F43F5E', // rose-500
  INSUFFICIENT_EVIDENCE: '#64748B' // slate-500
};

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 bg-[#111927] border border-[#1F293D] rounded-xl text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
        Calculating privacy metrics & drift telemetry...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
        {error || 'No analytics data available.'}
      </div>
    );
  }

  const riskPieData = [
    { name: 'Low Risk', key: 'LOW', value: data.risk_distribution.LOW || 0, color: RISK_COLORS.LOW },
    { name: 'Medium Drift', key: 'MEDIUM', value: data.risk_distribution.MEDIUM || 0, color: RISK_COLORS.MEDIUM },
    { name: 'High Drift', key: 'HIGH', value: data.risk_distribution.HIGH || 0, color: RISK_COLORS.HIGH },
    { name: 'Insufficient Evidence', key: 'INSUFFICIENT_EVIDENCE', value: data.risk_distribution.INSUFFICIENT_EVIDENCE || 0, color: RISK_COLORS.INSUFFICIENT_EVIDENCE }
  ].filter(item => item.value > 0);

  const totalAnalyses =
    (data.risk_distribution.LOW || 0) +
    (data.risk_distribution.MEDIUM || 0) +
    (data.risk_distribution.HIGH || 0) +
    (data.risk_distribution.INSUFFICIENT_EVIDENCE || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-slate-100">Telemetry & Risk Analytics</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Aggregated insights into purpose drift frequency, signal triggers, and institutional compliance posture.
        </p>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Applications */}
        <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tracked Applications</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {data.summary.total_applications}
          </div>
          <p className="text-xs text-slate-500">Registered baseline privacy policies</p>
        </div>

        {/* Total Evidence */}
        <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Evidence Analyzed</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {data.summary.total_evidence}
          </div>
          <p className="text-xs text-slate-500">Emails, policies, notifications</p>
        </div>

        {/* Drift Alerts */}
        <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Drift Alerts Raised</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {data.summary.total_alerts}
          </div>
          <p className="text-xs text-slate-500">Discrepancies flagged</p>
        </div>

        {/* Consent Health */}
        <div className="bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              Consent Health
              <span title={data.consent_health.formula} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              </span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                data.consent_health.status === 'Good'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : data.consent_health.status === 'Moderate'
                  ? 'bg-amber-500/10 text-amber-400'
                  : data.consent_health.status === 'At Risk'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {data.consent_health.status}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-100">
            {data.consent_health.percentage !== null
              ? `${data.consent_health.percentage}%`
              : 'No data yet'}
          </div>
          <p className="text-xs text-slate-500">
            {data.consent_health.percentage !== null
              ? `${data.consent_health.low_count} of ${data.consent_health.total_evidence} evidence low risk`
              : 'Add applications and evidence to begin'}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-5 bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Discrepancy Severity Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Classification breakdown across all evidence</p>
          </div>

          {totalAnalyses === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No analysis records yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1F293D',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alerts Over Time */}
        <div className="lg:col-span-7 bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Alert Volume Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detection trajectory over time</p>
          </div>

          {data.alerts_over_time.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No historical alert data yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.alerts_over_time}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1F293D',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    name="High Risk"
                    stroke="#F43F5E"
                    fillOpacity={1}
                    fill="url(#colorHigh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    name="Medium Drift"
                    stroke="#F59E0B"
                    fillOpacity={1}
                    fill="url(#colorMedium)"
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Top Signals & High Orgs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Triggering Signals */}
        <div className="lg:col-span-7 bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Top Triggering Signals</h3>
            <p className="text-xs text-slate-400 mt-0.5">Most recurrent pattern matches in privacy disclosures</p>
          </div>

          {data.top_signals.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-500 text-xs">
              No signal data available.
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.top_signals}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="signal"
                    type="category"
                    stroke="#94A3B8"
                    fontSize={11}
                    width={110}
                    tick={{ fill: '#94A3B8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1F293D',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Organisations with HIGH Risk */}
        <div className="lg:col-span-5 bg-[#111927] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Organisations with Most HIGH Risk</h3>
            <p className="text-xs text-slate-400 mt-0.5">Entities with frequent severe drift flags</p>
          </div>

          {data.top_high_orgs.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-500 text-xs">
              No HIGH risk organisations recorded.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {data.top_high_orgs.map((item: any, idx: number) => (
                <div
                  key={item.organisation}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F19] border border-[#1F293D]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#182235] text-slate-400 text-xs font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {item.organisation}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {item.count} High {item.count === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
