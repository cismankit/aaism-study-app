import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, LayoutDashboard, Crosshair, Radar, PenLine,
  Calendar, ChevronRight, ChevronLeft, X, Cloud, Server,
} from 'lucide-react';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../constants/platformBrand';
import { useApp } from '../context/AppContext';
import { loadAIConfig, saveAIConfig, defaultConfigs } from '../services/aiService';

const ONBOARDED_KEY = 'aaism-onboarded';
export const ONBOARDING_HINT_KEY = 'aaism-onboarding-hint';

export type OnboardingHint = 'study' | 'intel' | 'studio' | 'agent' | 'command';

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboarded(value = true): void {
  localStorage.setItem(ONBOARDED_KEY, value ? 'true' : 'false');
}

export function setOnboardingHint(hint: OnboardingHint): void {
  localStorage.setItem(ONBOARDING_HINT_KEY, hint);
}

export function consumeOnboardingHint(): OnboardingHint | null {
  const hint = localStorage.getItem(ONBOARDING_HINT_KEY);
  localStorage.removeItem(ONBOARDING_HINT_KEY);
  const valid: OnboardingHint[] = ['study', 'intel', 'studio', 'agent', 'command'];
  return valid.includes(hint as OnboardingHint) ? (hint as OnboardingHint) : null;
}

const ROUTE_ONBOARDING_HINT: Record<string, OnboardingHint> = {
  '/': 'command',
  '/study': 'study',
  '/intel': 'intel',
  '/studio': 'studio',
  '/agent': 'agent',
};

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
    setOnboardingHint('study');
    onComplete();
  };

  const handleTourNav = (route: string) => {
    setOnboarded(true);
    setOnboardingHint(ROUTE_ONBOARDING_HINT[route] ?? 'study');
    onComplete();
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-elevated dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-theme overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-cockpit">
              {STEPS[step].title}
            </span>
            <span className="text-xs text-theme-faint ml-1">
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <button
            onClick={() => finish(true)}
            className="p-1 text-theme-faint hover:text-cockpit-muted dark:hover:text-gray-200"
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
              <h2 className="text-xl font-bold text-cockpit mb-2">
                Welcome to {PLATFORM_NAME}
              </h2>
              <p className="text-sm text-cockpit-muted leading-relaxed">
                {PLATFORM_TAGLINE} — multi-cert study, AI tutors, intel feeds,
                timed exam sims, and domain readiness tracking. Let&apos;s get you set up in 60 seconds.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-cockpit-muted mb-4">
                Pick your AI provider. Both are free — Groq is cloud-fast, Ollama runs locally.
              </p>
              <button
                onClick={() => setAiChoice('groq')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  aiChoice === 'groq'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-theme hover:border-theme'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="font-semibold text-cockpit">Groq (Cloud)</div>
                    <div className="text-xs text-theme-muted">Free API · Fast inference · Needs API key</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setAiChoice('ollama')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  aiChoice === 'ollama'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-theme hover:border-theme'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-purple-500" />
                  <div>
                    <div className="font-semibold text-cockpit">Ollama (Local)</div>
                    <div className="text-xs text-theme-muted">Runs on your machine · Fully offline · Private</div>
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
              <p className="text-sm text-cockpit-muted mb-3">
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-theme hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all text-left group"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cockpit">{item.label}</div>
                    <div className="text-xs text-theme-muted">{item.sub}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-theme-faint group-hover:text-emerald-500" />
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
              <p className="text-sm text-cockpit-muted">
                When is your AAISM exam? We&apos;ll show a countdown on Command Center. Optional — skip if undecided.
              </p>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Exam Date
                </label>
                <input
                  type="date"
                  value={examDateInput}
                  onChange={e => setExamDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-elevated text-cockpit focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-theme-muted cursor-pointer">
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
                className="px-4 py-2 text-sm text-cockpit-muted hover:bg-cockpit-track dark:hover:bg-gray-800 rounded-lg flex items-center gap-1"
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
