import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Crosshair, Loader2, Sparkles, ArrowLeft, Trophy, Calendar, Flame, X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MissionDashboard from '../components/MissionDashboard';
import { useCert } from '../context/CertContext';
import { useGamification } from '../context/GamificationContext';
import {
  orchestrateStudyMission,
  getSuggestedMissionGoal,
  type MissionGoal,
  type AgentHandoff,
  type StudyMissionPlan,
} from '../services/missionOrchestrator';
import { getMissionLog } from '../services/progressService';
import { dismissMissionNudge, hasCompletedMissionToday } from '../services/productTierService';

type Phase = 'pick-goal' | 'orchestrating' | 'active' | 'complete';

interface MissionCompleteSummary {
  xpEarned: number;
  domainGain: number;
  durationMin: number;
}

export default function StudyMission() {
  const { activeCert } = useCert();
  const { state: gameState } = useGamification();
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
  const recentMissions = getMissionLog(activeCert.id).slice(-3).reverse();
  const missionDoneToday = hasCompletedMissionToday(activeCert.id);
  const streakAtRisk = gameState.currentStreak > 0 && !missionDoneToday && phase !== 'complete';

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
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Today's Mission"
        subtitle={`25 minutes on ${activeCert.shortName} — the loop that moves your score`}
        icon={Crosshair}
      />

      {showCommandNudge && phase === 'pick-goal' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-cockpit">Start here — this is the product</p>
            <p className="text-xs text-cockpit-muted mt-0.5">One mission beats browsing twelve tools. ~25 min to a real win.</p>
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

      {streakAtRisk && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-50/40 dark:bg-orange-500/10 px-4 py-3 flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-cockpit">Don&apos;t break your chain</p>
            <p className="text-xs text-cockpit-muted">
              {gameState.currentStreak}-day streak — complete today&apos;s mission to protect it.
            </p>
          </div>
        </div>
      )}

      {phase === 'pick-goal' && (
        <>
          <div className="rounded-xl border border-theme bg-theme-elevated p-4">
            <p className="text-sm font-semibold text-cockpit mb-1">Your next mission</p>
            <p className="text-xs text-theme-muted mb-4">
              Weak domain first — read → quiz → lab → intel. ~25 minutes.
            </p>
            <button
              type="button"
              onClick={() => startMission(suggestedGoal)}
              className="w-full text-left p-4 rounded-xl border border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5 hover:border-emerald-500 transition-all"
            >
              <p className="font-medium text-sm text-cockpit">{suggestedGoal.label}</p>
              <p className="text-[10px] text-theme-muted mt-1 capitalize flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {suggestedGoal.type.replace(/-/g, ' ')} · ~25 min
              </p>
            </button>
            {error && <p className="text-xs text-red-600 dark:text-red-400 mt-3">{error}</p>}
          </div>

          {recentMissions.length > 0 && (
            <div className="rounded-xl border border-theme bg-theme-elevated p-4">
              <p className="text-xs font-semibold text-theme-muted tracking-widest uppercase mb-2">Recent missions</p>
              <div className="space-y-2">
                {recentMissions.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-cockpit">{m.goalLabel}</span>
                    <span className="text-theme-muted">+{m.xpEarned} XP · D{m.domainId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'orchestrating' && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-500/5 p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-sm font-medium text-cockpit">Building your mission…</p>
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            {handoffs.map((h, i) => (
              <span key={h.agent}>
                {i > 0 && ' → '}
                <span className={h.status === 'done' ? 'text-emerald-600' : h.status === 'running' ? 'text-cyan-600' : ''}>
                  {h.agentName}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 'active' && plan && (
        <MissionDashboard plan={plan} handoffs={handoffs} onComplete={handleComplete} />
      )}

      {phase === 'complete' && plan && completeSummary && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10 p-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-cockpit">Mission complete</p>
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400 mt-2">
              Domain +{completeSummary.domainGain}% · {completeSummary.durationMin} min well spent · Tomorrow ready
            </p>
            <p className="text-xs text-theme-muted mt-2">+{completeSummary.xpEarned} XP · D{plan.domainId} updated</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-elevated p-3 text-left">
            <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tomorrow&apos;s mission
            </p>
            <p className="text-sm text-cockpit mt-1">{plan.tomorrowSuggestion}</p>
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
              to="/"
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
