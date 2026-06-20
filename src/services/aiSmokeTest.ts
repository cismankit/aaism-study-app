/**
 * End-to-end AI smoke tests — callable from Settings "Verify all AI".
 * Each test times out after 15s so a down Ollama fails fast instead of hanging.
 */

import {
  chat,
  chatJson,
  checkOllamaStatus,
  defaultConfigs,
  loadAIConfig,
  type AIConfig,
} from './aiService';
import { analyzeWithOpsAgent } from './opsAgentService';
import { smokeTestMissionHandoff } from './missionOrchestrator';

export const SMOKE_TEST_TIMEOUT_MS = 15_000;
/** LLM round-trips when Ollama is up (JSON tests can be slow on first load). */
export const SMOKE_TEST_LLM_TIMEOUT_MS = 120_000;
export const SMOKE_TEST_HEAVY_TIMEOUT_MS = 180_000;

export type SmokeTestId = 'chat' | 'ops-copilot' | 'mission-orchestrator' | 'agent-discovery';

export interface SmokeTestResult {
  id: SmokeTestId;
  label: string;
  passed: boolean;
  durationMs: number;
  message: string;
}

export interface SmokeTestRunSummary {
  results: SmokeTestResult[];
  allPassed: boolean;
  ranAt: string;
  provider: string;
  model: string;
}

function smokeOllamaConfig(): AIConfig {
  const saved = loadAIConfig();
  return {
    provider: 'ollama',
    baseUrl: saved.baseUrl ?? defaultConfigs.ollama.baseUrl,
    model: 'gemma4:latest',
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s — is Ollama running?`));
    }, ms);
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function runTimed(
  id: SmokeTestId,
  label: string,
  fn: () => Promise<{ message: string; passed: boolean }>,
  timeoutMs = SMOKE_TEST_LLM_TIMEOUT_MS,
): Promise<SmokeTestResult> {
  const start = Date.now();
  try {
    const { message, passed } = await withTimeout(fn(), timeoutMs, label);
    return { id, label, passed, durationMs: Date.now() - start, message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      id,
      label,
      passed: false,
      durationMs: Date.now() - start,
      message: msg,
    };
  }
}

async function ensureOllamaUp(config: AIConfig): Promise<string | null> {
  const status = await withTimeout(
    checkOllamaStatus(config.baseUrl),
    SMOKE_TEST_TIMEOUT_MS,
    'Ollama status check',
  );
  if (!status.running) {
    return status.error ?? 'Ollama not running';
  }
  return null;
}

async function testChatBasic(): Promise<{ message: string; passed: boolean }> {
  const config = smokeOllamaConfig();
  const down = await ensureOllamaUp(config);
  if (down) return { passed: false, message: down };

  const response = await chat(config, [
    { role: 'user', content: 'Reply with exactly the word OK and nothing else.' },
  ], { numPredict: 32, timeoutMs: SMOKE_TEST_LLM_TIMEOUT_MS });

  if (response.error) {
    return { passed: false, message: response.error };
  }
  if (!response.content.trim()) {
    return { passed: false, message: 'Empty response from chat()' };
  }
  return {
    passed: true,
    message: `chat() returned ${response.content.trim().slice(0, 80)}`,
  };
}

async function testOpsCopilotHermes(): Promise<{ message: string; passed: boolean }> {
  const result = await analyzeWithOpsAgent(
    'hermes',
    'Alert: repeated failed SSH logins from 203.0.113.50 against prod-jump-01.',
  );

  if (result.error) {
    return { passed: false, message: result.error };
  }
  if (!result.summary?.trim()) {
    return { passed: false, message: 'Hermes returned no summary' };
  }
  return {
    passed: true,
    message: `Hermes summary: ${result.summary.slice(0, 100)}${result.summary.length > 100 ? '…' : ''}`,
  };
}

async function testMissionOrchestrator(): Promise<{ message: string; passed: boolean }> {
  const outcome = await smokeTestMissionHandoff();
  if (!outcome.ok) {
    return { passed: false, message: outcome.error ?? 'Mission handoff failed' };
  }
  return {
    passed: true,
    message: outcome.summary.slice(0, 120),
  };
}

function parseDiscoveryJson(content: string): boolean {
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return false;
    parsed = JSON.parse(arrayMatch[0]);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return false;
  const first = parsed[0];
  if (!first || typeof first !== 'object') return false;
  const q = first as Record<string, unknown>;
  return typeof q.question === 'string' && q.question.length >= 10;
}

async function testAgentDiscoveryJson(): Promise<{ message: string; passed: boolean }> {
  const config = smokeOllamaConfig();
  const response = await chatJson(config, [
    { role: 'system', content: 'Return only valid JSON arrays. No markdown.' },
    {
      role: 'user',
      content:
        'Generate exactly 1 AAISM AI security certification exam question. ' +
        'Return a JSON array with one object: domain (1-4), question, options (4 strings), ' +
        'correctAnswer (0-3), explanation, difficulty, topic, confidence.',
    },
  ], { numPredict: 900, timeoutMs: SMOKE_TEST_LLM_TIMEOUT_MS });

  if (response.error) {
    return { passed: false, message: response.error };
  }
  if (!parseDiscoveryJson(response.content)) {
    return {
      passed: false,
      message: `Could not parse discovery JSON (${response.content.slice(0, 120)}…)`,
    };
  }
  return { passed: true, message: 'Discover agent JSON mode parsed 1 valid question' };
}

/** Run all AI smoke tests sequentially (Ollama + gemma4:latest). */
export async function runAllSmokeTests(): Promise<SmokeTestRunSummary> {
  const config = smokeOllamaConfig();
  const results: SmokeTestResult[] = [];

  const down = await ensureOllamaUp(config);
  if (down) {
    const fail = (id: SmokeTestId, label: string): SmokeTestResult => ({
      id,
      label,
      passed: false,
      durationMs: 0,
      message: down,
    });
    return {
      results: [
        fail('chat', 'Chat (Ollama)'),
        fail('ops-copilot', 'Ops Copilot (Hermes)'),
        fail('mission-orchestrator', 'Mission Orchestrator'),
        fail('agent-discovery', 'Agent Discovery (JSON)'),
      ],
      allPassed: false,
      ranAt: new Date().toISOString(),
      provider: config.provider,
      model: config.model,
    };
  }

  results.push(
    await runTimed('chat', 'Chat (Ollama)', testChatBasic),
  );
  results.push(
    await runTimed('ops-copilot', 'Ops Copilot (Hermes)', testOpsCopilotHermes, SMOKE_TEST_HEAVY_TIMEOUT_MS),
  );
  results.push(
    await runTimed('mission-orchestrator', 'Mission Orchestrator', testMissionOrchestrator, SMOKE_TEST_HEAVY_TIMEOUT_MS),
  );
  results.push(
    await runTimed('agent-discovery', 'Agent Discovery (JSON)', testAgentDiscoveryJson, SMOKE_TEST_HEAVY_TIMEOUT_MS),
  );

  return {
    results,
    allPassed: results.every(r => r.passed),
    ranAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}
