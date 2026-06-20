/**
 * Multi-agent orchestrator for Agent Discovery pipeline.
 * Backward-compatible wrapper around specialist agents.
 */

import {
  chatJson,
  resolveAIConfigForRun,
  resolveOllamaModel,
  defaultConfigs,
  getModelCapability,
  getRecommendedFallbackModel,
  type AIConfig,
  type Message,
} from './aiService';
import { loadEnsembleConfig } from './ensembleConfig';
import {
  analyzeCoverage,
  type AgentCallbacks,
  type LiveLogEntry,
} from './agentService';
import type { DiscoveryStrategy, CoverageGap } from './agentStore';
import { getAllQuestions, getDomainsForCert, type ExamQuestion } from '../data/examContent';
import { getApprovedQuestions } from './agentStore';
import { getActiveCertification } from './certContextService';
import { buildDiscoverySystemPrompt, buildCriticSystemPrompt } from './agentPrompts';
import { recordAgentSummary } from './memoryService';
import { isKillSwitchActive } from './killSwitchService';

export type AgentName = 'AnalystAgent' | 'DiscoverAgent' | 'CriticAgent' | 'DedupAgent';

export interface AgentConfidenceSummary {
  agent: AgentName;
  itemsProcessed: number;
  avgConfidence: number;
  error?: string;
}

export interface OrchestratorRunSummary {
  agentConfidences: AgentConfidenceSummary[];
  overallConfidence: number;
}

export interface OrchestratorContext {
  strategy: DiscoveryStrategy;
  config: AIConfig;
  callbacks: AgentCallbacks;
  signal?: AbortSignal;
}

function agentLog(
  agent: AgentName,
  callbacks: AgentCallbacks,
  phase: string,
  message: string,
  type: LiveLogEntry['type'] = 'info',
) {
  console.log(`[${agent}] ${message}`);
  callbacks.onLog({
    timestamp: new Date().toISOString(),
    phase,
    message: `[${agent}] ${message}`,
    type,
    agent,
  } as LiveLogEntry & { agent?: AgentName });
}

function checkAbort(ctx: OrchestratorContext) {
  if (isKillSwitchActive() || ctx.signal?.aborted) {
    const err = new Error('Agent stopped by user');
    err.name = 'AgentAbortError';
    throw err;
  }
}

// Re-export coverage from AnalystAgent
export function runAnalystAgent(ctx: OrchestratorContext) {
  checkAbort(ctx);
  agentLog('AnalystAgent', ctx.callbacks, 'analyze', 'Starting coverage analysis');
  ctx.callbacks.onPhaseChange('analyze', 'AnalystAgent scanning question bank...');

  const coverage = analyzeCoverage();
  const topGaps = coverage.gaps.filter(g =>
    (!ctx.strategy.targetDomain || g.domain === ctx.strategy.targetDomain) &&
    (!ctx.strategy.targetDifficulty || g.difficulty === ctx.strategy.targetDifficulty)
  );

  agentLog('AnalystAgent', ctx.callbacks, 'analyze',
    `Found ${topGaps.length} gaps across ${coverage.totalQuestions} questions`, 'success');

  return { coverage, topGaps };
}

type ParsedQuestion = ExamQuestion & { confidence: number; reasoning: string };

function sanitizeJsonString(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const firstBracket = Math.min(
    s.indexOf('[') === -1 ? Infinity : s.indexOf('['),
    s.indexOf('{') === -1 ? Infinity : s.indexOf('{'),
  );
  if (firstBracket !== Infinity && firstBracket > 0) s = s.slice(firstBracket);
  const lastClose = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (lastClose !== -1) s = s.slice(0, lastClose + 1);
  s = s.replace(/,\s*([}\]])/g, '$1');
  if (!s.includes('"') && s.includes("'")) s = s.replace(/'/g, '"');
  return s;
}

function tryParseJson(raw: string): unknown[] {
  const cleaned = sanitizeJsonString(raw);
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch { /* continue */ }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      try {
        const fixed = arrayMatch[0].replace(/,\s*$/, '') + ']';
        const parsed = JSON.parse(fixed);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* continue */ }
    }
  }

  const objects: unknown[] = [];
  const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let match;
  while ((match = objRegex.exec(cleaned)) !== null) {
    try { objects.push(JSON.parse(match[0])); } catch { /* skip */ }
  }
  return objects;
}

