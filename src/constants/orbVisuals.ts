/** Cert-specific orbital palette — Mission hero only (Three.js lazy-loaded). */

export interface CertOrbPalette {
  core: string;
  coreEmissive: string;
  ring: string;
  particle: string;
  domainColors: string[];
}

const DEFAULT_PALETTE: CertOrbPalette = {
  core: '#10b981',
  coreEmissive: '#064e3b',
  ring: '#10b981',
  particle: '#06b6d4',
  domainColors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316'],
};

const CERT_PALETTES: Record<string, CertOrbPalette> = {
  aaism: DEFAULT_PALETTE,
  cissp: {
    core: '#3b82f6',
    coreEmissive: '#1e3a8a',
    ring: '#3b82f6',
    particle: '#60a5fa',
    domainColors: ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899'],
  },
  'security-plus': {
    core: '#ef4444',
    coreEmissive: '#7f1d1d',
    ring: '#ef4444',
    particle: '#f97316',
    domainColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'],
  },
  ceh: {
    core: '#a855f7',
    coreEmissive: '#581c87',
    ring: '#a855f7',
    particle: '#c084fc',
    domainColors: ['#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'],
  },
  cbsp: {
    core: '#f59e0b',
    coreEmissive: '#78350f',
    ring: '#f59e0b',
    particle: '#fbbf24',
    domainColors: ['#f59e0b', '#eab308', '#84cc16', '#06b6d4', '#6366f1'],
  },
  qist: {
    core: '#06b6d4',
    coreEmissive: '#164e63',
    ring: '#06b6d4',
    particle: '#22d3ee',
    domainColors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#6366f1'],
  },
  cais: {
    core: '#14b8a6',
    coreEmissive: '#134e4a',
    ring: '#14b8a6',
    particle: '#2dd4bf',
    domainColors: ['#14b8a6', '#10b981', '#06b6d4', '#6366f1'],
  },
};

export function getCertOrbPalette(certId: string): CertOrbPalette {
  return CERT_PALETTES[certId] ?? DEFAULT_PALETTE;
}
