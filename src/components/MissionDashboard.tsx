import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Target, Terminal, Radar,
  ChevronDown, ChevronUp, Loader2, Sparkles,
  ExternalLink, ShieldCheck, TrendingUp, Briefcase, Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { useCert } from '../context/CertContext';
import { addMissionLogEntry } from '../services/progressService';
import { markStepComplete } from '../services/labService';
import type { StudyMissionPlan, AgentHandoff } from '../services/missionOrchestrator';
import type { ExamQuestion } from '../data/examContent';
import {
  resolveQuestionProvenance,
  formatExplanationCitation,
} from '../utils/quizProvenance';
import AgentCouncilStrip from './AgentCouncilStrip';
import { getAgentForMissionTask } from '../data/learnWorkEarnAgents';

interface MissionDashboardProps {
  plan: StudyMissionPlan;
  handoffs: AgentHandoff[];
  onComplete: (summary: { xpEarned: number; domainGain: number; durationMin: number }) => void;
}

type TaskId = 'read' | 'quiz' | 'lab' | 'intel';
const TASK_ORDER: TaskId[] = ['read', 'quiz', 'lab', 'intel'];

const TASK_META: Record<TaskId, { icon: typeof BookOpen; title: string; action: string }> = {
  read: { icon: BookOpen, title: 'Read topics', action: 'Finish reading' },
  quiz: { icon: Target, title: '5-question micro-quiz', action: 'Continue to lab' },
  lab: { icon: Terminal, title: 'Ops Lab step', action: 'Continue to intel' },
  intel: { icon: Radar, title: 'Intel brief', action: 'Complete mission' },
};

function shuffleOptions(q: ExamQuestion) {
  const correctOption = q.options[q.correctAnswer];
  const indices = q.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOptions = indices.map(i => q.options[i]);
  const shuffledCorrectAnswer = shuffledOptions.indexOf(correctOption);
  return { ...q, shuffledOptions, shuffledCorrectAnswer };
}

function ConfidenceBadge({ score, isLive }: { score: number; isLive: boolean }) {
  const color =
    score >= 70
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : score >= 40
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
      <ShieldCheck className="w-3 h-3" />
      {score}% · {isLive ? 'live RSS' : 'cached'}
    </span>
  );
}