function normalizeQuestion(q: Record<string, unknown>): ParsedQuestion | null {
  if (!q || typeof q !== 'object') return null;
  const question = String(q.question || q.Question || '').trim();
  if (!question || question.length < 10) return null;

  let options: string[] = [];
  if (Array.isArray(q.options)) options = q.options.map(String);
  else if (Array.isArray(q.Options)) options = (q.Options as unknown[]).map(String);
  if (options.length < 4) return null;
  options = options.slice(0, 4);

  let correctAnswer = 0;
  const ca = q.correctAnswer ?? q.correct_answer ?? q.answer;
  if (typeof ca === 'number') correctAnswer = ca;
  else if (typeof ca === 'string') {
    const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    correctAnswer = letterMap[ca.trim().toUpperCase().charAt(0)] ?? 0;
  }

  const rawDiff = String(q.difficulty || 'medium').toLowerCase();
  const difficulty = (['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium') as 'easy' | 'medium' | 'hard';

  return {
    id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    domain: Math.min(4, Math.max(1, Number(q.domain) || 1)),
    question,
    options,
    correctAnswer: Math.min(3, Math.max(0, correctAnswer)),
    explanation: String(q.explanation || 'See correct answer above.'),
    difficulty,
    topic: String(q.topic || 'General'),
    confidence: Math.min(100, Math.max(0, Number(q.confidence) || 70)),
    reasoning: String(q.reasoning || 'AI-generated question'),
  };
}

function parseQuestions(response: string): ParsedQuestion[] {
  return tryParseJson(response)
    .map(obj => normalizeQuestion(obj as Record<string, unknown>))
    .filter((q): q is ParsedQuestion => q !== null);
}

function buildSimplePrompt(count: number, domain?: number): string {
  const cert = getActiveCertification();
  const domains = getDomainsForCert(cert.id);
  const maxDomain = domains.length > 0 ? Math.max(...domains.map(d => d.id)) : 4;
  const domainHint = domain
    ? `Focus on Domain ${domain}.`
    : `Cover domains 1-${maxDomain} evenly.`;
  return `Generate exactly ${count} ${cert.shortName} (${cert.vendor}) exam questions. ${domainHint}

Return a JSON array. Each object: domain (1-${maxDomain}), question, options (4 strings with A/B/C/D), correctAnswer (0-3), explanation, difficulty (easy/medium/hard), topic, confidence (0-100).

JSON array only.`;
}

function getDiscoveryContext(): string {
  return buildDiscoverySystemPrompt();
}

async function callWithHeartbeat(
  ctx: OrchestratorContext,
  config: AIConfig,
  messages: Message[],
  label: string,
): Promise<string> {
  let tick = 0;
  const heartbeat = setInterval(() => {
    tick++;
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', `${label} (${tick * 5}s)...`, 'thinking');
  }, 5000);
  try {
    const resp = await chatJson(config, messages, { signal: ctx.signal });
    if (resp.error) throw new Error(resp.error);
    return resp.content;
  } finally {
    clearInterval(heartbeat);
  }
}

export async function runDiscoverAgent(
  ctx: OrchestratorContext,
  topGaps: CoverageGap[],
  sampleQuestions: ExamQuestion[],
): Promise<ParsedQuestion[]> {
  checkAbort(ctx);
  const cap = getModelCapability(ctx.config.model);
  agentLog('DiscoverAgent', ctx.callbacks, 'discover',
    `Using ${ctx.config.model} (tier: ${cap.tier}, JSON reliability: ${cap.jsonReliability}%)`);

  if (cap.tier === 'small') {
    agentLog('DiscoverAgent', ctx.callbacks, 'discover',
      `Warning: ${ctx.config.model} is a small model — using simplified prompts`, 'warning');
  }

  ctx.callbacks.onPhaseChange('discover', 'DiscoverAgent generating questions...');

  const count = ctx.strategy.questionCount;
  const domainHint = ctx.strategy.targetDomain ? `Domain ${ctx.strategy.targetDomain}` : 'all domains';
  const gapSummary = topGaps.slice(0, 5).map(g => `D${g.domain} ${g.topic} [${g.difficulty}]`).join(', ');

  const messages: Message[] = [
    { role: 'system', content: getDiscoveryContext() },
    { role: 'user', content: buildSimplePrompt(count, ctx.strategy.targetDomain) +
      `\n\nStrategy: ${ctx.strategy.type}. Target: ${domainHint}. Gaps: ${gapSummary}.` +
      `\n\nStyle reference:\n${sampleQuestions.slice(0, 2).map(q => q.question).join('\n')}` },
  ];

  let discovered: ParsedQuestion[] = [];

  // Attempt 1: JSON mode full batch
  agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 1: JSON mode batch (${count} questions)`, 'thinking');
  try {
    const content = await callWithHeartbeat(ctx, ctx.config, messages, 'Generating');
    discovered = parseQuestions(content);
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 1: parsed ${discovered.length} questions`,
      discovered.length > 0 ? 'success' : 'warning');
  } catch (e) {
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 1 failed: ${e}`, 'warning');
  }

  // Attempt 2: smaller batch simplified
  checkAbort(ctx);
  if (discovered.length < Math.ceil(count / 2)) {
    const remaining = count - discovered.length;
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 2: simplified prompt (${remaining} questions)`, 'thinking');
    try {
      const simpleMsgs: Message[] = [
        { role: 'system', content: 'Return only valid JSON arrays. No markdown.' },
        { role: 'user', content: buildSimplePrompt(Math.min(remaining, 4), ctx.strategy.targetDomain) },
      ];
      const content = await callWithHeartbeat(ctx, ctx.config, simpleMsgs, 'Retry');
      const parsed = parseQuestions(content);
      discovered.push(...parsed);
      agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 2: parsed ${parsed.length} questions`,
        parsed.length > 0 ? 'success' : 'warning');
    } catch (e) {
      agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 2 failed: ${e}`, 'warning');
    }
  }

  // Attempt 3: single-question chunks
  checkAbort(ctx);
  if (discovered.length === 0) {
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', 'Attempt 3: single-question chunks', 'thinking');
    const chunks = Math.min(count, 3);
    for (let i = 0; i < chunks; i++) {
      checkAbort(ctx);
      try {
        const chunkMsgs: Message[] = [
          { role: 'system', content: 'Return only a JSON array with 1 question object.' },
          { role: 'user', content: buildSimplePrompt(1, ctx.strategy.targetDomain) },
        ];
        const content = await callWithHeartbeat(ctx, ctx.config, chunkMsgs, `Chunk ${i + 1}`);
        discovered.push(...parseQuestions(content));
      } catch { /* continue */ }
    }
    agentLog('DiscoverAgent', ctx.callbacks, 'discover', `Attempt 3 total: ${discovered.length} questions`,
      discovered.length > 0 ? 'success' : 'warning');
  }

  return discovered;
}

