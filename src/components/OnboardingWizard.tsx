import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Target, Calendar, ChevronRight, ChevronLeft, X, Cloud, Server,
} from 'lucide-react';
import { PLATFORM_NAME } from '../constants/platformBrand';
import { useApp } from '../context/AppContext';
import { useCert } from '../context/CertContext';
import { CERTIFICATIONS } from '../data/certifications';
import { loadAIConfig, saveAIConfig, defaultConfigs } from '../services/aiService';
import ProTierStrip from './ProTierStrip';

const ONBOARDED_KEY = 'aaism-onboarded';
export const ONBOARDING_HINT_KEY = 'aaism-onboarding-hint';

export type OnboardingHint = 'mission' | 'study' | 'intel' | 'agent' | 'command';

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
  const valid: OnboardingHint[] = ['mission', 'study', 'intel', 'agent', 'command'];
  return valid.includes(hint as OnboardingHint) ? (hint as OnboardingHint) : null;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'cert', title: 'Pick track' },
  { id: 'ai', title: 'Choose AI' },
  { id: 'launch', title: 'First win' },
] as const;

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { setExamDate } = useApp();
  const { activeCertId, setActiveCert } = useCert();
  const [step, setStep] = useState(0);
  const [aiChoice, setAiChoice] = useState<'groq' | 'ollama'>('groq');
  const [examDateInput, setExamDateInput] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const finish = (goMission = false) => {
    const config = loadAIConfig();
    saveAIConfig({ ...config, provider: aiChoice, ...defaultConfigs[aiChoice] });
    if (examDateInput) setExamDate(examDateInput);
    if (dontShowAgain) setOnboarded(true);
    setOnboardingHint('mission');
    onComplete();
    if (goMission) navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-elevated dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-theme overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-cockpit">{STEPS[step].title}</span>
            <span className="text-xs text-theme-faint ml-1">{step + 1}/{STEPS.length}</span>
          </div>
          <button
            onClick={() => finish(false)}
            className="p-1 text-theme-faint hover:text-cockpit-muted"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 py-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'bg-emerald-500 w-6' : i < step ? 'bg-emerald-300 w-2' : 'bg-gray-300 dark:bg-gray-600 w-2'
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-4 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="text-4xl mb-3">🛡️</div>
                <h2 className="text-xl font-bold text-cockpit mb-2">Welcome to {PLATFORM_NAME}</h2>
                <p className="text-sm text-cockpit-muted leading-relaxed">
                  One daily mission. Real questions. Pass faster — 60 seconds to your first win.
                </p>
              </div>
              <ProTierStrip compact showFreeCompare />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2 py-2">
              <p className="text-sm text-cockpit-muted mb-3">Which cert are you studying for?</p>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {CERTIFICATIONS.filter(c => c.status === 'active').map(cert => (
                  <button
                    key={cert.id}
                    type="button"
                    onClick={() => setActiveCert(cert.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      activeCertId === cert.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-theme hover:border-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cert.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-cockpit">{cert.shortName}</div>
                      <div className="text-xs text-theme-muted">{cert.vendor}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-cockpit-muted mb-2">
                Pick AI for missions &amp; tutor. Both free — bring your own key.
              </p>
              <button
                type="button"
                onClick={() => setAiChoice('groq')}
                className={`w-full p-4 rounded-xl border-2 text-left ${
                  aiChoice === 'groq' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-theme'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="font-semibold text-cockpit">Groq (Cloud)</div>
                    <div className="text-xs text-theme-muted">Fast · Free tier · API key in Settings</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAiChoice('ollama')}
                className={`w-full p-4 rounded-xl border-2 text-left ${
                  aiChoice === 'ollama' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-theme'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-purple-500" />
                  <div>
                    <div className="font-semibold text-cockpit">Ollama (Local)</div>
                    <div className="text-xs text-theme-muted">Private · Offline · Runs on your Mac</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-2 space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5 p-4">
                <p className="text-sm font-semibold text-cockpit flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  This is your daily command center
                </p>
                <p className="text-xs text-cockpit-muted mt-2 leading-relaxed">
                  Every day: one 25-minute mission — weak domain → read → quiz → lab.
                  That loop is the product. Everything else unlocks as you go.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Exam date (optional)
                </label>
                <input
                  type="date"
                  value={examDateInput}
                  onChange={e => setExamDateInput(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-elevated text-cockpit text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

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
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 text-sm text-cockpit-muted hover:bg-cockpit-track rounded-lg flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finish(true)}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                Start 5-min mission <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding(): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnboarded()) setShow(true);
  }, []);

  const dismiss = () => setShow(false);
  return [show, dismiss];
}
