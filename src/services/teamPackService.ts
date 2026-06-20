import { chat, resolveAIConfigForRun, type AIConfig } from './aiService';
import { ensureAIReady, formatAIBlockedMessage } from './autoConfigService';
import { linkAbortSignal, isKillSwitchActive, KILL_SWITCH_HALT_MESSAGE } from './killSwitchService';
import { buildCertTrainingContext, getActiveCertification } from './certContextService';
import { type OpsAgentId } from './opsAgentService';
import { buildTeamPackPrompt, getAgentTimeoutMs } from './agentPrompts';
import { OSINT_SOURCES } from '../data/osintSources';
import {
  getTeamPack,
  type TeamPack,
  type TeamPackStep,
} from '../data/agentTeamPacks';

export type TeamPackPhase = 'idle' | 'planning' | 'executing' | 'complete' | 'error';

export type StepSourceType = 'llm' | 'osint-directory' | 'cert-context' | 'user-prompt';

export interface StepOutput {
  content: string;
  confidence: number;
  sourceType: StepSourceType;
  summary?: string;
  error?: string;
}

export interface StepStatus {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: StepOutput;
}

export interface TeamPackResult {
  summary: string;
  content: string;
  navigateTo?: string;
  navigateParams?: Record<string, string>;
  actions: Array<{ label: string; type: 'copy' | 'navigate'; value: string }>;
  stepOutputs: StepOutput[];
  overallConfidence: number;
}

export interface TeamPackCallbacks {
  onPhaseChange: (phase: TeamPackPhase) => void;
  onStepsUpdate: (steps: StepStatus[]) => void;
  onComplete: (result: TeamPackResult) => void;
  onError: (error: string) => void;
}

const STUDIO_PREFILL_KEY = 'aaism-team-pack-studio';

function checkAbort(signal?: AbortSignal) {
  if (isKillSwitchActive()) throw new Error(KILL_SWITCH_HALT_MESSAGE);
  if (signal?.aborted) throw new Error('Mission cancelled');
}

function buildOsintContext(certShortName: string): string {
  const sample = OSINT_SOURCES
    .filter(s => s.highValue)
    .slice(0, 12)
    .map(s => `- ${s.name}: ${s.description} (${s.url})`)
    .join('\n');
  return `High-value OSINT sources for ${certShortName} prep:\n${sample}`;
}

function buildSystemPrompt(pack: TeamPack, _agentId: OpsAgentId, certContext: string): string {
  const outputHints: Record<TeamPack['outputType'], string> = {
    'osint-summary': 'Produce intel brief sections with cited source URLs where applicable.',
    'content': 'Produce content sections ready for Studio export.',
    'playbook': 'Produce phased checklist sections with owners and decision points.',
    'cram-plan': 'Produce schedule blocks and high-yield bullet sections.',
    'support-draft': 'Produce formatted submission sections.',
    'career-profile': 'Produce career brief sections from user-pasted public data only.',
  };

  return `${buildTeamPackPrompt(pack.name, pack.outputType)}

${certContext}

${outputHints[pack.outputType]}

Each step must return verifiable structured output. Include confidence (0-100) reflecting how well the output is grounded in provided sources vs inference.
Keep content practical, cert-aligned, and ready to copy. No exploitation instructions.`;
}

function parseStepResponse(raw: string, fallbackSource: StepSourceType): StepOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const content = String(parsed.content ?? '').trim();
      const sourceType = (['llm', 'osint-directory', 'cert-context', 'user-prompt'].includes(String(parsed.sourceType))
        ? parsed.sourceType
        : fallbackSource) as StepSourceType;
      return {
        content,
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
        sourceType,
        summary: String(parsed.summary ?? ''),
      };
    }
  } catch { /* fall through */ }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { content: '', confidence: 0, sourceType: fallbackSource, error: 'Empty LLM response' };
  }
  return { content: trimmed, confidence: 55, sourceType: fallbackSource, summary: 'Unstructured LLM output' };
}

function inferStepSourceType(step: TeamPackStep, pack: TeamPack): StepSourceType {
  if (pack.outputType === 'osint-summary' && step.id === 'scan') return 'osint-directory';
  if (step.id === 'assess' || step.id === 'align' || step.id === 'scope') return 'cert-context';
  if (step.id === 'parse' || step.id === 'gather') return 'user-prompt';
  return 'llm';
}

function buildStepUserMessage(
  pack: TeamPack,
  step: TeamPackStep,
  stepIndex: number,
  userPrompt: string,
  certShortName: string,
  certName: string,
  osintContext: string,
  priorOutputs: StepOutput[],
): string {
  const priorSummary = priorOutputs
    .filter(o => o.content && !o.error)
    .map((o, i) => `### Prior step ${i + 1} (${o.sourceType}, ${o.confidence}%)\n${o.content.slice(0, 800)}`)
    .join('\n\n');

  const sourceBlock = pack.outputType === 'osint-summary' && step.id === 'scan' && osintContext
    ? `\n\nVerified OSINT directory entries (cite URLs from this list):\n${osintContext}`
    : '';

  return [
    `User mission prompt: ${userPrompt}`,
    `Active certification: ${certShortName} (${certName})`,
    `Current step ${stepIndex + 1}/${pack.steps.length}: ${step.label}`,
    `Step goal: ${step.description}`,
    sourceBlock,
    priorSummary ? `Prior step outputs:\n${priorSummary}` : '',
    `Produce the deliverable for "${step.label}" only.`,
    'Return JSON: { "content": "markdown deliverable for this step", "confidence": 0-100, "sourceType": "llm"|"osint-directory"|"cert-context"|"user-prompt", "summary": "one-line status" }',
  ].filter(Boolean).join('\n\n');
}

