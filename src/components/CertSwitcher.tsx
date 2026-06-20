import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Shield, Brain, Link2, Atom, ChevronDown, Check } from 'lucide-react';
import {
  CERTIFICATIONS,
  CERT_CATEGORIES,
  type CertCategory,
} from '../data/certifications';
import { getContentStats } from '../data/examContent';
import { getLabsForCert } from '../data/labs';
import { useCert } from '../context/CertContext';

function getCertDepthLabel(certId: string): { label: string; detail: string; isDeepening: boolean } {
  const stats = getContentStats(certId);
  const labCount = getLabsForCert(certId).length;
  const q = stats.totalQuestions;
  const detail = `${q} Q · ${labCount} labs`;
  if (q < 100) return { label: 'Deepening', detail, isDeepening: true };
  return { label: detail, detail, isDeepening: false };
}

const CATEGORY_ICONS: Record<CertCategory, typeof Shield> = {
  cybersecurity: Shield,
  ai: Brain,
  blockchain: Link2,
  quantum: Atom,
};

interface CertSwitcherProps {
  compact?: boolean;
  integrated?: boolean;
  /** Collapsed sidebar: logo trigger with cert dot badge only */
  rail?: boolean;
  children?: ReactNode;
}

function CertDropdown({
  open,
  onSelect,
  activeCertId,
}: {
  open: boolean;
  onSelect: (certId: string) => void;
  activeCertId: string;
}) {
  if (!open) return null;

  return (
    <>
      <div className="px-3 py-1.5 text-[10px] font-medium tracking-wide text-theme-muted">
        Certification track
      </div>
      {CERT_CATEGORIES.map(cat => {
        const certs = CERTIFICATIONS.filter(c => c.category === cat.id);
        if (certs.length === 0) return null;
        const Icon = CATEGORY_ICONS[cat.id];
        return (
          <div key={cat.id} className="px-2 py-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-theme-muted tracking-wide">
              <Icon className="w-3 h-3" />
              {cat.label}
            </div>
            {certs.map(cert => {
              const selected = cert.id === activeCertId;
              const depth = getCertDepthLabel(cert.id);
              return (
                <button
                  key={cert.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(cert.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${
                    selected
                      ? 'bg-emerald-50 dark:bg-emerald-500/15'
                      : 'hover:bg-cockpit-track dark:hover:bg-gray-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cert.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cockpit truncate">
                      {cert.shortName}
                    </div>
                    <div className="text-[10px] text-theme-muted truncate">{cert.vendor}</div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                    depth.label === 'Deepening'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                      : 'bg-cockpit-track text-theme-muted'
                  }`}>
                    {depth.label}
                  </span>
                  {selected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export default function CertSwitcher({ compact, integrated, rail, children }: CertSwitcherProps) {
  const { activeCert, setActiveCert } = useCert();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const CategoryIcon = CATEGORY_ICONS[activeCert.category];

  const handleSelect = (certId: string) => {
    setActiveCert(certId);
    setOpen(false);
  };

  if (rail && children) {
    const depth = getCertDepthLabel(activeCert.id);
    const stats = getContentStats(activeCert.id);
    const railTitle = `${activeCert.shortName} · ${depth.detail}`;

    return (
      <div ref={ref} className="sidebar-cert-rail flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="sidebar-brand-logo-btn"
          aria-expanded={open}
          aria-haspopup="listbox"
          title={railTitle}
        >
          {children}
          <span
            className="sidebar-cert-dot"
            style={{ backgroundColor: activeCert.color }}
            aria-hidden
          />
          <span
            className={`sidebar-cert-depth-badge ${depth.isDeepening ? 'sidebar-cert-depth-deepening' : ''}`}
            aria-label={depth.detail}
          >
            {depth.isDeepening ? '◐' : `${stats.totalQuestions}Q`}
          </span>
        </button>
        {open && (
          <div
            className="absolute left-full top-0 ml-2 z-[60] w-72 rounded-xl border border-theme bg-theme-elevated shadow-xl py-2 animate-fade-in"
            role="listbox"
          >
            <CertDropdown open={open} onSelect={handleSelect} activeCertId={activeCert.id} />
          </div>
        )}
      </div>
    );
  }

  const buttonClass = integrated
    ? `cert-switcher-integrated flex items-center gap-2 rounded-md transition-colors w-full ${
        compact ? 'justify-center px-1.5 py-1' : 'px-2 py-1.5 hover:bg-cockpit-track/80 dark:hover:bg-gray-800/60'
      }`
    : `flex items-center gap-2 rounded-lg border border-theme bg-theme-elevated hover:bg-cockpit-track transition-colors ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2'
      }`;

  return (
    <div ref={ref} className={`relative ${integrated ? 'min-w-0 flex-1' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={buttonClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={compact ? activeCert.shortName : undefined}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
          style={{ backgroundColor: activeCert.color }}
        />
        {!rail && <CategoryIcon className="w-3.5 h-3.5 text-theme-muted shrink-0" />}
        {!compact && !rail && (
          <span className="text-[11px] font-medium text-cockpit truncate flex-1 text-left">
            {activeCert.shortName}
          </span>
        )}
        {!compact && !rail && (
          <span className="text-[10px] text-theme-muted shrink-0">
            {getCertDepthLabel(activeCert.id).detail}
          </span>
        )}
        {!compact && !rail && (
          <ChevronDown className={`w-3 h-3 text-theme-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div
          className={`absolute ${integrated ? 'left-0 right-0' : 'left-0'} top-full mt-1 z-[60] w-72 rounded-xl border border-theme bg-theme-elevated shadow-xl py-2 animate-fade-in`}
          role="listbox"
        >
          <CertDropdown open={open} onSelect={handleSelect} activeCertId={activeCert.id} />
        </div>
      )}
    </div>
  );
}
