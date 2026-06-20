import {
  type AIProvider,
  checkOllamaStatus,
  loadAIConfig,
  pickBestInstalledModel,
  type OllamaModel,
  AI_CONFIG_CHANGED_EVENT,
} from './aiService';
import { normalizeOllamaBaseUrl } from './ollamaAppService';

export interface ProviderHealth {
  provider: AIProvider;
  healthy: boolean;
  message: string;
  modelInstalled?: boolean;
  configuredModel?: string;
  resolvedModel?: string;
  installedModels?: string[];
  lastChecked: string;
}

export interface LLMHealthReport {
  activeProvider: AIProvider;
  providers: Partial<Record<AIProvider, ProviderHealth>>;
  overallHealthy: boolean;
}

const HEALTH_CACHE_KEY = 'aaism-llm-health-cache';
export const POLL_INTERVAL_MS = 60_000;
export const SETTINGS_POLL_INTERVAL_MS = 30_000;

export type FixAction =
  | { type: 'open-ollama'; label: string }
  | { type: 'navigate'; href: string; label: string };

let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastReport: LLMHealthReport | null = null;
const listeners = new Set<(report: LLMHealthReport) => void>();
const afterCheckHooks = new Set<(report: LLMHealthReport) => void>();

/** Register a hook fired after each LLM health check (e.g. sync system health banner). */
export function onLLMHealthChecked(hook: (report: LLMHealthReport) => void): () => void {
  afterCheckHooks.add(hook);
  return () => afterCheckHooks.delete(hook);
}

function modelIsInstalled(models: OllamaModel[], modelName: string): boolean {
  const names = models.map(m => m.name);
  if (names.includes(modelName)) return true;
  const base = modelName.split(':')[0];
  return names.some(n => n === base || n.startsWith(`${base}:`));
}

async function checkOllamaHealth(baseUrl?: string, configuredModel?: string): Promise<ProviderHealth> {
  const now = new Date().toISOString();
  const status = await checkOllamaStatus(normalizeOllamaBaseUrl(baseUrl));

  if (!status.running) {
    return {
      provider: 'ollama',
      healthy: false,
      message: status.error ?? 'Ollama not running — open Settings → AI Provider and click "Open Ollama app"',
      configuredModel,
      lastChecked: now,
    };
  }

  const installed = status.models;
  const names = installed.map(m => m.name);
  const configured = configuredModel ?? 'qwen2.5:7b';
  const installedFlag = modelIsInstalled(installed, configured);
  const resolved = installedFlag
    ? configured
    : (pickBestInstalledModel(installed) ?? undefined);

  if (installed.length === 0) {
    return {
      provider: 'ollama',
      healthy: false,
      message: 'Ollama running but no models installed — run: ollama pull llama3.1:8b',
      configuredModel: configured,
      installedModels: names,
      lastChecked: now,
    };
  }

  if (!installedFlag && !resolved) {
    return {
      provider: 'ollama',
      healthy: false,
      message: `Model ${configured} not found — run: ollama pull llama3.1:8b`,
      configuredModel: configured,
      installedModels: names,
      lastChecked: now,
    };
  }

  return {
    provider: 'ollama',
    healthy: true,
    message: resolved && resolved !== configured
      ? `Using ${resolved} (${configured} not installed)`
      : `${names.length} model(s) ready`,
    modelInstalled: installedFlag,
    configuredModel: configured,
    resolvedModel: resolved ?? configured,
    installedModels: names,
    lastChecked: now,
  };
}

async function checkGroqHealth(apiKey?: string): Promise<ProviderHealth> {
  const now = new Date().toISOString();
  if (!apiKey?.trim()) {
    return {
      provider: 'groq',
      healthy: false,
      message: 'Groq API key missing — add at console.groq.com → Settings',
      lastChecked: now,
    };
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return {
        provider: 'groq',
        healthy: false,
        message: `Groq API error: ${res.status} ${res.statusText}`,
        lastChecked: now,
      };
    }
    return {
      provider: 'groq',
      healthy: true,
      message: 'Groq API reachable',
      lastChecked: now,
    };
  } catch (e) {
    return {
      provider: 'groq',
      healthy: false,
      message: `Groq unreachable: ${e instanceof Error ? e.message : String(e)}`,
      lastChecked: now,
    };
  }
}

export async function checkLLMHealth(): Promise<LLMHealthReport> {
  const config = loadAIConfig();
  const providers: Partial<Record<AIProvider, ProviderHealth>> = {};

  providers.ollama = await checkOllamaHealth(config.baseUrl, config.model);

  if (config.apiKey || config.provider === 'groq') {
    providers.groq = await checkGroqHealth(config.apiKey);
  }

  const active = config.provider;
  const overallHealthy = active === 'ollama'
    ? (providers.ollama?.healthy ?? false)
    : active === 'groq'
      ? (providers.groq?.healthy ?? false)
      : !!config.apiKey?.trim();

  const report: LLMHealthReport = {
    activeProvider: active,
    providers,
    overallHealthy,
  };

  lastReport = report;
  try {
    localStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(report));
  } catch { /* ignore */ }

  listeners.forEach(fn => fn(report));
  afterCheckHooks.forEach(fn => fn(report));
  return report;
}

