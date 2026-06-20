/**
 * Pluggable connector registry — localStorage only (`aegis-connectors-config`).
 * Migrates legacy `aaism-ai-config` + `aaism-integrations-config` on first load.
 */

import {
  CONNECTOR_DEFINITIONS,
  CONNECTOR_BY_ID,
  type ConnectorId,
  type ConnectorDefinition,
} from '../data/connectors/definitions';
import {
  type AIConfig,
  type AIProvider,
  defaultConfigs,
  AI_CONFIG_STORAGE_KEY,
  checkOllamaStatus,
  fetchGroqModels,
  testConnection as testAIConnection,
  loadLegacyAIConfig,
  saveAIConfig as saveLegacyAIConfig,
  resolveOllamaModel,
  dispatchAIConfigChanged,
} from './aiService';
import {
  INTEGRATIONS_CONFIG_KEY,
  loadIntegrationsConfig,
  saveIntegrationsConfig,
  testSupabaseConnection,
  validateCheckoutUrl,
  type IntegrationsConfig,
} from './integrationsConfigService';
import { RSS_SOURCES } from '../data/rssSources';

export const CONNECTORS_CONFIG_KEY = 'aegis-connectors-config';

export type ConnectorStatus = 'disconnected' | 'connected' | 'error';

export interface ConnectorState {
  enabled: boolean;
  fields: Record<string, string>;
  lastStatus?: ConnectorStatus;
  lastMessage?: string;
  lastChecked?: string;
}

export interface ConnectorsConfig {
  primaryAiProvider: AIProvider;
  connectors: Partial<Record<ConnectorId, ConnectorState>>;
  migratedAt?: string;
}

export interface ConnectorRuntime extends ConnectorDefinition {
  status: ConnectorStatus;
  enabled: boolean;
  fields: Record<string, string>;
  lastMessage?: string;
  lastChecked?: string;
}

const AI_CONNECTOR_TO_PROVIDER: Record<string, AIProvider> = {
  ollama: 'ollama',
  groq: 'groq',
  anthropic: 'claude',
  openai: 'openai',
};

const PROVIDER_TO_CONNECTOR: Record<AIProvider, ConnectorId> = {
  ollama: 'ollama',
  groq: 'groq',
  claude: 'anthropic',
  openai: 'openai',
};