function buildBatchedStepUserMessage(
  pack: TeamPack,
  userPrompt: string,
  certShortName: string,
  certName: string,
  osintContext: string,
): string {
  const stepsSpec = pack.steps
    .map((s, i) => `${i + 1}. [id=${s.id}] ${s.label}: ${s.description}`)
    .join('\n');

  const sourceBlock = pack.outputType === 'osint-summary' && osintContext
    ? `\n\nVerified OSINT directory entries (cite URLs from this list):\n${osintContext}`
    : '';

  return [
    `User mission prompt: ${userPrompt}`,
    `Active certification: ${certShortName} (${certName})`,
    `Execute ALL ${pack.steps.length} steps below in one pass.`,
    sourceBlock,
    `Steps:\n${stepsSpec}`,
    'Return JSON: { "steps": [{ "id": "step-id", "content": "markdown deliverable", "confidence": 0-100, "sourceType": "llm"|"osint-directory"|"cert-context"|"user-prompt", "summary": "one-line status" }] }',
    'Include one entry per step id, in order. Each step builds on prior context within your response.',
  ].filter(Boolean).join('\n\n');
}

function parseBatchedStepResponse(
  raw: string,
  pack: TeamPack,
): StepOutput[] | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { steps?: unknown[] };
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;

    const byId = new Map<string, StepOutput>();
    for (const entry of parsed.steps) {
      if (!entry || typeof entry !== 'object') continue;
      const row = entry as Record<string, unknown>;
      const id = String(row.id ?? '').trim();
      if (!id) continue;
      const step = pack.steps.find(s => s.id === id);
      const fallbackSource = step ? inferStepSourceType(step, pack) : 'llm';
      byId.set(id, parseStepResponse(JSON.stringify(row), fallbackSource));
    }

    const ordered = pack.steps.map(step => {
      const output = byId.get(step.id);
      if (output?.content && !output.error) return output;
      return output ?? { content: '', confidence: 0, sourceType: inferStepSourceType(step, pack), error: `Missing step: ${step.label}` };
    });

    if (ordered.every(o => o.content && !o.error)) return ordered;
    if (ordered.some(o => o.content && !o.error)) return ordered;
    return null;
  } catch {
    return null;
  }
}

async function executeStepsBatched(
  pack: TeamPack,
  userPrompt: string,
  certContext: string,
  osintContext: string,
  agentId: OpsAgentId,
  config: AIConfig,
  certShortName: string,
  certName: string,
  signal?: AbortSignal,
): Promise<StepOutput[] | null> {
  checkAbort(signal);
  const systemPrompt = buildSystemPrompt(pack, agentId, certContext);

  const response = await chat(config, [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: buildBatchedStepUserMessage(pack, userPrompt, certShortName, certName, osintContext),
    },
  ], {
    jsonMode: true,
    temperature: 0.4,
    timeoutMs: getAgentTimeoutMs('team-pack'),
  });

  checkAbort(signal);
  if (response.error) return null;

  return parseBatchedStepResponse(response.content, pack);
}

async function executeStep(
  pack: TeamPack,
  step: TeamPackStep,
  stepIndex: number,
  userPrompt: string,
  certContext: string,
  osintContext: string,
  priorOutputs: StepOutput[],
  agentId: OpsAgentId,
  config: AIConfig,
  certShortName: string,
  certName: string,
  signal?: AbortSignal,
): Promise<StepOutput> {
  checkAbort(signal);
  const fallbackSource = inferStepSourceType(step, pack);

  const response = await chat(config, [
    { role: 'system', content: buildSystemPrompt(pack, agentId, certContext) },
    {
      role: 'user',
      content: buildStepUserMessage(
        pack, step, stepIndex, userPrompt, certShortName, certName, osintContext, priorOutputs,
      ),
    },
  ], { jsonMode: true, temperature: 0.4, timeoutMs: getAgentTimeoutMs('team-pack'), signal });

  checkAbort(signal);

  if (response.error) {
    return { content: '', confidence: 0, sourceType: fallbackSource, error: response.error };
  }

  const parsed = parseStepResponse(response.content, fallbackSource);
  if (!parsed.content && !parsed.error) {
    return { ...parsed, error: 'Step produced no content' };
  }
  return parsed;
}

