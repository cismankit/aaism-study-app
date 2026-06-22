import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, ChevronRight, RotateCcw,
  Flag, Pause, Play, Clock, BarChart3,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RemediationPanel from '../components/RemediationPanel';
import { usePerformance } from '../components/OSINTLayout';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import {
  getExamSimulation, ExamQuestion, getContentStats,
} from '../data/examContent';
import { useCert } from '../context/CertContext';
import {
  EXAM_MAX_PAUSES,
} from '../constants/examConfig';
import ExamProofRing from '../components/ExamProofRing';
import {
  addExamAttempt, getPassThreshold, getReadinessScore, type DomainBreakdown,
} from '../services/progressService';

interface ShuffledQuestion extends ExamQuestion {
  shuffledOptions: string[];
  shuffledCorrectAnswer: number;
}

type ExamState = 'setup' | 'active' | 'paused' | 'review';

function shuffleOptions(q: ExamQuestion): ShuffledQuestion {
  const indices = q.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOptions = indices.map(i => q.options[i]);
  const shuffledCorrectAnswer = shuffledOptions.indexOf(q.options[q.correctAnswer]);
  return { ...q, shuffledOptions, shuffledCorrectAnswer };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function computeDomainBreakdown(
  questions: ShuffledQuestion[],
  answers: (number | null)[],
): Record<number, DomainBreakdown> {
  const breakdown: Record<number, DomainBreakdown> = {};
  questions.forEach((q, i) => {
    if (!breakdown[q.domain]) breakdown[q.domain] = { correct: 0, total: 0, pct: 0 };
    breakdown[q.domain].total++;
    if (answers[i] === q.shuffledCorrectAnswer) breakdown[q.domain].correct++;
  });
  Object.values(breakdown).forEach(d => {
    d.pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
  });
  return breakdown;
}

const DOMAIN_NAMES: Record<number, string> = {
  1: 'AI Governance',
  2: 'AI Risk Mgmt',
  3: 'AI Tech & Controls',
  4: 'AI Operations',
};

function getDomainLabel(domainId: number, certDomains: Array<{ id: number; shortName: string }>): string {
  const d = certDomains.find(x => x.id === domainId);
  return d?.shortName ?? DOMAIN_NAMES[domainId] ?? `Domain ${domainId}`;
}

export default function Exam() {
  const navigate = useNavigate();
  const { addQuizAttempt } = useApp();
  const { completeQuiz } = useGamification();
  const { setBgColor } = usePerformance();
  const { activeCert } = useCert();

  const examQuestionCount = activeCert.examFormat?.questions ?? 90;
  const examDurationSeconds = (activeCert.examFormat?.minutes ?? 150) * 60;
  const certDomains = activeCert.domains;
  const bankSize = getContentStats(activeCert.id).totalQuestions;
  const deliveredQuestionCount = Math.min(examQuestionCount, bankSize);
  const bankShortfall = bankSize < examQuestionCount;

  const [examState, setExamState] = useState<ExamState>('setup');
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(examDurationSeconds);
  const [pauseCount, setPauseCount] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);
  const [domainBreakdown, setDomainBreakdown] = useState<Record<number, DomainBreakdown>>({});
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const passThreshold = getPassThreshold();
  const readinessPreview = getReadinessScore(activeCert.id);

  useEffect(() => {
    if (examState === 'setup') setBgColor('white');
    else if (examState === 'active') setBgColor('red');
  }, [examState, setBgColor]);

  const finishExam = useCallback((finalAnswers: (number | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = finalAnswers.reduce<number>(
      (c, ans, i) => c + (ans !== null && ans === questions[i].shuffledCorrectAnswer ? 1 : 0),
      0,
    );
    const pct = Math.round((correct / questions.length) * 100);
    const didPass = pct >= passThreshold;
    const used = examDurationSeconds - timeRemaining;
    const breakdown = computeDomainBreakdown(questions, finalAnswers);

    setCorrectCount(correct);
    setScore(pct);
    setPassed(didPass);
    setDomainBreakdown(breakdown);
    setTimeUsed(used);
    setBgColor(didPass ? 'green' : 'red');

    addQuizAttempt({
      date: new Date().toISOString(),
      domain: 'all',
      totalQuestions: questions.length,
      correctAnswers: correct,
      score: pct,
    });
    completeQuiz(pct, questions.length, correct, 'all');

    addExamAttempt({
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: correct,
      score: pct,
      timeUsedSeconds: used,
      passed: didPass,
      passThreshold,
      domainBreakdown: breakdown,
      flaggedCount: flagged.size,
      pausedCount: pauseCount,
    });

    setExamState('review');
  }, [questions, timeRemaining, passThreshold, flagged.size, pauseCount, addQuizAttempt, completeQuiz, setBgColor, examDurationSeconds]);

  useEffect(() => {
    if (examState !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          finishExam(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, answers, finishExam]);

  const startExam = () => {
    const raw = getExamSimulation(examQuestionCount, activeCert.id);
    const shuffled = raw.map(shuffleOptions);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setFlagged(new Set());
    setCurrentQ(0);
    setTimeRemaining(examDurationSeconds);
    setPauseCount(0);
    setExamState('active');
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  };

  const handlePause = () => {
    if (pauseCount >= EXAM_MAX_PAUSES) return;
    setPauseCount(c => c + 1);
    setExamState('paused');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResume = () => setExamState('active');

  const wrongAnswers = examState === 'review'
    ? questions
        .map((q, i) => ({ question: q, userAnswer: answers[i] }))
        .filter(({ question, userAnswer }) => userAnswer !== question.shuffledCorrectAnswer)
    : [];

  // ── SETUP ──
  if (examState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title={`${activeCert.shortName} Timed Exam`}
          subtitle={
            bankShortfall
              ? `${activeCert.vendor} simulation — ${deliveredQuestionCount} of ${examQuestionCount} practice items available · ${activeCert.examFormat?.minutes ?? 150} min timer (official format)`
              : `${activeCert.vendor} simulation — ${examQuestionCount} questions, ${activeCert.examFormat?.minutes ?? 150} minutes, no hints`
          }
          icon={ClipboardList}
          iconClassName="text-red-500"
        />

        <div className="mt-6 bg-theme-elevated rounded-xl p-8 border border-theme text-center">
          <ExamProofRing
            value={passThreshold}
            totalSeconds={examDurationSeconds}
            label="Pass bar"
            sublabel={`${readinessPreview}% readiness`}
            variant="setup"
            className="mx-auto mb-6"
          />

          <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
            <div className="bg-theme-muted dark:bg-gray-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-cockpit">
                {deliveredQuestionCount}
                {bankShortfall && (
                  <span className="text-sm font-normal text-theme-muted">/{examQuestionCount}</span>
                )}
              </div>
              <div className="text-xs text-theme-muted">
                {bankShortfall ? 'Practice items' : 'Questions'}
              </div>
            </div>
            <div className="bg-theme-muted dark:bg-gray-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-cockpit">{activeCert.examFormat?.minutes ?? 150}</div>
              <div className="text-xs text-theme-muted">Minutes</div>
            </div>
            <div className="bg-theme-muted dark:bg-gray-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-cockpit">{passThreshold}%</div>
              <div className="text-xs text-theme-muted">Pass Score</div>
            </div>
          </div>

          {bankShortfall && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-4 max-w-md mx-auto">
              Bank has {bankSize} items — this run delivers {deliveredQuestionCount}. Timer matches the official{' '}
              {activeCert.examFormat?.minutes ?? 150}-minute format, not scaled to item count.
            </p>
          )}

          <ul className="text-left text-sm text-cockpit-muted space-y-2 mb-6 max-w-md mx-auto">
            <li className="flex items-center gap-2"><Flag className="w-4 h-4 text-amber-500" /> Flag questions for review</li>
            <li className="flex items-center gap-2"><Pause className="w-4 h-4 text-blue-500" /> 1 pause allowed ({EXAM_MAX_PAUSES} max)</li>
            <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500" /> Domain breakdown on completion</li>
          </ul>

          <button
            onClick={startExam}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-orange-700 transition-all inline-flex items-center gap-2"
          >
            <ClipboardList size={20} />
            Begin Exam
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── PAUSED ──
  if (examState === 'paused') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Pause className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-cockpit mb-2">Exam Paused</h2>
        <p className="text-sm text-theme-muted mb-6">
          {EXAM_MAX_PAUSES - pauseCount} pause{EXAM_MAX_PAUSES - pauseCount !== 1 ? 's' : ''} remaining · {formatTime(timeRemaining)} left
        </p>
        <button
          onClick={handleResume}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 inline-flex items-center gap-2"
        >
          <Play size={18} /> Resume Exam
        </button>
      </div>
    );
  }

  // ── ACTIVE ──
  if (examState === 'active') {
    const q = questions[currentQ];
    const answered = answers.filter(a => a !== null).length;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm text-cockpit-muted">
              Q{currentQ + 1} / {questions.length} · {answered} answered
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFlag}
                className={`p-1.5 rounded-lg transition-colors ${
                  flagged.has(currentQ)
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-theme-faint hover:bg-cockpit-track'
                }`}
                title="Flag for review"
              >
                <Flag className="w-4 h-4" />
              </button>
              {pauseCount < EXAM_MAX_PAUSES && (
                <button
                  onClick={handlePause}
                  className="p-1.5 rounded-lg text-theme-faint hover:bg-cockpit-track"
                  title="Pause (1 max)"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <ExamProofRing
                value={Math.round((answered / questions.length) * 100)}
                totalSeconds={examDurationSeconds}
                remainingSeconds={timeRemaining}
                variant="active"
                size={56}
              />
              <div className={`px-3 py-1.5 rounded-lg font-mono font-bold text-sm hidden sm:block ${
                timeRemaining < 600
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : timeRemaining < 1800
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-cockpit-track text-cockpit'
              }`}>
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="h-2 bg-cockpit-track rounded-full mb-6">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h3 className="text-lg font-medium text-cockpit mb-4">{q.question}</h3>

          <div className="space-y-2 mb-6">
            {q.shuffledOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  const next = [...answers];
                  next[currentQ] = i;
                  setAnswers(next);
                }}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQ] === i
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-theme hover:border-theme'
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                <span className="text-theme-secondary">{opt}</span>
              </button>
            ))}
          </div>

          {/* Question navigator */}
          <div className="flex flex-wrap gap-1 mb-4 max-h-20 overflow-y-auto">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded text-[10px] font-medium ${
                  i === currentQ
                    ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                    : flagged.has(i)
                      ? 'bg-amber-500 text-white'
                      : answers[i] !== null
                        ? 'bg-green-500 text-white'
                        : 'bg-cockpit-track text-cockpit-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-4 py-2 text-cockpit-muted hover:bg-cockpit-track rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => finishExam(answers)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ──
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-elevated rounded-xl p-8 border border-theme text-center">
        <ExamProofRing
          value={score}
          totalSeconds={examDurationSeconds}
          variant="result"
          passed={passed}
          className="mx-auto mb-4"
        />

        <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 ${
          passed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {passed ? 'PASS' : 'FAIL'} — {score}% (pass = {passThreshold}%)
        </div>

        <h2 className="text-3xl font-bold text-cockpit mb-1">{score}%</h2>
        <p className="text-cockpit-muted mb-1">
          {correctCount} of {questions.length} correct
        </p>
        <p className="text-sm text-theme-muted mb-6 flex items-center justify-center gap-1">
          <Clock className="w-4 h-4" />
          Time used: {formatTime(timeUsed)} / {formatTime(examDurationSeconds)}
        </p>

        {/* Domain breakdown chart */}
        <div className="mb-6 text-left">
          <h3 className="text-sm font-semibold text-cockpit mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Domain Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(domainBreakdown).map(([domainId, data]) => (
              <div key={domainId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cockpit-muted">
                    D{domainId}: {getDomainLabel(Number(domainId), certDomains)}
                  </span>
                  <span className={`font-mono font-bold ${
                    data.pct >= passThreshold ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {data.pct}% ({data.correct}/{data.total})
                  </span>
                </div>
                <div className="h-2 bg-cockpit-track rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.pct >= passThreshold ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setBgColor('white'); setExamState('setup'); }}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 inline-flex items-center gap-2"
          >
            <RotateCcw size={18} /> Try Again
          </button>
          <button
            onClick={() => navigate('/study')}
            className="px-6 py-3 border border-theme text-theme-secondary rounded-xl font-medium hover:bg-theme-muted dark:hover:bg-gray-700"
          >
            Study Ops
          </button>
        </div>
      </div>

      <RemediationPanel wrongAnswers={wrongAnswers} />
    </div>
  );
}
