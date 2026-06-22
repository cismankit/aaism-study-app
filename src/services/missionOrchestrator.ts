/**
 * Unified study mission orchestrator — Invest → Learn → Work → Connect → Earn handoff chain.
 */

import { chat, resolveAIConfigForRun } from './aiService';
import { isKillSwitchActive, KILL_SWITCH_HALT_MESSAGE, linkAbortSignal } from './killSwitchService';
import { buildMissionPillarPrompt } from './agentPrompts';
import { buildCertTrainingContext, getActiveCertification } from './certContextService';
import { getDomainProgress, getWeakestDomain } from './progressService';
import { topics, type Topic } from '../data/knowledgeBase';
import { getLabsForDomain } from './labService';
import type { LabDefinition } from '../data/labs/types';
import { getQuestionsByDomain, type ExamQuestion } from '../data/examContent';
import { getDomainsForCert } from '../data/examContent';
import { fetchLiveIntelFeed, type IntelFeedItem } from './rssFeedService';
import { relevanceToConfidence } from '../utils/quizProvenance';
import { getDomainGuide } from '../data/aaismDomainGuide';
import { getTopicHeatMap, getTrapPatterns } from '../data/communityIntelligence';
import {
  MISSION_HANDOFF_ORDER,
  getLearnWorkEarnAgent,
  type LearnWorkEarnPillar,
} from '../data/learnWorkEarnAgents';

export type MissionGoalType = 'domain-focus' | 'weak-drill' | 'daily-30min';

export interface MissionGoal {
  type: MissionGoalType;
  label: string;
  domainId?: number;
}

export interface AgentHandoff {
  pillar: LearnWorkEarnPillar;
  agent: LearnWorkEarnPillar;
  agentName: string;
  phase: string;
  produces: string;
  message: string;
  status: 'pending' | 'running' | 'done';
}