function SourceBadge({ source }: { source: 'bank' | 'llm' }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
      source === 'bank'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    }`}>
      {source === 'bank' ? 'Question bank' : 'LLM-generated'}
    </span>
  );
}

export default function MissionDashboard({ plan, handoffs, onComplete }: MissionDashboardProps) {
  const { activeCert } = useCert();
  const { addQuizAttempt } = useApp();
  const { completeQuiz, addXP } = useGamification();
  const [completed, setCompleted] = useState<Set<TaskId>>(new Set());
  const [expandedTopic, setExpandedTopic] = useState<string | null>(plan.topics[0]?.id ?? null);
  const [readTopicsViewed, setReadTopicsViewed] = useState<Set<string>>(new Set());
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizShowExplanation, setQuizShowExplanation] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [labStepDone, setLabStepDone] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const currentTask = TASK_ORDER.find(t => !completed.has(t)) ?? null;
  const allDone = completed.size >= TASK_ORDER.length;

  const shuffledQuestions = useMemo(
    () => plan.quizQuestions.map(shuffleOptions),
    [plan.quizQuestions],
  );

  const completeTask = (id: TaskId) => {
    setCompleted(prev => new Set(prev).add(id));
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizAnswers(new Array(shuffledQuestions.length).fill(null));
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizShowExplanation(false);
    setQuizDone(false);
  };

  const submitQuizAnswer = () => {
    if (quizSelected === null) return;
    const nextAnswers = [...quizAnswers];
    nextAnswers[quizIndex] = quizSelected;
    setQuizAnswers(nextAnswers);
    setQuizShowExplanation(true);
  };

  const advanceQuiz = () => {
    setQuizSelected(null);
    setQuizShowExplanation(false);

    if (quizIndex + 1 >= shuffledQuestions.length) {
      const correct = quizAnswers.reduce<number>(
        (c, ans, i) => c + (ans === shuffledQuestions[i].shuffledCorrectAnswer ? 1 : 0),
        0,
      );
      const pct = Math.round((correct / shuffledQuestions.length) * 100);
      setQuizScore(pct);
      setQuizDone(true);
      addQuizAttempt({
        date: new Date().toISOString(),
        domain: plan.domainId,
        totalQuestions: shuffledQuestions.length,
        correctAnswers: correct,
        score: pct,
      });
      completeQuiz(pct, shuffledQuestions.length, correct, plan.domainId);
      completeTask('quiz');
    } else {
      setQuizIndex(quizIndex + 1);
    }
  };

  const markLabStep = () => {
    if (plan.lab) {
      const firstStep = plan.lab.steps?.[0];
      if (firstStep) markStepComplete(plan.lab.id, firstStep.id);
    }
    setLabStepDone(true);
    completeTask('lab');
  };

  const finishMission = useCallback(() => {
    if (finishing) return;
    setFinishing(true);
    const xpEarned = 75 + (quizScore >= 80 ? 25 : 0);
    addXP(xpEarned, 'Study mission complete');
    addMissionLogEntry({
      completedAt: new Date().toISOString(),
      goalType: plan.goal.type,
      goalLabel: plan.goal.label,
      domainId: plan.domainId,
      xpEarned,
      quizScore,
      tasksCompleted: Array.from(completed),
      tomorrowSuggestion: plan.tomorrowSuggestion,
    });
    const domainGain = Math.max(2, Math.round(quizScore / 25));
    onComplete({ xpEarned, domainGain, durationMin: 25 });
  }, [finishing, quizScore, addXP, plan, completed, onComplete]);

  const canFinishReading = readTopicsViewed.size >= plan.topics.length;
  const activeQuizQ = shuffledQuestions[quizIndex];
  const activeProvenance = activeQuizQ
    ? resolveQuestionProvenance(activeQuizQ, activeCert.id)
    : null;

  const renderNextAction = () => {
    if (!currentTask) return null;
    const meta = TASK_META[currentTask];

    if (currentTask === 'read') {
      return (
        <button
          onClick={() => completeTask('read')}
          disabled={!canFinishReading}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {meta.action} ({readTopicsViewed.size}/{plan.topics.length} topics opened)
        </button>
      );
    }

    if (currentTask === 'quiz') {
      if (!quizStarted) {
        return (
          <button
            onClick={startQuiz}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            Start quiz ({shuffledQuestions.length} questions)
          </button>
        );
      }
      if (quizDone) return null;
      if (!quizShowExplanation) {
        return (
          <button
            onClick={submitQuizAnswer}
            disabled={quizSelected === null}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            Submit answer
          </button>
        );
      }
      return (
        <button
          onClick={advanceQuiz}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
        >
          {quizIndex + 1 >= shuffledQuestions.length ? meta.action : 'Next question'}
        </button>
      );
    }

    if (currentTask === 'lab') {
      if (!plan.lab) {
        return (
          <button
            onClick={() => completeTask('lab')}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            Skip — no lab for this domain
          </button>
        );
      }
      return (
        <div className="flex gap-2">
          <Link
            to={`/ops?lab=${plan.lab.id}`}
            className="flex-1 text-center px-4 py-3 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          >
            Open full lab →
          </Link>
          <button
            onClick={markLabStep}
            disabled={labStepDone}
            className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {labStepDone ? 'Step recorded' : 'Mark step complete'}
          </button>
        </div>
      );
    }

    if (currentTask === 'intel') {
      return (
        <button
          onClick={() => {
            completeTask('intel');
            finishMission();
          }}
          disabled={finishing}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {meta.action}
        </button>
      );
    }

    return null;
  };

  const renderCurrentTaskBody = () => {
    if (!currentTask) return null;

    if (currentTask === 'read') {
      return (
        <div className="space-y-2">
          {plan.topics.map(topic => (
            <div key={topic.id} className="rounded-lg border border-theme overflow-hidden">
              <button
                onClick={() => {
                  setExpandedTopic(expandedTopic === topic.id ? null : topic.id);
                  setReadTopicsViewed(prev => new Set(prev).add(topic.id));
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cockpit-track transition-colors"
              >
                <span className="text-sm font-medium text-cockpit">{topic.title}</span>
                {expandedTopic === topic.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedTopic === topic.id && (
                <div className="px-3 pb-3 text-xs text-theme-muted space-y-2 border-t border-theme pt-2">
                  <p>{topic.description}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {topic.keyPoints.slice(0, 4).map(kp => (
                      <li key={kp}>{kp}</li>
                    ))}
                  </ul>
                  <Link to={`/knowledge?domain=${topic.domain}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    Open in Knowledge Base →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (currentTask === 'quiz') {
      if (!quizStarted) {
        return <p className="text-xs text-theme-muted">Bank-sourced questions from Domain {plan.domainId}.</p>;
      }
      if (quizDone) {
        return (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Score: {quizScore}% — quiz complete
          </p>
        );
      }
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-theme-muted">
              Question {quizIndex + 1} of {shuffledQuestions.length}
            </p>
            {activeProvenance && <SourceBadge source={activeProvenance.source} />}
          </div>
          <p className="text-sm font-medium text-cockpit">{activeQuizQ.question}</p>
          <div className="space-y-1.5">
            {activeQuizQ.shuffledOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => !quizShowExplanation && setQuizSelected(i)}
                disabled={quizShowExplanation}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  quizShowExplanation && i === activeQuizQ.shuffledCorrectAnswer
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : quizShowExplanation && i === quizSelected && i !== activeQuizQ.shuffledCorrectAnswer
                      ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                      : quizSelected === i
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-theme hover:border-emerald-500/40'
                }`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          {quizShowExplanation && activeProvenance && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-3 text-xs space-y-1">
              <p className="font-medium text-cockpit">Explanation</p>
              <p className="text-theme-muted">{activeQuizQ.explanation}</p>
              <p className="text-[10px] text-theme-faint pt-1 border-t border-theme">
                {formatExplanationCitation(activeProvenance)}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentTask === 'lab') {
      if (!plan.lab) {
        return <p className="text-xs text-theme-muted">No lab available for this domain.</p>;
      }
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-cockpit">{plan.lab.title}</p>
          <p className="text-xs text-theme-muted">{plan.lab.description}</p>
          {plan.lab.steps?.[0] && (
            <div className="rounded-lg bg-cockpit-track p-3 text-xs space-y-1">
              <p className="font-medium text-cockpit">{plan.lab.steps[0].title}</p>
              <p className="text-theme-muted">{plan.lab.steps[0].instruction}</p>
              {plan.lab.steps[0].command && (
                <code className="block mt-1 px-2 py-1 rounded bg-gray-900 text-emerald-400 font-mono text-[10px]">
                  {plan.lab.steps[0].command}
                </code>
              )}
            </div>
          )}
        </div>
      );
    }

    if (currentTask === 'intel') {
      return (
        <div className="space-y-2">
          {plan.communityHeat.length > 0 && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-50/30 dark:bg-orange-500/10 p-2.5 space-y-1">
              <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Connect · Community exam heat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {plan.communityHeat.map(h => (
                  <span key={h.topic} className="text-[10px] px-1.5 py-0.5 rounded bg-theme-elevated border border-theme">
                    {h.topic} · {h.heat}%{h.trend ? ` · ${h.trend}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {plan.intelHeadlines.length === 0 ? (
            <p className="text-xs text-theme-muted">
              No live RSS headlines available — check Intel Hub or try again later.
            </p>
          ) : (
            plan.intelHeadlines.map((h, i) => (
              <div key={i} className="rounded-lg border border-theme p-2.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-cockpit flex-1">{h.title}</p>
                  <ConfidenceBadge score={h.confidence} isLive={h.isLive} />
                </div>
                <p className="text-[11px] text-theme-muted">{h.summary}</p>
                {h.link && (
                  <a
                    href={h.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {h.source ?? 'Source'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {h.sourceUrl && h.sourceUrl.startsWith('http') && (
                  <p className="text-[10px] text-theme-faint">
                    Feed:{' '}
                    <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {h.sourceUrl}
                    </a>
                  </p>
                )}
              </div>
            ))
          )}
          {plan.intelBrief && (
            <p className="text-xs text-theme-secondary leading-relaxed border-t border-theme pt-2">
              {plan.intelBrief}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  const currentMeta = currentTask ? TASK_META[currentTask] : null;
  const CurrentIcon = currentMeta?.icon ?? BookOpen;
  const activePillar = currentTask ? getAgentForMissionTask(currentTask).id : null;

  return (
    <div className="space-y-4">
      <AgentCouncilStrip handoffs={handoffs} activePillar={activePillar} variant="active" />

      {/* Invest brief from Strategist */}
      {plan.investBrief && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-50/30 dark:bg-violet-500/10 p-3">
          <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 tracking-widest uppercase flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" /> Invest · Domain ROI
            {plan.domainWeight && <span className="text-theme-muted normal-case">· {plan.domainWeight} exam weight</span>}
          </p>
          <p className="text-xs text-cockpit leading-relaxed">{plan.investBrief}</p>
        </div>
      )}

      {/* Header + progress */}
      <div>
        <h2 className="text-lg font-bold text-cockpit">{plan.goal.label}</h2>
        <p className="text-xs text-theme-muted">
          D{plan.domainId} · {plan.domainName} · {completed.size}/{TASK_ORDER.length} tasks
        </p>
        <div className="flex gap-1 mt-2">
          {TASK_ORDER.map(t => (
            <div
              key={t}
              className={`h-1 flex-1 rounded-full ${
                completed.has(t) ? 'bg-emerald-500' : currentTask === t ? 'bg-cyan-500' : 'bg-cockpit-track'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current task only — one next action */}
      {currentTask && currentMeta && (
        <div className="rounded-xl border border-theme bg-theme-elevated p-4">
          <div className="flex items-center gap-3 mb-3">
            <CurrentIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-sm text-cockpit">{currentMeta.title}</span>
          </div>
          {renderCurrentTaskBody()}
          <div className="mt-4">{renderNextAction()}</div>
        </div>
      )}

      {allDone && !finishing && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Mission ready to complete</p>
          <p className="text-xs text-theme-muted">{plan.tomorrowSuggestion}</p>
          {plan.earnAction && (
            <div className="rounded-lg border border-emerald-500/20 bg-theme-elevated p-3">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                <Briefcase className="w-3 h-3" /> Earn · Next career action
              </p>
              <p className="text-xs text-cockpit">{plan.earnAction}</p>
              <Link to="/career" className="inline-flex text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline mt-1">
                Open Career Intel →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
