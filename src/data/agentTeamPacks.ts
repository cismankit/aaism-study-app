import type { OpsAgentId } from '../services/opsAgentService';

export interface TeamPackStep {
  id: string;
  label: string;
  description: string;
}

export interface TeamPackRoute {
  path: string;
  label: string;
}

export interface TeamPack {
  id: string;
  name: string;
  icon: 'radar' | 'pen-line' | 'briefcase' | 'zap' | 'life-buoy' | 'globe';
  description: string;
  linkedRoutes: TeamPackRoute[];
  defaultAgent: OpsAgentId;
  samplePrompts: string[];
  steps: TeamPackStep[];
  /** Route to open when mission completes */
  completeRoute?: string;
  /** Mission output type for service layer */
  outputType: 'osint-summary' | 'content' | 'playbook' | 'cram-plan' | 'support-draft' | 'career-profile';
}

export const AGENT_TEAM_PACKS: TeamPack[] = [
  {
    id: 'intel-pack',
    name: 'Intel Pack',
    icon: 'radar',
    description: 'OSINT Arsenal + Intel Hub workflows — surface sources, curate links, and produce an intel brief.',
    linkedRoutes: [
      { path: '/osint', label: 'OSINT Arsenal' },
      { path: '/intel', label: 'Intel Hub' },
    ],
    defaultAgent: 'openclaw',
    samplePrompts: [
      'Summarize top OSINT sources for my active cert domain',
      'Build a weekly threat intel brief from curated feeds',
      'Map external exposure patterns for a target domain (lab only)',
    ],
    steps: [
      { id: 'scan', label: 'Searching sources', description: 'Scanning OSINT directory and RSS feeds' },
      { id: 'curate', label: 'Curating links', description: 'Ranking sources by cert relevance' },
      { id: 'brief', label: 'Summary report', description: 'Compiling actionable intel brief' },
    ],
    completeRoute: '/intel',
    outputType: 'osint-summary',
  },
  {
    id: 'content-pack',
    name: 'Content Pack',
    icon: 'pen-line',
    description: 'Content Studio missions — draft outlines, generate posts, and format for LinkedIn or threads.',
    linkedRoutes: [{ path: '/studio', label: 'Content Studio' }],
    defaultAgent: 'claude-analyst',
    samplePrompts: [
      'Generate a LinkedIn post about my weakest exam domain',
      'Draft a YouTube script outline for CISSP Domain 3',
      'Create a Twitter thread on AI governance frameworks',
    ],
    steps: [
      { id: 'outline', label: 'Draft outline', description: 'Structuring key points and hook' },
      { id: 'generate', label: 'Generate post', description: 'Writing cert-aligned content' },
      { id: 'format', label: 'Format for channel', description: 'Polishing for LinkedIn / thread / script' },
    ],
    completeRoute: '/studio',
    outputType: 'content',
  },
  {
    id: 'ops-pack',
    name: 'Ops Pack',
    icon: 'briefcase',
    description: 'Playbooks + Scenario Lab — build checklists, run tabletop scenarios, and export runbooks.',
    linkedRoutes: [
      { path: '/playbooks', label: 'Playbooks' },
      { path: '/scenarios', label: 'Scenario Lab' },
    ],
    defaultAgent: 'hermes',
    samplePrompts: [
      'Create an incident response playbook for phishing with AI-generated lures',
      'Generate a tabletop scenario for ransomware in healthcare',
      'Build a vendor risk assessment checklist for my cert domain',
    ],
    steps: [
      { id: 'scope', label: 'Define scope', description: 'Mapping scenario to cert domains' },
      { id: 'checklist', label: 'Build checklist', description: 'Drafting phased playbook steps' },
      { id: 'validate', label: 'Validate runbook', description: 'Adding decision points and owners' },
    ],
    completeRoute: '/playbooks',
    outputType: 'playbook',
  },
  {
    id: 'cram-pack',
    name: 'Cram Pack',
    icon: 'zap',
    description: '24h Cram Mode — compressed study plan, high-yield topics, and last-minute drill schedule.',
    linkedRoutes: [{ path: '/cram', label: '24h Cram Mode' }],
    defaultAgent: 'hermes',
    samplePrompts: [
      'Generate a 24-hour cram sheet for CISSP Domain 5 IAM',
      'Build a last-day review schedule for Security+',
      'List high-yield mnemonics for my weakest domains',
    ],
    steps: [
      { id: 'assess', label: 'Assess weak domains', description: 'Prioritizing by weight and readiness' },
      { id: 'schedule', label: 'Build cram schedule', description: 'Hour-by-hour study blocks' },
      { id: 'yield', label: 'High-yield summary', description: 'Condensed must-know facts' },
    ],
    completeRoute: '/cram',
    outputType: 'cram-plan',
  },
  {
    id: 'support-pack',
    name: 'Support Pack',
    icon: 'life-buoy',
    description: 'Help, bug reports, feature requests, donate, and release updates — guided support missions.',
    linkedRoutes: [
      { path: '/help', label: 'Help & Support' },
      { path: '/support', label: 'Bug Reports' },
      { path: '/feature-request', label: 'Feature Request' },
      { path: '/donate', label: 'Donate' },
      { path: '/my-updates', label: 'My Updates' },
    ],
    defaultAgent: 'claude-analyst',
    samplePrompts: [
      'Draft a bug report for a UI issue I found',
      'Write a feature request for cert-aware flashcards',
      'Summarize what changed in the latest platform updates',
    ],
    steps: [
      { id: 'gather', label: 'Gather context', description: 'Collecting issue details and repro steps' },
      { id: 'draft', label: 'Draft submission', description: 'Formatting for support or feature queue' },
      { id: 'route', label: 'Route to channel', description: 'Suggesting the right support path' },
    ],
    outputType: 'support-draft',
  },
  {
    id: 'career-pack',
    name: 'Career Pack',
    icon: 'globe',
    description: 'Career intel for job seekers — company profiles, job posting analysis, and people map from public pasted data only.',
    linkedRoutes: [{ path: '/career', label: 'Career Intel' }],
    defaultAgent: 'claude-analyst',
    samplePrompts: [
      'Build a company profile from this job posting I pasted',
      'Reverse-engineer required skills from a security engineer job description',
      'Map who to connect with for a CISO team role (public OSINT only)',
    ],
    steps: [
      { id: 'parse', label: 'Parse pasted data', description: 'Extract tech stack and hiring signals from user-provided text' },
      { id: 'align', label: 'Cert alignment', description: 'Map requirements to active certification domains' },
      { id: 'connect', label: 'Connection plan', description: 'Suggest human outreach angles and public footprint tips' },
    ],
    completeRoute: '/career',
    outputType: 'career-profile',
  },
];

export function getTeamPack(id: string): TeamPack | undefined {
  return AGENT_TEAM_PACKS.find(p => p.id === id);
}
