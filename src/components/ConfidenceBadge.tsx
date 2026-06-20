import { useState } from 'react';
import type { ConfidenceScore } from '../types/provenance';
import { formatConfidenceLabel } from '../services/confidenceService';

const LEVEL_STYLES: Record<ConfidenceScore['level'], string> = {
  verified: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40',
  high: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  low: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30',
  unverified: 'bg-cockpit-track text-theme-muted border-theme',
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceScore;
  compact?: boolean;
  className?: string;
}

export default function ConfidenceBadge({ confidence, compact, className = '' }: ConfidenceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const style = LEVEL_STYLES[confidence.level];

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full border font-medium ${style} ${
          compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
        }`}
        tabIndex={0}
        role="status"
        aria-label={formatConfidenceLabel(confidence)}
      >
        <span className="capitalize">{confidence.level}</span>
        {!compact && <span className="opacity-70">· {confidence.score}%</span>}
      </span>

      {showTooltip && confidence.sources.length > 0 && (
        <span
          className="absolute z-50 bottom-full left-0 mb-1.5 w-56 rounded-lg border border-theme bg-theme-elevated shadow-lg p-2 pointer-events-none"
          role="tooltip"
        >
          <span className="block text-[10px] font-semibold text-cockpit mb-1">
            {formatConfidenceLabel(confidence)}
          </span>
          <span className="block text-[9px] text-theme-muted mb-1.5">{confidence.method}</span>
          <span className="block text-[9px] font-medium text-theme-muted uppercase mb-0.5">Sources</span>
          <ul className="space-y-0.5">
            {confidence.sources.slice(0, 5).map(s => (
              <li key={s.id} className="text-[9px] text-theme-secondary truncate">
                <span className="text-theme-muted">{s.type.replace('_', ' ')}:</span> {s.label}
              </li>
            ))}
            {confidence.sources.length > 5 && (
              <li className="text-[9px] text-theme-muted">+{confidence.sources.length - 5} more</li>
            )}
          </ul>
        </span>
      )}
    </span>
  );
}
