/**
 * Auto-configuration service — boot-time provider setup and pre-run AI readiness checks.
 * Agents call ensureAIReady() at run start; initAutoConfigOnBoot() runs on app load.
 */

import { testOllamaConnection } from './ollamaAppService';
import {
  pickBestInstalledModel,
  fetchGroqModels,
  defaultConfigs,
  type OllamaModel,
} from './aiService';
import {
  resolveAIConfigWithFallback,
  getConnectorState,
  syncOllamaSelection,
  syncPrimaryProvider,
  loadConnectorsConfig,
} from './connectorRegistry';
import { markConnectionVerified } from './connectionVerificationService';
import { notifyOllamaConnected } from './systemHealthService';
import {
  checkLLMHealth,
  getFixSteps,
  type LLMHealthReport,
} from './llmHealthService';

export const AUTOCONFIG_LOG_KEY = 'aegis-autoconfig-log';
export const AUTOCONFIG_SETTINGS_KEY = 'aegis-autoconfig-settings';
export const AUTOCONFIG_TOAST_EVENT = 'aegis-autoconfig-toast';
export const AUTOCONFIG_LOG_CHANGED_EVENT = 'aegis-autoconfig-log-changed';

const MAX_LOG_ENTRIES = 20;
const RETRY_DELAYS_MS = [2_000, 4_000, 8_000] as const;

export type AutoConfigLogLevel = 'info' | 'success' | 'warn' | 'error';

export interface AutoConfigLogEntry {
  timestamp: string;
  level: AutoConfigLogLevel;
  message: string;
}

export interface AutoConfigSettings {
  enabledOnStartup: boolean;
}

export interface AutoConfigResult {
  ok: boolean;
  provider: 'ollama' | 'groq' | 'none';
  message: string;
  model?: string;
}

export interface AutoConfigToastDetail {
  message: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

export interface AIReadyResult {
  ready: boolean;
  message: string;
  fixSteps: string[];
  report?: LLMHealthReport;
}

const DEFAULT_SETTINGS: AutoConfigSettings = { enabledOnStartup: true };

let bootStarted = false;
let runningPromise: Promise<AutoConfigResult> | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function loadAutoConfigSettings(): AutoConfigSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<AutoConfigSettings>>(AUTOCONFIG_SETTINGS_KEY, {}) };
}

export function saveAutoConfigSettings(settings: AutoConfigSettings): void {
  writeJson(AUTOCONFIG_SETTINGS_KEY, settings);
}

export function getAutoConfigLog(): AutoConfigLogEntry[] {
  return readJson<AutoConfigLogEntry[]>(AUTOCONFIG_LOG_KEY, []);
}

export function appendAutoConfigLog(message: string, level: AutoConfigLogLevel = 'info'): AutoConfigLogEntry {
  const entry: AutoConfigLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  const log = [...getAutoConfigLog(), entry].slice(-MAX_LOG_ENTRIES);
  writeJson(AUTOCONFIG_LOG_KEY, log);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTOCONFIG_LOG_CHANGED_EVENT, { detail: log }));
  }
  return entry;
}

export function subscribeAutoConfigLog(listener: (log: AutoConfigLogEntry[]) => void): () => void {
  listener(getAutoConfigLog());
  const handler = (e: Event) => {
    listener((e as CustomEvent<AutoConfigLogEntry[]>).detail ?? getAutoConfigLog());
  };
  window.addEventListener(AUTOCONFIG_LOG_CHANGED_EVENT, handler);
  return () => window.removeEventListener(AUTOCONFIG_LOG_CHANGED_EVENT, handler);
}

export function showAutoConfigToast(message: string, variant: AutoConfigToastDetail['variant'] = 'info'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AutoConfigToastDetail>(AUTOCONFIG_TOAST_EVENT, { detail: { message, variant } }),
  );
}

function modelNameMatches(names: string[], configured: string): boolean {
  if (names.includes(configured)) return true;
  const base = configured.split(':')[0];
  return names.some(n => n === base || n.startsWith(`${base}:`));
}

