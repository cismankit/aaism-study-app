import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, ChevronDown, ChevronUp, Rocket, Settings, ClipboardCheck,
  Crosshair, Theater, Bot, Briefcase, Radar, BookOpen, Lightbulb, Globe,
  Shield,
} from 'lucide-react';
import { GEMMA4_BLOG_URL, AI_CONFIG_STORAGE_KEY } from '../services/aiService';
import PageHeader from '../components/PageHeader';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I add a Groq API key?',
    answer:
      'Open Settings (/settings) → Settings tab → select Groq as provider. Get a free key at console.groq.com, paste it in the Groq API Key field, and click Save. Keys are stored in browser localStorage (aaism-ai-config) only — never sent to AAISM servers. Use Test Connection to verify.',
  },
  {
    question: 'Gemma 4 for offline agents — what should I pull?',
    answer:
      'Gemma 4 (Apr 2026, Apache 2.0) is on Ollama with native JSON output and function calling — ideal for Agent Discovery. Pull gemma4:e4b for edge/agent JSON work or gemma4:31b for best quality. See the Google Gemma 4 blog and Settings → Offline Model Manager for pull commands.',
  },
  {
    question: 'What is AAISM?',
    answer:
      'AAISM is an AI Security Intelligence study platform built for AAISM exam prep. It combines practice questions, scenario labs, agent discovery workflows, playbooks, and intel feeds in one OSINT-themed workspace.',
  },
  {
    question: 'Do I need an account or internet connection?',
    answer:
      'No account is required. Progress, flashcards, and settings are stored locally in your browser. AI features need an API key and network access when you enable them in Settings.',
  },
  {
    question: 'How do I configure AI features?',
    answer:
      'Open Settings from the top bar or sidebar footer, go to the Settings tab, and enter your provider API key (OpenAI, Anthropic, etc.). AI powers tutoring, scenario feedback, and agent discovery — all optional.',
  },
  {
    question: 'Where does my study progress live?',
    answer:
      'Quiz attempts, XP, streaks, and achievements are saved in browser local storage on your device. Clearing site data will reset progress — export or note scores if you need a backup.',
  },
  {
    question: 'Can I request a custom feature?',
    answer:
      'Yes — use the in-app Feature Request form for tiered support and My Updates tracking, or open a GitHub issue for general suggestions.',
  },
  {
    question: 'Is this affiliated with ISACA or the official AAISM exam?',
    answer:
      'No. AAISM Study App is an independent community project. Always verify against official ISACA materials and exam policies.',
  },
  {
    question: 'What data does AAISM store? (Privacy policy)',
    answer:
      'Study progress, AI keys, agent leads, community votes, and RSS cache live in browser localStorage only — nothing is sent to AAISM servers. LLM prompts go directly to Groq/Ollama from your browser. RSS feeds use public read-only proxies. See the full Data & Privacy page at /privacy.',
  },
];

const appAreas = [
  { to: '/study', icon: Crosshair, label: 'Study Ops', desc: 'Domain quizzes, flashcards, and exam mode' },
  { to: '/scenarios', icon: Theater, label: 'Scenario Lab', desc: 'Interactive case studies and pattern drills' },
  { to: '/agent', icon: Bot, label: 'Agent Discovery', desc: 'Review AI-generated question leads' },
  { to: '/playbooks', icon: Briefcase, label: 'Playbooks', desc: 'Org-level AI security implementation guides' },
  { to: '/intel', icon: Radar, label: 'Intel Hub', desc: 'Community intelligence and topic heat maps' },
  { to: '/osint', icon: Globe, label: 'OSINT Arsenal', desc: 'Curated practitioner-grade intelligence source directory' },
];

