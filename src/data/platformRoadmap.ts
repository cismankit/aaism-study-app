export interface RoadmapItem {
  id: string;
  title: string;
  summary: string;
  status: 'planned' | 'in-progress' | 'exploring';
}

export const PLATFORM_ROADMAP: RoadmapItem[] = [
  {
    id: 'multi-model-ensemble',
    title: 'Multi-model agent ensemble',
    summary: 'Run Qwen + Gemma in parallel for discovery, then merge and dedupe the best questions.',
    status: 'exploring',
  },
  {
    id: 'exam-timed-mode',
    title: 'Exam sim timed mode',
    summary: 'Full 90-question / 150-minute simulation with pacing alerts and domain breakdown.',
    status: 'planned',
  },
  {
    id: 'progress-sync',
    title: 'Progress sync',
    summary: 'Export and restore quiz scores, streaks, and domain readiness across devices.',
    status: 'planned',
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
};
