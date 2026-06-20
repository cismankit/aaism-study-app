interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/** Five council nodes — Learn · Work · Earn · Invest · Connect */
const ORBIT_NODES = [
  { cx: 24, cy: 12.8, color: '#10b981', cls: 'aegis-orbit-0' },
  { cx: 35.8, cy: 18.2, color: '#14b8a6', cls: 'aegis-orbit-1' },
  { cx: 33.2, cy: 29.8, color: '#2dd4bf', cls: 'aegis-orbit-2' },
  { cx: 14.8, cy: 29.8, color: '#22d3ee', cls: 'aegis-orbit-3' },
  { cx: 12.2, cy: 18.2, color: '#38bdf8', cls: 'aegis-orbit-4' },
] as const;

const SHIELD =
  'M 24 6.2 L 38.8 13.8 V 26.8 C 38.8 34 32.2 39.8 24 42.2 C 15.8 39.8 9.2 34 9.2 26.8 V 13.8 Z';

const A_BODY = 'M 24 14.2 L 18.2 30.8 H 20.8 L 22.3 26.4 H 25.7 L 27.2 30.8 H 29.8 L 24 14.2 Z';
const A_CUTOUT = 'M 22.6 24.2 H 25.4 L 24 19.4 Z';

/** Aegis mark — shield · monogram A · five-node council orbit (16px–512px) */
export default function Logo({ size = 32, className = '', showBackground = true }: LogoProps) {
  const uid = `aegis-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`aegis-logo group ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#030712" />
          <stop offset="55%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id={`${uid}-vignette`} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#030712" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-shield-fill`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0f2847" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#061018" stopOpacity={0.92} />
        </linearGradient>
        <linearGradient id={`${uid}-stroke`} x1="12%" y1="92%" x2="88%" y2="8%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="38%" stopColor="#10b981" />
          <stop offset="72%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`${uid}-a`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.65" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-inner`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.35" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="atop" />
        </filter>
      </defs>

      {showBackground && (
        <>
          <rect width="48" height="48" rx="10.5" fill={`url(#${uid}-bg)`} />
          <rect width="48" height="48" rx="10.5" fill={`url(#${uid}-vignette)`} />
        </>
      )}

      {/* Shield body + rim */}
      <path d={SHIELD} fill={`url(#${uid}-shield-fill)`} className="aegis-logo-shield-fill" />
      <path
        d={SHIELD}
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.15"
        strokeLinejoin="round"
        className="aegis-logo-shield"
        opacity={0.95}
      />
      <path
        d="M 24 7.4 L 36.5 13.6"
        fill="none"
        stroke={`url(#${uid}-sheen)`}
        strokeWidth="0.55"
        strokeLinecap="round"
        className="aegis-logo-sheen"
        opacity={0.7}
      />

      {/* Council orbit */}
      <g className="aegis-logo-orbit-group" filter={`url(#${uid}-glow)`}>
        <ellipse
          cx="24"
          cy="21.2"
          rx="12.4"
          ry="8.6"
          fill="none"
          stroke={`url(#${uid}-stroke)`}
          strokeWidth="0.5"
          strokeDasharray="1.8 2.4"
          className="aegis-logo-orbit"
          opacity={0.38}
        />
        {ORBIT_NODES.map(({ cx, cy, color, cls }) => (
          <circle
            key={cls}
            cx={cx}
            cy={cy}
            r="1.05"
            fill={color}
            className={`aegis-logo-node ${cls}`}
            opacity={0.92}
          />
        ))}
      </g>

      {/* Monogram A */}
      <g className="aegis-logo-monogram" filter={`url(#${uid}-inner)`}>
        <path
          d={A_BODY}
          fill={showBackground ? `url(#${uid}-a)` : 'currentColor'}
          className="aegis-logo-a"
        />
        <path d={A_CUTOUT} fill={`url(#${uid}-bg)`} className="aegis-logo-cutout" />
      </g>

      {/* Core hub */}
      <circle
        cx="24"
        cy="19.4"
        r="1.35"
        fill={`url(#${uid}-stroke)`}
        className="aegis-logo-hub"
      />
      <circle
        cx="24"
        cy="19.4"
        r="2.8"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="0.45"
        className="aegis-logo-hub-ring"
        opacity={0.45}
      />
    </svg>
  );
}
