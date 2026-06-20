import { Link, useLocation } from 'react-router-dom';
import { Target, ChevronRight } from 'lucide-react';
import { useCert } from '../context/CertContext';
import {
  getDailyLoopSteps,
  getFocusContext,
  getNextBestAction,
  isLoopChildRoute,
} from '../services/sidebarJourneyService';
import DailyLoopStrip from './DailyLoopStrip';

export default function FocusContextBar() {
  const location = useLocation();
  const { activeCert, activeCertId } = useCert();

  if (!isLoopChildRoute(location.pathname)) return null;

  const focus = getFocusContext(activeCertId);
  const steps = getDailyLoopSteps(activeCertId);
  const next = getNextBestAction(activeCertId);

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-theme-elevated/80 backdrop-blur-sm px-3 py-2.5 sm:px-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          <Target className="w-3 h-3" />
          Learn · Work · Earn
        </Link>
        {focus.lastMissionGoal && (
          <>
            <span className="text-theme-faint">·</span>
            <span className="text-[10px] text-theme-muted truncate max-w-[200px]">
              {focus.lastMissionGoal}
            </span>
          </>
        )}
        <Link
          to={next.to}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-400 hover:underline shrink-0"
        >
          Continue: {next.label}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <DailyLoopStrip
        steps={steps}
        focusLabel={focus.focusLabel}
        certShortName={activeCert.shortName}
        variant="compact"
      />
    </div>
  );
}
