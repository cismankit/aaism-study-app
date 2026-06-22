import { getCertOrbPalette } from '../constants/orbVisuals';

export interface OrbDomain {
  id: number;
  shortName: string;
  avg: number;
  isFocus?: boolean;
}

interface MissionOrbFallbackProps {
  certId?: string;
  readiness: number;
  domains: OrbDomain[];
  className?: string;
}

export default function MissionOrbFallback({
  certId = 'aaism',
  readiness,
  domains,
  className = '',
}: MissionOrbFallbackProps) {
  const palette = getCertOrbPalette(certId);
  const focus = domains.find(d => d.isFocus) ?? domains[0];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-cyan-950/30 min-h-[220px] max-h-[280px] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 400 280" className="w-full h-full">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.core} stopOpacity="0.9" />
            <stop offset="100%" stopColor={palette.core} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="140" rx="150" ry="52" fill="none" stroke={`${palette.ring}26`} strokeWidth="1" strokeDasharray="4 6" />
        <ellipse cx="200" cy="140" rx="115" ry="78" fill="none" stroke={`${palette.particle}1f`} strokeWidth="1" />
        {domains.map((d, i) => {
          const angle = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
          const rx = d.isFocus ? 115 : 150;
          const ry = d.isFocus ? 78 : 52;
          const x = 200 + rx * Math.cos(angle);
          const y = 140 + ry * Math.sin(angle);
          const color = palette.domainColors[i % palette.domainColors.length];
          return (
            <g key={d.id}>
              <circle cx={x} cy={y} r={d.isFocus ? 14 : 9} fill={color} fillOpacity={0.85} />
              <text x={x} y={y + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="monospace">
                {d.shortName}
              </text>
            </g>
          );
        })}
        <circle cx="200" cy="140" r="36" fill="url(#coreGlow)" />
        <circle cx="200" cy="140" r="28" fill="none" stroke={palette.core} strokeWidth="2" strokeOpacity="0.6" />
        <text x="200" y="136" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="system-ui">
          {readiness}%
        </text>
        <text x="200" y="152" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">
          READINESS
        </text>
        {focus && (
          <text x="200" y="258" textAnchor="middle" fill={`${palette.core}b3`} fontSize="10" fontFamily="system-ui">
            Focus · {focus.shortName} · {focus.avg}%
          </text>
        )}
      </svg>
    </div>
  );
}
