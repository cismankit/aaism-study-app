import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Target, BookOpen, Brain, Coffee, 
  CheckCircle, Circle, Play, ChevronRight, AlertTriangle,
  Star, Trophy, RotateCcw, Timer, Flame
} from 'lucide-react';

interface CramBlock {
  id: string;
  hour: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'study' | 'quiz' | 'review' | 'break' | 'exam';
  domain?: number;
  duration: number; // minutes
  tips: string[];
  action?: { label: string; path: string };
}

const CRAM_BLOCKS: CramBlock[] = [
  {
    id: 'diagnostic',
    hour: 'Hours 1-2',
    title: 'Diagnostic Exam',
    description: 'Take a full 90-question practice exam to identify weak areas. Don\'t study first — measure your baseline.',
    icon: <Target size={20} className="text-red-500" />,
    type: 'exam',
    duration: 120,
    tips: [
      'Set a 150-minute timer to simulate real conditions',
      'Don\'t look up answers — get honest baseline',
      'Note which domains you struggle with',
      'Score yourself and identify your weakest domain',
    ],
    action: { label: 'Start Diagnostic Exam', path: '/study?tab=quiz' },
  },
  {
    id: 'domain3-deep',
    hour: 'Hours 3-6',
    title: 'Domain 3 Deep Dive (38% — Biggest ROI)',
    description: 'AI Technologies and Controls is the HEAVIEST domain. Focus here for maximum score impact.',
    icon: <Brain size={20} className="text-purple-500" />,
    type: 'study',
    domain: 3,
    duration: 240,
    tips: [
      'Read the Domain 3 Cheat Sheet section first',
      'Focus on: Security Architecture, Data Controls, Privacy/Ethics, Monitoring',
      'Memorize: LIME vs SHAP, Differential Privacy, Federated Learning',
      'Know deployment patterns: Shadow, Canary, Blue-Green',
      'Understand drift types: Data drift vs Concept drift',
      'Review OWASP Top 10 for LLMs — especially Prompt Injection',
    ],
    action: { label: 'Study Domain 3', path: '/cheatsheet' },
  },
  {
    id: 'break1',
    hour: 'Hour 6',
    title: 'Power Break',
    description: 'Take a 30-minute break. Eat, hydrate, move around. Your brain needs this to consolidate.',
    icon: <Coffee size={20} className="text-amber-500" />,
    type: 'break',
    duration: 30,
    tips: [
      'Step away from the screen completely',
      'Eat something with protein and complex carbs',
      'Drink water — dehydration kills focus',
      'Light exercise or stretching helps memory',
    ],
  },
  {
    id: 'domain1-deep',
    hour: 'Hours 7-9',
    title: 'Domain 1 Deep Dive (31%)',
    description: 'AI Governance and Program Management — frameworks, policies, compliance.',
    icon: <BookOpen size={20} className="text-blue-500" />,
    type: 'study',
    domain: 1,
    duration: 180,
    tips: [
      'NIST AI RMF: Govern → Map → Measure → Manage (memorize this!)',
      'ISO 42001: PDCA cycle — Plan, Do, Check, Act',
      'EU AI Act: 4 risk levels — Unacceptable, High, Limited, Minimal',
      'Know: Social scoring = BANNED, Recruitment AI = HIGH RISK',
      'Governance ALWAYS comes before technical implementation',
      'Business alignment is ALWAYS the FIRST consideration',
    ],
    action: { label: 'Study Domain 1', path: '/cheatsheet' },
  },
  {
    id: 'domain2-deep',
    hour: 'Hours 10-12',
    title: 'Domain 2 Deep Dive (31%)',
    description: 'AI Risk Management — threats, vulnerabilities, vendor/supply chain.',
    icon: <AlertTriangle size={20} className="text-red-500" />,
    type: 'study',
    domain: 2,
    duration: 180,
    tips: [
      'Memorize attack types: Adversarial (inference) vs Poisoning (training)',
      'MITRE ATLAS = AI attacks. MITRE ATT&CK = cyber attacks.',
      'Know vendor management: due diligence, contracts, SLAs, right to audit',
      'Risk appetite = Board decision. Risk treatment = Management.',
      'Differential Privacy = adds noise. Federated Learning = data stays local.',
      'OWASP LLM01 = Prompt Injection (most common LLM vulnerability)',
    ],
    action: { label: 'Study Domain 2', path: '/cheatsheet' },
  },
  {
    id: 'break2',
    hour: 'Hour 12',
    title: 'Meal Break + Flashcard Review',
    description: 'Take a longer break. While eating, review flashcards on your weakest topics.',
    icon: <Coffee size={20} className="text-amber-500" />,
    type: 'break',
    duration: 45,
    tips: [
      'Review flashcards casually while eating',
      'Focus on terms and concepts you keep forgetting',
      'Don\'t force study — let your brain process',
    ],
  },
  {
    id: 'practice1',
    hour: 'Hours 13-15',
    title: 'Mixed Practice (All Domains)',
    description: 'Take practice quizzes covering all domains. Focus on understanding WHY each answer is correct.',
    icon: <Target size={20} className="text-green-500" />,
    type: 'quiz',
    duration: 180,
    tips: [
      'Take 3 separate 30-question quizzes',
      'After each question, READ THE EXPLANATION carefully',
      'Note patterns: ISACA always prefers governance over technical',
      'Practice the "MOST/BEST/FIRST" question technique',
      'Don\'t rush — understanding > speed at this stage',
    ],
    action: { label: 'Start Practice Quiz', path: '/study?tab=quiz' },
  },
  {
    id: 'weak-areas',
    hour: 'Hours 16-18',
    title: 'Weak Area Blitz',
    description: 'Based on your diagnostic + practice results, hammer your weakest areas.',
    icon: <Flame size={20} className="text-orange-500" />,
    type: 'review',
    duration: 180,
    tips: [
      'Go back to the domain where you scored lowest',
      'Re-read that domain\'s cheat sheet section',
      'Take a domain-specific quiz (10 questions)',
      'Review any questions you got wrong in previous quizzes',
      'Use the AI Tutor to explain concepts you don\'t understand',
    ],
    action: { label: 'Review Weak Areas', path: '/study?tab=quiz' },
  },
  {
    id: 'break3',
    hour: 'Hour 18',
    title: 'Short Break',
    description: 'Quick refresh. Stretch, splash water on face, quick snack.',
    icon: <Coffee size={20} className="text-amber-500" />,
    type: 'break',
    duration: 15,
    tips: ['Stay hydrated', 'Don\'t look at screens', 'Brief walk if possible'],
  },
  {
    id: 'mock-exam',
    hour: 'Hours 19-22',
    title: 'Full Mock Exam Under Pressure',
    description: 'Simulate the REAL exam: 90 questions, 150-minute timer, no peeking. This is your dress rehearsal.',
    icon: <Timer size={20} className="text-red-500" />,
    type: 'exam',
    duration: 180,
    tips: [
      'Set a 150-minute timer — NO extensions',
      'No cheat sheets, no looking things up',
      'Use the 3-pass technique: easy first, medium second, hard last',
      'Mark uncertain questions and come back',
      'NEVER leave a question blank',
      'After finishing, review ALL wrong answers with explanations',
    ],
    action: { label: 'Start Mock Exam', path: '/study?tab=quiz' },
  },
  {
    id: 'final-review',
    hour: 'Hours 22-23',
    title: 'Final Review — Wrong Answers Only',
    description: 'Go through every question you got wrong today. Understand the pattern of your mistakes.',
    icon: <RotateCcw size={20} className="text-indigo-500" />,
    type: 'review',
    duration: 60,
    tips: [
      'Review wrong answers from diagnostic AND mock exam',
      'Look for patterns: do you keep picking technical over governance?',
      'Re-read the ISACA Exam Tips cheat sheet section',
      'Make mental notes of the "FIRST/MOST/BEST" patterns',
    ],
    action: { label: 'Review Cheat Sheet', path: '/cheatsheet' },
  },
  {
    id: 'final-cram',
    hour: 'Hour 23-24',
    title: 'Last-Hour Power Cram',
    description: 'Quick-fire review of the absolute must-know facts. Then REST.',
    icon: <Star size={20} className="text-yellow-500" />,
    type: 'study',
    duration: 60,
    tips: [
      'Read through ALL "EXAM TIP" yellow boxes in the cheat sheet',
      'Recite: NIST AI RMF = Govern, Map, Measure, Manage',
      'Recite: ISO 42001 = PDCA: Plan, Do, Check, Act',
      'Recite: EU AI Act = Unacceptable, High, Limited, Minimal',
      'Remember: Governance > Management > Technical',
      'Remember: Business alignment FIRST, always',
      'Get 6-8 hours of sleep — sleep consolidates memory!',
      'DO NOT pull an all-nighter — you need your brain working',
    ],
    action: { label: 'Final Cheat Sheet Review', path: '/cheatsheet' },
  },
];

