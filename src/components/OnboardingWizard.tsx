import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, LayoutDashboard, Crosshair, Radar, PenLine,
  Calendar, ChevronRight, ChevronLeft, X, Cloud, Server,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { loadAIConfig, saveAIConfig, defaultConfigs } from '../services/aiService';

const ONBOARDED_KEY = 'aaism-onboarded';

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboarded(value = true): void {
  localStorage.setItem(ONBOARDED_KEY, value ? 'true' : 'false');
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'ai', title: 'Choose AI' },
  { id: 'tour', title: 'Quick Tour' },
  { id: 'exam', title: 'Exam Date' },
] as const;

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { setExamDate } = useApp();
  const [step, setStep] = useState(0);
  const [aiChoice, setAiChoice] = useState<'groq' | 'ollama'>('groq');
  const [examDateInput, setExamDateInput] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const finish = (skipped = false) => {
    if (!skipped && aiChoice) {
      const config = loadAIConfig();
      saveAIConfig({ ...config, provider: aiChoice, ...defaultConfigs[aiChoice] });
    }
    if (examDateInput) setExamDate(examDateInput);
    if (dontShowAgain) setOnboarded(true);
    onComplete();
  };

  const handleTourNav = (route: string) => {
    setOnboarded(true);
    onComplete();
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {STEPS[step].title}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <button
            onClick={() => finish(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-emerald-500 w-6' : i < step ? 'bg-emerald-300' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-4 min-h-[280px]">
          {step === 0 && (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">🛡️</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to AAISM Intelligence Platform
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Your mission control for ISACA AAISM exam prep — AI tutors, intel feeds,
                timed exam sims, and domain readiness tracking. Let&apos;s get you set up in 60 seconds.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pick your AI provider. Both are free — Groq is cloud-fast, Ollama runs locally.
              </p>
              <button
                onClick={() => setAiChoice('groq')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  aiChoice === 'groq'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Groq (Cloud)</div>
                    <div className="text-xs text-gray-500">Free API · Fast inference · Needs API key</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setAiChoice('ollama')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  aiChoice === 'ollama'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-purple-500" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Ollama (Local)</div>
                    <div className="text-xs text-gray-500">Runs on your machine · Fully offline · Private</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleTourNav('/settings')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Configure API keys in Settings →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 py-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Four ops zones — tap to explore:
              </p>
              {[
                { icon: LayoutDashboard, label: 'Command Center', sub: 'Readiness HUD & throttles', route: '/', color: 'text-emerald-500' },
                { icon: Crosshair, label: 'Study Ops', sub: 'Quiz, flashcards, AI tutor', route: '/study', color: 'text-orange-500' },
                { icon: Radar, label: 'Intel Hub', sub: 'Threat intel & trap radar', route: '/intel', color: 'text-cyan-500' },
                { icon: PenLine, label: 'Content Studio', sub: 'Generate study content', route: '/studio', color: 'text-violet-500' },
              ].map(item => (
                <button
                  key={item.route}
                  onClick={() => handleTourNav(item.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all text-left group"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.sub}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
                </button>
              ))}
              <button
                onClick={() => handleTourNav('/agent')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Bot className="w-3 h-3" /> Also check Agent Discovery →
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When is your AAISM exam? We&apos;ll show a countdown on Command Center. Optional — skip if undecided.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Exam Date
                </label>
                <input
                  type="date"
                  value={examDateInput}
                  onChange={e => setExamDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="rounded border-gray-300"
            />
            Don&apos;t show again
          </label>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => finish(false)}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                Launch <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hook to show onboarding on first visit */
export function useOnboarding(): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnboarded()) setShow(true);
  }, []);

  const dismiss = () => setShow(false);
  return [show, dismiss];
}
