import { useState, useEffect } from 'react';
import { X, LayoutDashboard, Crosshair, Zap, Radar, Bot } from 'lucide-react';

const JOURNEY_DISMISSED_KEY = 'aaism-sidebar-journey-dismissed';

const MISSION_PATH = [
  { label: 'Command', subtitle: 'Orient & plan', icon: LayoutDashboard, color: 'text-emerald-500' },
  { label: 'Study', subtitle: '312+ questions', icon: Crosshair, color: 'text-cyan-500' },
  { label: 'Exam', subtitle: '90Q timed sim', icon: Zap, color: 'text-amber-500' },
  { label: 'Intel', subtitle: 'Live OSINT feeds', icon: Radar, color: 'text-violet-500' },
  { label: 'Agent', subtitle: 'AI discovery', icon: Bot, color: 'text-pink-500' },
] as const;

export function isJourneyHintDismissed(): boolean {
  return localStorage.getItem(JOURNEY_DISMISSED_KEY) === 'true';
}

export function dismissJourneyHint(): void {
  localStorage.setItem(JOURNEY_DISMISSED_KEY, 'true');
}

interface SidebarJourneyHintProps {
  collapsed: boolean;
}

export default function SidebarJourneyHint({ collapsed }: SidebarJourneyHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (collapsed && !isJourneyHintDismissed()) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [collapsed]);

  if (!visible || !collapsed) return null;

  const handleDismiss = () => {
    dismissJourneyHint();
    setVisible(false);
  };

  return (
    <div
      className="fixed left-[60px] top-1/2 -translate-y-1/2 z-[55] w-64 animate-fade-in pointer-events-auto hidden lg:block"
      role="dialog"
      aria-label="Learning path guide"
    >
      <div className="ml-2 rounded-xl border border-emerald-500/30 bg-theme-elevated/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl shadow-emerald-500/10 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Mission Path
            </p>
            <p className="text-xs text-theme-muted mt-0.5">
              Hover icons for details — follow this flow to ace the exam.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-theme-faint hover:text-theme-secondary hover:bg-cockpit-track dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Dismiss guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {MISSION_PATH.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                  <div className={`w-7 h-7 rounded-lg bg-cockpit-track dark:bg-gray-800 flex items-center justify-center ${step.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-medium text-theme-secondary truncate w-full text-center">
                    {step.label}
                  </span>
                </div>
                {i < MISSION_PATH.length - 1 && (
                  <div className="w-2 h-px bg-emerald-500/40 shrink-0 mb-4" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleDismiss}
          className="mt-3 w-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Got it — explore on hover
        </button>
      </div>
    </div>
  );
}
