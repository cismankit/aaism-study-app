import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { useCert } from '../context/CertContext';
import { usePerformance } from '../components/OSINTLayout';
import { getAllQuestions, getQuestionsByDomain, getContentStats, ExamQuestion } from '../data/examContent';
import { getPassThreshold } from '../services/progressService';
import {
  resolveQuestionProvenance,
  formatExplanationCitation,
} from '../utils/quizProvenance';
import { 
  loadFlashcards,
  addFlashcard,
  deleteFlashcard,
  getDueCards,
  processReview,
  getFlashcardStats
} from '../services/flashcardStore';
import { Flashcard } from '../types';
import { 
  Target, 
  FileText, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Zap,
  Layers,
  Plus,
  Trash2,
  RotateCw,
  Brain,
  Lightbulb,
  Edit2,
  Save,
  X,
  Search,
  Bot,
  MessageSquare,
  ClipboardList,
  Merge
} from 'lucide-react';
import DomainProgressStrip from '../components/DomainProgressStrip';
import Tutor from './Tutor';
import RemediationPanel from '../components/RemediationPanel';

type Tab = 'tutor' | 'notes' | 'flashcards' | 'quiz' | 'exam';
type QuizState = 'setup' | 'active' | 'review';
type QuizMode = 'practice' | 'exam';