function findGemma4Model(names: string[]): string | null {
  return names.find(n => n === 'gemma4:latest') ?? names.find(n => n.startsWith('gemma4:')) ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNotReadyMessage(report: LLMHealthReport | null): string {
  if (!report) {
    return 'AI provider not configured — open Settings → AI Provider to connect Ollama or Groq.';
  }
  const active = report.providers[report.activeProvider];
  return active?.message ?? 'AI provider not ready — check Settings → AI Provider.';
}

async function tryGroqFallback(): Promise<AutoConfigResult | null> {
  const groqState = getConnectorState('groq');
  const apiKey = groqState.fields.apiKey?.trim();
  if (!apiKey) {
    appendAutoConfigLog('Groq fallback skipped — no API key configured', 'warn');
    return null;
  }

  appendAutoConfigLog('Trying Groq fallback…', 'info');
  const test = await fetchGroqModels({
    provider: 'groq',
    apiKey,
    model: groqState.fields.model || defaultConfigs.groq.model!,
    baseUrl: defaultConfigs.groq.baseUrl,
  });

  if (!test.success) {
    appendAutoConfigLog(`Groq fallback failed: ${test.message}`, 'error');
    return null;
  }

  syncPrimaryProvider('groq');
  appendAutoConfigLog('Switched primary provider to Groq', 'success');
  await checkLLMHealth();
  return {
    ok: true,
    provider: 'groq',
    message: 'Using Groq — Ollama unavailable',
  };
}

async function attemptOllamaConfigure(): Promise<AutoConfigResult | null> {
  const ollamaState = getConnectorState('ollama');
  const baseUrl = ollamaState.fields.baseUrl || defaultConfigs.ollama.baseUrl!;
  const configuredModel = ollamaState.fields.model || defaultConfigs.ollama.model!;

  appendAutoConfigLog(`Probing Ollama at ${baseUrl}…`, 'info');
  const probe = await testOllamaConnection(baseUrl, configuredModel);

  if (!probe.connected) {
    appendAutoConfigLog(probe.error ?? 'Ollama not reachable', 'warn');
    return null;
  }

  appendAutoConfigLog(
    `Ollama connected (${probe.latencyMs}ms, ${probe.models.length} model(s))`,
    'success',
  );

  const names = probe.models.map(m => m.name);
  const models = probe.models as OllamaModel[];
  let targetModel = configuredModel;

  const configuredMissing = !modelNameMatches(names, configuredModel);
  const gemma4 = findGemma4Model(names);

  if (configuredMissing && gemma4) {
    targetModel = gemma4;
    appendAutoConfigLog(`Self-heal: ${configuredModel} missing → ${gemma4}`, 'info');
  } else {
    const best = pickBestInstalledModel(models);
    if (best && (!modelNameMatches(names, configuredModel) || best !== configuredModel)) {
      targetModel = best;
      if (best !== configuredModel) {
        appendAutoConfigLog(`Auto-selected best model: ${best}`, 'info');
      }
    } else if (probe.defaultModel) {
      targetModel = probe.defaultModel;
    }
  }

  syncOllamaSelection(targetModel, {
    baseUrl: probe.baseUrl,
    enabled: true,
    setPrimary: true,
  });
  appendAutoConfigLog(`Synced connectors — model ${targetModel}`, 'success');

  await notifyOllamaConnected();
  appendAutoConfigLog('Health banner updated via notifyOllamaConnected()', 'info');

  const health = await checkLLMHealth();
  if (health.overallHealthy && health.activeProvider === 'ollama') {
    appendAutoConfigLog('LLM health check passed', 'success');
  } else {
    appendAutoConfigLog(
      health.providers.ollama?.message ?? 'Ollama connected but health check incomplete',
      'warn',
    );
  }

  return {
    ok: true,
    provider: 'ollama',
    message: `Ollama ready — ${targetModel}`,
    model: targetModel,
  };
}

/** Run full auto-configuration flow (manual or boot). */
export async function runAutoConfig(source: 'boot' | 'manual' = 'manual'): Promise<AutoConfigResult> {
  if (runningPromise) return runningPromise;

  runningPromise = (async (): Promise<AutoConfigResult> => {
    appendAutoConfigLog(
      source === 'boot' ? 'Auto-config on startup…' : 'Manual auto-config started',
      'info',
    );

    const maxAttempts = RETRY_DELAYS_MS.length;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS_MS[attempt - 1];
        appendAutoConfigLog(`Retry ${attempt + 1}/${maxAttempts} in ${delay / 1000}s…`, 'info');
        await sleep(delay);
      }

      const result = await attemptOllamaConfigure();
      if (result?.ok) {
        appendAutoConfigLog(result.message, 'success');
        showAutoConfigToast(result.message, 'success');
        return result;
      }
    }

    appendAutoConfigLog(`Waiting ${RETRY_DELAYS_MS[maxAttempts - 1] / 1000}s before fallback…`, 'info');
    await sleep(RETRY_DELAYS_MS[maxAttempts - 1]);

    appendAutoConfigLog('Ollama unavailable after retries — trying Groq', 'warn');
    const groqResult = await tryGroqFallback();
    if (groqResult?.ok) {
      appendAutoConfigLog(groqResult.message, 'success');
      showAutoConfigToast(groqResult.message, 'warning');
      return groqResult;
    }

    const cfg = loadConnectorsConfig();
    const message =
      cfg.connectors.groq?.fields.apiKey?.trim()
        ? 'AI offline — Ollama and Groq unavailable'
        : 'AI offline — start Ollama or add a Groq API key in Settings';

    appendAutoConfigLog(message, 'error');
    showAutoConfigToast(message, 'error');
    return { ok: false, provider: 'none', message };
  })().finally(() => {
    runningPromise = null;
  });

  return runningPromise!;
}

