import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, Crosshair, Zap, Flame, ChevronRight, Sparkles,
  BookOpen, Wrench, Award, LayoutDashboard,
} from 'lucide-react';
import type { OrbDomain } from './MissionOrbFallback';
import MissionOrbFallback from './MissionOrbFallback';
import DailyLoopStrip from './DailyLoopStrip';
import type { DailyLoopStep } from '../services/sidebarJourneyService';
import type { MissionGoal } from '../services/missionOrchestrator';
import type { MissionLogEntry } from '../services/progressService';
import { PLATFORM_NAME } from '../constants/platformBrand';

const MissionOrbHero = lazy(() => import('./MissionOrbHero'));

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

interface PillarRing {
  label: string;
  sub: string;
  progress: number;
  color: string;
  icon: typeof Target;
}

interface MissionLandingProps {
  certId: string;
  certShortName: string;
  readiness: number;
  streak: number;
  levelTitle: string;
  domains: OrbDomain[];
  focusLabel: string;
  dailyLoopSteps: DailyLoopStep[];
  learnRing: number;
  workRing: number;
  earnRing: number;
  streakWeek: boolean[];
  missionDoneToday: boolean;
  suggestedGoal: MissionGoal;
  goalOptions: MissionGoal[];
  recentMissions: MissionLogEntry[];
  onStartMission: (goal: MissionGoal) => void;
  error?: string | null;
}

