interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/** AAISM Intelligence Platform mark — shield + radar sweep + AI node network */
export default function Logo({ size = 32, className = '', showBackground = true }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="aaism-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="aaism-shield" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {showBackground && (
        <rect width="48" height="48" rx="10" fill="url(#aaism-grad)" />
      )}

      {/* Shield outline */}
      <path
        d="M24 6 L38 12 L38 24 C38 32 32 38 24 42 C16 38 10 32 10 24 L10 12 Z"
        fill="none"
        stroke="url(#aaism-shield)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={showBackground ? 1 : 0.9}
      />

      {/* Radar sweep arc */}
      <path
        d="M24 24 L24 14 A10 10 0 0 1 32 20 Z"
        fill="white"
        fillOpacity={showBackground ? 0.25 : 0.35}
      />
      <circle
        cx="24"
        cy="24"
        r="10"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity={showBackground ? 0.4 : 0.55}
      />
      <circle
        cx="24"
        cy="24"
        r="6"
        fill="none"
        stroke="white"
        strokeWidth="0.6"
        strokeOpacity={showBackground ? 0.3 : 0.45}
      />

      {/* AI node network */}
      <circle cx="24" cy="24" r="2.2" fill="white" />
      <circle cx="18" cy="18" r="1.4" fill="white" fillOpacity="0.85" />
      <circle cx="30" cy="18" r="1.4" fill="white" fillOpacity="0.85" />
      <circle cx="20" cy="30" r="1.2" fill="white" fillOpacity="0.7" />
      <circle cx="28" cy="30" r="1.2" fill="white" fillOpacity="0.7" />

      <line x1="24" y1="24" x2="18" y2="18" stroke="white" strokeWidth="0.7" strokeOpacity="0.6" />
      <line x1="24" y1="24" x2="30" y2="18" stroke="white" strokeWidth="0.7" strokeOpacity="0.6" />
      <line x1="24" y1="24" x2="20" y2="30" stroke="white" strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="24" y1="24" x2="28" y2="30" stroke="white" strokeWidth="0.7" strokeOpacity="0.5" />

      {/* Radar blip */}
      <circle cx="30" cy="20" r="1" fill="#6ee7b7" />
    </svg>
  );
}
