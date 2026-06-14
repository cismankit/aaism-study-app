/**
 * Multi-agent orchestrator for Agent Discovery pipeline.
 * Backward-compatible wrapper around specialist agents.
 */

import {
  chatJson,
  loadAIConfig,
  resolveAgentConfig,
  AAISM_CONTEXT,
  getModelCapability,
  getRecommendedFallbackModel,
  type AIConfig,
  type Message,
} from './aiService';
import {
  analyzeCoverage,
  type AgentCallbacks,
  type LiveLogEntry,
} from './agentService';
import type { DiscoveryStrategy, CoverageGap } from './agentStore';
import { getAllQuestions, type ExamQuestion } from '../data/examContent';
import { getApprovedQuestions } from './agentStore';

export type AgentName = 'AnalystAgent' | 'DiscoverAgent' | 'CriticAgent' | 'DedupAgent';

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
  if (ctx.signal?.aborted) {
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
  const domainHint = domain ? `Focus on Domain ${domain}.` : 'Cover domains 1-4 evenly.';
  return `Generate exactly ${count} ISACA AAISM exam questions. ${domainHint}

Return a JSON array. Each object: domain (1-4), question, options (4 strings with A/B/C/D), correctAnswer (0-3), explanation, difficulty (easy/medium/hard), topic, confidence (0-100).

Example: [{"domain":1,"question":"What is the PRIMARY purpose of an AI Governance Board?","options":["A) Develop models","B) Provide oversight","C) Replace IT","D) Approve contracts"],"correctAnswer":1,"explanation":"Board provides oversight.","difficulty":"medium","topic":"AI Governance","confidence":85}]

JSON array only.`;
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
    const resp = await chatJson(config, messages);
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
    { role: 'system', content: `${AAISM_CONTEXT}\n\nYou generate ISACA AAISM exam questions. Return ONLY valid JSON arrays.` },
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

  const validated = questions.filter(q => {
    const valid =
      q.question.length >= 15 &&
      q.options.length === 4 &&
      q.options.every(o => o.length > 2) &&
      q.explanation.length >= 10 &&
      q.domain >= 1 && q.domain <= 4;

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

export async function runMultiAgentDiscovery(
  strategy: DiscoveryStrategy,
  callbacks: AgentCallbacks,
  config?: AIConfig,
  signal?: AbortSignal,
): Promise<{
  discovered: Array<ParsedQuestion & { similarityScore: number }>;
  coverage: ReturnType<typeof analyzeCoverage>;
}> {
  const aiConfig = config || await resolveAgentConfig(loadAIConfig());
  const ctx: OrchestratorContext = { strategy, config: aiConfig, callbacks, signal };

  const { coverage, topGaps } = runAnalystAgent(ctx);

  let discovered = await runDiscoverAgent(ctx, topGaps, getAllQuestions().slice(0, 5));

  if (discovered.length === 0) {
    const fallback = getRecommendedFallbackModel();
    if (aiConfig.provider === 'ollama' && aiConfig.model !== fallback) {
      agentLog('DiscoverAgent', callbacks, 'discover',
        `All attempts failed. Try: ollama pull ${fallback}`, 'warning');
    }
    throw new Error(
      `Could not parse valid questions after 3 attempts. ` +
      (aiConfig.provider === 'ollama'
        ? `Your model (${aiConfig.model}) may be too small for structured JSON. Try ${fallback} or Groq (free).`
        : 'Try running again or switching models.')
    );
  }

  discovered = runCriticAgent(ctx, discovered);
  const deduped = runDedupAgent(ctx, discovered);

  return { discovered: deduped, coverage };
}

export type { ParsedQuestion };