function FitnessRing({
  progress,
  color,
  size,
  stroke,
  offset = 0,
}: {
  progress: number;
  color: string;
  size: number;
  stroke: number;
  offset?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = c * clamped;
  return (
    <circle
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={`${dash} ${c}`}
      transform={`rotate(${offset} ${size / 2} ${size / 2})`}
      className="transition-all duration-700 ease-out"
    />
  );
}

const PILLARS = [
  {
    key: 'learn',
    title: 'Learn',
    verb: 'Daily loop',
    icon: BookOpen,
    route: '/',
    labelClass: 'text-cyan-700 dark:text-cyan-400',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    barColor: '#06b6d4',
    body: 'One 25-minute mission — read, quiz, lab, intel. Weak domain first. This is the product.',
  },
  {
    key: 'work',
    title: 'Work',
    verb: 'Drill depth',
    icon: Wrench,
    route: '/study?tab=quiz',
    labelClass: 'text-emerald-700 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    barColor: '#10b981',
    body: 'Domain practice when you need reps. Questions, flashcards, and targeted drills — not the daily loop.',
  },
  {
    key: 'earn',
    title: 'Earn',
    verb: 'Prove it',
    icon: Award,
    route: '/exam',
    labelClass: 'text-amber-700 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    barColor: '#f59e0b',
    body: 'Timed exam simulation. Pacing, judgment, pass threshold — earn your readiness score.',
  },
] as const;

export default function MissionLanding({
  certId,
  certShortName,
  readiness,
  streak,
  levelTitle,
  domains,
  focusLabel,
  dailyLoopSteps,
  learnRing,
  workRing,
  earnRing,
  streakWeek,
  missionDoneToday,
  suggestedGoal,
  goalOptions,
  recentMissions,
  onStartMission,
  error,
}: MissionLandingProps) {
  const reducedMotion = usePrefersReducedMotion();
  const rings: PillarRing[] = [
    { label: 'Learn', sub: missionDoneToday ? 'Loop done' : 'Mission', progress: learnRing, color: '#06b6d4', icon: BookOpen },
    { label: 'Work', sub: 'Practice', progress: workRing, color: '#10b981', icon: Wrench },
    { label: 'Earn', sub: 'Exam', progress: earnRing, color: '#f59e0b', icon: Award },
  ];

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-5">
      {/* Hero — orbital viz + rings + streak */}
      <section className="relative rounded-2xl border border-emerald-500/20 overflow-hidden cockpit-glass">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12)_0%,transparent_55%)] pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1fr_auto] gap-4 p-4 sm:p-5">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                {PLATFORM_NAME} Mission
              </span>
              <span className="text-[10px] text-theme-faint">·</span>
              <span className="text-[10px] font-mono text-theme-muted">{certShortName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cockpit leading-tight">
              Learn · Work · Earn
            </h1>
            <p className="text-sm text-cockpit-muted max-w-lg">
              Your certification journey in one daily loop. Mission teaches, Practice drills, Exam proves — not three tabs, one path.
            </p>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 max-w-lg">
              Unofficial AAISM prep companion — not affiliated with ISACA. Verify all content against official exam materials.
            </p>

            {/* Duolingo-style streak path */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1">
                {streakWeek.map((active, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-cockpit-track border-theme text-theme-faint'
                      }`}
                      title={dayLabels[i]}
                    >
                      {active ? <Flame className="w-3.5 h-3.5 text-orange-500" /> : dayLabels[i]}
                    </div>
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}-day streak
                </span>
              )}
            </div>
          </div>

          {/* Apple Fitness-style triple rings */}
          <div className="flex items-center justify-center gap-4 shrink-0">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32">
              <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                <FitnessRing progress={1} color="rgba(255,255,255,0.06)" size={128} stroke={10} />
                <FitnessRing progress={earnRing} color="#f59e0b" size={128} stroke={10} offset={-90} />
                <FitnessRing progress={workRing} color="#10b981" size={128} stroke={10} offset={30} />
                <FitnessRing progress={learnRing} color="#06b6d4" size={128} stroke={10} offset={150} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-mono text-theme-muted uppercase">Ready</span>
                <span className="text-2xl font-bold text-cockpit tabular-nums">{readiness}%</span>
                <span className="text-[9px] text-theme-faint truncate max-w-[80px]">{levelTitle}</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2 text-[10px]">
              {rings.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-cockpit font-medium">{r.label}</span>
                  <span className="text-theme-muted">{r.sub}</span>
                  <span className="text-theme-faint tabular-nums">{Math.round(r.progress * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative px-4 sm:px-5 pb-4">
          {reducedMotion ? (
            <MissionOrbFallback certId={certId} readiness={readiness} domains={domains} />
          ) : (
            <Suspense fallback={<MissionOrbFallback certId={certId} readiness={readiness} domains={domains} />}>
              <MissionOrbHero certId={certId} readiness={readiness} domains={domains} />
            </Suspense>
          )}
          {focusLabel && (
            <p className="text-center text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-2 font-medium">
              Orbital focus · {focusLabel}
            </p>
          )}
        </div>
      </section>

      {/* Linear-style cycle + primary CTA */}
      <section className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Today&apos;s cycle
            </p>
            <p className="text-sm text-cockpit mt-0.5">
              {missionDoneToday ? 'Loop complete — drill or prove next' : 'Start with Learn — the 25-min mission'}
            </p>
          </div>
          <Link
            to="/command"
            className="inline-flex items-center gap-1 text-[11px] text-theme-muted hover:text-cockpit transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Command Center
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <DailyLoopStrip
          steps={dailyLoopSteps}
          focusLabel={focusLabel}
          certShortName={certShortName}
          variant="panel"
        />

        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/5 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Learn · Today&apos;s mission
              </p>
              <p className="font-medium text-sm text-cockpit mt-1">{suggestedGoal.label}</p>
              <p className="text-[10px] text-theme-muted mt-1 capitalize flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {suggestedGoal.type.replace(/-/g, ' ')} · read → quiz → lab · ~25 min
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartMission(suggestedGoal)}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Target className="w-4 h-4" />
              {missionDoneToday ? 'Run again' : 'Start mission'}
            </button>
          </div>

          {goalOptions.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-500/20">
              <span className="text-[10px] text-theme-muted w-full">Or pick a {certShortName} goal:</span>
              {goalOptions.slice(0, 4).map(g => (
                <button
                  key={`${g.type}-${g.domainId ?? 'all'}`}
                  type="button"
                  onClick={() => onStartMission(g)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
                    g.label === suggestedGoal.label
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                      : 'border-theme bg-theme-elevated text-cockpit-muted hover:border-emerald-500/30'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </section>

      {/* Unified Learn · Work · Earn narrative — not tabs */}
      <section className="grid sm:grid-cols-3 gap-3">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          const ringVal = i === 0 ? learnRing : i === 1 ? workRing : earnRing;
          const isPrimary = i === 0 && !missionDoneToday;
          return (
            <Link
              key={p.key}
              to={p.route}
              className={`group rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                isPrimary
                  ? 'border-cyan-500/40 bg-cyan-50/30 dark:bg-cyan-500/5 ring-1 ring-cyan-500/20'
                  : 'border-theme bg-theme-elevated hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest ${p.labelClass}`}>
                  {p.title}
                </span>
                <Icon className={`w-4 h-4 ${p.iconClass} opacity-70 group-hover:opacity-100`} />
              </div>
              <p className="text-sm font-bold text-cockpit">{p.verb}</p>
              <p className="text-[11px] text-theme-muted mt-1.5 leading-relaxed">{p.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-1 flex-1 rounded-full bg-cockpit-track mr-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(ringVal * 100)}%`, backgroundColor: p.barColor }}
                  />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-theme-faint group-hover:text-cockpit shrink-0" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Quick paths — Work & Earn without leaving narrative */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          to="/study?tab=quiz"
          className="flex items-center gap-3 rounded-xl border border-theme bg-theme-elevated p-3 hover:border-emerald-500/30 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Crosshair className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-cockpit">Work · Practice drills</p>
            <p className="text-[10px] text-theme-muted">Domain questions when you need extra reps</p>
          </div>
          <ChevronRight className="w-4 h-4 text-theme-faint group-hover:text-cockpit" />
        </Link>
        <Link
          to="/exam"
          className="flex items-center gap-3 rounded-xl border border-theme bg-theme-elevated p-3 hover:border-amber-500/30 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-cockpit">Earn · Exam simulation</p>
            <p className="text-[10px] text-theme-muted">Timed run · prove readiness under pressure</p>
          </div>
          <ChevronRight className="w-4 h-4 text-theme-faint group-hover:text-cockpit" />
        </Link>
      </div>

      {recentMissions.length > 0 && (
        <div className="rounded-xl border border-theme bg-theme-elevated p-4">
          <p className="text-xs font-semibold text-theme-muted tracking-widest uppercase mb-2">Mission log</p>
          <div className="space-y-2">
            {recentMissions.map(m => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-cockpit truncate mr-2">{m.goalLabel}</span>
                <span className="text-theme-muted shrink-0 tabular-nums">+{m.xpEarned} XP · D{m.domainId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
