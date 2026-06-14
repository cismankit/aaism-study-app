import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, XCircle, Target, BookOpen, ChevronRight } from 'lucide-react';
import { ExamQuestion, getQuestionsByDomain } from '../data/examContent';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import RemediationPanel from './RemediationPanel';

const MICRO_QUIZ_COUNT = 3;
const WEAK_THRESHOLD = 60;

interface ShuffledQuestion extends ExamQuestion {
  shuffledOptions: string[];
  shuffledCorrectAnswer: number;
}

interface DomainMicroQuizModalProps {
  open: boolean;
  domainId: number | null;
  domainName: string;
  onClose: () => void;
}

function shuffleAnswerOptions(q: ExamQuestion): ShuffledQuestion {
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

type Phase = 'active' | 'review';

export default function DomainMicroQuizModal({
  open,
  domainId,
  domainName,
  onClose,
}: DomainMicroQuizModalProps) {
  const { addQuizAttempt } = useApp();
  const { completeQuiz } = useGamification();
  const [phase, setPhase] = useState<Phase>('active');
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const initQuiz = useCallback(() => {
    if (!domainId) return;
    const pool = getQuestionsByDomain(domainId);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(MICRO_QUIZ_COUNT, shuffled.length)).map(shuffleAnswerOptions);
    setQuestions(picked);
    setAnswers(new Array(picked.length).fill(null));
    setCurrentQ(0);
    setSelected(null);
    setShowExp(false);
    setPhase('active');
    setScore(0);
    setEarnedXP(0);
  }, [domainId]);

  useEffect(() => {
    if (open && domainId) initQuiz();
  }, [open, domainId, initQuiz]);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const wrongAnswers = useMemo(() => {
    if (phase !== 'review') return [];
    return questions
      .map((q, i) => ({
        question: q,
        userAnswer: answers[i],
        shuffledCorrectAnswer: q.shuffledCorrectAnswer,
      }))
      .filter(w => w.userAnswer !== w.shuffledCorrectAnswer);
  }, [phase, questions, answers]);

  const finishQuiz = (finalAnswers: (number | null)[]) => {
    const correct = finalAnswers.reduce<number>(
      (count, ans, i) => count + (ans === questions[i].shuffledCorrectAnswer ? 1 : 0),
      0,
    );
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);

    if (domainId) {
      addQuizAttempt({
        date: new Date().toISOString(),
        domain: domainId,
        totalQuestions: questions.length,
        correctAnswers: correct,
        score: pct,
      });
      const xp = completeQuiz(pct, questions.length, correct, domainId);
      setEarnedXP(xp);
    }
    setPhase('review');
  };

  const submit = () => {
    if (selected === null) return;
    const newAns = [...answers];
    newAns[currentQ] = selected;
    setAnswers(newAns);
    setShowExp(true);
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowExp(false);
    } else {
      finishQuiz(answers);
    }
  };

  if (!open || !domainId) return null;

  const current = questions[currentQ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="micro-quiz-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-theme-elevated rounded-2xl shadow-2xl border border-theme flex flex-col animate-fade-in"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-5 h-5 text-accent-emerald flex-shrink-0" />
            <div className="min-w-0">
              <h2 id="micro-quiz-title" className="font-semibold text-cockpit truncate">
                Domain {domainId} Micro-Drill
              </h2>
              <p className="text-xs text-cockpit-muted truncate">{domainName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cockpit-subtle hover:text-cockpit hover:bg-cockpit-track transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase === 'active' && current && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-cockpit-muted font-mono">
              <span>Q{currentQ + 1} / {questions.length}</span>
              <span className="text-amber-600 dark:text-amber-400">Weak domain drill (&lt;{WEAK_THRESHOLD}%)</span>
            </div>

            <p className="text-sm font-medium text-cockpit leading-relaxed">{current.question}</p>

            <div className="space-y-2">
              {current.shuffledOptions.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = showExp && i === current.shuffledCorrectAnswer;
                const isWrong = showExp && isSelected && i !== current.shuffledCorrectAnswer;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={showExp}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-cockpit'
                        : isWrong
                          ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-cockpit'
                          : isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-cockpit'
                            : 'border-theme hover:border-emerald-400/50 text-cockpit-muted'
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      {showExp && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                      {showExp && isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {showExp && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
                <p className="text-xs text-cockpit-muted">{current.explanation}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!showExp ? (
                <button
                  onClick={submit}
                  disabled={selected === null}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={next}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                >
                  {currentQ < questions.length - 1 ? 'Next' : 'See Results'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className="p-5 space-y-4">
            <div className="text-center py-4">
              <div className={`text-4xl font-bold tabular-nums ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {score}%
              </div>
              <p className="text-sm text-cockpit-muted mt-1">
                {score >= 80 ? 'Strong — keep momentum!' : score >= 60 ? 'Improving — review missed concepts.' : 'Needs work — use remediation below.'}
              </p>
              {earnedXP > 0 && (
                <p className="text-xs text-accent-emerald mt-1">+{earnedXP} XP earned</p>
              )}
            </div>

            {wrongAnswers.length > 0 && (
              <RemediationPanel wrongAnswers={wrongAnswers} compact />
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/knowledge?domain=${domainId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Study Domain {domainId}
              </Link>
              <button
                onClick={initQuiz}
                className="px-4 py-2 rounded-lg border border-theme text-cockpit-muted text-sm font-medium hover:bg-cockpit-track transition-colors"
              >
                Retry drill
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors ml-auto"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { WEAK_THRESHOLD, MICRO_QUIZ_COUNT };
