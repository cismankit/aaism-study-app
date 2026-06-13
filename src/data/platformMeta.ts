export interface StudyPath {
  id: string;
  name: string;
  duration: string;
  description: string;
  steps: Array<{ label: string; route: string; detail: string }>;
  icon: 'cram' | 'deep' | 'org';
}

export interface PlatformWorkflow {
  id: string;
  title: string;
  summary: string;
  howItHelps: string;
  route: string;
  tips: string[];
}

export interface PlatformMetaSection {
  id: string;
  title: string;
  content: string;
}

export const STUDY_PATHS: StudyPath[] = [
  {
    id: 'exam-cram',
    name: 'Exam Cram (2–4 weeks)',
    duration: '2–4 weeks',
    description: 'Focused pass strategy — hit high-yield domains, traps, and pattern drills.',
    icon: 'cram',
    steps: [
      { label: 'Domain Guides', route: '/knowledge', detail: 'Skim D1–D4 learning objectives and trap alerts' },
      { label: '24h Cram Mode', route: '/cram', detail: 'High-yield rapid review before exam day' },
      { label: 'Trap Radar', route: '/intel', detail: 'Memorize common wrong-answer bait patterns' },
      { label: 'BEST/MOST/FIRST Drills', route: '/scenarios', detail: 'Pattern recognition under time pressure' },
      { label: 'Timed Quizzes', route: '/study', detail: 'Domain-filtered practice with pacing' },
    ],
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning (6–8 weeks)',
    duration: '6–8 weeks',
    description: 'Build durable understanding — frameworks, scenarios, and visual references.',
    icon: 'deep',
    steps: [
      { label: 'Domain Guides', route: '/knowledge', detail: 'Read all core concepts and apply-it scenarios' },
      { label: 'Visual Knowledge Hub', route: '/knowledge/visual', detail: 'Diagrams for NIST, EU AI Act, attacks' },
      { label: 'Study Ops by Domain', route: '/study', detail: 'Chapter-by-chapter with explanations' },
      { label: 'Scenario Lab', route: '/scenarios', detail: 'Full case studies and judgment building' },
      { label: 'Agent Discovery', route: '/agent', detail: 'Expand question bank with curated intel' },
    ],
  },
  {
    id: 'org-implementation',
    name: 'Org Implementation',
    duration: 'Ongoing',
    description: 'Translate AAISM knowledge into enterprise AI security program actions.',
    icon: 'org',
    steps: [
      { label: 'Playbooks', route: '/playbooks', detail: 'Phased implementation guides for your org' },
      { label: 'Domain 1 Governance', route: '/knowledge?domain=1', detail: 'Policy, roles, and regulatory mapping' },
      { label: 'Risk Assessment (D2)', route: '/knowledge?domain=2', detail: 'Threat models and risk treatment' },
      { label: 'Secure SDLC (D3)', route: '/knowledge?domain=3', detail: 'Pipeline controls and validation gates' },
      { label: 'Operations (D4)', route: '/knowledge?domain=4', detail: 'Monitoring, incidents, decommissioning' },
    ],
  },
];

