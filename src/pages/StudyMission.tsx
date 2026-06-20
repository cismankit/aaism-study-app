import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Crosshair, Loader2, Sparkles, ArrowLeft, Trophy, Calendar,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MissionDashboard from '../components/MissionDashboard';
import { useCert } from '../context/CertContext';
import {
  orchestrateStudyMission,
  getMissionGoalOptions,
  type MissionGoal,
  type AgentHandoff,
  type StudyMissionPlan,
} from '../services/missionOrchestrator';
import { getMissionLog } from '../services/progressService';

type Phase = 'pick-goal' | 'orchestrating' | 'active' | 'complete';

export default function StudyMission() {
  const { activeCert } = useCert();
  const [phase, setPhase] = useState<Phase>('pick-goal');
  const [handoffs, setHandoffs] = useState<AgentHandoff[]>([]);
  const [plan, setPlan] = useState<StudyMissionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const goalOptions = getMissionGoalOptions(activeCert.id);
  const recentMissions = getMissionLog(activeCert.id).slice(-3).reverse();

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

  const handleComplete = (xp: number) => {
    setXpEarned(xp);
    setPhase('complete');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Study Mission"
        subtitle={`Unified learning loop for ${activeCert.shortName} — study, quiz, lab, and intel in one flow`}
        icon={Crosshair}
      />

      {phase === 'pick-goal' && (
        <>
          <div className="rounded-xl border border-theme bg-theme-elevated p-4">
            <p className="text-sm font-semibold text-cockpit mb-1">Pick your mission goal</p>
            <p className="text-xs text-theme-muted mb-4">
              Agent team orchestrates: Hermes assesses weak areas → Claude picks topics + lab → OpenClaw pulls intel.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {goalOptions.map(goal => (
                <button
                  key={`${goal.type}-${goal.domainId ?? 'all'}`}
                  onClick={() => startMission(goal)}
                  className="text-left p-4 rounded-xl border border-theme hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all"
                >
                  <p className="font-medium text-sm text-cockpit">{goal.label}</p>
                  <p className="text-[10px] text-theme-muted mt-1 capitalize">{goal.type.replace('-', ' ')}</p>
                </button>
              ))}
            </div>
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
          <p className="text-sm font-medium text-cockpit">Agents orchestrating your mission…</p>
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

      {phase === 'complete' && plan && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10 p-6 text-center space-y-4">
          <Trophy className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-cockpit">Mission complete!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">+{xpEarned} XP earned</p>
            <p className="text-xs text-theme-muted mt-2">Domain {plan.domainId} progress updated</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-elevated p-3 text-left">
            <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tomorrow&apos;s mission
            </p>
            <p className="text-sm text-cockpit mt-1">{plan.tomorrowSuggestion}</p>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => { setPhase('pick-goal'); setPlan(null); }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> New mission
            </button>
            <Link
              to="/"
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
