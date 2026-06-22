import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getReadinessTrend } from '../services/progressService';

interface ReadinessSparklineProps {
  certId: string;
  days?: number;
  className?: string;
}

export default function ReadinessSparkline({ certId, days = 7, className = '' }: ReadinessSparklineProps) {
  const trend = useMemo(() => getReadinessTrend(certId, days), [certId, days]);

  const width = 120;
  const height = 36;
  const pad = 2;
  const values = trend.map(d => d.score);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
  const TrendIcon = delta > 2 ? TrendingUp : delta < -2 ? TrendingDown : Minus;
  const trendColor = delta > 2 ? 'text-emerald-600 dark:text-emerald-400' : delta < -2 ? 'text-red-600 dark:text-red-400' : 'text-theme-muted';

  if (trend.every(d => d.score === 0)) {
    return (
      <div className={`text-[10px] text-theme-muted ${className}`}>
        No activity in last {days} days — start a mission to track trends.
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[120px] h-9 shrink-0" aria-hidden>
        <polyline
          points={points}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {values.map((v, i) => {
          const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
          const y = height - pad - ((v - min) / range) * (height - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#10b981" opacity={i === values.length - 1 ? 1 : 0.5} />;
        })}
      </svg>
      <div className="min-w-0">
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {delta > 0 ? '+' : ''}{delta}% vs {days}d ago
        </div>
        <div className="text-[9px] text-theme-muted truncate">
          {trend[trend.length - 1]?.label ?? 'Today'}
        </div>
      </div>
    </div>
  );
}