const STORAGE_KEY = 'aaism_cram_progress';

export default function CramMode() {
  const navigate = useNavigate();
  const [completedBlocks, setCompletedBlocks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedBlocks));
  }, [completedBlocks]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timer, timerRunning]);

  const toggleComplete = (id: string) => {
    setCompletedBlocks(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const startTimer = (minutes: number, blockId: string) => {
    setActiveBlock(blockId);
    setTimer(minutes * 60);
    setTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = Math.round((completedBlocks.length / CRAM_BLOCKS.length) * 100);
  const totalStudyHours = 24;
  const completedHours = Math.round(
    CRAM_BLOCKS.filter(b => completedBlocks.includes(b.id))
      .reduce((sum, b) => sum + b.duration, 0) / 60
  );

  const resetProgress = () => {
    if (confirm('Reset all cram mode progress?')) {
      setCompletedBlocks([]);
      setActiveBlock(null);
      setTimer(0);
      setTimerRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Flame size={32} className="text-red-500" />
          24-Hour Cram Mode
          <Flame size={32} className="text-orange-500" />
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Structured 24-hour study plan to maximize your AAISM exam score
        </p>
      </div>

      {/* Timer Banner */}
      {timerRunning && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-4 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer size={24} className="animate-pulse" />
            <div>
              <span className="text-sm opacity-80">
                {CRAM_BLOCKS.find(b => b.id === activeBlock)?.title}
              </span>
              <div className="text-3xl font-mono font-bold">{formatTime(timer)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              {timerRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => { setTimer(0); setTimerRunning(false); }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" /> Your Progress
          </h2>
          <button onClick={resetProgress} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Reset Progress
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{completedBlocks.length}/{CRAM_BLOCKS.length}</div>
            <div className="text-xs text-gray-500">Blocks Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedHours}h</div>
            <div className="text-xs text-gray-500">of ~{totalStudyHours}h</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{progress}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Cram Blocks */}
      <div className="space-y-3">
        {CRAM_BLOCKS.map((block) => {
          const isCompleted = completedBlocks.includes(block.id);
          const isActive = activeBlock === block.id && timerRunning;
          
          const typeColors: Record<string, string> = {
            study: 'border-l-blue-500',
            quiz: 'border-l-green-500',
            review: 'border-l-purple-500',
            break: 'border-l-amber-500',
            exam: 'border-l-red-500',
          };

          return (
            <div
              key={block.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${typeColors[block.type]} overflow-hidden transition-all ${
                isCompleted ? 'opacity-60' : ''
              } ${isActive ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Completion Toggle */}
                  <button
                    onClick={() => toggleComplete(block.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle size={22} className="text-green-500" />
                    ) : (
                      <Circle size={22} className="text-gray-300 dark:text-gray-600" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {block.icon}
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">
                        {block.hour}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">
                        {block.duration} min
                      </span>
                      {block.domain && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          block.domain === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          block.domain === 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}>
                          Domain {block.domain}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-bold ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                      {block.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{block.description}</p>

                    {/* Tips */}
                    <div className="mt-3 space-y-1">
                      {block.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Zap size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!isCompleted && (
                        <button
                          onClick={() => startTimer(block.duration, block.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Play size={12} /> Start Timer ({block.duration}m)
                        </button>
                      )}
                      {block.action && (
                        <button
                          onClick={() => navigate(block.action!.path)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {block.action.label} <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Motivation */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-200 dark:border-green-800 text-center">
        <Trophy size={32} className="mx-auto text-yellow-500 mb-2" />
        <h3 className="font-bold text-lg">You've Got This!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg mx-auto">
          The AAISM pass score is 450/800 (~56%). Focus on understanding the ISACA mindset: governance first, 
          business alignment always, and risk-based thinking. When in doubt, pick the most strategic answer.
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs">
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">D1: 31%</span>
          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">D2: 31%</span>
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">D3: 38%</span>
        </div>
      </div>
    </div>
  );
}
