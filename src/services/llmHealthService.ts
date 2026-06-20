import {
  type AIProvider,
  checkOllamaStatus,
  loadAIConfig,
  pickBestInstalledModel,
  type OllamaModel,
} from './aiService';

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
const POLL_INTERVAL_MS = 60_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastReport: LLMHealthReport | null = null;
const listeners = new Set<(report: LLMHealthReport) => void>();

function modelIsInstalled(models: OllamaModel[], modelName: string): boolean {
  const names = models.map(m => m.name);
  if (names.includes(modelName)) return true;
  const base = modelName.split(':')[0];
  return names.some(n => n === base || n.startsWith(`${base}:`));
}

async function checkOllamaHealth(baseUrl?: string, configuredModel?: string): Promise<ProviderHealth> {
  const now = new Date().toISOString();
  const status = await checkOllamaStatus(baseUrl);

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
  const config = loadAIConfig();
  if (config.provider !== 'ollama') {
    return () => {};
  }

  const tick = () => {
    if (document.visibilityState === 'hidden') return;
    void checkLLMHealth();
  };

  void checkLLMHealth();
  pollTimer = setInterval(tick, POLL_INTERVAL_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void checkLLMHealth();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    document.removeEventListener('visibilitychange', onVisibility);
  };
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
