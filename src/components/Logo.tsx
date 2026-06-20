interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/** Aegis mark — shield cortex, orbital arc, neural node (16px–48px) */
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
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#060a10" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${uid}-stroke`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="45%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`${uid}-core`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {showBackground && (
        <rect width="48" height="48" rx="10" fill={`url(#${uid}-bg)`} />
      )}

      {/* Shield cortex — protection + command */}
      <path
        d="M 24 7 L 38 14.5 V 26.5 C 38 33 31.5 38.5 24 41 C 16.5 38.5 10 33 10 26.5 V 14.5 Z"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.1"
        strokeLinejoin="round"
        className="aegis-logo-shield"
        opacity={0.9}
      />

      {/* Inner chevron — forward motion */}
      <path
        d="M 24 16 L 30 30 H 27.2 L 25.8 26.5 H 22.2 L 20.8 30 H 18 L 24 16 Z"
        fill={showBackground ? `url(#${uid}-core)` : 'currentColor'}
        className="aegis-logo-chevron"
        opacity={0.96}
      />
      <path
        d="M 22.5 24 H 25.5 L 24 19.5 Z"
        fill={`url(#${uid}-bg)`}
        className="aegis-logo-cutout"
      />

      {/* Neural hub */}
      <circle
        cx="24"
        cy="19.5"
        r="1.75"
        fill={`url(#${uid}-stroke)`}
        className="aegis-logo-node"
      />
      <circle
        cx="24"
        cy="19.5"
        r="4"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="0.55"
        opacity={0.4}
        className="aegis-logo-ring"
      />

      {/* Orbital trajectory */}
      <path
        d="M 34 13 Q 40 20 37 30"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="0.85"
        strokeLinecap="round"
        className="aegis-logo-orbit"
        opacity={0.75}
      />
      <circle
        cx="37"
        cy="30"
        r="1.35"
        fill="#2dd4bf"
        className="aegis-logo-satellite"
      />
      <circle
        cx="34"
        cy="13"
        r="0.9"
        fill="#38bdf8"
        opacity={0.85}
        className="aegis-logo-satellite-a"
      />
    </svg>
  );
}