export const PLATFORM_WORKFLOWS: PlatformWorkflow[] = [
  {
    id: 'command-center',
    title: 'Command Center',
    summary: 'Your mission dashboard — readiness, threats, and quick actions.',
    howItHelps: 'See domain readiness scores, rising threats, trap alerts, and jump to study modes in one view.',
    route: '/',
    tips: [
      'Check Domain Readiness before each study session — attack lowest scores first.',
      'Rising Threats reflect community intel heat map — high-yield exam topics.',
      'Use Quick Scenarios for 5-minute BEST/MOST/FIRST warmups.',
    ],
  },
  {
    id: 'study-ops',
    title: 'Study Ops',
    summary: 'Practice questions organized by domain and chapter with analytics.',
    howItHelps: 'Build accuracy and pacing with filtered quizzes, explanations, and progress tracking.',
    route: '/study',
    tips: [
      'Filter by weak domain from Dashboard analytics.',
      'Read explanations even when correct — they encode exam logic.',
      'Use timed mode in the final two weeks before exam.',
    ],
  },
  {
    id: 'intel-hub',
    title: 'Intel Hub',
    summary: 'Community intelligence — trap patterns, heat maps, and question trends.',
    howItHelps: 'Avoid common wrong answers and focus on high-frequency exam topics.',
    route: '/intel',
    tips: [
      'Review trap patterns weekly — they mirror ISACA distractor design.',
      'Topic heat map shows rising domains; prioritize D2 LLM threats.',
      'Cross-reference traps with Domain Guides for context.',
    ],
  },
  {
    id: 'agent-discovery',
    title: 'Agent Discovery',
    summary: 'AI-assisted pipeline that discovers and curates new study content.',
    howItHelps: 'Expands the question bank with approved leads from frameworks, CVEs, and exam trends.',
    route: '/agent',
    tips: [
      'Review pending leads regularly — approve high-quality additions.',
      'Agent follows NIST/OWASP sources for relevance.',
      'Approved questions flow into Study Ops automatically.',
    ],
  },
  {
    id: 'scenario-lab',
    title: 'Scenario Lab',
    summary: 'Interactive case studies and keyword pattern drills.',
    howItHelps: 'Builds judgment for scenario-based exam questions — the hardest question type.',
    route: '/scenarios',
    tips: [
      'Start with BEST/MOST/FIRST drills before full scenarios.',
      'Verbalize why wrong answers are wrong — strengthens recall.',
      'Link scenarios to Domain Guide "Apply it" sections.',
    ],
  },
  {
    id: 'playbooks',
    title: 'Implementation Playbooks',
    summary: 'Org-level phased guides for AI security program rollout.',
    howItHelps: 'Bridges exam knowledge to real-world implementation — valuable for consultants and CISOs.',
    route: '/playbooks',
    tips: [
      'Use Org Implementation study path as your roadmap.',
      'Each playbook maps to AAISM domains — track coverage.',
      'Customize phases to your org size and maturity.',
    ],
  },
];

export const PLATFORM_META_SECTIONS: PlatformMetaSection[] = [
  {
    id: 'how-to-use',
    title: 'How to Use This Platform to Master AAISM',
    content:
      'AAISM Intelligence Platform is structured around the four exam domains. Start with Domain Guides for conceptual foundation, use Study Ops for retrieval practice, Intel Hub for trap avoidance, and Scenario Lab for judgment. Command Center ties it together with readiness metrics. For exam cram, invert the order: traps → drills → timed quizzes → domain skim.',
  },
  {
    id: 'exam-alignment',
    title: 'Exam Alignment Note',
    content:
      'The official AAISM exam has three scored domains (D1 Governance 31%, D2 Risk 31%, D3 Technologies & Controls 38%). Operations and monitoring content appears within D3 on the exam. This platform uses four learning modules (D1–D4) to separate operations for clarity — D4 maps to the operations portion of exam D3.',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant & Tutor',
    content:
      'When configured with an API key (see Help Center), the AI tutor uses the knowledge base for grounded answers. It searches domain guides, glossary, and exam content before responding. Use it to explain wrong answers and generate practice scenarios — not as a substitute for studying primary materials.',
  },
  {
    id: 'progress-tracking',
    title: 'Progress & Gamification',
    content:
      'XP, streaks, and domain scores reflect quiz performance over time. Domain Readiness on Command Center averages recent scores per domain. Achievements reward consistency. Progress is stored locally in your browser — export or note scores if switching devices.',
  },
];

export const LEARNING_PATH_WIDGET = {
  title: 'Learning Paths',
  subtitle: 'Domain mastery routes',
  description: 'Pick a path: exam cram, deep learning, or org implementation.',
  ctaRoute: '/knowledge',
  ctaLabel: 'Open Domain Guides',
};
