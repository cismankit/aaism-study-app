import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, BookOpen, Target, Terminal, Radar,
  ChevronDown, ChevronUp, Loader2, Sparkles, ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { getOpsAgent } from '../services/opsAgentService';
import { addMissionLogEntry } from '../services/progressService';
import { markStepComplete } from '../services/labService';
import type { StudyMissionPlan, AgentHandoff } from '../services/missionOrchestrator';
import type { ExamQuestion } from '../data/examContent';

interface MissionDashboardProps {
  plan: StudyMissionPlan;
  handoffs: AgentHandoff[];
  onComplete: (xpEarned: number) => void;
}

type TaskId = 'read' | 'quiz' | 'lab' | 'intel';

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

export default function MissionDashboard({ plan, handoffs, onComplete }: MissionDashboardProps) {
  const { addQuizAttempt } = useApp();
  const { completeQuiz, addXP } = useGamification();
  const [completed, setCompleted] = useState<Set<TaskId>>(new Set());
  const [expandedTopic, setExpandedTopic] = useState<string | null>(plan.topics[0]?.id ?? null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const shuffledQuestions = useMemo(
    () => plan.quizQuestions.map(shuffleOptions),
    [plan.quizQuestions],
  );

  const toggleTask = (id: TaskId) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizAnswers(new Array(shuffledQuestions.length).fill(null));
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizDone(false);
  };

  const submitQuizAnswer = () => {
    if (quizSelected === null) return;
    const nextAnswers = [...quizAnswers];
    nextAnswers[quizIndex] = quizSelected;
    setQuizAnswers(nextAnswers);
    setQuizSelected(null);

    if (quizIndex + 1 >= shuffledQuestions.length) {
      const correct = nextAnswers.reduce<number>(
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
      setCompleted(prev => new Set(prev).add('quiz'));
    } else {
      setQuizIndex(quizIndex + 1);
    }
  };

  const markLabStep = () => {
    if (plan.lab) {
      const firstStep = plan.lab.steps?.[0];
      if (firstStep) markStepComplete(plan.lab.id, firstStep.id);
    }
    setCompleted(prev => new Set(prev).add('lab'));
  };

  const allDone = completed.size >= 4;

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
    onComplete(xpEarned);
  }, [finishing, quizScore, addXP, plan, completed, onComplete]);

  return (
    <div className="space-y-4">
      {/* Agent handoff pipeline */}
      <div className="rounded-xl border border-theme bg-theme-elevated p-4">
        <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase mb-3">
          Agent pipeline
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {handoffs.map((h, i) => {
            const agent = getOpsAgent(h.agent);
            return (
              <div key={`${h.agent}-${h.phase}`} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-3 h-3 text-theme-faint" />}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                    h.status === 'done'
                      ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10'
                      : h.status === 'running'
                        ? 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-500/10 animate-pulse'
                        : 'border-theme bg-cockpit-track'
                  }`}
                >
                  <span className={`font-semibold ${agent.accent}`}>{h.agentName}</span>
                  {h.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {h.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 space-y-1">
          {handoffs.filter(h => h.status === 'done').map(h => (
            <p key={`${h.agent}-msg`} className="text-[11px] text-theme-muted">
              <span className={`font-medium ${getOpsAgent(h.agent).accent}`}>{h.agentName}:</span>{' '}
              {h.message.slice(0, 160)}{h.message.length > 160 ? '…' : ''}
            </p>
          ))}
        </div>
      </div>

      {/* Checklist header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-cockpit">{plan.goal.label}</h2>
          <p className="text-xs text-theme-muted">
            D{plan.domainId} · {plan.domainName} · {completed.size}/4 tasks
          </p>
        </div>
        {allDone && (
          <button
            onClick={finishMission}
            disabled={finishing}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2"
          >
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Complete mission
          </button>
        )}
      </div>

      {/* Task cards — single page, no tabs */}
      <div className="space-y-3">
        {/* Read topics */}
        <TaskCard
          done={completed.has('read')}
          icon={BookOpen}
          title="Read topics"
          onToggle={() => toggleTask('read')}
        >
          <div className="space-y-2">
            {plan.topics.map(topic => (
              <div key={topic.id} className="rounded-lg border border-theme overflow-hidden">
                <button
                  onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
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
            <button
              onClick={() => setCompleted(prev => new Set(prev).add('read'))}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Mark reading complete
            </button>
          </div>
        </TaskCard>

        {/* Quiz */}
        <TaskCard
          done={completed.has('quiz')}
          icon={Target}
          title="5-question micro-quiz"
          onToggle={() => toggleTask('quiz')}
        >
          {!quizStarted ? (
            <button
              onClick={startQuiz}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium"
            >
              Start quiz ({shuffledQuestions.length} questions)
            </button>
          ) : quizDone ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Score: {quizScore}% — quiz complete
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-theme-muted">
                Question {quizIndex + 1} of {shuffledQuestions.length}
              </p>
              <p className="text-sm font-medium text-cockpit">{shuffledQuestions[quizIndex].question}</p>
              <div className="space-y-1.5">
                {shuffledQuestions[quizIndex].shuffledOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setQuizSelected(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      quizSelected === i
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-theme hover:border-emerald-500/40'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={submitQuizAnswer}
                disabled={quizSelected === null}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs disabled:opacity-50"
              >
                Submit answer
              </button>
            </div>
          )}
        </TaskCard>

        {/* Lab */}
        <TaskCard
          done={completed.has('lab')}
          icon={Terminal}
          title="Ops Lab step"
          onToggle={() => toggleTask('lab')}
        >
          {plan.lab ? (
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
              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/ops?lab=${plan.lab.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                >
                  Open full lab →
                </Link>
                <button
                  onClick={markLabStep}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
                >
                  Mark step complete
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-theme-muted">No lab available for this domain — mark complete to continue.</p>
          )}
        </TaskCard>

        {/* Intel */}
        <TaskCard
          done={completed.has('intel')}
          icon={Radar}
          title="Intel brief"
          onToggle={() => toggleTask('intel')}
        >
          <div className="space-y-2">
            {plan.intelHeadlines.map((h, i) => (
              <div key={i} className="rounded-lg border border-theme p-2.5">
                <p className="text-xs font-semibold text-cockpit">{h.title}</p>
                <p className="text-[11px] text-theme-muted mt-0.5">{h.summary}</p>
                {h.source && <p className="text-[10px] text-theme-faint mt-1">Source: {h.source}</p>}
              </div>
            ))}
            <p className="text-xs text-theme-secondary leading-relaxed border-t border-theme pt-2">
              {plan.intelBrief}
            </p>
            <button
              onClick={() => setCompleted(prev => new Set(prev).add('intel'))}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Mark intel review complete
            </button>
          </div>
        </TaskCard>
      </div>

      {allDone && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Mission ready to complete</p>
          <p className="text-xs text-theme-muted mt-1">{plan.tomorrowSuggestion}</p>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  done,
  icon: Icon,
  title,
  children,
  onToggle,
}: {
  done: boolean;
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${done ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-theme bg-theme-elevated'}`}>
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onToggle} className="flex-shrink-0" aria-label={done ? 'Mark incomplete' : 'Mark complete'}>
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Circle className="w-5 h-5 text-theme-muted" />
          )}
        </button>
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="font-semibold text-sm text-cockpit">{title}</span>
      </div>
      {children}
    </div>
  );
}