/** Kick off auto-config once on app boot when enabled in settings. */
export function initAutoConfigOnBoot(): void {
  if (bootStarted || typeof window === 'undefined') return;
  bootStarted = true;

  const settings = loadAutoConfigSettings();
  if (!settings.enabledOnStartup) {
    appendAutoConfigLog('Auto-config on startup disabled — skipped', 'info');
    return;
  }

  void runAutoConfig('boot');
}

/** Verify AI connectivity before heavy agent work. Blocks run when not ready. */
export async function ensureAIReady(): Promise<AIReadyResult> {
  const report = await checkLLMHealth();
  const { config, message: fallbackMessage } = await resolveAIConfigWithFallback();

  if (config.provider === 'ollama') {
    const ollamaHealth = report.providers.ollama;
    if (!ollamaHealth?.healthy) {
      return {
        ready: false,
        message: ollamaHealth?.message ?? formatNotReadyMessage(report),
        fixSteps: getFixSteps(report),
        report,
      };
    }
    markConnectionVerified('ollama', config.model);
    return {
      ready: true,
      message: fallbackMessage
        ? `AI ready (${fallbackMessage})`
        : `AI ready — Ollama · ${ollamaHealth.resolvedModel ?? config.model}`,
      fixSteps: [],
      report,
    };
  }

  if (!config.apiKey?.trim()) {
    return {
      ready: false,
      message: fallbackMessage ?? formatNotReadyMessage(report),
      fixSteps: getFixSteps(report),
      report,
    };
  }

  if (config.provider === 'groq' && !report.providers.groq?.healthy) {
    return {
      ready: false,
      message: report.providers.groq?.message ?? 'Groq API unreachable',
      fixSteps: getFixSteps(report),
      report,
    };
  }

  if (config.provider === 'groq') {
    markConnectionVerified('groq', config.model);
  }
  return {
    ready: true,
    message: fallbackMessage
      ? `AI ready (${fallbackMessage})`
      : `AI ready — ${config.provider}`,
    fixSteps: [],
    report,
  };
}

/** User-facing block message for UI when ensureAIReady fails. */
export function formatAIBlockedMessage(result: AIReadyResult): string {
  const steps = result.fixSteps.length > 0
    ? `\n\nFix:\n${result.fixSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : '';
  return `${result.message}${steps}`;
}
