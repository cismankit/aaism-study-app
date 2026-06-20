/**
 * Learn · Work · Earn · Invest · Connect — five-pillar agent council for Aegis missions.
 * Maps mission phases to LLM backends and platform routes (no placeholder cards).
 */

import type { OpsAgentId } from '../services/opsAgentService';

export type LearnWorkEarnPillar = 'learn' | 'work' | 'earn' | 'invest' | 'connect';

export type MissionTaskId = 'read' | 'quiz' | 'lab' | 'intel';

export interface LearnWorkEarnRoute {
  label: string;
  to: string;
}

export interface LearnWorkEarnAgent {
  id: LearnWorkEarnPillar;
  name: string;
  codename: string;
  pillarLabel: string;
  role: string;
  description: string;
  accent: string;
  borderAccent: string;
  bgAccent: string;
  /** LLM backend for orchestration handoff */
  llmBackend: OpsAgentId | 'career';
  orchestrationPhase: string;
  /** Human-readable output label shown in agent council strip */
  produces: string;
  routes: LearnWorkEarnRoute[];
  /** Mission dashboard task this agent owns during the active loop */
  missionTask?: MissionTaskId;
}

export const LEARN_WORK_EARN_AGENTS: LearnWorkEarnAgent[] = [
  {
    id: 'invest',
    name: 'Strategist',
    codename: 'Invest',
    pillarLabel: 'Invest',
    role: 'Cert ROI & domain priority',
    description: 'Weighs exam domain weights, weak scores, and readiness ROI to pick today\'s focus.',
    accent: 'text-violet-600 dark:text-violet-400',
    borderAccent: 'border-violet-500/40',
    bgAccent: 'bg-violet-50/50 dark:bg-violet-500/10',
    llmBackend: 'claude-analyst',
    orchestrationPhase: 'prioritize',
    produces: 'Domain priority brief',
    routes: [
      { label: 'Domain guides', to: '/knowledge' },
      { label: 'Exam sim', to: '/exam' },
    ],
  },
  {
    id: 'learn',
    name: 'Scholar',
    codename: 'Learn',
    pillarLabel: 'Learn',
    role: 'KB curation & micro-quiz',
    description: 'Selects knowledge-base topics and bank questions aligned to weak areas.',
    accent: 'text-blue-600 dark:text-blue-400',
    borderAccent: 'border-blue-500/40',
    bgAccent: 'bg-blue-50/50 dark:bg-blue-500/10',
    llmBackend: 'claude-analyst',
    orchestrationPhase: 'curate',
    produces: 'Read list + quiz set',
    routes: [
      { label: 'Knowledge Base', to: '/knowledge' },
      { label: 'Practice drills', to: '/study?tab=quiz' },
    ],
    missionTask: 'read',
  },
  {
    id: 'work',
    name: 'Hermes',
    codename: 'Work',
    pillarLabel: 'Work',
    role: 'Ops lab & hands-on drills',
    description: 'Picks the ops lab step that proves domain knowledge under pressure.',
    accent: 'text-cyan-600 dark:text-cyan-400',
    borderAccent: 'border-cyan-500/40',
    bgAccent: 'bg-cyan-50/50 dark:bg-cyan-500/10',
    llmBackend: 'hermes',
    orchestrationPhase: 'ops',
    produces: 'Lab step assignment',
    routes: [
      { label: 'Ops Lab', to: '/ops' },
      { label: 'Team packs', to: '/packs' },
    ],
    missionTask: 'lab',
  },
  {
    id: 'connect',
    name: 'OpenClaw',
    codename: 'Connect',
    pillarLabel: 'Connect',
    role: 'Live intel & community heat',
    description: 'Pulls RSS headlines and community exam heat for the focus domain.',
    accent: 'text-orange-600 dark:text-orange-400',
    borderAccent: 'border-orange-500/40',
    bgAccent: 'bg-orange-50/50 dark:bg-orange-500/10',
    llmBackend: 'openclaw',
    orchestrationPhase: 'intel',
    produces: 'Intel brief + heat map',
    routes: [
      { label: 'Intel Hub', to: '/intel' },
      { label: 'Career intel', to: '/career' },
    ],
    missionTask: 'intel',
  },
  {
    id: 'earn',
    name: 'Scout',
    codename: 'Earn',
    pillarLabel: 'Earn',
    role: 'Career signals & outreach',
    description: 'Maps cert progress to job-market signals and community credibility plays.',
    accent: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-emerald-500/40',
    bgAccent: 'bg-emerald-50/50 dark:bg-emerald-500/10',
    llmBackend: 'career',
    orchestrationPhase: 'earn',
    produces: 'Career tie-in action',
    routes: [
      { label: 'Career OSINT', to: '/career' },
      { label: 'Agent gaps', to: '/agent' },
    ],
    missionTask: 'quiz',
  },
];

/** Orchestration order: ROI → study → ops → intel → career */
export const MISSION_HANDOFF_ORDER: LearnWorkEarnPillar[] = [
  'invest',
  'learn',
  'work',
  'connect',
  'earn',
];

export function getLearnWorkEarnAgent(id: LearnWorkEarnPillar): LearnWorkEarnAgent {
  return LEARN_WORK_EARN_AGENTS.find(a => a.id === id) ?? LEARN_WORK_EARN_AGENTS[0];
}

export function getAgentForMissionTask(task: MissionTaskId): LearnWorkEarnAgent {
  return LEARN_WORK_EARN_AGENTS.find(a => a.missionTask === task)
    ?? getLearnWorkEarnAgent('learn');
}

export function resolveLlmBackend(pillar: LearnWorkEarnPillar): OpsAgentId {
  const backend = getLearnWorkEarnAgent(pillar).llmBackend;
  if (backend === 'career') return 'claude-analyst';
  return backend;
}

export interface StudyModeDefinition {
  id: 'mission' | 'exam' | 'practice';
  label: string;
  tagline: string;
  description: string;
  route: string;
  duration: string;
  agentMode: 'multi-agent council' | 'solo timed proof' | 'self-serve drills';
}

export const STUDY_MODE_DEFINITIONS: StudyModeDefinition[] = [
  {
    id: 'mission',
    label: 'Mission',
    tagline: 'Guided multi-agent daily loop',
    description: 'Five agents hand off: Invest picks focus → Learn curates → Work assigns lab → Connect pulls intel → Earn ties career.',
    route: '/',
    duration: '~25 min',
    agentMode: 'multi-agent council',
  },
  {
    id: 'exam',
    label: 'Exam',
    tagline: 'Solo timed proof',
    description: 'Full exam simulation with timer, flagging, and score breakdown — no agent hand-holding.',
    route: '/exam',
    duration: 'Timed',
    agentMode: 'solo timed proof',
  },
  {
    id: 'practice',
    label: 'Practice',
    tagline: 'Self-serve drills',
    description: 'Pick domain, difficulty, and question count. Drill weak spots on your schedule.',
    route: '/study?tab=quiz',
    duration: 'Flexible',
    agentMode: 'self-serve drills',
  },
];

export function buildLearnWorkEarnPromptBlock(): string {
  const lines = LEARN_WORK_EARN_AGENTS.map(
    a => `- **${a.pillarLabel} (${a.name})** — ${a.role}. Produces: ${a.produces}.`,
  ).join('\n');
  return `## Learn · Work · Earn · Invest · Connect agent council
Mission orchestration runs five specialist agents in sequence:
${lines}
Each handoff builds on prior output and user cert memory. Stay concise; output feeds the next phase.`;
}
