import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCert } from '../context/CertContext';
import { getDomainProgress } from '../services/progressService';
import { useApp } from '../context/AppContext';

interface DomainProgressStripProps {
  /** Highlight weak domain from mission handoff */
  focusDomainId?: number;
  className?: string;
}

export default function DomainProgressStrip({ focusDomainId, className = '' }: DomainProgressStripProps) {
  const { activeCert } = useCert();
  const { state } = useApp();

  const domains = useMemo(() => {
    const progress = getDomainProgress(activeCert.id);
    return activeCert.domains.map(d => {
      const p = progress.find(x => x.domainId === d.id);
      return { ...d, avg: p?.avg ?? 0, count: p?.count ?? 0 };
    });
  }, [activeCert, state.quizAttempts]);

  const focusId = focusDomainId ?? domains.find(d => d.count > 0 && d.avg < 60)?.id;

  return (
    <div className={`rounded-xl border border-theme bg-theme-elevated/80 px-3 py-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">
          {activeCert.shortName} · Domain progress
        </p>
        {focusId && (
          <Link
            to={`/study?tab=quiz&domain=${focusId}`}
            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            Drill weak D{focusId}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {domains.map(d => {
          const isFocus = d.id === focusId;
          const barColor = d.avg >= 80 ? '#10b981' : d.avg >= 60 ? '#f59e0b' : d.count > 0 ? '#ef4444' : '#64748b';
          return (
            <Link
              key={d.id}
              to={`/study?tab=quiz&domain=${d.id}`}
              title={`D${d.id}: ${d.shortName}`}
              className={`flex-1 min-w-[52px] rounded-lg border px-2 py-1.5 transition-colors hover:border-emerald-500/40 ${
                isFocus ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'border-theme bg-cockpit-track/50'
              }`}
            >
              <div className="text-[9px] font-mono text-theme-muted truncate">D{d.id}</div>
              <div className="text-xs font-bold tabular-nums text-cockpit">{d.count > 0 ? `${d.avg}%` : '—'}</div>
              <div className="h-0.5 mt-1 rounded-full bg-cockpit-track overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${d.avg}%`, backgroundColor: barColor }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
