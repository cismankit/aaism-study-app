import { Link, useLocation } from 'react-router-dom';
import { Crosshair, ClipboardList, Target } from 'lucide-react';
import { STUDY_MODE_DEFINITIONS } from '../data/learnWorkEarnAgents';

const MODE_ICONS = {
  mission: Crosshair,
  exam: ClipboardList,
  practice: Target,
} as const;

export default function StudyModeGuide({ className = '' }: { className?: string }) {
  const location = useLocation();
  const activeId = location.pathname.startsWith('/exam')
    ? 'exam'
    : location.pathname.startsWith('/study')
      ? 'practice'
      : 'mission';

  return (
    <div className={`grid sm:grid-cols-3 gap-2 ${className}`}>
      {STUDY_MODE_DEFINITIONS.map(mode => {
        const Icon = MODE_ICONS[mode.id];
        const isActive = activeId === mode.id;
        return (
          <Link
            key={mode.id}
            to={mode.route}
            className={`rounded-xl border p-3 transition-all hover:scale-[1.01] ${
              isActive
                ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20'
                : 'border-theme bg-theme-elevated hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-muted'}`} />
              <span className="text-sm font-bold text-cockpit">{mode.label}</span>
              <span className="ml-auto text-[10px] font-mono text-theme-faint">{mode.duration}</span>
            </div>
            <p className="text-xs font-medium text-cockpit">{mode.tagline}</p>
            <p className="text-[10px] text-theme-muted mt-1 leading-relaxed">{mode.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
