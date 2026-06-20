import { useState, useRef, useEffect } from 'react';
import { Shield, Brain, Link2, Atom, ChevronDown, Check } from 'lucide-react';
import {
  CERTIFICATIONS,
  CERT_CATEGORIES,
  type CertCategory,
} from '../data/certifications';
import { useCert } from '../context/CertContext';

const CATEGORY_ICONS: Record<CertCategory, typeof Shield> = {
  cybersecurity: Shield,
  ai: Brain,
  blockchain: Link2,
  quantum: Atom,
};

interface CertSwitcherProps {
  compact?: boolean;
  integrated?: boolean;
}

export default function CertSwitcher({ compact, integrated }: CertSwitcherProps) {
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
        <CategoryIcon className="w-3.5 h-3.5 text-theme-muted shrink-0" />
        {!compact && (
          <span className="text-[11px] font-medium text-cockpit truncate flex-1 text-left">
            {activeCert.shortName}
          </span>
        )}
        {!compact && (
          <ChevronDown className={`w-3 h-3 text-theme-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div
          className={`absolute ${integrated ? 'left-0 right-0' : 'left-0'} top-full mt-1 z-[60] w-72 rounded-xl border border-theme bg-theme-elevated shadow-xl py-2 animate-fade-in`}
          role="listbox"
        >
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
                  const selected = cert.id === activeCert.id;
                  return (
                    <button
                      key={cert.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setActiveCert(cert.id);
                        setOpen(false);
                      }}
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
                      {selected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
