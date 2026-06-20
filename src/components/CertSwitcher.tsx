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

export default function CertSwitcher({ compact }: { compact?: boolean }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border border-theme bg-theme-elevated hover:bg-cockpit-track transition-colors ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: activeCert.color }}
        />
        <CategoryIcon className="w-3.5 h-3.5 text-theme-muted shrink-0" />
        {!compact && (
          <span className="text-xs font-semibold text-cockpit truncate max-w-[120px]">
            {activeCert.shortName}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-theme-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-[60] w-72 rounded-xl border border-theme bg-theme-elevated shadow-xl py-2 animate-fade-in"
          role="listbox"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-theme-muted uppercase">
            Certification track
          </div>
          {CERT_CATEGORIES.map(cat => {
            const certs = CERTIFICATIONS.filter(c => c.category === cat.id);
            if (certs.length === 0) return null;
            const Icon = CATEGORY_ICONS[cat.id];
            return (
              <div key={cat.id} className="px-2 py-1">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-theme-muted uppercase tracking-wide">
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
