interface ExamProofRingProps {
  /** 0–100 score or readiness preview */
  value: number;
  /** Total exam duration in seconds (setup) or remaining (active) */
  totalSeconds: number;
  /** Remaining seconds — when set, ring shows elapsed timer arc */
  remainingSeconds?: number;
  label?: string;
  sublabel?: string;
  size?: number;
  variant?: 'setup' | 'active' | 'result';
  passed?: boolean;
  className?: string;
}

export default function ExamProofRing({
  value,
  totalSeconds,
  remainingSeconds,
  label = 'Pass bar',
  sublabel,
  size = 160,
  variant = 'setup',
  passed,
  className = '',
}: ExamProofRingProps) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const elapsed = remainingSeconds !== undefined ? totalSeconds - remainingSeconds : 0;
  const timerProgress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const scoreProgress = Math.min(1, Math.max(0, value / 100));

  const ringColor =
    variant === 'result'
      ? passed
        ? '#10b981'
        : '#ef4444'
      : variant === 'active'
        ? timerProgress > 0.85
          ? '#ef4444'
          : timerProgress > 0.7
            ? '#f59e0b'
            : '#3b82f6'
        : '#f59e0b';

  const arcProgress = variant === 'active' && remainingSeconds !== undefined ? timerProgress : scoreProgress;
  const dash = c * arcProgress;

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-500"
        />
        {variant === 'setup' && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r - 14}
            fill="none"
            stroke="rgba(245,158,11,0.25)"
            strokeWidth={3}
            strokeDasharray={`${c * 0.65} ${c}`}
            strokeDashoffset={c * 0.175}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
        {variant === 'active' && remainingSeconds !== undefined ? (
          <>
            <span className="text-[9px] font-mono uppercase text-theme-muted tracking-wider">Time left</span>
            <span className="text-2xl font-bold tabular-nums text-cockpit">{formatTime(remainingSeconds)}</span>
          </>
        ) : variant === 'result' ? (
          <>
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: ringColor }}>
              {passed ? 'Passed' : 'Below bar'}
            </span>
            <span className="text-3xl font-bold tabular-nums text-cockpit">{value}%</span>
          </>
        ) : (
          <>
            <span className="text-[9px] font-mono uppercase text-theme-muted tracking-wider">{label}</span>
            <span className="text-3xl font-bold tabular-nums text-cockpit">{value}%</span>
            {sublabel && <span className="text-[9px] text-theme-muted mt-0.5">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
}