export function getLastHealthReport(): LLMHealthReport | null {
  if (lastReport) return lastReport;
  try {
    const raw = localStorage.getItem(HEALTH_CACHE_KEY);
    if (raw) return JSON.parse(raw) as LLMHealthReport;
  } catch { /* ignore */ }
  return null;
}

export function subscribeLLMHealth(listener: (report: LLMHealthReport) => void): () => void {
  listeners.add(listener);
  const cached = getLastHealthReport();
  if (cached) listener(cached);
  return () => listeners.delete(listener);
}

export function startLLMHealthPolling(): () => void {
  const tick = () => {
    if (document.visibilityState === 'hidden') return;
    void checkLLMHealth();
  };

  void checkLLMHealth();
  pollTimer = setInterval(tick, POLL_INTERVAL_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void checkLLMHealth();
  };
  const onConfigChanged = () => {
    void checkLLMHealth();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener(AI_CONFIG_CHANGED_EVENT, onConfigChanged);

  return () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener(AI_CONFIG_CHANGED_EVENT, onConfigChanged);
  };
}

export function formatConnectedStatusLabel(report: LLMHealthReport): string {
  const { activeProvider, providers } = report;
  const health = providers[activeProvider];

  if (activeProvider === 'ollama') {
    const count = health?.installedModels?.length ?? 0;
    const model = health?.resolvedModel ?? health?.configuredModel ?? loadAIConfig().model;
    return `Connected to Ollama · ${count} model${count === 1 ? '' : 's'} · ${model}`;
  }

  if (activeProvider === 'groq') {
    return `Connected to Groq · ${health?.configuredModel ?? loadAIConfig().model}`;
  }

  const name = activeProvider === 'claude' ? 'Claude' : activeProvider === 'openai' ? 'OpenAI' : activeProvider;
  return `Connected to ${name} · ${health?.configuredModel ?? loadAIConfig().model}`;
}

/** Actionable banner line when AI is healthy, e.g. "Ollama connected — using gemma4:latest" */
export function formatConnectedBannerMessage(report: LLMHealthReport): string {
  const { activeProvider, providers } = report;
  const health = providers[activeProvider];
  const model = health?.resolvedModel ?? health?.configuredModel ?? loadAIConfig().model;

  if (activeProvider === 'ollama') {
    return `Ollama connected — using ${model}`;
  }
  if (activeProvider === 'groq') {
    return `Groq connected — using ${model}`;
  }
  const name = activeProvider === 'claude' ? 'Claude' : 'OpenAI';
  return `${name} connected — using ${model}`;
}

export function getFixAction(report: LLMHealthReport): FixAction | null {
  if (report.overallHealthy) return null;

  if (report.activeProvider === 'ollama') {
    const msg = report.providers.ollama?.message ?? '';
    if (msg.includes('not running') || msg.includes('Ollama not')) {
      return { type: 'open-ollama', label: 'Open Ollama app' };
    }
    if (msg.includes('no models') || msg.includes('not found')) {
      return { type: 'navigate', href: '/settings', label: 'Pull a model' };
    }
    return { type: 'open-ollama', label: 'Fix connection' };
  }

  if (report.activeProvider === 'groq') {
    return { type: 'navigate', href: '/settings', label: 'Add Groq API key' };
  }

  return { type: 'navigate', href: '/settings', label: 'Configure provider' };
}

export function isAIReady(report: LLMHealthReport | null): boolean {
  return report?.overallHealthy ?? false;
}

export function getFixSteps(report: LLMHealthReport | null): string[] {
  if (!report) return ['Check LLM provider in Settings'];
  const active = report.providers[report.activeProvider];
  if (!active) return ['Configure Ollama or Groq in Settings'];

  if (report.activeProvider === 'ollama') {
    if (!active.healthy) {
      const steps = [
        'Open Settings → AI Provider',
        'Click "Open Ollama app" — no Terminal needed',
        'Use one-click Pull buttons for recommended models',
      ];
      if (active.message.includes('not found') || active.message.includes('no models')) {
        steps.push('Pull Gemma 4 (8B) or Qwen 2.5 7B from the setup wizard');
      }
      if (active.configuredModel && !active.modelInstalled) {
        steps.push(`Or pull your configured model: ollama pull ${active.configuredModel}`);
      }
      return steps;
    }
  }

  if (report.activeProvider === 'groq' && !active.healthy) {
    return ['Get a free key at console.groq.com', 'Add API key in Settings → Groq'];
  }

  return [];
}
