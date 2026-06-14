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
  item => item.status === 'planned' || item.status === 'exploring',
);