function parseMissionResult(
  pack: TeamPack,
  stepOutputs: StepOutput[],
  certShortName: string,
): TeamPackResult {
  const validOutputs = stepOutputs.filter(o => o.content && !o.error);
  const content = validOutputs.map(o => o.content).join('\n\n---\n\n');
  const overallConfidence = validOutputs.length > 0
    ? Math.round(validOutputs.reduce((s, o) => s + o.confidence, 0) / validOutputs.length)
    : 0;
  const summary = validOutputs.length > 0
    ? `${pack.name} complete — ${validOutputs.length}/${stepOutputs.length} steps with output (avg confidence ${overallConfidence}%).`
    : 'Mission failed — no step produced verifiable output.';

  const actions: TeamPackResult['actions'] = [];
  if (content) {
    actions.push({ label: 'Copy result', type: 'copy', value: content });
  }

  let navigateTo = pack.completeRoute;
  const navigateParams: Record<string, string> = {};

  if (content && pack.outputType === 'content') {
    navigateTo = '/studio';
    const prompt = content.slice(0, 2000);
    navigateParams.prompt = prompt;
    navigateParams.topic = `${certShortName} study content`;
    try {
      sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify({ content, title: `${certShortName} content` }));
    } catch { /* ignore */ }
    actions.push({ label: 'Open in Studio', type: 'navigate', value: `/studio?prompt=${encodeURIComponent(prompt.slice(0, 500))}` });
  } else if (content && pack.outputType === 'career-profile') {
    navigateTo = '/career';
    actions.push({ label: 'Open Career Intel', type: 'navigate', value: '/career' });
  } else if (content && pack.outputType === 'support-draft') {
    navigateTo = '/support';
    actions.push({ label: 'Open form', type: 'navigate', value: '/support' });
  } else if (content && pack.completeRoute) {
    actions.push({ label: 'Open destination', type: 'navigate', value: pack.completeRoute });
  }

  return { summary, content, navigateTo, navigateParams, actions, stepOutputs, overallConfidence };
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

  const runSignal = linkAbortSignal(signal);

  if (isKillSwitchActive()) {
    const errMsg = KILL_SWITCH_HALT_MESSAGE;
    callbacks?.onPhaseChange('error');
    callbacks?.onError(errMsg);
    throw new Error(errMsg);
  }

  const readyCheck = await ensureAIReady();
  if (!readyCheck.ready) {
    const blocked = formatAIBlockedMessage(readyCheck);
    callbacks?.onPhaseChange('error');
    callbacks?.onError(blocked);
    throw new Error(blocked);
  }

  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  const agent = agentId ?? pack.defaultAgent;
  const config = await resolveAIConfigForRun();

  const stepStatuses: StepStatus[] = pack.steps.map(s => ({
    id: s.id,
    label: s.label,
    status: 'pending',
  }));

  const notify = callbacks;
  const stepOutputs: StepOutput[] = [];

  notify?.onPhaseChange('executing');
  notify?.onStepsUpdate(stepStatuses);

  const osintContext = pack.outputType === 'osint-summary'
    ? buildOsintContext(cert.shortName)
    : '';

  // Batched LLM call: N steps → 1 request when possible
  stepStatuses.forEach((_, i) => { stepStatuses[i] = { ...stepStatuses[i], status: 'running' }; });
  notify?.onStepsUpdate([...stepStatuses]);

  const batched = await executeStepsBatched(
    pack, userPrompt, certContext, osintContext, agent,
    config, cert.shortName, cert.name, runSignal,
  );

  if (batched && batched.every(o => o.content && !o.error)) {
    for (let i = 0; i < pack.steps.length; i++) {
      stepOutputs.push(batched[i]);
      stepStatuses[i] = { ...stepStatuses[i], status: 'done', output: batched[i] };
    }
    notify?.onStepsUpdate([...stepStatuses]);
  } else {
    stepOutputs.length = 0;
    for (let i = 0; i < pack.steps.length; i++) {
      stepStatuses[i] = { ...stepStatuses[i], status: 'pending' };
    }

    for (let i = 0; i < pack.steps.length; i++) {
      checkAbort(runSignal);
      const step = pack.steps[i];

      stepStatuses[i] = { ...stepStatuses[i], status: 'running' };
      notify?.onStepsUpdate([...stepStatuses]);

      const output = await executeStep(
        pack,
        step,
        i,
        userPrompt,
        certContext,
        osintContext,
        stepOutputs,
        agent,
        config,
        cert.shortName,
        cert.name,
        runSignal,
      );

      stepOutputs.push(output);

      if (output.error || !output.content) {
        stepStatuses[i] = { ...stepStatuses[i], status: 'error', output };
        notify?.onStepsUpdate([...stepStatuses]);
        const errMsg = output.error ?? `Step "${step.label}" produced no content`;
        notify?.onPhaseChange('error');
        notify?.onError(errMsg);
        throw new Error(errMsg);
      }

      stepStatuses[i] = { ...stepStatuses[i], status: 'done', output };
      notify?.onStepsUpdate([...stepStatuses]);
    }
  }

  const result = parseMissionResult(pack, stepOutputs, cert.shortName);
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