export function runCriticAgent(
  ctx: OrchestratorContext,
  questions: ParsedQuestion[],
): ParsedQuestion[] {
  checkAbort(ctx);
  agentLog('CriticAgent', ctx.callbacks, 'score', `Validating ${questions.length} questions (rule-based)`);
  ctx.callbacks.onPhaseChange('score', 'CriticAgent validating output...');

  const maxDomain = Math.max(
    ...getDomainsForCert(getActiveCertification().id).map(d => d.id),
    4,
  );
  const validated = questions.filter(q => {
    const valid =
      q.question.length >= 15 &&
      q.options.length === 4 &&
      q.options.every(o => o.length > 2) &&
      q.explanation.length >= 10 &&
      q.domain >= 1 && q.domain <= maxDomain;

    if (!valid) {
      agentLog('CriticAgent', ctx.callbacks, 'score', `Rejected malformed question: ${q.question.slice(0, 40)}...`, 'warning');
    }
    return valid;
  });

  // Boost confidence for well-formed questions
  const scored = validated.map(q => ({
    ...q,
    confidence: Math.min(100, q.confidence + (q.explanation.length > 50 ? 5 : 0)),
  }));

  agentLog('CriticAgent', ctx.callbacks, 'score',
    `${scored.length}/${questions.length} passed validation`, 'success');

  return scored;
}

function buildEnsembleDiscoverConfig(base: AIConfig): AIConfig {
  const ensemble = loadEnsembleConfig();
  if (ensemble.discoverProvider === 'groq') {
    const groqKey = ensemble.groqApiKey?.trim() || (base.provider === 'groq' ? base.apiKey : undefined);
    if (groqKey) {
      return {
        provider: 'groq',
        apiKey: groqKey,
        baseUrl: defaultConfigs.groq.baseUrl,
        model: base.provider === 'groq' ? base.model : defaultConfigs.groq.model!,
        groqModels: base.groqModels,
      };
    }
  }
  return base.provider === 'ollama' ? base : {
    ...base,
    provider: 'ollama',
    baseUrl: base.baseUrl ?? defaultConfigs.ollama.baseUrl,
    model: defaultConfigs.ollama.model!,
  };
}

