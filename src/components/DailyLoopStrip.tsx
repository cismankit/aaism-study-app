import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { DailyLoopStep } from '../services/sidebarJourneyService';

interface DailyLoopStripProps {
  steps: DailyLoopStep[];
  focusLabel?: string;
  certShortName?: string;
  variant?: 'compact' | 'panel';
  className?: string;
}

export default function DailyLoopStrip({
  steps,
  focusLabel,
  certShortName,
  variant = 'panel',
  className = '',
}: DailyLoopStripProps) {
  const doneCount = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Learn · Work · Earn{certShortName ? ` · ${certShortName}` : ''}
          </p>
          {focusLabel && (
            <p className="text-xs text-theme-muted truncate">{focusLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-theme-faint shrink-0" aria-hidden />}
              <Link
                to={step.to}
                title={`${step.label}: ${step.subtitle}`}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors truncate ${
                  step.done
                    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                    : nextStep?.id === step.id
                      ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'bg-cockpit-track text-theme-muted hover:text-theme-secondary'
                }`}
              >
                {step.done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                {step.label}
              </Link>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-theme-faint font-mono shrink-0">
          {doneCount}/{steps.length}
        </span>
      </div>
    );
  }

  return (
    <div className={`cockpit-glass rounded-xl p-4 border border-emerald-500/20 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Learn · Work · Earn{certShortName ? ` · ${certShortName}` : ''}
          </p>
          {focusLabel && (
            <p className="text-sm text-cockpit mt-0.5">{focusLabel}</p>
          )}
        </div>
        <span className="text-xs font-mono text-theme-muted">
          {doneCount} of {steps.length} complete
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map(step => (
          <Link
            key={step.id}
            to={step.to}
            className={`rounded-lg border p-3 transition-all hover:scale-[1.01] ${
              step.done
                ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10'
                : nextStep?.id === step.id
                  ? 'border-cyan-500/40 bg-cyan-50/40 dark:bg-cyan-500/10 ring-1 ring-cyan-500/20'
                  : 'border-theme bg-theme-elevated hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-cockpit">{step.label}</span>
              {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            </div>
            <p className="text-[10px] text-theme-muted">{step.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
