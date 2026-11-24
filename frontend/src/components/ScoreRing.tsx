import React from 'react';
import { RiskLevel } from '../types';

interface ScoreRingProps {
  score: number;
  risk: RiskLevel;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  risk,
  size = 90,
  strokeWidth = 8,
  showLabel = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#10B981'; // Green (LOW)
  let textColor = 'text-emerald-400';
  let bgColor = 'stroke-slate-800';

  if (risk === 'HIGH') {
    strokeColor = '#EF4444'; // Red
    textColor = 'text-rose-400';
  } else if (risk === 'MEDIUM') {
    strokeColor = '#F59E0B'; // Amber
    textColor = 'text-amber-400';
  } else if (risk === 'INSUFFICIENT_EVIDENCE') {
    strokeColor = '#64748B'; // Grey
    textColor = 'text-slate-400';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={bgColor}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-black tracking-tight leading-none ${size > 90 ? 'text-2xl' : 'text-xl'} ${textColor}`}>
            {risk === 'INSUFFICIENT_EVIDENCE' ? '—' : score}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
          Discrepancy Score
        </span>
      )}
    </div>
  );
};
