interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/** AAISM Intelligence Platform mark — hex intel badge + geometric A monogram + neural arc */
export default function Logo({ size = 32, className = '', showBackground = true }: LogoProps) {
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
        <linearGradient id="aaism-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c1222" />
          <stop offset="100%" stopColor="#162032" />
        </linearGradient>
        <linearGradient id="aaism-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="45%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="aaism-glow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {showBackground && (
        <rect width="48" height="48" rx="11" fill="url(#aaism-bg)" />
      )}

      {/* Hexagonal intel frame */}
      <path
        d="M24 4.5 L38.5 12.8 V31.2 L24 39.5 L9.5 31.2 V12.8 Z"
        fill="none"
        stroke="url(#aaism-accent)"
        strokeWidth="1.15"
        strokeLinejoin="round"
        opacity={0.88}
        className="aaism-logo-hex transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Geometric A monogram */}
      <path
        d="M24 11.5 L31.5 34 H28.2 L26.4 28.5 H21.6 L19.8 34 H16.5 L24 11.5 Z"
        fill="white"
        fillOpacity={showBackground ? 0.96 : 0.92}
      />
      <path
        d="M22.1 25.5 H25.9 L24 19.2 Z"
        fill="url(#aaism-bg)"
        fillOpacity={showBackground ? 1 : 0.85}
      />

      {/* Intelligence iris — focal point */}
      <circle
        cx="24"
        cy="20.5"
        r="1.6"
        fill="url(#aaism-accent)"
        className="aaism-logo-iris transition-transform duration-500 group-hover:scale-125"
        style={{ transformOrigin: '24px 20.5px' }}
      />
      <circle
        cx="24"
        cy="20.5"
        r="3.2"
        fill="none"
        stroke="url(#aaism-glow)"
        strokeWidth="0.6"
        opacity={0.55}
        className="aaism-logo-ring"
      />

      {/* Neural network arc */}
      <g className="aaism-logo-neural" opacity={showBackground ? 0.85 : 0.95}>
        <path
          d="M33 14 Q37 18 36.5 24 Q36 30 33 33"
          fill="none"
          stroke="url(#aaism-accent)"
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity={0.65}
        />
        <circle cx="33" cy="14" r="1.3" fill="#34d399" className="aaism-logo-node" />
        <circle cx="36.5" cy="21" r="1.1" fill="#2dd4bf" className="aaism-logo-node" style={{ animationDelay: '0.15s' }} />
        <circle cx="33.5" cy="28" r="1.2" fill="#22d3ee" className="aaism-logo-node" style={{ animationDelay: '0.3s' }} />
        <line x1="31" y1="18" x2="33" y2="14" stroke="#34d399" strokeWidth="0.5" opacity={0.5} />
        <line x1="30.5" y1="22" x2="36.5" y2="21" stroke="#2dd4bf" strokeWidth="0.5" opacity={0.45} />
      </g>
    </svg>
  );
}
