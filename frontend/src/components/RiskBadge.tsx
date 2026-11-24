import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  risk: RiskLevel | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md' }) => {
  if (!risk) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
        NO ANALYSIS
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const config: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
    LOW: {
      label: 'LOW RISK',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    },
    MEDIUM: {
      label: 'MEDIUM RISK',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      text: 'text-amber-700',
      border: 'border-amber-200'
    },
    HIGH: {
      label: 'HIGH RISK',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      text: 'text-rose-700',
      border: 'border-rose-200'
    },
    INSUFFICIENT_EVIDENCE: {
      label: 'INSUFFICIENT EVIDENCE',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      text: 'text-slate-700',
      border: 'border-slate-300'
    }
  };

  const c = config[risk] || config.INSUFFICIENT_EVIDENCE;

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider rounded-full border shadow-sm ${c.bg} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Risk classification: ${c.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {c.label}
    </span>
  );
};
