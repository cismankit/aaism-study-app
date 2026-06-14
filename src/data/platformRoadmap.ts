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
    summary: 'Run Qwen + Gemma in parallel for discovery, then merge and dedupe the best questions.',
    status: 'exploring',
  },
  {
    id: 'mobile-pwa',
    title: 'Mobile PWA',
    summary: 'Installable offline shell with cached study content and push-ready architecture.',
    status: 'exploring',
  },
  {
    id: 'community-voting',
    title: 'Community question voting',
    summary: 'Upvote agent-discovered leads and flag weak questions for review.',
    status: 'planned',
  },
];

export const ROADMAP_STATUS_LABEL: Record<RoadmapItem['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  exploring: 'Exploring',
  shipped: 'Shipped',
  partial: 'Partial',
};

/** Phase 2 backlog — ready for next implementation agent */
export const PHASE_2_ITEMS: RoadmapItem[] = PLATFORM_ROADMAP.filter(
  item => item.status === 'planned' || item.status === 'exploring',
);