function defaultConnectorState(id: ConnectorId, enabled = false): ConnectorState {
  const def = CONNECTOR_BY_ID[id];
  const fields: Record<string, string> = {};
  def.requiredFields?.forEach(f => {
    if (f.key === 'baseUrl') fields.baseUrl = 'http://localhost:11434';
    if (f.key === 'model') fields.model = defaultConfigs.ollama.model ?? 'gemma4:latest';
  });
  return { enabled, fields };
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function migrateFromLegacy(): ConnectorsConfig {
  const ai = readJson<AIConfig>(AI_CONFIG_STORAGE_KEY);
  const integrations = readJson<IntegrationsConfig>(INTEGRATIONS_CONFIG_KEY);

  const connectors: Partial<Record<ConnectorId, ConnectorState>> = {};

  // Ollama — enabled by default if primary or no cloud key
  connectors.ollama = {
    enabled: !ai || ai.provider === 'ollama',
    fields: {
      baseUrl: ai?.baseUrl ?? defaultConfigs.ollama.baseUrl ?? 'http://localhost:11434',
      model: ai?.model ?? defaultConfigs.ollama.model ?? 'gemma4:latest',
    },
  };

  if (ai?.apiKey) {
    const cid = PROVIDER_TO_CONNECTOR[ai.provider];
    if (cid && cid !== 'ollama') {
      connectors[cid] = {
        enabled: true,
        fields: {
          apiKey: ai.apiKey,
          model: ai.model,
          baseUrl: ai.baseUrl ?? '',
        },
      };
    }
  }

  if (integrations?.supabaseUrl || integrations?.supabaseAnonKey) {
    connectors.supabase = {
      enabled: true,
      fields: {
        url: integrations.supabaseUrl ?? '',
        anonKey: integrations.supabaseAnonKey ?? '',
      },
    };
  }

  if (integrations?.stripeCheckoutUrl) {
    connectors.stripe = {
      enabled: true,
      fields: { checkoutUrl: integrations.stripeCheckoutUrl },
    };
  }

  if (integrations?.razorpayPaymentLink || integrations?.razorpayKeyId) {
    connectors.razorpay = {
      enabled: true,
      fields: {
        paymentLink: integrations.razorpayPaymentLink ?? '',
        keyId: integrations.razorpayKeyId ?? '',
      },
    };
  }

  // RSS intel — on by default (built-in sources)
  connectors['rss-intel'] = { enabled: true, fields: {} };

  return {
    primaryAiProvider: ai?.provider ?? 'ollama',
    connectors,
    migratedAt: new Date().toISOString(),
  };
}

export function loadConnectorsConfig(): ConnectorsConfig {
  const stored = readJson<ConnectorsConfig>(CONNECTORS_CONFIG_KEY);
  if (stored?.connectors) return stored;
  const migrated = migrateFromLegacy();
  saveConnectorsConfig(migrated);
  return migrated;
}

export function syncAIConfigToConnectors(config: AIConfig): void {
  const stored = readJson<ConnectorsConfig>(CONNECTORS_CONFIG_KEY);
  if (!stored) return;

  const cid = PROVIDER_TO_CONNECTOR[config.provider];
  if (cid) {
    const fields: Record<string, string> = {};
    if (config.provider === 'ollama') {
      fields.baseUrl = config.baseUrl ?? defaultConfigs.ollama.baseUrl ?? 'http://localhost:11434';
      fields.model = config.model;
    } else {
      if (config.apiKey) fields.apiKey = config.apiKey;
      fields.model = config.model;
      if (config.baseUrl) fields.baseUrl = config.baseUrl;
    }
    stored.connectors[cid] = {
      ...(stored.connectors[cid] ?? defaultConnectorState(cid, true)),
      enabled: true,
      fields,
    };
  }
  stored.primaryAiProvider = config.provider;
  writeJson(CONNECTORS_CONFIG_KEY, stored);
}

export function saveConnectorsConfig(config: ConnectorsConfig): void {
  writeJson(CONNECTORS_CONFIG_KEY, config);
  syncToLegacyStores(config);
  dispatchAIConfigChanged(buildAIConfigFromConnectors(config));
}

/** Atomically enable Ollama, set model, sync aaism-ai-config + aegis-connectors-config */
export function syncOllamaSelection(
  model: string,
  options?: { enabled?: boolean; baseUrl?: string; setPrimary?: boolean },
): AIConfig {
  const config = loadConnectorsConfig();
  if (options?.setPrimary !== false) {
    config.primaryAiProvider = 'ollama';
  }
  const existing = config.connectors.ollama ?? defaultConnectorState('ollama', true);
  config.connectors.ollama = {
    ...existing,
    enabled: options?.enabled ?? true,
    fields: {
      ...existing.fields,
      baseUrl: options?.baseUrl ?? existing.fields.baseUrl ?? defaultConfigs.ollama.baseUrl ?? 'http://localhost:11434',
      model,
    },
  };
  saveConnectorsConfig(config);
  return buildAIConfigFromConnectors(config);
}

/** Atomically set primary provider and mirror to legacy AI config */
export function syncPrimaryProvider(provider: AIProvider): AIConfig {
  const config = loadConnectorsConfig();
  config.primaryAiProvider = provider;
  const cid = PROVIDER_TO_CONNECTOR[provider];
  if (cid) {
    const existing = config.connectors[cid] ?? defaultConnectorState(cid, true);
    config.connectors[cid] = { ...existing, enabled: true };
  }
  saveConnectorsConfig(config);
  return buildAIConfigFromConnectors(config);
}

function syncToLegacyStores(config: ConnectorsConfig): void {
  const aiConfig = buildAIConfigFromConnectors(config);
  saveLegacyAIConfig(aiConfig);

  const integrations: IntegrationsConfig = loadIntegrationsConfig();
  const supa = config.connectors.supabase;
  if (supa?.enabled) {
    integrations.supabaseUrl = supa.fields.url;
    integrations.supabaseAnonKey = supa.fields.anonKey;
  }
  const stripe = config.connectors.stripe;
  if (stripe?.enabled) {
    integrations.stripeCheckoutUrl = stripe.fields.checkoutUrl;
  }
  const razorpay = config.connectors.razorpay;
  if (razorpay?.enabled) {
    integrations.razorpayPaymentLink = razorpay.fields.paymentLink;
    integrations.razorpayKeyId = razorpay.fields.keyId;
  }
  saveIntegrationsConfig(integrations);
}

export function getConnectorState(id: ConnectorId): ConnectorState {
  const config = loadConnectorsConfig();
  return config.connectors[id] ?? defaultConnectorState(id);
}

export function setConnectorState(id: ConnectorId, state: ConnectorState): void {
  if (id === 'ollama' && state.fields.model) {
    syncOllamaSelection(state.fields.model, {
      enabled: state.enabled,
      baseUrl: state.fields.baseUrl,
      setPrimary: state.enabled && getPrimaryAiProvider() === 'ollama',
    });
    return;
  }
  const config = loadConnectorsConfig();
  config.connectors[id] = state;
  saveConnectorsConfig(config);
}

export function setPrimaryAiProvider(provider: AIProvider): void {
  syncPrimaryProvider(provider);
}

export function getPrimaryAiProvider(): AIProvider {
  return loadConnectorsConfig().primaryAiProvider;
}

export function buildAIConfigFromConnectors(config?: ConnectorsConfig): AIConfig {
  const cfg = config ?? loadConnectorsConfig();
  const provider = cfg.primaryAiProvider;
  const cid = PROVIDER_TO_CONNECTOR[provider];
  const state = cid ? cfg.connectors[cid] : undefined;
  const base = { ...defaultConfigs[provider] } as Partial<AIConfig>;

  if (provider === 'ollama') {
    return {
      provider: 'ollama',
      baseUrl: state?.fields.baseUrl || base.baseUrl,
      model: state?.fields.model || base.model!,
    };
  }

  const legacy = loadLegacyAIConfig();
  return {
    provider,
    apiKey: state?.fields.apiKey || legacy.apiKey,
    baseUrl: state?.fields.baseUrl || base.baseUrl,
    model: state?.fields.model || base.model!,
    groqModels: legacy.groqModels,
    groqModelsFetchedAt: legacy.groqModelsFetchedAt,
    validationModel: legacy.validationModel,
  };
}

/** Resolve AI config with fallback: primary → Groq only when Ollama fails or primary lacks key */
export async function resolveAIConfigWithFallback(): Promise<{ config: AIConfig; fallbackUsed: boolean; message?: string }> {
  const cfg = loadConnectorsConfig();
  const primary = buildAIConfigFromConnectors(cfg);

  if (primary.provider === 'ollama') {
    const status = await checkOllamaStatus(primary.baseUrl);
    if (status.running && status.models.length > 0) {
      const resolved = await resolveOllamaModel(primary);
      if (!resolved.error) {
        const config = { ...primary, model: resolved.model };
        if (resolved.fallbackUsed && resolved.model !== primary.model) {
          syncOllamaSelection(resolved.model, { baseUrl: primary.baseUrl, setPrimary: true });
        }
        return { config, fallbackUsed: resolved.fallbackUsed };
      }
    }

    const groqState = cfg.connectors.groq;
    if (groqState?.enabled && groqState.fields.apiKey?.trim()) {
      return {
        config: {
          provider: 'groq',
          apiKey: groqState.fields.apiKey,
          baseUrl: defaultConfigs.groq.baseUrl,
          model: groqState.fields.model || defaultConfigs.groq.model!,
        },
        fallbackUsed: true,
        message: status.running
          ? 'Ollama model unavailable — using Groq fallback'
          : 'Ollama not running — using Groq fallback',
      };
    }

    return {
      config: primary,
      fallbackUsed: false,
      message: status.running
        ? 'Ollama running but configured model unavailable'
        : 'Ollama not running — open Settings → AI Provider',
    };
  }

  if (primary.apiKey?.trim()) {
    return { config: primary, fallbackUsed: false };
  }

  const groqState = cfg.connectors.groq;
  if (groqState?.enabled && groqState.fields.apiKey?.trim()) {
    return {
      config: {
        provider: 'groq',
        apiKey: groqState.fields.apiKey,
        baseUrl: defaultConfigs.groq.baseUrl,
        model: groqState.fields.model || defaultConfigs.groq.model!,
      },
      fallbackUsed: true,
      message: `${cfg.primaryAiProvider} not configured — using Groq fallback`,
    };
  }

  return {
    config: primary,
    fallbackUsed: false,
    message: 'Connect an AI provider in Settings → Connectors',
  };
}

export function isConnectorConfigured(id: ConnectorId): boolean {
  const state = getConnectorState(id);
  if (!state.enabled) return false;
  const def = CONNECTOR_BY_ID[id];
  if (!def.requiredFields?.length) return true;
  return def.requiredFields.every(f => {
    if (f.key === 'keyId') return true;
    return Boolean(state.fields[f.key]?.trim());
  });
}

async function testConnectorConnection(id: ConnectorId, fields: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  switch (id) {
    case 'ollama': {
      const baseUrl = fields.baseUrl || 'http://localhost:11434';
      const status = await checkOllamaStatus(baseUrl);
      if (!status.running) {
        return { ok: false, message: status.error ?? 'Ollama not running — click "Open Ollama app" in Local LLM Hub' };
      }
      const model = fields.model || 'qwen2.5:7b';
      const hasModel = status.models.some(m => m.name === model || m.name.startsWith(model.split(':')[0]));
      if (status.models.length === 0) {
        return { ok: false, message: 'Ollama running but no models — run: ollama pull llama3.1:8b' };
      }
      return {
        ok: true,
        message: hasModel
          ? `Connected — ${status.models.length} model(s), default ${model} ready`
          : `Connected — ${status.models.length} model(s); ${model} not installed`,
      };
    }
    case 'groq': {
      if (!fields.apiKey?.trim()) return { ok: false, message: 'Groq API key required' };
      const result = await fetchGroqModels({
        provider: 'groq',
        apiKey: fields.apiKey,
        model: defaultConfigs.groq.model!,
        baseUrl: defaultConfigs.groq.baseUrl,
      });
      return { ok: result.success, message: result.message };
    }
    case 'anthropic': {
      if (!fields.apiKey?.trim()) return { ok: false, message: 'Anthropic API key required' };
      const result = await testAIConnection({
        provider: 'claude',
        apiKey: fields.apiKey,
        model: fields.model || defaultConfigs.claude.model!,
        baseUrl: defaultConfigs.claude.baseUrl,
      });
      return { ok: result.success, message: result.message };
    }
    case 'openai': {
      if (!fields.apiKey?.trim()) return { ok: false, message: 'OpenAI API key required' };
      const result = await testAIConnection({
        provider: 'openai',
        apiKey: fields.apiKey,
        model: fields.model || defaultConfigs.openai.model!,
        baseUrl: defaultConfigs.openai.baseUrl,
      });
      return { ok: result.success, message: result.message };
    }
    case 'supabase': {
      if (!fields.url?.trim() || !fields.anonKey?.trim()) {
        return { ok: false, message: 'Supabase URL and anon key required' };
      }
      const result = await testSupabaseConnection(fields.url, fields.anonKey);
      return { ok: result.ok, message: result.message };
    }
    case 'rss-intel': {
      const count = RSS_SOURCES.length;
      if (count === 0) return { ok: false, message: 'No RSS sources configured' };
      return { ok: true, message: `${count} RSS sources ready for Intel Hub` };
    }
    case 'stripe': {
      if (!fields.checkoutUrl?.trim()) return { ok: false, message: 'Stripe checkout URL required' };
      const v = validateCheckoutUrl(fields.checkoutUrl, 'stripe');
      return { ok: v.valid, message: v.message };
    }
    case 'razorpay': {
      if (!fields.paymentLink?.trim()) return { ok: false, message: 'Razorpay payment link required' };
      const v = validateCheckoutUrl(fields.paymentLink, 'razorpay');
      return { ok: v.valid, message: v.message };
    }
    default:
      return { ok: false, message: 'Unknown connector' };
  }
}

export async function testConnector(id: ConnectorId): Promise<{ ok: boolean; message: string }> {
  const state = getConnectorState(id);
  const result = await testConnectorConnection(id, state.fields);
  const config = loadConnectorsConfig();
  config.connectors[id] = {
    ...state,
    lastStatus: result.ok ? 'connected' : 'error',
    lastMessage: result.message,
    lastChecked: new Date().toISOString(),
  };
  saveConnectorsConfig(config);
  return result;
}

export function getConnectorRuntime(id: ConnectorId): ConnectorRuntime {
  const def = CONNECTOR_BY_ID[id];
  const state = getConnectorState(id);
  let status: ConnectorStatus = 'disconnected';
  if (state.enabled) {
    if (state.lastStatus) {
      status = state.lastStatus;
    } else if (isConnectorConfigured(id)) {
      status = 'connected';
    }
  }
  return {
    ...def,
    status,
    enabled: state.enabled,
    fields: state.fields,
    lastMessage: state.lastMessage,
    lastChecked: state.lastChecked,
  };
}

export function getAllConnectors(): ConnectorRuntime[] {
  return CONNECTOR_DEFINITIONS.map(d => getConnectorRuntime(d.id));
}

/** Live health check for one connector; persists status to localStorage. */
export async function refreshConnectorStatus(id: ConnectorId): Promise<ConnectorRuntime> {
  const state = getConnectorState(id);
  if (!state.enabled) {
    return getConnectorRuntime(id);
  }
  const result = await testConnectorConnection(id, state.fields);
  const config = loadConnectorsConfig();
  config.connectors[id] = {
    ...state,
    lastStatus: result.ok ? 'connected' : 'error',
    lastMessage: result.message,
    lastChecked: new Date().toISOString(),
  };
  saveConnectorsConfig(config);
  return getConnectorRuntime(id);
}

/** Refresh all enabled connectors (used by Settings 30s poll). */
export async function refreshEnabledConnectorStatuses(): Promise<void> {
  const config = loadConnectorsConfig();
  const enabled = CONNECTOR_DEFINITIONS.filter(d => config.connectors[d.id]?.enabled);
  await Promise.all(enabled.map(d => refreshConnectorStatus(d.id)));
}

export function getAiConnectors(): ConnectorRuntime[] {
  return getAllConnectors().filter(c => c.category === 'ai');
}

export { AI_CONNECTOR_TO_PROVIDER, PROVIDER_TO_CONNECTOR };
export type { ConnectorId } from '../data/connectors/definitions';
