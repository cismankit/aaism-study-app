/**
 * Unified study mission orchestrator — Hermes → Claude Analyst → OpenClaw handoff.
 */

import { chat, resolveAIConfigForRun } from './aiService';
import { buildCertTrainingContext, getActiveCertification } from './certContextService';
import { buildMissionHandoffPrompt } from './agentPrompts';
import { type OpsAgentId } from './opsAgentService';
import { getDomainProgress, getWeakestDomain } from './progressService';
import { topics, type Topic } from '../data/knowledgeBase';
import { getLabsForDomain } from './labService';
import type { LabDefinition } from '../data/labs/types';
import { getQuestionsByDomain, type ExamQuestion } from '../data/examContent';
import { getDomainsForCert } from '../data/examContent';
import { fetchLiveIntelFeed, type IntelFeedItem } from './rssFeedService';
import { relevanceToConfidence } from '../utils/quizProvenance';

export type MissionGoalType = 'domain-focus' | 'weak-drill' | 'daily-30min';

export interface MissionGoal {
  type: MissionGoalType;
  label: string;
  domainId?: number;
}

export interface AgentHandoff {
  agent: OpsAgentId;
  agentName: string;
  phase: string;
  message: string;
  status: 'pending' | 'running' | 'done';
}

export interface IntelHeadline {
  title: string;
  summary: string;
  source?: string;
  sourceUrl?: string;
  link?: string;
  confidence: number;
  isLive: boolean;
}

export interface StudyMissionPlan {
  id: string;
  goal: MissionGoal;
  domainId: number;
  domainName: string;
  topics: Topic[];
  lab: LabDefinition | null;
  intelHeadlines: IntelHeadline[];
  quizQuestions: ExamQuestion[];
  intelBrief: string;
  handoffs: AgentHandoff[];
  tomorrowSuggestion: string;
}

export interface MissionOrchestratorCallbacks {
  onHandoffUpdate: (handoffs: AgentHandoff[]) => void;
  onPlanReady: (plan: StudyMissionPlan) => void;
  onError: (error: string) => void;
}

export interface SharedMissionContext {
  certId: string;
  certShortName: string;
  goal: MissionGoal;
  domainId: number;
  domainName: string;
  weakDomains: Array<{ domainId: number; avg: number; count: number }>;
  domainProgress: ReturnType<typeof getDomainProgress>;
}

const WEAK_THRESHOLD = 60;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pickTopicsForDomain(domainId: number, count = 3): Topic[] {
  const pool = topics.filter(t => t.domain === domainId);
  if (pool.length >= count) {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  }
  const extra = topics.filter(t => t.domain !== domainId);
  return [...pool, ...extra].slice(0, count);
}

function pickLabForDomain(certId: string, domainId: number): LabDefinition | null {
  const labs = getLabsForDomain(certId, domainId);
  if (labs.length === 0) return null;
  return labs[Math.floor(Math.random() * labs.length)];
}

function pickQuizQuestions(domainId: number, count = 5): ExamQuestion[] {
  const pool = getQuestionsByDomain(domainId);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}

function intelItemToHeadline(item: IntelFeedItem): IntelHeadline {
  return {
    title: item.title,
    summary: item.summary.slice(0, 220),
    source: item.source,
    sourceUrl: item.sourceUrl,
    link: item.link,
    confidence: relevanceToConfidence(item.relevanceScore, item.isLive),
    isLive: item.isLive,
  };
}

async function pickIntelHeadlines(_domainId: number, count = 2): Promise<IntelHeadline[]> {
  try {
    const feed = await fetchLiveIntelFeed();
    const liveItems = feed.items.filter(i => i.isLive && i.link.startsWith('http'));
    if (liveItems.length === 0) return [];

    return liveItems
      .map(intelItemToHeadline)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count);
  } catch {
    return [];
  }
}

function buildIntelBrief(headlines: IntelHeadline[], domainName: string): string {
  const parts = headlines.map(h => `${h.title}: ${h.summary}`).join(' ');
  return `Intel brief for ${domainName}: ${parts.slice(0, 600)}`;
}