export default function Study() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('tutor');
  const { setBgColor } = usePerformance();
  const { activeCert } = useCert();
  const [quizBootstrap, setQuizBootstrap] = useState<{ domainId?: number; questionCount?: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Handle URL params for quiz generation and mission handoffs
  useEffect(() => {
    const tab = searchParams.get('tab');
    const domainParam = searchParams.get('domain');
    if (tab === 'quiz') {
      setActiveTab('quiz');
      if (domainParam) {
        const domainId = Number(domainParam);
        if (Number.isFinite(domainId) && domainId > 0) {
          setQuizBootstrap({ domainId });
        }
      }
    }
  }, [searchParams]);

  const [focusDomainId, setFocusDomainId] = useState<number | undefined>();

  // Handle navigation state from Command Center domain readiness or mission handoff
  useEffect(() => {
    const state = location.state as { startQuiz?: boolean; domainId?: number; questionCount?: number; weakDomain?: number } | null;
    if (state?.startQuiz) {
      setActiveTab('quiz');
      setQuizBootstrap({ domainId: state.domainId, questionCount: state.questionCount });
      window.history.replaceState({}, document.title);
    }
    if (state?.weakDomain && Number.isFinite(state.weakDomain)) {
      setFocusDomainId(state.weakDomain);
    } else if (state?.domainId && Number.isFinite(state.domainId)) {
      setFocusDomainId(state.domainId);
    }
  }, [location.state]);

  // Reset background color when entering study page
  useEffect(() => {
    setBgColor('blue');
    return () => setBgColor('white');
  }, [setBgColor]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
      <DomainProgressStrip focusDomainId={focusDomainId} className="mb-4 max-w-5xl mx-auto w-full" />
      {/* Floating Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-1 bg-theme-elevated/80 backdrop-blur-lg p-1.5 rounded-2xl border border-theme/50 dark:border-gray-700/50 shadow-xl">
          {[
            { id: 'tutor' as Tab, label: 'AI Tutor', icon: MessageSquare, color: 'from-purple-500 to-indigo-600' },
            { id: 'notes' as Tab, label: 'Notes', icon: FileText, color: 'from-blue-500 to-cyan-600' },
            { id: 'flashcards' as Tab, label: 'Cards', icon: Layers, color: 'from-green-500 to-emerald-600' },
            { id: 'quiz' as Tab, label: 'Quiz', icon: Target, color: 'from-orange-500 to-red-600' },
            { id: 'exam' as Tab, label: 'Exam', icon: ClipboardList, color: 'from-red-500 to-pink-600' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                  : 'text-cockpit-muted hover:bg-cockpit-track'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with creative floating layout */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-4xl">
          {activeTab !== 'exam' && (
            <Link
              to="/exam"
              className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 hover:border-red-500/40 transition-all group"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-sm font-semibold text-cockpit">{activeCert.shortName} Timed Exam</div>
                  <div className="text-xs text-theme-muted">
                    {activeCert.examFormat?.questions ?? 90} questions · {activeCert.examFormat?.minutes ?? 150} min · {activeCert.vendor}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {activeTab === 'tutor' && (
            <TutorTab
              onSwitchTab={tab => setActiveTab(tab)}
              onToast={setToast}
              onQuizBootstrap={bootstrap => setQuizBootstrap(bootstrap)}
            />
          )}
          {activeTab === 'notes' && <NotesTab />}
          {activeTab === 'flashcards' && <FlashcardsTab />}
          {activeTab === 'quiz' && <QuizTab bootstrap={quizBootstrap} onBootstrapConsumed={() => setQuizBootstrap(null)} />}
          {activeTab === 'exam' && <ExamSimTab />}
        </div>
      </div>
    </div>
  );
}

// ============ AI TUTOR TAB (Embedded Full Tutor) ============
function TutorTab({
  onSwitchTab,
  onToast,
  onQuizBootstrap,
}: {
  onSwitchTab: (tab: 'notes' | 'quiz') => void;
  onToast: (message: string) => void;
  onQuizBootstrap: (bootstrap: { domainId: number; questionCount?: number }) => void;
}) {
  return (
    <div className="animate-fade-in">
      <Tutor
        embedded
        onSwitchTab={onSwitchTab}
        onToast={onToast}
        onQuizBootstrap={onQuizBootstrap}
      />
    </div>
  );
}

// Shuffled question with randomized answer order
interface ShuffledQuestion extends ExamQuestion {
  shuffledOptions: string[];
  shuffledCorrectAnswer: number; // Index in shuffledOptions
}

// ============ QUIZ TAB ============
function QuizTab({ bootstrap, onBootstrapConsumed }: { bootstrap?: { domainId?: number; questionCount?: number } | null; onBootstrapConsumed?: () => void }) {
  const { addQuizAttempt } = useApp();
  const { completeQuiz } = useGamification();
  const { setBgColor } = usePerformance();
  const { activeCert } = useCert();
  const examQuestionCount = activeCert.examFormat?.questions ?? 90;
  const examDurationSeconds = (activeCert.examFormat?.minutes ?? 150) * 60;
  const passThreshold = getPassThreshold(activeCert.id);
  const contentStats = getContentStats(activeCert.id);
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [quizMode, setQuizMode] = useState<QuizMode>('practice');
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExp, setShowExp] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [examTimer, setExamTimer] = useState(0); // seconds remaining

  // Pre-select domain when arriving from AI Tutor "Create Quiz"
  useEffect(() => {
    const stored = localStorage.getItem('generateQuizDomain');
    if (!stored || quizState !== 'setup') return;
    const domainId = Number(stored);
    if (Number.isFinite(domainId) && activeCert.domains.some(d => d.id === domainId)) {
      setSelectedDomain(domainId);
    }
  }, [activeCert.id, quizState]);

  const allQuestions = getAllQuestions(activeCert.id);

  // Exam timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (quizMode === 'exam' && quizState === 'active' && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer(prev => {
          if (prev <= 1) {
            // Time's up - auto-submit
            finishQuiz(answers);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizMode, quizState, examTimer > 0]); // eslint-disable-line

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Shuffle answer options and track new correct index
  const shuffleAnswerOptions = (q: ExamQuestion): ShuffledQuestion => {
    const correctOption = q.options[q.correctAnswer];
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffledOptions = indices.map(i => q.options[i]);
    const shuffledCorrectAnswer = shuffledOptions.indexOf(correctOption);
    return { ...q, shuffledOptions, shuffledCorrectAnswer };
  };

  // Update background based on state
  useEffect(() => {
    if (quizState === 'setup') setBgColor('white');
    else if (quizState === 'active') setBgColor('blue');
  }, [quizState, setBgColor]);

  // Auto-start quiz when navigated from Command Center domain readiness
  useEffect(() => {
    if (!bootstrap?.domainId || quizState !== 'setup') return;
    setSelectedDomain(bootstrap.domainId);
    onBootstrapConsumed?.();
    localStorage.removeItem('generateQuizDomain');
    localStorage.removeItem('generateQuizFrom');
    // Defer start until domain state is applied
    const timer = setTimeout(() => {
      const qs = getQuestionsByDomain(bootstrap.domainId!);
      const shuffledQs = [...qs].sort(() => Math.random() - 0.5);
      const target = bootstrap.questionCount ?? 10;
      const count = Math.min(target, shuffledQs.length);
      const preparedQs = shuffledQs.slice(0, count).map(shuffleAnswerOptions);
      setQuestions(preparedQs);
      setAnswers(new Array(preparedQs.length).fill(null));
      setCurrentQ(0);
      setSelected(null);
      setShowExp(false);
      setEarnedXP(0);
      setQuizState('active');
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrap?.domainId]);

  const getQuestionsForSelection = () => {
    if (selectedDomain === 'all') {
      return allQuestions;
    }
    return getQuestionsByDomain(selectedDomain);
  };

  const current = questions[currentQ];

  const start = () => {
    const qs = getQuestionsForSelection();
    
    // Shuffle questions
    const shuffledQs = [...qs].sort(() => Math.random() - 0.5);
    
    // Limit practice to 10; exam sim uses cert question count
    const count = quizMode === 'exam' ? Math.min(examQuestionCount, shuffledQs.length) : Math.min(10, shuffledQs.length);
    const selectedQs = shuffledQs.slice(0, count);
    
    // Shuffle answer options for each question
    const preparedQs = selectedQs.map(shuffleAnswerOptions);
    
    setQuestions(preparedQs);
    setAnswers(new Array(preparedQs.length).fill(null));
    setCurrentQ(0);
    setSelected(null);
    setShowExp(false);
    setEarnedXP(0);
    // Set timer for exam mode: 150 minutes total (ISACA AAISM)
    if (quizMode === 'exam') {
      setExamTimer(examDurationSeconds);
    }
    setQuizState('active');
  };

  const submit = () => {
    if (selected === null) return;
    const newAns = [...answers];
    newAns[currentQ] = selected;
    setAnswers(newAns);
    if (quizMode === 'practice') {
      setShowExp(true);
    } else {
      // Exam mode: auto advance
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
      } else {
        finishQuiz(newAns);
      }
    }
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

  const finishQuiz = (finalAnswers: (number | null)[]) => {
    // Compare against shuffledCorrectAnswer
    const correct = finalAnswers.reduce((count: number, ans, i) => 
      count + (ans === questions[i].shuffledCorrectAnswer ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);

    // Update background based on score
    if (score >= 80) setBgColor('green');      // Pass - excellent
    else if (score >= 65) setBgColor('yellow'); // Pass - warning level
    else setBgColor('red');                     // Fail

    addQuizAttempt({
      date: new Date().toISOString(),
      domain: selectedDomain,
      totalQuestions: questions.length,
      correctAnswers: correct,
      score,
    });

    const xp = completeQuiz(score, questions.length, correct, selectedDomain);
    setEarnedXP(xp);
    setQuizState('review');
  };

  const reset = () => {
    setBgColor('blue'); // Restart color
    setQuizState('setup');
    setSelectedDomain('all');
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowExp(false);
  };

  // SETUP STATE
  if (quizState === 'setup') {
    const domainInfo = activeCert.domains.map(d => ({
      id: d.id,
      name: d.name,
      icon: d.icon ?? '📘',
    }));
    const tutorQuizDomain = localStorage.getItem('generateQuizDomain');
    const fromTutor = tutorQuizDomain && domainInfo.some(d => d.id === Number(tutorQuizDomain));

    return (
      <div className="bg-theme-elevated rounded-xl border border-theme p-8">
        {fromTutor && (
          <div className="mb-6 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-300">
            Quiz topic saved from AI Tutor — Domain {tutorQuizDomain} selected. Start when ready.
          </div>
        )}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="text-primary-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-cockpit">Practice Quiz</h2>
          <p className="text-theme-muted mt-2">Test your knowledge across {activeCert.shortName} exam domains — {contentStats.totalQuestions} questions in bank</p>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 max-w-md mx-auto mb-6">
          <button
            onClick={() => setQuizMode('practice')}
            className={`flex-1 p-3 rounded-lg border text-center ${
              quizMode === 'practice' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-theme'
            }`}
          >
            <div className="font-medium">Practice</div>
            <div className="text-xs text-theme-muted">With explanations</div>
          </button>
          <button
            onClick={() => setQuizMode('exam')}
            className={`flex-1 p-3 rounded-lg border text-center ${
              quizMode === 'exam' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-theme'
            }`}
          >
            <div className="font-medium">Exam Sim</div>
            <div className="text-xs text-theme-muted">Timed, no hints</div>
          </button>
        </div>

        <div className="space-y-3 max-w-md mx-auto mb-8">
          <button
            onClick={() => setSelectedDomain('all')}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedDomain === 'all'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-theme hover:border-theme'
            }`}
          >
            <span className="font-medium">All Domains</span>
            <span className="text-theme-muted ml-2">({allQuestions.length} questions)</span>
          </button>
          
          {domainInfo.map(domain => {
            const count = getQuestionsByDomain(domain.id).length;
            return (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                  selectedDomain === domain.id
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-theme hover:border-theme'
                }`}
              >
                <span className="text-xl">{domain.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{domain.name}</div>
                  <div className="text-sm text-theme-muted">{count} questions</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={start}
          disabled={getQuestionsForSelection().length === 0}
          className="w-full max-w-md mx-auto block py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          Start {quizMode === 'exam' ? 'Exam Simulation' : 'Quiz'} ({Math.min(quizMode === 'exam' ? examQuestionCount : 10, getQuestionsForSelection().length)} questions)
        </button>
      </div>
    );
  }

  // ACTIVE STATE
  if (quizState === 'active') {
    const isCorrect = answers[currentQ] === current.shuffledCorrectAnswer;
    
    return (
      <div className="bg-theme-elevated rounded-xl border border-theme p-6">
        {/* Progress + Timer */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-2 bg-cockpit-track rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-cockpit-muted">
            {currentQ + 1} / {questions.length}
          </span>
          {quizMode === 'exam' && examTimer > 0 && (
            <span className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${
              examTimer < 300 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 
              examTimer < 600 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-cockpit-track text-theme-secondary dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {formatTimer(examTimer)}
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-xl font-semibold text-cockpit mb-6">{current.question}</h3>

        {/* Options - using shuffled options */}
        <div className="space-y-3 mb-6">
          {current.shuffledOptions.map((opt, i) => {
            const isSelected = selected === i;
            const isAnswer = i === current.shuffledCorrectAnswer;
            const wasSelected = answers[currentQ] === i;

            let style = 'border-theme hover:border-theme dark:hover:border-gray-500';
            if (showExp) {
              if (isAnswer) style = 'border-green-500 bg-green-50 dark:bg-green-900/30';
              else if (wasSelected && !isAnswer) style = 'border-red-500 bg-red-50 dark:bg-red-900/30';
            } else if (isSelected) {
              style = 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-200 dark:ring-primary-800';
            }

            return (
              <button
                key={i}
                onClick={() => !showExp && setSelected(i)}
                disabled={showExp}
                className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${style}`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-sm ${
                  showExp && isAnswer ? 'border-green-500 text-green-600 dark:text-green-400' :
                  showExp && wasSelected && !isAnswer ? 'border-red-500 text-red-600 dark:text-red-400' :
                  isSelected ? 'border-primary-500 text-primary-600 dark:text-primary-400' :
                  'border-theme text-theme-muted'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="flex-1 text-cockpit">{opt}</span>
                {showExp && isAnswer && <CheckCircle className="text-green-500" size={20} />}
                {showExp && wasSelected && !isAnswer && <XCircle className="text-red-500" size={20} />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExp && (
          <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
            <div className={`font-medium mb-1 ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <p className={`text-sm ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {current.explanation}
            </p>
            <p className="text-[10px] text-theme-faint mt-2 pt-2 border-t border-theme/50">
              {formatExplanationCitation(resolveQuestionProvenance(current, activeCert.id))}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showExp ? (
            <button
              onClick={submit}
              disabled={selected === null}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={next}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              {currentQ < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // REVIEW STATE
  const correct = answers.reduce((count: number, ans, i) => 
    count + (ans === questions[i].shuffledCorrectAnswer ? 1 : 0), 0);
  const score = Math.round((correct / questions.length) * 100);

  const wrongAnswers = questions
    .map((q, i) => ({ question: q, userAnswer: answers[i] }))
    .filter(({ question, userAnswer }) => userAnswer !== question.shuffledCorrectAnswer);

  const passed = score >= passThreshold;

  return (
    <div className="bg-theme-elevated rounded-xl border border-theme p-8 text-center">
      {/* Pass/Fail Banner */}
      <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold mb-4 ${
        passed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      }`}>
        {passed ? 'PASS' : 'NEEDS IMPROVEMENT'} — {score}% (pass = {passThreshold}%)
      </div>

      <div className={`text-6xl font-bold mb-2 ${
        score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-500'
      }`}>
        {score}%
      </div>
      <p className="text-cockpit-muted mb-4">
        {correct} of {questions.length} correct
      </p>

      {earnedXP > 0 && (
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-lg mb-6 animate-bounce-in">
          <Zap size={20} />
          +{earnedXP} XP
        </div>
      )}

      {score === 100 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl inline-block">
          <span className="text-2xl">🏆</span>
          <p className="text-purple-700 dark:text-purple-300 font-semibold">Perfect Score!</p>
        </div>
      )}

      {!passed && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto">
          <p className="font-semibold mb-1">Exam Readiness Tip:</p>
          <p>Pass threshold is {passThreshold}%. Focus on your weakest domain and review the Knowledge Base for key frameworks.</p>
        </div>
      )}

      <button
        onClick={reset}
        className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
      >
        <RotateCcw size={18} />
        Try Again
      </button>

      <RemediationPanel wrongAnswers={wrongAnswers} compact />
    </div>
  );
}

// ============ NOTES TAB ============
function NotesTab() {
  const { state, addNote, updateNote, deleteNote } = useApp();
  const { activeCert } = useCert();
  const [activeDomain, setActiveDomain] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedDomainForNew, setSelectedDomainForNew] = useState(1);
  const [showCombined, setShowCombined] = useState(true);
  const [convertedToCards, setConvertedToCards] = useState<Set<string>>(new Set());

  // Get all notes from selected domain(s) — scoped to active cert domains
  const certDomainIds = new Set(activeCert.domains.map(d => d.id));
  const allNotes = state.domains.flatMap(domain =>
    certDomainIds.has(domain.id) &&
    (activeDomain === 'all' || activeDomain === domain.id)
      ? domain.notes.map(note => {
          const certDomain = activeCert.domains.find(d => d.id === domain.id);
          return {
            ...note,
            domainId: domain.id,
            domainIcon: certDomain?.icon ?? domain.icon,
            domainName: certDomain?.name ?? domain.name,
          };
        })
      : []
  );

  // Smart combine: Group similar AI Tutor notes by topic
  const combineNotes = (notes: typeof allNotes) => {
    if (!showCombined) return notes;
    
    const tutorNotes = notes.filter(n => n.title.startsWith('AI Tutor:'));
    const otherNotes = notes.filter(n => !n.title.startsWith('AI Tutor:'));
    
    // Group tutor notes by domain
    const groupedByDomain: Record<number, typeof tutorNotes> = {};
    tutorNotes.forEach(note => {
      if (!groupedByDomain[note.domainId]) groupedByDomain[note.domainId] = [];
      groupedByDomain[note.domainId].push(note);
    });
    
    // If more than 3 tutor notes in a domain, combine them
    const combinedNotes: typeof allNotes = [];
    Object.entries(groupedByDomain).forEach(([domainId, domNotes]) => {
      if (domNotes.length > 3) {
        // Create combined note preview
        combinedNotes.push({
          id: `combined-${domainId}`,
          title: `📚 AI Tutor Notes (${domNotes.length})`,
          content: domNotes.map(n => `### ${n.title.replace('AI Tutor: ', '')}\n${n.content}`).join('\n\n---\n\n'),
          domainId: Number(domainId),
          domainIcon: domNotes[0].domainIcon,
          domainName: domNotes[0].domainName,
          createdAt: domNotes[0].createdAt,
          updatedAt: domNotes[domNotes.length - 1].updatedAt,
        });
      } else {
        combinedNotes.push(...domNotes);
      }
    });
    
    return [...otherNotes, ...combinedNotes].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };

  // Filter by search
  const filteredNotes = searchQuery
    ? allNotes.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : combineNotes(allNotes);

  // Sort by newest first
  const sortedNotes = [...filteredNotes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Check if note is from AI Tutor
  const isFromTutor = (title: string) => title.startsWith('AI Tutor:');

  // Convert note to flashcard
  const handleNoteToFlashcard = (note: typeof sortedNotes[0]) => {
    const front = note.title.replace('AI Tutor: ', '').substring(0, 100);
    const back = note.content.substring(0, 500);
    addFlashcard({
      front: front + '?',
      back,
      domainId: note.domainId,
      tags: ['from-notes'],
      difficulty: 'medium',
    });
    setConvertedToCards(prev => new Set(prev).add(note.id));
  };

  const handleAddNote = () => {
    if (!noteTitle.trim()) return;
    addNote(selectedDomainForNew, { title: noteTitle, content: noteContent });
    setNoteTitle('');
    setNoteContent('');
    setIsAdding(false);
  };

  const handleUpdateNote = (domainId: number, noteId: string) => {
    if (!noteTitle.trim()) return;
    updateNote(domainId, noteId, { title: noteTitle, content: noteContent });
    setIsEditing(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const startEdit = (note: typeof sortedNotes[0]) => {
    setIsEditing(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const totalNotes = state.domains
    .filter(d => certDomainIds.has(d.id))
    .reduce((sum, d) => sum + d.notes.length, 0);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-cockpit">Your Notes</h2>
          <p className="text-sm text-theme-muted">
            {totalNotes} note{totalNotes !== 1 ? 's' : ''} total
            {filteredNotes.length !== totalNotes && ` • ${filteredNotes.length} shown`}
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setIsEditing(null); setNoteTitle(''); setNoteContent(''); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Note
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-faint" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-theme bg-theme-elevated text-cockpit rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        {/* Domain Filter */}
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveDomain('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeDomain === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-theme-elevated text-cockpit-muted border border-theme'
            }`}
          >
            All
          </button>
          {activeCert.domains.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveDomain(d.id)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeDomain === d.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-theme-elevated text-cockpit-muted border border-theme'
              }`}
              title={d.name}
            >
              {d.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="bg-theme-elevated rounded-xl border-2 border-primary-500 p-4">
          <h3 className="font-semibold text-cockpit mb-3">New Note</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <select
                value={selectedDomainForNew}
                onChange={e => setSelectedDomainForNew(Number(e.target.value))}
                className="px-3 py-2 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-lg"
              >
                {activeCert.domains.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.shortName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Note title..."
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <textarea
              placeholder="Note content..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-cockpit-track text-theme-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="bg-theme-elevated rounded-xl border border-theme p-8 text-center">
          <FileText size={40} className="mx-auto text-theme-faint mb-3" />
          <p className="text-theme-muted mb-2">
            {searchQuery ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-sm text-theme-muted dark:text-theme-muted">
            {!searchQuery && (
              <>
                Create notes here or save AI Tutor responses as notes with the
                <Bot size={14} className="inline mx-1" />
                "Save to Notes" button
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map(note => (
            <div
              key={note.id}
              className="bg-theme-elevated rounded-xl border border-theme p-4"
            >
              {isEditing === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-lg"
                  />
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.domainId, note.id)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-cockpit-track text-theme-secondary rounded-lg text-sm flex items-center gap-1"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{note.domainIcon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-cockpit truncate">{note.title}</h3>
                          {isFromTutor(note.title) && (
                            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] rounded font-medium flex items-center gap-0.5">
                              <Bot size={10} />
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-theme-faint">
                          {new Date(note.updatedAt).toLocaleDateString()} •{' '}
                          {note.domainName ?? `Domain ${note.domainId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Convert to Flashcard */}
                      {!note.id.startsWith('combined-') && !convertedToCards.has(note.id) && (
                        <button
                          onClick={() => handleNoteToFlashcard(note)}
                          className="p-1.5 text-theme-faint hover:text-green-600 rounded transition-colors"
                          title="Convert to Flashcard"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                      {convertedToCards.has(note.id) && (
                        <span className="p-1.5 text-green-500" title="Converted to flashcard">
                          <CheckCircle size={14} />
                        </span>
                      )}
                      {!note.id.startsWith('combined-') && (
                        <>
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1.5 text-theme-faint hover:text-primary-600 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteNote(note.domainId, note.id)}
                            className="p-1.5 text-theme-faint hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      {note.id.startsWith('combined-') && (
                        <button
                          onClick={() => setShowCombined(false)}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          <Merge size={12} className="inline mr-1" />
                          Expand
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-cockpit-muted mt-2 whitespace-pre-wrap line-clamp-3">
                    {note.content}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {totalNotes === 0 && !isAdding && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-blue-500 dark:text-blue-400 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-300">Pro Tip</div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Ask questions in the AI Tutor and click "Save to Notes" to build your study notes automatically!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ FLASHCARDS TAB ============
function FlashcardsTab() {
  const { activeCert } = useCert();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0, learning: 0, new: 0 });
  const [mode, setMode] = useState<'overview' | 'review' | 'create'>('overview');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newCard, setNewCard] = useState({
    front: '',
    back: '',
    domainId: activeCert.domains[0]?.id ?? 1,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCards(loadFlashcards());
    setDueCards(getDueCards());
    setStats(getFlashcardStats());
  };

  const handleReview = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (dueCards[currentCardIndex]) {
      processReview({ cardId: dueCards[currentCardIndex].id, quality });
      
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setMode('overview');
        refreshData();
      }
    }
  };

  const handleCreateCard = () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      addFlashcard({
        front: newCard.front,
        back: newCard.back,
        domainId: newCard.domainId,
        tags: [],
        difficulty: 'medium',
      });
      setNewCard({ front: '', back: '', domainId: activeCert.domains[0]?.id ?? 1 });
      refreshData();
    }
  };

  const handleDeleteCard = (id: string) => {
    deleteFlashcard(id);
    refreshData();
  };

  // Overview Mode
  if (mode === 'overview') {
    return (
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
            <Layers className="text-primary-500 mx-auto mb-1" size={20} />
            <div className="text-2xl font-bold text-cockpit">{stats.total}</div>
            <div className="text-xs text-theme-muted">Total Cards</div>
          </div>
          <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
            <RotateCw className="text-orange-500 mx-auto mb-1" size={20} />
            <div className="text-2xl font-bold text-cockpit">{stats.due}</div>
            <div className="text-xs text-theme-muted">Due Today</div>
          </div>
          <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
            <Brain className="text-blue-500 mx-auto mb-1" size={20} />
            <div className="text-2xl font-bold text-cockpit">{stats.learning}</div>
            <div className="text-xs text-theme-muted">Learning</div>
          </div>
          <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
            <CheckCircle className="text-green-500 mx-auto mb-1" size={20} />
            <div className="text-2xl font-bold text-cockpit">{stats.mastered}</div>
            <div className="text-xs text-theme-muted">Mastered</div>
          </div>
          <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
            <Lightbulb className="text-yellow-500 mx-auto mb-1" size={20} />
            <div className="text-2xl font-bold text-cockpit">{stats.new}</div>
            <div className="text-xs text-theme-muted">New</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setCurrentCardIndex(0); setShowAnswer(false); setMode('review'); }}
            disabled={stats.due === 0}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl p-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCw size={20} />
            <div className="text-left">
              <div className="font-semibold">Review Due Cards</div>
              <div className="text-xs text-primary-200">{stats.due} cards ready</div>
            </div>
          </button>
          <button
            onClick={() => setMode('create')}
            className="bg-theme-elevated border border-theme hover:border-primary-400 text-cockpit rounded-xl p-4 flex items-center justify-center gap-3 transition-all"
          >
            <Plus size={20} className="text-primary-500" />
            <div className="text-left">
              <div className="font-semibold">Create New Card</div>
              <div className="text-xs text-theme-muted">Add to your deck</div>
            </div>
          </button>
        </div>

        {/* Card List */}
        <div className="bg-theme-elevated rounded-xl border border-theme p-4">
          <h3 className="font-semibold text-cockpit mb-3">Your Flashcards</h3>
          {cards.length === 0 ? (
            <div className="text-center py-8 text-theme-faint">
              <Layers size={32} className="mx-auto mb-2 opacity-50" />
              <p>No flashcards yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cards.slice(0, 20).map(card => (
                <div 
                  key={card.id}
                  className="flex items-center justify-between p-3 bg-theme-muted dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-cockpit text-sm truncate">{card.front}</div>
                    <div className="text-xs text-theme-muted">
                      Domain {card.domainId} • {card.repetitions} reviews
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1.5 text-theme-faint hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Review Mode
  if (mode === 'review' && dueCards.length > 0) {
    const currentCard = dueCards[currentCardIndex];
    
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-theme-muted">
          <span>Card {currentCardIndex + 1} of {dueCards.length}</span>
          <button onClick={() => setMode('overview')} className="text-primary-500 hover:underline">
            Exit Review
          </button>
        </div>

        {/* Flashcard */}
        <div 
          onClick={() => setShowAnswer(!showAnswer)}
          className="bg-theme-elevated rounded-2xl border border-theme p-8 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="text-center">
            <div className="text-xs text-theme-muted uppercase mb-4">
              {showAnswer ? 'Answer' : 'Question'}
            </div>
            <div className="text-xl font-medium text-cockpit">
              {showAnswer ? currentCard.back : currentCard.front}
            </div>
            {!showAnswer && (
              <div className="mt-6 text-sm text-theme-faint">Tap to reveal answer</div>
            )}
          </div>
        </div>

        {/* Rating Buttons */}
        {showAnswer && (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleReview(1)}
              className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Again
            </button>
            <button
              onClick={() => handleReview(2)}
              className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50"
            >
              Hard
            </button>
            <button
              onClick={() => handleReview(3)}
              className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50"
            >
              Good
            </button>
            <button
              onClick={() => handleReview(5)}
              className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-900/50"
            >
              Easy
            </button>
          </div>
        )}
      </div>
    );
  }

  // Create Mode
  if (mode === 'create') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-cockpit">Create Flashcard</h3>
          <button onClick={() => setMode('overview')} className="text-theme-faint hover:text-theme-secondary">
            ← Back
          </button>
        </div>

        <div className="bg-theme-elevated rounded-xl border border-theme p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Question (Front)</label>
            <textarea
              value={newCard.front}
              onChange={e => setNewCard({ ...newCard, front: e.target.value })}
              placeholder="What is..."
              className="w-full px-4 py-3 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Answer (Back)</label>
            <textarea
              value={newCard.back}
              onChange={e => setNewCard({ ...newCard, back: e.target.value })}
              placeholder="The answer is..."
              className="w-full px-4 py-3 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Domain</label>
            <select
              value={newCard.domainId}
              onChange={e => setNewCard({ ...newCard, domainId: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-theme bg-theme-elevated dark:bg-gray-700 text-cockpit rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {activeCert.domains.map(d => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.shortName}: {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateCard}
            disabled={!newCard.front.trim() || !newCard.back.trim()}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Flashcard
          </button>
        </div>
      </div>
    );
  }

  return <div className="text-center py-8 text-theme-muted">No cards due for review!</div>;
}

// ============ EXAM SIMULATION TAB ============
function ExamSimTab() {
  const { addQuizAttempt } = useApp();
  const { completeQuiz } = useGamification();
  const { setBgColor } = usePerformance();
  const { activeCert } = useCert();
  const examQuestionCount = activeCert.examFormat?.questions ?? 90;
  const examDurationSeconds = (activeCert.examFormat?.minutes ?? 150) * 60;
  const passThreshold = getPassThreshold(activeCert.id);
  const [examState, setExamState] = useState<'setup' | 'active' | 'review'>('setup');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(examDurationSeconds);
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);

  // Update background based on state
  useEffect(() => {
    if (examState === 'setup') setBgColor('white');
    else if (examState === 'active') setBgColor('red'); // Red during exam for pressure
  }, [examState, setBgColor]);

  // Timer
  useEffect(() => {
    if (examState !== 'active') return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState]);

  const shuffleOptions = (q: ExamQuestion): ShuffledQuestion => {
    const indices = [0, 1, 2, 3];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      ...q,
      shuffledOptions: indices.map(i => q.options[i]),
      shuffledCorrectAnswer: indices.indexOf(q.correctAnswer)
    };
  };

  const startExam = () => {
    const allQ = getAllQuestions(activeCert.id);
    const selected = allQ.sort(() => Math.random() - 0.5).slice(0, examQuestionCount);
    const shuffled = selected.map(shuffleOptions);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setCurrentQ(0);
    setTimeRemaining(examDurationSeconds);
    setExamState('active');
  };

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].shuffledCorrectAnswer).length;
    const score = Math.round((correct / questions.length) * 100);
    
    // Update background based on score
    if (score >= passThreshold) setBgColor('green');
    else setBgColor('red');                 // Fail

    addQuizAttempt({
      date: new Date().toISOString(),
      domain: 'all',
      totalQuestions: questions.length,
      correctAnswers: correct,
      score,
    });

    completeQuiz(score, questions.length, correct, 'all');
    setExamState('review');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (examState === 'setup') {
    return (
      <div className="bg-theme-elevated rounded-xl p-8 border border-theme text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-cockpit mb-2">
          Exam Simulation
        </h2>
        <p className="text-cockpit-muted mb-6 max-w-md mx-auto">
          Simulate the {activeCert.shortName} exam with {examQuestionCount} questions and a {activeCert.examFormat?.minutes ?? 150}-minute timer.
          For the full timed mode with flagging and domain breakdown, use the dedicated exam route.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
          <div className="bg-theme-muted dark:bg-gray-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-cockpit">{examQuestionCount}</div>
            <div className="text-xs text-theme-muted">Questions</div>
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

        <button
          onClick={startExam}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-orange-700 transition-all flex items-center gap-2 mx-auto mb-3"
        >
          <ClipboardList size={20} />
          Quick Exam Sim
          <ChevronRight size={18} />
        </button>
        <Link
          to="/exam"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
        >
          Full Timed Exam Mode (flag, pause, breakdown) →
        </Link>
      </div>
    );
  }

  if (examState === 'active') {
    const q = questions[currentQ];
    return (
      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        {/* Exam Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-cockpit-muted">
            Question {currentQ + 1} of {questions.length}
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-mono font-bold ${
            timeRemaining < 600 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-cockpit-track text-cockpit'
          }`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-cockpit-track rounded-full mb-6">
          <div 
            className="h-full bg-primary-600 rounded-full transition-all"
            style={{ width: `${(answers.filter(a => a !== null).length / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="text-lg font-medium text-cockpit mb-4">{q.question}</h3>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {q.shuffledOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                const newAns = [...answers];
                newAns[currentQ] = i;
                setAnswers(newAns);
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

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="px-4 py-2 text-cockpit-muted hover:bg-cockpit-track rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="flex gap-1 overflow-x-auto max-w-xs">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-6 h-6 rounded text-xs font-medium ${
                  i === currentQ 
                    ? 'bg-primary-600 text-white'
                    : answers[i] !== null
                      ? 'bg-green-500 text-white'
                      : 'bg-cockpit-track text-cockpit-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>
    );
  }

  // Review state
  const correct = answers.filter((a, i) => a === questions[i].shuffledCorrectAnswer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= passThreshold;

  const wrongAnswers = questions
    .map((q, i) => ({ question: q, userAnswer: answers[i] }))
    .filter(({ question, userAnswer }) => userAnswer !== question.shuffledCorrectAnswer);

  return (
    <div className="bg-theme-elevated rounded-xl p-8 border border-theme text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
        passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        {passed ? (
          <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
        ) : (
          <XCircle className="text-red-600 dark:text-red-400" size={40} />
        )}
      </div>
      
      <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
        {score}%
      </h2>
      <p className="text-cockpit-muted mb-4">
        {passed ? '🎉 Congratulations! You passed!' : '📚 Keep studying, you\'ll get there!'}
      </p>
      <p className="text-sm text-theme-muted mb-6">
        {correct} of {questions.length} correct • Pass mark: {passThreshold}%
      </p>

      <button
        onClick={() => { setBgColor('blue'); setExamState('setup'); }}
        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        <RotateCcw size={18} className="inline mr-2" />
        Try Again
      </button>

      <RemediationPanel wrongAnswers={wrongAnswers} compact />
    </div>
  );
}