async function buildEnsembleCriticConfig(base: AIConfig): Promise<AIConfig> {
  const ensemble = loadEnsembleConfig();
  if (ensemble.criticProvider === 'groq') {
    const groqKey = ensemble.groqApiKey?.trim() || (base.provider === 'groq' ? base.apiKey : undefined);
    if (groqKey) {
      return {
        provider: 'groq',
        apiKey: groqKey,
        baseUrl: defaultConfigs.groq.baseUrl,
        model: base.provider === 'groq' ? base.model : defaultConfigs.groq.model!,
      };
    }
  }
  const ollamaBase: AIConfig = base.provider === 'ollama' ? base : {
    provider: 'ollama',
    baseUrl: defaultConfigs.ollama.baseUrl,
    model: defaultConfigs.ollama.model!,
  };
  const resolved = await resolveOllamaModel(ollamaBase);
  return { ...ollamaBase, model: resolved.model };
}

async function runCriticAgentLLM(
  ctx: OrchestratorContext,
  questions: ParsedQuestion[],
  criticConfig: AIConfig,
): Promise<ParsedQuestion[]> {
  checkAbort(ctx);
  agentLog('CriticAgent', ctx.callbacks, 'score',
    `LLM critic on ${criticConfig.provider}/${criticConfig.model} (${questions.length} questions)`, 'thinking');
  ctx.callbacks.onPhaseChange('score', 'CriticAgent LLM validation...');

  const rulePassed = runCriticAgent(ctx, questions);
  if (rulePassed.length === 0) return rulePassed;

  const reviewPayload = rulePassed.map((q, i) => ({
    id: i,
    domain: q.domain,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));

  const messages: Message[] = [
    { role: 'system', content: `${buildCriticSystemPrompt()}\n\nReview batch and return ONLY JSON.` },
    { role: 'user', content: `Review these ${reviewPayload.length} questions. Return JSON: {"approved":[0,1,...],"rejected":[2],"notes":"..."}
Reject questions that are off-topic, have ambiguous answers, or poor distractors.

Questions:
${JSON.stringify(reviewPayload, null, 2)}` },
  ];

  try {
    const resp = await chatJson(criticConfig, messages, { signal: ctx.signal });
    if (resp.error) throw new Error(resp.error);
    const parsed = JSON.parse(sanitizeJsonString(resp.content)) as { approved?: number[] };
    const approvedIdx = new Set(parsed.approved ?? rulePassed.map((_, i) => i));
    const approved = rulePassed.filter((_, i) => approvedIdx.has(i));
    agentLog('CriticAgent', ctx.callbacks, 'score',
      `LLM critic: ${approved.length}/${rulePassed.length} approved`, 'success');
    return approved.map(q => ({
      ...q,
      confidence: Math.min(100, q.confidence + 8),
    }));
  } catch (e) {
    agentLog('CriticAgent', ctx.callbacks, 'score',
      `LLM critic fallback to rule-based: ${e instanceof Error ? e.message : e}`, 'warning');
    return rulePassed;
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): Set<string> {
  const words = normalizeText(text).split(' ');
  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) bigrams.add(`${words[i]} ${words[i + 1]}`);
  words.forEach(w => bigrams.add(w));
  return bigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
}

export function runDedupAgent(
  ctx: OrchestratorContext,
  questions: ParsedQuestion[],
): Array<ParsedQuestion & { similarityScore: number }> {
  checkAbort(ctx);
  agentLog('DedupAgent', ctx.callbacks, 'deduplicate', `Checking ${questions.length} questions for duplicates`);
  ctx.callbacks.onPhaseChange('deduplicate', 'DedupAgent running similarity analysis...');

  const existing = [...getAllQuestions(), ...getApprovedQuestions()];
  const result = questions.map(q => {
    const tokens = tokenize(q.question);
    let maxSim = 0;
    for (const eq of existing) {
      maxSim = Math.max(maxSim, jaccardSimilarity(tokens, tokenize(eq.question)));
    }
    return { ...q, similarityScore: Math.round(maxSim) };
  });

  const unique = result.filter(q => q.similarityScore < 60).length;
  agentLog('DedupAgent', ctx.callbacks, 'deduplicate', `${unique} unique, ${result.length - unique} duplicates`, 'success');

  return result;
}

function buildRunSummary(
  analystGaps: number,
  discovered: ParsedQuestion[],
  criticCount: number,
  deduped: Array<ParsedQuestion & { similarityScore: number }>,
  discoverError?: string,
): OrchestratorRunSummary {
  const avg = (items: Array<{ confidence: number }>) =>
    items.length > 0
      ? Math.round(items.reduce((s, q) => s + q.confidence, 0) / items.length)
      : 0;

  const agentConfidences: AgentConfidenceSummary[] = [
    {
      agent: 'AnalystAgent',
      itemsProcessed: analystGaps,
      avgConfidence: analystGaps > 0 ? 95 : 0,
    },
    {
      agent: 'DiscoverAgent',
      itemsProcessed: discovered.length,
      avgConfidence: avg(discovered),
      error: discoverError,
    },
    {
      agent: 'CriticAgent',
      itemsProcessed: criticCount,
      avgConfidence: avg(discovered.slice(0, criticCount)),
    },
    {
      agent: 'DedupAgent',
      itemsProcessed: deduped.length,
      avgConfidence: avg(deduped),
    },
  ];

  const overallConfidence = deduped.length > 0 ? avg(deduped) : 0;
  return { agentConfidences, overallConfidence };
}

export async function runMultiAgentDiscovery(
  strategy: DiscoveryStrategy,
  callbacks: AgentCallbacks,
  config?: AIConfig,
  signal?: AbortSignal,
): Promise<{
  discovered: Array<ParsedQuestion & { similarityScore: number }>;
  coverage: ReturnType<typeof analyzeCoverage>;
  summary: OrchestratorRunSummary;
}> {
  const baseConfig = config || await resolveAIConfigForRun();
  const ensemble = loadEnsembleConfig();
  const discoverConfig = ensemble.enabled ? buildEnsembleDiscoverConfig(baseConfig) : baseConfig;
  const ctx: OrchestratorContext = { strategy, config: discoverConfig, callbacks, signal };

  if (ensemble.enabled) {
    agentLog('DiscoverAgent', callbacks, 'discover',
      `Ensemble mode: discover via ${discoverConfig.provider}/${discoverConfig.model}`, 'info');
  }

  const { coverage, topGaps } = runAnalystAgent(ctx);

  let discovered = await runDiscoverAgent(ctx, topGaps, getAllQuestions().slice(0, 5));
  const discoverCount = discovered.length;

  if (discovered.length === 0) {
    const fallback = getRecommendedFallbackModel();
    if (discoverConfig.provider === 'ollama' && discoverConfig.model !== fallback) {
      agentLog('DiscoverAgent', callbacks, 'discover',
        `All attempts failed. Try: ollama pull ${fallback}`, 'warning');
    }
    throw new Error(
      `Could not parse valid questions after 3 attempts. ` +
      (discoverConfig.provider === 'ollama'
        ? `Your model (${discoverConfig.model}) may be too small for structured JSON. Try ${fallback} or Groq (free).`
        : 'Try running again or switching models.')
    );
  }

  if (ensemble.enabled) {
    const criticConfig = await buildEnsembleCriticConfig(baseConfig);
    discovered = await runCriticAgentLLM(ctx, discovered, criticConfig);
  } else {
    discovered = runCriticAgent(ctx, discovered);
  }

  const deduped = runDedupAgent(ctx, discovered);
  const summary = buildRunSummary(topGaps.length, discovered.slice(0, discoverCount), discovered.length, deduped);

  agentLog('AnalystAgent', callbacks, 'populate',
    `Run summary — overall confidence ${summary.overallConfidence}%`, 'success');
  for (const ac of summary.agentConfidences) {
    const errSuffix = ac.error ? ` (error: ${ac.error})` : '';
    agentLog(ac.agent, callbacks, 'populate',
      `${ac.agent}: ${ac.itemsProcessed} items, avg confidence ${ac.avgConfidence}%${errSuffix}`, 'info');
  }

  recordAgentSummary({
    persona: 'discover-pipeline',
    summary: `Discovery run: ${deduped.length} questions, ${summary.overallConfidence}% confidence, ${topGaps.length} gaps targeted`,
    certId: getActiveCertification().id,
  });

  return { discovered: deduped, coverage, summary };
}

export type { ParsedQuestion };
