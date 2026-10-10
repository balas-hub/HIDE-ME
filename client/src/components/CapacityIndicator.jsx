import React from 'react';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CapacityIndicator({ currentChars = 0, maxChars = 0 }) {
  if (!maxChars || maxChars <= 0) return null;

  const percentage = Math.min(100, Math.round((currentChars / maxChars) * 100));
  const isOverLimit = currentChars > maxChars;
  const isNearLimit = percentage >= 80 && !isOverLimit;

  let barColor = 'bg-gradient-to-r from-blue-600 to-cyan-400';
  let statusText = 'OPTIMAL ENTROPY BUDGET (< 0.00018 Δ DISTORTION)';
  let statusColor = 'text-cyan-400';

  if (isOverLimit) {
    barColor = 'bg-red-500';
    statusText = 'CARRIER SATURATION BREACHED! TRUNCATE PAYLOAD OR PICK LARGER VESSEL.';
    statusColor = 'text-red-400 font-bold';
  } else if (isNearLimit) {
    barColor = 'bg-amber-400';
    statusText = 'HIGH SPECTRAL OCCUPANCY. VESSEL NEAR LIMITS BUT SHIELD HOLDS.';
    statusColor = 'text-amber-400';
  }

  return (
    <div className="bg-[#020712] p-3.5 rounded-xl border border-cyan-500/30 text-xs font-mono shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-cyan-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider uppercase">CARRIER INJECTION BUDGET:</span>
        </div>
        <div className="flex items-center space-x-2">
          {isOverLimit ? (
            <span className="flex items-center space-x-1 text-red-400 font-bold uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SATURATION BREACH</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-emerald-400 uppercase font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HEADROOM SECURE</span>
            </span>
          )}
          <span className="text-slate-400">
            <strong className={isOverLimit ? 'text-red-400' : 'text-cyan-300'}>
              {currentChars.toLocaleString()}
            </strong>{' '}
            / {maxChars.toLocaleString()} BYTES ({percentage}%)
          </span>
        </div>
      </div>

      <div className="w-full bg-[#030e26] border border-cyan-500/20 rounded-full h-2.5 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className={`mt-2 text-[10px] uppercase tracking-wide ${statusColor}`}>
        &bull; {statusText}
      </div>
    </div>
  );
}