export interface CommunityHeatItem {
  topic: string;
  heat: number;
  trend?: string;
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

export interface MissionTrapBrief {
  name: string;
  description: string;
  howToAvoid: string;
  domainId: number;
}

export interface StudyMissionPlan {
  id: string;
  goal: MissionGoal;
  domainId: number;
  domainName: string;
  domainWeight?: string;
  topics: Topic[];
  lab: LabDefinition | null;
  intelHeadlines: IntelHeadline[];
  communityHeat: CommunityHeatItem[];
  /** Today's cert-specific trap from Intel Hub — feeds mission intel step */
  dailyTrap: MissionTrapBrief | null;
  quizQuestions: ExamQuestion[];
  intelBrief: string;
  investBrief: string;
  earnAction: string;
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
  domainWeight?: string;
  weakDomains: Array<{ domainId: number; avg: number; count: number }>;
  domainProgress: ReturnType<typeof getDomainProgress>;
  communityHeat: CommunityHeatItem[];
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

function pickCommunityHeat(certId: string, domainId: number, count = 3): CommunityHeatItem[] {
  return getTopicHeatMap(certId)
    .filter(t => t.domain === domainId)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, count)
    .map(t => ({ topic: t.topic, heat: t.heat, trend: t.trend }));
}

/** Pick today's cert trap for mission intel — rotates by calendar day, prefers focus domain. */
function pickDailyTrap(certId: string, domainId: number): MissionTrapBrief | null {
  const traps = getTrapPatterns(certId);
  if (traps.length === 0) return null;

  const domainTraps = traps.filter(t => t.domains.includes(domainId));
  const pool = domainTraps.length > 0 ? domainTraps : traps;
  const dayIndex = Math.floor(Date.now() / 86_400_000) % pool.length;
  const trap = pool[dayIndex];
  const primaryDomain = trap.domains.find(d => d === domainId) ?? trap.domains[0] ?? domainId;

  return {
    name: trap.name,
    description: trap.description,
    howToAvoid: trap.howToAvoid,
    domainId: primaryDomain,
  };
}

function buildIntelBrief(headlines: IntelHeadline[], domainName: string): string {
  const parts = headlines.map(h => `${h.title}: ${h.summary}`).join(' ');
  return `Intel brief for ${domainName}: ${parts.slice(0, 600)}`;
}

function buildInvestFallback(ctx: SharedMissionContext): string {
  const weak = ctx.weakDomains.find(d => d.domainId === ctx.domainId);
  const weight = ctx.domainWeight ?? 'unknown weight';
  if (weak) {
    return `D${ctx.domainId} ${ctx.domainName} (${weight}) — ${weak.avg}% avg. Highest ROI: close this gap before exam sim.`;
  }
  return `D${ctx.domainId} ${ctx.domainName} (${weight}) — no quiz data yet. ROI: establish baseline with today's mission loop.`;
}

function buildEarnFallback(ctx: SharedMissionContext, heat: CommunityHeatItem[]): string {
  const hotTopic = heat[0]?.topic ?? ctx.domainName;
  return `After D${ctx.domainId}, analyze a job post mentioning "${hotTopic}" on Career Intel — map skills to ${ctx.certShortName}.`;
}

function resolveDomain(
  certId: string,
  goal: MissionGoal,
): { domainId: number; domainName: string; domainWeight?: string } {
  const domains = getDomainsForCert(certId);
  if (goal.domainId) {
    const d = domains.find(x => x.id === goal.domainId);
    const guide = getDomainGuide(goal.domainId);
    return {
      domainId: goal.domainId,
      domainName: d?.name ?? `Domain ${goal.domainId}`,
      domainWeight: guide?.weight,
    };
  }
  const weakest = getWeakestDomain(certId);
  if (weakest) {
    const d = domains.find(x => x.id === weakest.domainId);
    const guide = getDomainGuide(weakest.domainId);
    return {
      domainId: weakest.domainId,
      domainName: d?.name ?? `Domain ${weakest.domainId}`,
      domainWeight: guide?.weight,
    };
  }
  const first = domains[0];
  const guide = first ? getDomainGuide(first.id) : undefined;
  return {
    domainId: first?.id ?? 1,
    domainName: first?.name ?? 'Domain 1',
    domainWeight: guide?.weight,
  };
}

function buildTomorrowSuggestion(
  ctx: SharedMissionContext,
  completedDomainId: number,
): string {
  const weak = ctx.weakDomains.filter(d => d.domainId !== completedDomainId && d.avg < WEAK_THRESHOLD);
  if (weak.length > 0) {
    return `Tomorrow: Invest picks D${weak[0].domainId} (${weak[0].avg}% avg) — weak domain ROI`;
  }
  const nextDomain = ctx.domainProgress.find(d => d.domainId !== completedDomainId && d.count === 0);
  if (nextDomain) {
    return `Tomorrow: explore Domain ${nextDomain.domainId} — no quizzes yet`;
  }
  return 'Tomorrow: daily 30-min mixed review across all domains';
}

function buildInitialHandoffs(): AgentHandoff[] {
  return MISSION_HANDOFF_ORDER.map(pillar => {
    const agent = getLearnWorkEarnAgent(pillar);
    return {
      pillar,
      agent: pillar,
      agentName: agent.name,
      phase: agent.orchestrationPhase,
      produces: agent.produces,
      message: `${agent.role}…`,
      status: 'pending' as const,
    };
  });
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

async function runPillarStep(
  pillar: LearnWorkEarnPillar,
  userPrompt: string,
  certContext: string,
  handoffs: AgentHandoff[],
  callbacks: MissionOrchestratorCallbacks,
  signal?: AbortSignal,
): Promise<string> {
  const agent = getLearnWorkEarnAgent(pillar);
  const idx = handoffs.findIndex(h => h.pillar === pillar);
  if (idx >= 0) {
    handoffs[idx] = { ...handoffs[idx], status: 'running' };
    callbacks.onHandoffUpdate([...handoffs]);
  }

  await delay(400);

  if (isKillSwitchActive() || signal?.aborted) {
    throw new Error(KILL_SWITCH_HALT_MESSAGE);
  }

  const config = await resolveAIConfigForRun();
  const response = await chat(config, [
    {
      role: 'system',
      content: `${buildMissionPillarPrompt(pillar)}\n\n${certContext}\nReturn concise plain text (2-3 sentences).`,
    },
    { role: 'user', content: userPrompt },
  ], { jsonMode: false, temperature: 0.3, numPredict: 2048, timeoutMs: 90_000, signal });

  if (response.error) {
    const errMsg = `${agent.name} ${agent.orchestrationPhase}: ${response.error}`;
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

/** Single Invest handoff step for Settings smoke tests. */
export async function smokeTestMissionHandoff(): Promise<{
  ok: boolean;
  summary: string;
  error?: string;
}> {
  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const handoffs = buildInitialHandoffs();
  handoffs[0] = { ...handoffs[0], status: 'pending', message: 'Smoke test…' };
  let capturedError = '';

  try {
    const summary = await runPillarStep(
      'invest',
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
  const runSignal = linkAbortSignal(signal);

  if (isKillSwitchActive()) {
    const errMsg = KILL_SWITCH_HALT_MESSAGE;
    callbacks.onError(errMsg);
    throw new Error(errMsg);
  }

  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const { domainId, domainName, domainWeight } = resolveDomain(cert.id, goal);
  const domainProgress = getDomainProgress(cert.id);
  const weakDomains = domainProgress
    .filter(d => d.count > 0 && d.avg < WEAK_THRESHOLD)
    .sort((a, b) => a.avg - b.avg);
  const communityHeat = pickCommunityHeat(cert.id, domainId, 3);

  const ctx: SharedMissionContext = {
    certId: cert.id,
    certShortName: cert.shortName,
    goal,
    domainId,
    domainName,
    domainWeight,
    weakDomains,
    domainProgress,
    communityHeat,
  };

  const handoffs = buildInitialHandoffs();
  callbacks.onHandoffUpdate([...handoffs]);

  const checkAbort = () => {
    if (isKillSwitchActive() || runSignal.aborted) throw new Error(KILL_SWITCH_HALT_MESSAGE);
  };

  const missionTopics = pickTopicsForDomain(domainId, 3);
  const missionLab = pickLabForDomain(cert.id, domainId);
  const missionQuiz = pickQuizQuestions(domainId, 5);
  const intelHeadlines = await pickIntelHeadlines(domainId, 2);
  const dailyTrap = pickDailyTrap(cert.id, domainId);

  checkAbort();
  const investSummary = await runPillarStep(
    'invest',
    `Invest ROI for ${cert.shortName}. Domain: ${domainName} (D${domainId}, ${domainWeight ?? 'weight unknown'}). ` +
    `Weak domains: ${weakDomains.map(d => `D${d.domainId}@${d.avg}%`).join(', ') || 'none yet'}. ` +
    `Goal: ${goal.label}. Community heat: ${communityHeat.map(h => h.topic).join(', ') || 'none'}. ` +
    `Summarize priority in 2 sentences with explicit ROI rationale.`,
    certContext,
    handoffs,
    callbacks,
    runSignal,
  );
  checkAbort();

  const investBrief = investSummary.length > 20
    ? investSummary
    : buildInvestFallback(ctx);

  checkAbort();
  await runPillarStep(
    'learn',
    `Learn plan for D${domainId} ${domainName}. Topics: ${missionTopics.map(t => t.title).join(', ')}. ` +
    `Quiz: ${missionQuiz.length} bank questions. Confirm alignment with ${goal.label}.`,
    certContext,
    handoffs,
    callbacks,
    runSignal,
  );
  checkAbort();

  checkAbort();
  await runPillarStep(
    'work',
    `Work ops assignment for D${domainId}. Lab: ${missionLab?.title ?? 'none available'}. ` +
    `First step: ${missionLab?.steps?.[0]?.title ?? 'N/A'}. Confirm hands-on focus.`,
    certContext,
    handoffs,
    callbacks,
    runSignal,
  );
  checkAbort();

  checkAbort();
  const connectSummary = await runPillarStep(
    'connect',
    `Connect intel for D${domainId}: Headlines: ${intelHeadlines.map(h => h.title).join('; ') || 'none'}. ` +
    `Community heat: ${communityHeat.map(h => `${h.topic}(${h.heat})`).join(', ') || 'none'}. ` +
    (dailyTrap
      ? `Today's trap from Intel Hub: "${dailyTrap.name}" — ${dailyTrap.description}. Avoid: ${dailyTrap.howToAvoid}. `
      : '') +
    `One paragraph brief weaving trap + headlines.`,
    certContext,
    handoffs,
    callbacks,
    runSignal,
  );
  checkAbort();

  const intelBrief = connectSummary.length > 80
    ? connectSummary
    : buildIntelBrief(intelHeadlines, domainName);

  checkAbort();
  const earnSummary = await runPillarStep(
    'earn',
    `Earn career tie-in for D${domainId} ${domainName} on ${cert.shortName}. ` +
    `Hot community topic: ${communityHeat[0]?.topic ?? domainName}. ` +
    `Suggest one public-data career action (job post analysis, outreach draft, or agent gap run).`,
    certContext,
    handoffs,
    callbacks,
    runSignal,
  );
  checkAbort();

  const earnAction = earnSummary.length > 20
    ? earnSummary
    : buildEarnFallback(ctx, communityHeat);

  const plan: StudyMissionPlan = {
    id: crypto.randomUUID(),
    goal,
    domainId,
    domainName,
    domainWeight,
    topics: missionTopics,
    lab: missionLab,
    intelHeadlines,
    communityHeat,
    dailyTrap,
    quizQuestions: missionQuiz,
    intelBrief,
    investBrief,
    earnAction,
    handoffs: [...handoffs],
    tomorrowSuggestion: buildTomorrowSuggestion(ctx, domainId),
  };

  callbacks.onPlanReady(plan);
  return plan;
}
