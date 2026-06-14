interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/** AAISM mark — orbital arc + geometric A monogram (Grok/xAI precision) */
export default function Logo({ size = 32, className = '', showBackground = true }: LogoProps) {
  const uid = `aaism-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`aaism-logo group ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#070b12" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id={`${uid}-stroke`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`${uid}-mono`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {showBackground && (
        <rect width="48" height="48" rx="10" fill={`url(#${uid}-bg)`} />
      )}

      {/* Orbital arc — partial ring, SpaceX-style trajectory */}
      <path
        d="M 8 28 A 20 20 0 0 1 40 28"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.25"
        strokeLinecap="round"
        className="aaism-logo-orbit transition-all duration-500 group-hover:stroke-[1.5]"
        opacity={0.92}
      />
      <path
        d="M 40 28 A 20 20 0 0 1 8 28"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeDasharray="2 4"
        opacity={0.35}
        className="aaism-logo-orbit-trail"
      />

      {/* Geometric A monogram — single-stroke precision */}
      <path
        d="M 24 12 L 32 36 M 24 12 L 16 36 M 19.5 27.5 H 28.5"
        fill="none"
        stroke={showBackground ? `url(#${uid}-mono)` : 'currentColor'}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="aaism-logo-a"
      />

      {/* Neural node at apex */}
      <circle
        cx="24"
        cy="12"
        r="2"
        fill={`url(#${uid}-stroke)`}
        className="aaism-logo-node transition-transform duration-500 group-hover:scale-125"
        style={{ transformOrigin: '24px 12px' }}
      />
      <circle
        cx="24"
        cy="12"
        r="4.5"
        fill="none"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="0.6"
        opacity={0.45}
        className="aaism-logo-ring"
      />

      {/* Orbital satellite node */}
      <circle
        cx="38"
        cy="26"
        r="1.5"
        fill="#2dd4bf"
        className="aaism-logo-satellite"
      />
    </svg>
  );
}