function resolveDomain(
  certId: string,
  goal: MissionGoal,
): { domainId: number; domainName: string } {
  const domains = getDomainsForCert(certId);
  if (goal.domainId) {
    const d = domains.find(x => x.id === goal.domainId);
    return { domainId: goal.domainId, domainName: d?.name ?? `Domain ${goal.domainId}` };
  }
  const weakest = getWeakestDomain(certId);
  if (weakest) {
    const d = domains.find(x => x.id === weakest.domainId);
    return { domainId: weakest.domainId, domainName: d?.name ?? `Domain ${weakest.domainId}` };
  }
  const first = domains[0];
  return { domainId: first?.id ?? 1, domainName: first?.name ?? 'Domain 1' };
}

function buildTomorrowSuggestion(
  ctx: SharedMissionContext,
  completedDomainId: number,
): string {
  const weak = ctx.weakDomains.filter(d => d.domainId !== completedDomainId && d.avg < WEAK_THRESHOLD);
  if (weak.length > 0) {
    return `Tomorrow: weak domain drill on Domain ${weak[0].domainId} (${weak[0].avg}% avg)`;
  }
  const nextDomain = ctx.domainProgress.find(d => d.domainId !== completedDomainId && d.count === 0);
  if (nextDomain) {
    return `Tomorrow: explore Domain ${nextDomain.domainId} — no quizzes yet`;
  }
  return 'Tomorrow: daily 30-min mixed review across all domains';
}

export function getSuggestedMissionGoal(certId: string): MissionGoal {
  const options = getMissionGoalOptions(certId);
  return options[0] ?? {
    type: 'daily-30min',
    label: 'Daily 30 min — balanced mix',
  };
}

export function getMissionGoalOptions(certId: string): MissionGoal[] {
  const domains = getDomainsForCert(certId);
  const weakest = getWeakestDomain(certId);
  const options: MissionGoal[] = [];

  if (weakest) {
    options.push({
      type: 'weak-drill',
      label: `Weak domain drill — D${weakest.domainId} (${weakest.avg}%)`,
      domainId: weakest.domainId,
    });
  }

  domains.slice(0, 3).forEach(d => {
    options.push({
      type: 'domain-focus',
      label: `Pass ${d.name}`,
      domainId: d.id,
    });
  });

  options.push({
    type: 'daily-30min',
    label: 'Daily 30 min — balanced mix',
  });

  return options;
}

async function runAgentStep(
  agentId: OpsAgentId,
  phase: string,
  userPrompt: string,
  certContext: string,
  handoffs: AgentHandoff[],
  callbacks: MissionOrchestratorCallbacks,
): Promise<string> {
  const idx = handoffs.findIndex(h => h.agent === agentId && h.phase === phase);
  if (idx >= 0) {
    handoffs[idx] = { ...handoffs[idx], status: 'running' };
    callbacks.onHandoffUpdate([...handoffs]);
  }

  await delay(400);

  const config = await resolveAIConfigForRun();
  const response = await chat(config, [
    { role: 'system', content: `${buildMissionHandoffPrompt(agentId)}\n\n${certContext}\nReturn concise JSON or plain text.` },
    { role: 'user', content: userPrompt },
  ], { jsonMode: false, temperature: 0.3 });

  if (response.error) {
    const errMsg = `${agentId} ${phase}: ${response.error}`;
    callbacks.onError(errMsg);
    if (idx >= 0) {
      handoffs[idx] = {
        ...handoffs[idx],
        status: 'done',
        message: `⚠ ${response.error.slice(0, 200)}`,
      };
      callbacks.onHandoffUpdate([...handoffs]);
    }
    throw new Error(response.error);
  }

  const message = response.content.slice(0, 300);

  if (idx >= 0) {
    handoffs[idx] = { ...handoffs[idx], status: 'done', message };
    callbacks.onHandoffUpdate([...handoffs]);
  }

  return message;
}

