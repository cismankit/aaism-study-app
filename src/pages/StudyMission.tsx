import { useState, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Crosshair, Loader2, Sparkles, ArrowLeft, Trophy, Calendar, Flame, X,
  Terminal, Bot, ChevronRight,
} from 'lucide-react';
import MissionLanding from '../components/MissionLanding';
import MissionDashboard from '../components/MissionDashboard';
import { useCert } from '../context/CertContext';
import { useGamification } from '../context/GamificationContext';
import { useApp } from '../context/AppContext';
import { getLevelFromXP } from '../data/gamificationData';
import {
  orchestrateStudyMission,
  getSuggestedMissionGoal,
  getMissionGoalOptions,
  type MissionGoal,
  type AgentHandoff,
  type StudyMissionPlan,
} from '../services/missionOrchestrator';
import {
  getMissionLog,
  getDomainProgress,
  getReadinessScore,
  getTodayActivityCounts,
  loadProgress,
} from '../services/progressService';
import {
  getDailyLoopSteps,
  getFocusContext,
  hasMissionCompletedToday,
} from '../services/sidebarJourneyService';
import AgentCouncilStrip from '../components/AgentCouncilStrip';
import { dismissMissionNudge } from '../services/productTierService';

type Phase = 'pick-goal' | 'orchestrating' | 'active' | 'complete';

interface MissionCompleteSummary {
  xpEarned: number;
  domainGain: number;
  durationMin: number;
}

function buildStreakWeek(certId: string): boolean[] {
  const today = new Date();
  const slice = loadProgress().byCert[certId];
  const activeDates = new Set<string>();

  (slice?.missionLog ?? []).forEach(m => activeDates.add(m.completedAt.slice(0, 10)));
  (slice?.quizHistory ?? []).forEach(q => activeDates.add(q.date.slice(0, 10)));

  const week: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    week.push(activeDates.has(d.toISOString().slice(0, 10)));
  }
  return week;
}

