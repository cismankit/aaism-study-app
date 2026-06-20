export interface RoadmapItem {
  id: string;
  title: string;
  summary: string;
  status: 'planned' | 'in-progress' | 'exploring' | 'shipped' | 'partial';
}

export const PLATFORM_ROADMAP: RoadmapItem[] = [
  {
    id: 'content-studio',
    title: 'Content Studio',
    summary: 'Generate LinkedIn posts, YouTube scripts, GitHub READMEs, and threads from AAISM study intel — powered by free LLMs.',
    status: 'shipped',
  },
  {
    id: 'exam-timed-mode',
    title: 'Exam sim timed mode',
    summary: 'Full 90-question / 150-minute simulation with pacing alerts, flagging, pause, and domain breakdown.',
    status: 'shipped',
  },
  {
    id: 'progress-sync',
    title: 'Progress sync',
    summary: 'Unified progress store with export and restore of quiz scores, exam attempts, streaks, and domain readiness.',
    status: 'shipped',
  },
  {
    id: 'onboarding-wizard',
    title: 'Onboarding wizard',
    summary: 'First-visit guided setup — AI provider choice, platform tour, and optional exam date.',
    status: 'shipped',
  },
  {
    id: 'remediation-ui',
    title: 'Post-quiz remediation',
    summary: 'Missed-concept panels with knowledge links, playbooks, and similar-question drills after quizzes and exams.',
    status: 'shipped',
  },
  {
    id: 'global-search',
    title: 'Global search (⌘K)',
    summary: 'Command palette to search pages, knowledge topics, OSINT sources, and playbooks.',
    status: 'shipped',
  },
  {
    id: 'multi-model-ensemble',
    title: 'Multi-model agent ensemble',
    summary: 'Discover on Groq, validate with Ollama critic — dual-model Agent Discovery in Settings Advanced.',
    status: 'shipped',
  },
  {
    id: 'community-voting',
    title: 'Community question voting',
    summary: 'Upvote agent-discovered leads and flag weak questions for review.',
    status: 'shipped',
  },
  {
    id: 'mobile-pwa',
    title: 'Mobile PWA',
    summary: 'Installable offline shell with cached study content, service worker, and dismissible install banner.',
    status: 'shipped',
  },
  {
    id: 'content-queue',
    title: 'Content Studio queue',
    summary: 'Draft → approved → exported workflow with localStorage queue panel in Content Studio.',
    status: 'shipped',
  },
  {
    id: 'playbook-export',
    title: 'Playbook audit export',
    summary: 'Structured audit evidence checklist as markdown bundle or print-ready PDF from playbook phases.',
    status: 'shipped',
  },
  {
    id: 'groq-rate-limit',
    title: 'Groq client rate limit',
    summary: 'Client-side throttle (30 calls/min) in aiService to prevent free-tier burst errors.',
    status: 'shipped',
  },
  {
    id: 'route-code-split',
    title: 'Route code splitting',
    summary: 'React.lazy for Exam, Content Studio, and Agent Discovery to reduce initial bundle size.',
    status: 'shipped',
  },
  {
    id: 'theme-tokens',
    title: 'App-wide theme tokens',
    summary: 'Semantic light/dark tokens (text-cockpit, bg-theme-elevated, border-theme) replacing hardcoded gray classes.',
    status: 'shipped',
  },
  {
    id: 'micro-quiz-modal',
    title: 'Domain micro-quiz modal',
    summary: 'In-app 3-question drill modal on Command Center for weak domains (<60%) with remediation on completion.',
    status: 'shipped',
  },
  {
    id: 'auth-cloud-sync',
    title: 'Auth & cloud sync',
    summary: 'In-app Supabase config, sign-in scaffold, cloud blob push/pull, and latest-wins merge for progress.',
    status: 'shipped',
  },
  {
    id: 'payments-mvp',
    title: 'Payments MVP',
    summary: 'In-app Stripe/Razorpay checkout config, hosted URLs, success/cancel return pages, and security callouts.',
    status: 'shipped',
  },
  {
    id: 'integrations-settings',
    title: 'Settings → Integrations',
    summary: 'Configure Supabase sync and payment checkout URLs in-app — localStorage only, env vars as fallback.',
    status: 'shipped',
  },
  {
    id: 'system-health',
    title: 'System health alerts',
    summary: 'Dismissible banners for Ollama offline, sync failures, payment misconfig, and Supabase connectivity.',
    status: 'shipped',
  },
  {
    id: 'multi-cert-platform',
    title: 'Multi-cert Swiss Knife',
    summary: 'Cert registry, global switcher, cert-filtered questions, KB, exam format, and agent prompts across cybersecurity, AI, blockchain, and quantum tracks.',
    status: 'shipped',
  },
  {
    id: 'question-bank-300',
    title: '300+ question bank',
    summary: 'Expanded exam-realistic questions across D1–D4 with varied difficulty in bulk question bank.',
    status: 'shipped',
  },
];

export const ROADMAP_STATUS_LABEL: Record<RoadmapItem['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  exploring: 'Exploring',
  shipped: 'Shipped',
  partial: 'Partial',
};

/** Remaining backlog — ready for next implementation agent */
export const PHASE_2_ITEMS: RoadmapItem[] = PLATFORM_ROADMAP.filter(
  item => item.status === 'planned' || item.status === 'exploring' || item.status === 'partial',
);