/** Single Hermes handoff step for Settings smoke tests. */
export async function smokeTestMissionHandoff(): Promise<{
  ok: boolean;
  summary: string;
  error?: string;
}> {
  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const handoffs: AgentHandoff[] = [
    {
      agent: 'hermes',
      agentName: 'Hermes',
      phase: 'assess',
      message: 'Smoke test…',
      status: 'pending',
    },
  ];
  let capturedError = '';

  try {
    const summary = await runAgentStep(
      'hermes',
      'assess',
      `Smoke test: summarize one priority for ${cert.shortName} Domain 1 in one sentence.`,
      certContext,
      handoffs,
      {
        onHandoffUpdate: () => {},
        onPlanReady: () => {},
        onError: err => {
          capturedError = err;
        },
      },
    );
    if (capturedError) {
      return { ok: false, summary: '', error: capturedError };
    }
    if (!summary.trim() || summary.length < 5) {
      return { ok: false, summary: '', error: 'Empty mission handoff response' };
    }
    return { ok: true, summary };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, summary: '', error: capturedError || msg };
  }
}

export async function orchestrateStudyMission(
  goal: MissionGoal,
  callbacks: MissionOrchestratorCallbacks,
  signal?: AbortSignal,
): Promise<StudyMissionPlan> {
  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const { domainId, domainName } = resolveDomain(cert.id, goal);
  const domainProgress = getDomainProgress(cert.id);
  const weakDomains = domainProgress
    .filter(d => d.count > 0 && d.avg < WEAK_THRESHOLD)
    .sort((a, b) => a.avg - b.avg);

  const ctx: SharedMissionContext = {
    certId: cert.id,
    certShortName: cert.shortName,
    goal,
    domainId,
    domainName,
    weakDomains,
    domainProgress,
  };

  const handoffs: AgentHandoff[] = [
    { agent: 'hermes', agentName: 'Hermes', phase: 'assess', message: 'Analyzing domain scores…', status: 'pending' },
    { agent: 'claude-analyst', agentName: 'Claude Analyst', phase: 'curate', message: 'Selecting KB topics and lab…', status: 'pending' },
    { agent: 'openclaw', agentName: 'OpenClaw', phase: 'intel', message: 'Pulling relevant headlines…', status: 'pending' },
  ];
  callbacks.onHandoffUpdate([...handoffs]);

  const checkAbort = () => {
    if (signal?.aborted) throw new Error('Mission cancelled');
  };

  checkAbort();
  const hermesSummary = await runAgentStep(
    'hermes',
    'assess',
    `Assess weak areas for ${cert.shortName}. Domain focus: ${domainName} (D${domainId}). ` +
    `Weak domains: ${weakDomains.map(d => `D${d.domainId}@${d.avg}%`).join(', ') || 'none yet'}. ` +
    `Goal: ${goal.label}. Summarize priority in 2 sentences.`,
    certContext,
    handoffs,
    callbacks,
  );
  checkAbort();

  if (handoffs[0]) handoffs[0].message = hermesSummary.slice(0, 200);
  callbacks.onHandoffUpdate([...handoffs]);

  const missionTopics = pickTopicsForDomain(domainId, 3);
  const missionLab = pickLabForDomain(cert.id, domainId);

  checkAbort();
  await runAgentStep(
    'claude-analyst',
    'curate',
    `Pick study plan for D${domainId} ${domainName}. Topics: ${missionTopics.map(t => t.title).join(', ')}. ` +
    `Lab: ${missionLab?.title ?? 'none available'}. Confirm alignment with ${goal.label}.`,
    certContext,
    handoffs,
    callbacks,
  );
  checkAbort();

  const intelHeadlines = await pickIntelHeadlines(domainId, 2);
  checkAbort();
  const openclawSummary = await runAgentStep(
    'openclaw',
    'intel',
    `Summarize intel relevance for D${domainId}: ${intelHeadlines.map(h => h.title).join('; ')}. One paragraph brief.`,
    certContext,
    handoffs,
    callbacks,
  );
  checkAbort();

  const intelBrief = openclawSummary.length > 80
    ? openclawSummary
    : buildIntelBrief(intelHeadlines, domainName);

  const plan: StudyMissionPlan = {
    id: crypto.randomUUID(),
    goal,
    domainId,
    domainName,
    topics: missionTopics,
    lab: missionLab,
    intelHeadlines,
    quizQuestions: pickQuizQuestions(domainId, 5),
    intelBrief,
    handoffs: [...handoffs],
    tomorrowSuggestion: buildTomorrowSuggestion(ctx, domainId),
  };

  callbacks.onPlanReady(plan);
  return plan;
}
