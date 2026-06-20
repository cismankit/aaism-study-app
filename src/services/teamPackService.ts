import { chat, loadAIConfig } from './aiService';
import { buildCertTrainingContext, getActiveCertification } from './certContextService';
import { getOpsAgent, type OpsAgentId } from './opsAgentService';
import { OSINT_SOURCES } from '../data/osintSources';
import {
  getTeamPack,
  type TeamPack,
} from '../data/agentTeamPacks';

export type TeamPackPhase = 'idle' | 'planning' | 'executing' | 'complete' | 'error';

export interface StepStatus {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
}

export interface TeamPackResult {
  summary: string;
  content: string;
  navigateTo?: string;
  navigateParams?: Record<string, string>;
  actions: Array<{ label: string; type: 'copy' | 'navigate'; value: string }>;
}

export interface TeamPackCallbacks {
  onPhaseChange: (phase: TeamPackPhase) => void;
  onStepsUpdate: (steps: StepStatus[]) => void;
  onComplete: (result: TeamPackResult) => void;
  onError: (error: string) => void;
}

const STUDIO_PREFILL_KEY = 'aaism-team-pack-studio';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildOsintContext(certShortName: string): string {
  const sample = OSINT_SOURCES
    .filter(s => s.highValue)
    .slice(0, 12)
    .map(s => `- ${s.name}: ${s.description} (${s.url})`)
    .join('\n');
  return `High-value OSINT sources for ${certShortName} prep:\n${sample}`;
}

function buildSystemPrompt(pack: TeamPack, agentId: OpsAgentId, certContext: string): string {
  const agent = getOpsAgent(agentId);
  const outputHints: Record<TeamPack['outputType'], string> = {
    'osint-summary': 'Return JSON: { summary, content (markdown brief), highlights: string[] }',
    'content': 'Return JSON: { summary, content (full post/script markdown), title, format: linkedin|thread|youtube }',
    'playbook': 'Return JSON: { summary, content (markdown checklist with phases), title }',
    'cram-plan': 'Return JSON: { summary, content (hour-by-hour markdown schedule + high-yield bullets), domains: string[] }',
    'support-draft': 'Return JSON: { summary, content (formatted submission text), route: help|support|feature-request|donate|my-updates }',
  };

  return `${agent.systemPrompt}

${certContext}

You are executing the "${pack.name}" team mission.
Mission type: ${pack.outputType}
${outputHints[pack.outputType]}

Keep content practical, cert-aligned, and ready to copy. No exploitation instructions.`;
}

function parseMissionResult(
  pack: TeamPack,
  raw: string,
  certShortName: string,
): TeamPackResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string | string[]>;
      const content = String(parsed.content ?? raw);
      const summary = String(parsed.summary ?? 'Mission complete.');
      const actions: TeamPackResult['actions'] = [
        { label: 'Copy result', type: 'copy', value: content },
      ];

      let navigateTo = pack.completeRoute;
      const navigateParams: Record<string, string> = {};

      if (pack.outputType === 'content') {
        navigateTo = '/studio';
        const prompt = content.slice(0, 2000);
        navigateParams.prompt = prompt;
        navigateParams.topic = String(parsed.title ?? `${certShortName} study content`);
        try {
          sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify({ content, title: parsed.title }));
        } catch { /* ignore */ }
        actions.push({ label: 'Open in Studio', type: 'navigate', value: `/studio?prompt=${encodeURIComponent(prompt.slice(0, 500))}` });
      } else if (pack.outputType === 'support-draft') {
        const route = String(parsed.route ?? 'support');
        const routeMap: Record<string, string> = {
          help: '/help',
          support: '/support',
          'feature-request': '/feature-request',
          donate: '/donate',
          'my-updates': '/my-updates',
        };
        navigateTo = routeMap[route] ?? '/support';
        actions.push({ label: 'Open form', type: 'navigate', value: navigateTo });
      } else if (pack.completeRoute) {
        actions.push({ label: 'Open destination', type: 'navigate', value: pack.completeRoute });
      }

      return { summary, content, navigateTo, navigateParams, actions };
    }
  } catch { /* fall through */ }

  return {
    summary: 'Mission complete.',
    content: raw,
    navigateTo: pack.completeRoute,
    actions: [
      { label: 'Copy result', type: 'copy', value: raw },
      ...(pack.completeRoute ? [{ label: 'Open destination', type: 'navigate' as const, value: pack.completeRoute }] : []),
    ],
  };
}

export async function runTeamPackMission(
  packId: string,
  userPrompt: string,
  agentId?: OpsAgentId,
  callbacks?: TeamPackCallbacks,
  signal?: AbortSignal,
): Promise<TeamPackResult> {
  const pack = getTeamPack(packId);
  if (!pack) throw new Error('Unknown team pack');

  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const agent = agentId ?? pack.defaultAgent;

  const stepStatuses: StepStatus[] = pack.steps.map(s => ({
    id: s.id,
    label: s.label,
    status: 'pending',
  }));

  const notify = callbacks;

  const checkAbort = () => {
    if (signal?.aborted) throw new Error('Mission cancelled');
  };

  notify?.onPhaseChange('planning');
  notify?.onStepsUpdate(stepStatuses);
  await delay(600);
  checkAbort();

  notify?.onPhaseChange('executing');

  for (let i = 0; i < pack.steps.length; i++) {
    checkAbort();
    stepStatuses[i] = { ...stepStatuses[i], status: 'running' };
    notify?.onStepsUpdate([...stepStatuses]);
    await delay(800 + Math.random() * 700);
    checkAbort();
    stepStatuses[i] = { ...stepStatuses[i], status: 'done' };
    notify?.onStepsUpdate([...stepStatuses]);
  }

  const osintContext = pack.outputType === 'osint-summary'
    ? buildOsintContext(cert.shortName)
    : '';

  const userMessage = [
    `User mission prompt: ${userPrompt}`,
    `Active certification: ${cert.shortName} (${cert.name})`,
    osintContext,
    `Produce output for ${pack.name}.`,
  ].filter(Boolean).join('\n\n');

  const config = loadAIConfig();
  const response = await chat(config, [
    { role: 'system', content: buildSystemPrompt(pack, agent, certContext) },
    { role: 'user', content: userMessage },
  ], { jsonMode: true, temperature: 0.4 });

  checkAbort();

  if (response.error) {
    notify?.onPhaseChange('error');
    notify?.onError(response.error);
    throw new Error(response.error);
  }

  const result = parseMissionResult(pack, response.content, cert.shortName);
  notify?.onPhaseChange('complete');
  notify?.onComplete(result);
  return result;
}

export function getStudioPrefill(): { content?: string; title?: string } | null {
  try {
    const raw = sessionStorage.getItem(STUDIO_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { content?: string; title?: string };
  } catch {
    return null;
  }
}

export function clearStudioPrefill(): void {
  try {
    sessionStorage.removeItem(STUDIO_PREFILL_KEY);
  } catch { /* ignore */ }
}

export { STUDIO_PREFILL_KEY };