export default function StudyMission() {
  const { activeCert } = useCert();
  const { state: gameState } = useGamification();
  const { state: appState } = useApp();
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>('pick-goal');
  const [handoffs, setHandoffs] = useState<AgentHandoff[]>([]);
  const [plan, setPlan] = useState<StudyMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completeSummary, setCompleteSummary] = useState<MissionCompleteSummary | null>(null);
  const [showCommandNudge, setShowCommandNudge] = useState(
    () => (location.state as { fromCommand?: boolean } | null)?.fromCommand === true,
  );
  const abortRef = useRef<AbortController | null>(null);

  const suggestedGoal = getSuggestedMissionGoal(activeCert.id);
  const goalOptions = useMemo(() => getMissionGoalOptions(activeCert.id), [activeCert.id, appState.quizAttempts]);
  const recentMissions = getMissionLog(activeCert.id).slice(-3).reverse();
  const missionDoneToday = hasMissionCompletedToday(activeCert.id);
  const streakAtRisk = gameState.currentStreak > 0 && !missionDoneToday && phase !== 'complete';

  const readiness = useMemo(() => getReadinessScore(activeCert.id), [activeCert.id, appState.quizAttempts, gameState.domainScores]);
  const focusContext = useMemo(() => getFocusContext(activeCert.id), [activeCert.id, appState.quizAttempts]);
  const dailyLoopSteps = useMemo(() => getDailyLoopSteps(activeCert.id), [activeCert.id, appState.quizAttempts]);
  const currentLevel = getLevelFromXP(gameState.xp);

  const orbDomains = useMemo(() => {
    const progress = getDomainProgress(activeCert.id);
    const focusId = focusContext.domainId;
    return activeCert.domains.map(d => {
      const p = progress.find(x => x.domainId === d.id);
      return {
        id: d.id,
        shortName: d.shortName,
        avg: p?.avg ?? 0,
        isFocus: d.id === focusId,
      };
    });
  }, [activeCert, focusContext.domainId, appState.quizAttempts]);

  const todayActivity = useMemo(() => getTodayActivityCounts(activeCert.id), [activeCert.id, appState.quizAttempts]);
  const learnRing = missionDoneToday ? 1 : todayActivity.missions > 0 ? 0.5 : 0.15;
  const workRing = Math.min(1, (todayActivity.quizzes + (missionDoneToday ? 1 : 0)) / 3);
  const earnRing = Math.min(1, readiness / 100);

  const streakWeek = useMemo(() => buildStreakWeek(activeCert.id), [activeCert.id, appState.quizAttempts]);

  const startMission = async (goal: MissionGoal) => {
    setError(null);
    setPhase('orchestrating');
    abortRef.current = new AbortController();

    try {
      await orchestrateStudyMission(
        goal,
        {
          onHandoffUpdate: setHandoffs,
          onPlanReady: p => {
            setPlan(p);
            setPhase('active');
          },
          onError: msg => setError(msg),
        },
        abortRef.current.signal,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mission failed');
      setPhase('pick-goal');
    }
  };

  const handleComplete = (summary: MissionCompleteSummary) => {
    setCompleteSummary(summary);
    setPhase('complete');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {showCommandNudge && phase === 'pick-goal' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cockpit">Welcome back from Command</p>
            <p className="text-xs text-cockpit-muted mt-0.5">Mission is home — one loop beats browsing twelve tools.</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowCommandNudge(false); dismissMissionNudge(); }}
            className="p-1 text-theme-faint hover:text-cockpit"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {streakAtRisk && phase === 'pick-goal' && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-50/40 dark:bg-orange-500/10 px-4 py-3 flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-cockpit">Don&apos;t break your chain</p>
            <p className="text-xs text-cockpit-muted">
              {gameState.currentStreak}-day streak — complete today&apos;s Learn loop to protect it.
            </p>
          </div>
        </div>
      )}

      {phase === 'pick-goal' && (
        <MissionLanding
          certId={activeCert.id}
          certShortName={activeCert.shortName}
          readiness={readiness}
          streak={gameState.currentStreak}
          levelTitle={currentLevel.title}
          domains={orbDomains}
          focusLabel={focusContext.focusLabel}
          dailyLoopSteps={dailyLoopSteps}
          learnRing={learnRing}
          workRing={workRing}
          earnRing={earnRing}
          streakWeek={streakWeek}
          missionDoneToday={missionDoneToday}
          suggestedGoal={suggestedGoal}
          goalOptions={goalOptions}
          recentMissions={recentMissions}
          onStartMission={startMission}
          error={error}
        />
      )}

      {phase === 'orchestrating' && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-500/5 p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className="text-sm font-medium text-cockpit">Building your mission…</p>
          </div>
          <AgentCouncilStrip handoffs={handoffs} variant="orchestration" />
        </div>
      )}

      {phase === 'active' && plan && (
        <MissionDashboard plan={plan} handoffs={handoffs} onComplete={handleComplete} />
      )}

      {phase === 'complete' && plan && completeSummary && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10 p-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-cockpit">Mission complete — Learn loop done</p>
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400 mt-2">
              Domain +{completeSummary.domainGain}% · {completeSummary.durationMin} min well spent
            </p>
            <p className="text-xs text-theme-muted mt-2">+{completeSummary.xpEarned} XP · D{plan.domainId} updated</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-elevated p-3 text-left">
            <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tomorrow&apos;s Learn mission
            </p>
            <p className="text-sm text-cockpit mt-1">{plan.tomorrowSuggestion}</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-elevated p-3 text-left space-y-2">
            <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase">
              Work the domain · D{plan.domainId}
            </p>
            <div className="grid sm:grid-cols-3 gap-2">
              <Link
                to="/study?tab=quiz"
                state={{ weakDomain: plan.domainId }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-theme hover:border-emerald-500/40 text-xs font-medium text-cockpit"
              >
                <span className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-500" />
                  Work · Practice drill
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-faint" />
              </Link>
              <Link
                to={plan.lab ? `/ops?lab=${plan.lab.id}` : `/ops?domain=${plan.domainId}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-theme hover:border-emerald-500/40 text-xs font-medium text-cockpit"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                  Ops Lab
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-faint" />
              </Link>
              <Link
                to="/exam"
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-theme hover:border-amber-500/40 text-xs font-medium text-cockpit"
              >
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-violet-500" />
                  Earn · Exam sim
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-faint" />
              </Link>
            </div>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => { setPhase('pick-goal'); setPlan(null); setCompleteSummary(null); }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> New mission
            </button>
            <Link
              to="/command"
              onClick={() => dismissMissionNudge()}
              className="px-4 py-2 rounded-lg border border-theme text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Command Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