const gettingStartedSteps = [
  { step: 1, title: 'Take a baseline quiz', body: 'Start in Study Ops → pick a domain and run a short quiz to see where you stand.' },
  { step: 2, title: 'Explore Scenario Lab', body: 'Work through case studies to connect concepts to real-world AI security decisions.' },
  { step: 3, title: 'Skim a Playbook', body: 'Pick a starter playbook to understand how exam topics map to enterprise workflows.' },
  { step: 4, title: 'Enable AI (optional)', body: 'Add your API key in Settings for tutoring and deeper scenario feedback.' },
  { step: 5, title: 'Use Cram Mode before exam day', body: 'Run 24h Cram Mode for a focused last-minute review pass.' },
];

const examChecklist = [
  'Review all five AAISM domains at least once',
  'Complete at least two full timed practice sessions',
  'Memorize key distinctions (training vs inference attacks, governance vs technical controls)',
  'Run through Quick Ref / Cheat Sheet the night before',
  'Confirm exam logistics (ID, time zone, proctoring rules) via ISACA',
  'Get sleep — cramming all night hurts recall more than one more quiz',
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.question}
            className="bg-theme-elevated rounded-xl border border-theme overflow-hidden osint-widget"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-sm sm:text-base">{faq.question}</span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-cockpit-muted leading-relaxed border-t border-theme pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContactSection() {
  return (
    <div className="bg-theme-elevated rounded-xl border border-theme p-5 osint-widget space-y-4">
      <h3 className="font-semibold text-sm">Need more help?</h3>
      <p className="text-sm text-gray-400">
        Bug reports and GitHub community links are on the Support page. Paid feature requests use the dedicated form.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/support"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          Support &amp; bug reports
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </Link>
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Shield className="w-4 h-4" /> Data &amp; privacy
        </Link>
        <Link
          to="/feature-request"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Feature request form
        </Link>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        icon={HelpCircle}
        title="Help Center"
        subtitle="Getting started, FAQs, and exam prep — bugs and features go to Support or Feature Request."
      />

      {/* Getting Started */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold">Getting Started</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gettingStartedSteps.map(item => (
            <div
              key={item.step}
              className="bg-theme-elevated rounded-xl border border-theme p-4 osint-widget"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xs font-bold mb-2">
                {item.step}
              </div>
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-theme-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App Areas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Key App Areas</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {appAreas.map(area => {
            const Icon = area.icon;
            return (
              <Link
                key={area.to}
                to={area.to}
                className="flex items-center gap-3 p-3 rounded-xl bg-theme-elevated border border-theme hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group osint-widget"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{area.label}</div>
                  <div className="text-xs text-theme-muted truncate">{area.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* AI Settings */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20 p-5">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Configure AI in Settings</h2>
              <p className="text-sm text-cockpit-muted mb-3">
                AI features are opt-in. Navigate to <strong>Settings → Settings tab</strong>, choose your provider, and paste your API key.
                Keys stay in your browser only (<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{AI_CONFIG_STORAGE_KEY}</code> in localStorage) — never sent to our servers.
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Open Settings
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-emerald-500/10">
              <h3 className="font-medium text-sm mb-2">How to add Groq API key</h3>
              <ol className="text-sm text-cockpit-muted space-y-1 list-decimal list-inside">
                <li>Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">console.groq.com</a></li>
                <li>Open <Link to="/settings" className="text-emerald-600 hover:underline">Settings</Link> → Settings tab → select Groq</li>
                <li>Paste your key, pick a model, Save, then Test Connection</li>
              </ol>
            </div>

            <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-violet-500/10">
              <h3 className="font-medium text-sm mb-2">Gemma 4 for offline agents</h3>
              <p className="text-sm text-cockpit-muted">
                Gemma 4 (Apr 2026) runs locally via Ollama with native JSON and agentic workflows.
                Pull <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">gemma4:e4b</code> or{' '}
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">gemma4:31b</code> in Settings → Offline Model Manager.{' '}
                <a href={GEMMA4_BLOG_URL} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
                  Read the Google Gemma 4 blog →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Checklist */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Exam Day Checklist</h2>
        </div>
        <ul className="bg-theme-elevated rounded-xl border border-theme p-5 space-y-2 osint-widget">
          {examChecklist.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-cockpit-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        </div>
        <FAQAccordion />
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <ContactSection />
      </section>
    </div>
  );
}
