// AI Service Layer - Supports multiple providers
// Ollama (local/offline), Groq (free), Claude API, OpenAI API

import {
  buildAIConfigFromConnectors,
  resolveAIConfigWithFallback,
  CONNECTORS_CONFIG_KEY,
  syncAIConfigToConnectors,
} from './connectorRegistry';
import {
  normalizeOllamaBaseUrl,
  DEFAULT_OLLAMA_URL,
  testOllamaConnection,
} from './ollamaAppService';

export type AIProvider = 'ollama' | 'groq' | 'claude' | 'openai';

export type ModelTier = 'small' | 'medium' | 'large';

export interface GroqModelOption {
  id: string;
  label: string;
  badge?: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  /** Optional separate model for validation/critic pass (multi-agent) */
  validationModel?: string;
  /** Cached Groq /v1/models list from last successful fetch */
  groqModels?: GroqModelOption[];
  groqModelsFetchedAt?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest?: string;
}

export interface ModelCapability {
  name: string;
  tier: ModelTier;
  jsonReliability: number; // 0-100
  sizeGb: string;
  gpuRam: string;
  description: string;
  recommended?: boolean;
  fallbackOnly?: boolean;
  /** Tier S — preferred for Agent Discovery JSON work */
  tierS?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export interface ChatOptions {
  jsonMode?: boolean;
  temperature?: number;
}

// Default configurations for each provider
export const defaultConfigs: Record<AIProvider, Partial<AIConfig>> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'gemma4:latest',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    model: 'llama-3.3-70b-versatile',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
  },
};

/** localStorage key for AI provider config (API keys stored here — browser only, never sent to AAISM servers) */
export const AI_CONFIG_STORAGE_KEY = 'aaism-ai-config';

export const AI_CONFIG_CHANGED_EVENT = 'aaism-ai-config-changed';

type AIConfigListener = (config: AIConfig) => void;
const aiConfigListeners = new Set<AIConfigListener>();

export function subscribeAIConfig(listener: AIConfigListener): () => void {
  aiConfigListeners.add(listener);
  listener(loadAIConfig());
  return () => aiConfigListeners.delete(listener);
}

export function initAIConfigSync(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener(AI_CONFIG_CHANGED_EVENT, () => {
    const config = loadLegacyAIConfig();
    aiConfigListeners.forEach(l => l(config));
  });
}

export function dispatchAIConfigChanged(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AI_CONFIG_CHANGED_EVENT, { detail: config }));
  aiConfigListeners.forEach(l => l(config));
}

/** Groq cloud models — static fallback when /v1/models fetch fails */
export const GROQ_MODELS: readonly GroqModelOption[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', badge: 'Recommended · JSON/agent' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', badge: 'Faster' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', badge: 'Long context' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B', badge: 'Efficient' },
];

/** Badge hints for known Groq model IDs (merged with API list) */
export const GROQ_MODEL_BADGES: Record<string, string> = {
  'llama-3.3-70b-versatile': 'Recommended · JSON/agent',
  'llama-3.3-70b-specdec': 'Speculative decode',
  'llama-3.1-8b-instant': 'Faster',
  'llama-3.1-70b-versatile': 'High quality',
  'llama-3.1-70b-specdec': 'Speculative decode',
  'llama-guard-3-8b': 'Safety guard',
  'mixtral-8x7b-32768': 'Long context',
  'gemma2-9b-it': 'Efficient',
  'gemma-7b-it': 'Efficient',
};

const GROQ_NON_CHAT_PATTERN = /whisper|distil|tts|embed|prompt|or-pp|or-sage|playai-tts/i;

function groqModelDisplayLabel(id: string): string {
  const staticMatch = GROQ_MODELS.find(m => m.id === id);
  if (staticMatch) return staticMatch.label;
  return id
    .replace(/-/g, ' ')
    .replace(/\b(\w)/g, c => c.toUpperCase());
}

function groqModelOptionLabel(id: string, badge?: string): string {
  const base = groqModelDisplayLabel(id);
  return badge ? `${base} — ${badge}` : base;
}

/** Parse Groq /v1/models response into chat-capable dropdown options */
export function parseGroqModelsFromApi(data: unknown): GroqModelOption[] {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { data?: unknown }).data)) {
    return [];
  }

  const rows = (data as { data: { id?: string }[] }).data;
  const seen = new Set<string>();

  return rows
    .filter(m => {
      if (!m.id || GROQ_NON_CHAT_PATTERN.test(m.id) || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map(m => {
      const badge = GROQ_MODEL_BADGES[m.id!];
      return { id: m.id!, label: groqModelOptionLabel(m.id!, badge), badge };
    })
    .sort((a, b) => {
      const aRec = a.badge?.includes('Recommended') ? 0 : 1;
      const bRec = b.badge?.includes('Recommended') ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;
      return a.id.localeCompare(b.id);
    });
}

/** Models for dropdown — cached API list or static fallback */
export function getGroqModelsForDropdown(config: AIConfig): GroqModelOption[] {
  if (config.groqModels?.length) {
    return config.groqModels;
  }
  return GROQ_MODELS.map(m => ({
    id: m.id,
    label: m.badge ? `${m.label} — ${m.badge}` : m.label,
    badge: m.badge,
  }));
}

export function hasGemma4OnGroq(models: GroqModelOption[]): boolean {
  return models.some(m => /gemma.?4/i.test(m.id));
}

/** Agent auto-selection order — first installed match wins */
export const AGENT_MODEL_PREFERENCE: readonly string[] = [
  'gemma4:31b',
  'gemma4:26b',
  'gemma4:latest',
  'gemma4:e4b',
  'gemma4:e2b',
  'qwen3.5:latest',
  'qwen3.5:7b',
  'qwen2.5:7b',
  'qwen2.5:14b',
  'qwen3:8b',
  'qwen3:latest',
  'llama3.1:8b',
  'gemma2:9b',
  'gemma2:27b',
  'gemma3:4b',
  'gemma3:12b',
  'mistral-small',
  'mistral:7b',
  'deepseek-r1:7b',
  'phi4',
  'phi3:medium',
  'llama3.3:70b',
];

export const GEMMA4_BLOG_URL =
  'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/';

export const GEMMA4_OLLAMA_URL = 'https://ollama.com/library/gemma4';

export const GEMMA4_STATUS_NOTE =
  'Gemma 4 is now on Ollama (Apr 2026). Native JSON output, function calling, and agentic workflows — ideal for AAISM agents. Pull gemma4:e4b for edge/agent JSON work or gemma4:31b for best quality. Gemma 3 remains supported as a lighter fallback.';

export const GEMMA4_PULL_COMMANDS = [
  'ollama pull gemma4:31b',
  'ollama pull gemma4:26b',
  'ollama pull gemma4:e4b',
  'ollama pull gemma4:e2b',
] as const;

/** Model name prefixes to watch for newly published Ollama tags */
export const WATCHED_MODEL_PREFIXES = ['gemma4', 'qwen3.5'] as const;

export interface WatchedModelMatch {
  pattern: string;
  installed: OllamaModel[];
  isNew: boolean;
}

function matchesWatchedPrefix(modelName: string, pattern: string): boolean {
  const lower = modelName.toLowerCase();
  const normalizedPattern = pattern.toLowerCase().replace('.', '');
  const base = modelBaseName(modelName);
  return lower.includes(pattern.toLowerCase()) || base.includes(normalizedPattern);
}

/** Flag newly installed watched models (e.g. gemma4, qwen3.5) from /api/tags */
export function watchForModels(
  installed: OllamaModel[],
  previousNames: string[] = [],
): WatchedModelMatch[] {
  const prev = new Set(previousNames);
  return WATCHED_MODEL_PREFIXES.map(pattern => {
    const matches = installed.filter(m => matchesWatchedPrefix(m.name, pattern));
    const isNew = matches.some(m => !prev.has(m.name));
    return { pattern, installed: matches, isNew };
  });
}

/** Build Tier S entries for watched models found in the local Ollama registry */
export function getDetectedWatchedModels(installed: OllamaModel[]): ModelCapability[] {
  const seen = new Set<string>();
  const detected: ModelCapability[] = [];

  for (const model of installed) {
    for (const pattern of WATCHED_MODEL_PREFIXES) {
      if (!matchesWatchedPrefix(model.name, pattern) || seen.has(model.name)) continue;
      seen.add(model.name);
      const label = pattern === 'gemma4' ? 'Google Gemma 4 (auto-detected)' : 'Qwen 3.5 (auto-detected)';
      const jsonScore = /gemma4:31b/i.test(model.name) ? 98
        : /gemma4:26b/i.test(model.name) ? 96
        : /gemma4:e4b/i.test(model.name) ? 94
        : pattern === 'gemma4' ? 90 : 93;
      detected.push({
        name: model.name,
        tier: /gemma4:31b|gemma4:26b/i.test(model.name) ? 'large' : 'medium',
        jsonReliability: jsonScore,
        sizeGb: 'See Ollama',
        gpuRam: '8GB+',
        description: `${label} — surfaced from your Ollama install`,
        tierS: true,
        recommended: true,
      });
    }
  }

  return detected;
}

/** Top offline models for AAISM Agent Discovery — Tier S first */
export const AAISM_OFFLINE_MODELS: ModelCapability[] = [
  { name: 'gemma4:31b', tier: 'large', jsonReliability: 98, sizeGb: '~19GB', gpuRam: '24GB+', description: 'Gemma 4 Dense — best quality (32GB+ unified memory)', recommended: true, tierS: true },
  { name: 'gemma4:26b', tier: 'large', jsonReliability: 96, sizeGb: '~16GB', gpuRam: '20GB+', description: 'Gemma 4 MoE — fast tokens/sec, strong structured output (24GB+)', recommended: true, tierS: true },
  { name: 'gemma4:latest', tier: 'medium', jsonReliability: 95, sizeGb: '~9.6GB', gpuRam: '16GB+', description: 'Gemma 4 8B (latest tag) — recommended for Apple Silicon 16GB+', recommended: true, tierS: true },
  { name: 'gemma4:e4b', tier: 'medium', jsonReliability: 94, sizeGb: '~3GB', gpuRam: '8GB+', description: 'Gemma 4 Effective 4B — best for 8GB Mac / edge JSON', recommended: true, tierS: true },
  { name: 'glm4:latest', tier: 'medium', jsonReliability: 90, sizeGb: '~5GB', gpuRam: '8GB+', description: 'GLM-4 (Zhipu) — strong Chinese/English; GLM-5 not on Ollama yet', tierS: true },
  { name: 'gemma4:e2b', tier: 'medium', jsonReliability: 88, sizeGb: '~2GB', gpuRam: '6GB+', description: 'Gemma 4 Effective 2B — mobile/IoT, native JSON & audio', tierS: true },
  { name: 'qwen2.5:7b', tier: 'medium', jsonReliability: 94, sizeGb: '~4.4GB', gpuRam: '8GB+', description: 'Top pick — excellent JSON and reasoning', recommended: true, tierS: true },
  { name: 'qwen2.5:14b', tier: 'medium', jsonReliability: 96, sizeGb: '~8.9GB', gpuRam: '12GB+', description: 'Stronger Qwen variant, very reliable structured output', recommended: true, tierS: true },
  { name: 'qwen3:8b', tier: 'medium', jsonReliability: 93, sizeGb: '~5.0GB', gpuRam: '8GB+', description: 'Latest Qwen generation — great for agents (text; not qwen3-vl)', tierS: true },
  { name: 'llama3.1:8b', tier: 'medium', jsonReliability: 92, sizeGb: '~4.7GB', gpuRam: '8GB+', description: 'Proven balance of quality and JSON reliability', recommended: true, tierS: true },
  { name: 'gemma2:9b', tier: 'medium', jsonReliability: 88, sizeGb: '~5.4GB', gpuRam: '10GB+', description: 'Google Gemma 2 — solid agent responses', tierS: true },
  { name: 'gemma2:27b', tier: 'large', jsonReliability: 95, sizeGb: '~16GB', gpuRam: '24GB+', description: 'Large Gemma 2 — premium local quality', tierS: true },
  { name: 'gemma3:4b', tier: 'medium', jsonReliability: 90, sizeGb: '~3.3GB', gpuRam: '8GB+', description: 'Gemma 3 — lighter fallback; upgrade to gemma4:e4b when ready', tierS: true },
  { name: 'gemma3:12b', tier: 'medium', jsonReliability: 93, sizeGb: '~8.1GB', gpuRam: '12GB+', description: 'Gemma 3 mid-size — strong instruction following', tierS: true },
  { name: 'mistral-small', tier: 'medium', jsonReliability: 90, sizeGb: '~14GB', gpuRam: '16GB+', description: 'Mistral Small — enterprise-grade JSON', tierS: true },
  { name: 'mistral:7b', tier: 'medium', jsonReliability: 85, sizeGb: '~4.1GB', gpuRam: '8GB+', description: 'Fast Mistral 7B, good JSON', tierS: true },
  { name: 'deepseek-r1:7b', tier: 'medium', jsonReliability: 88, sizeGb: '~4.7GB', gpuRam: '8GB+', description: 'Reasoning-focused — strong for complex agent steps', tierS: true },
  { name: 'phi4', tier: 'medium', jsonReliability: 91, sizeGb: '~8.2GB', gpuRam: '10GB+', description: 'Microsoft Phi-4 — reliable structured output', tierS: true },
  { name: 'phi3:medium', tier: 'medium', jsonReliability: 82, sizeGb: '~7.9GB', gpuRam: '8GB+', description: 'Phi-3 medium — good instruction following', tierS: true },
  { name: 'llama3.3:70b', tier: 'large', jsonReliability: 97, sizeGb: '~40GB', gpuRam: '48GB+', description: 'Llama 3.3 70B — best local quality if you have VRAM', tierS: true },
  { name: 'llama3.2:3b', tier: 'small', jsonReliability: 35, sizeGb: '~2GB', gpuRam: '4GB', description: 'Too small for reliable JSON — avoid for agents', fallbackOnly: true },
];

export const RECOMMENDED_OLLAMA_MODELS = AAISM_OFFLINE_MODELS.map(m => ({
  name: m.name,
  description: m.description,
}));

const MODEL_TIER_PATTERNS: Array<{ pattern: RegExp; tier: ModelTier; jsonReliability: number }> = [
  { pattern: /llama3\.2:1b|1b|tiny|mini|embed|nomic|vl|vision/i, tier: 'small', jsonReliability: 20 },
  { pattern: /llama3\.2:3b|llama3\.2$|phi3:mini|gemma2:2b/i, tier: 'small', jsonReliability: 35 },
  { pattern: /gemma4:31b|gemma4:26b/i, tier: 'large', jsonReliability: 97 },
  { pattern: /gemma4:e4b|gemma4:e2b|gemma4/i, tier: 'medium', jsonReliability: 92 },
  { pattern: /llama3\.1|llama3\.3|mistral|qwen2\.5|qwen3|phi3:medium|phi4|gemma2|gemma3|deepseek-r1|7b|8b|9b|12b|14b/i, tier: 'medium', jsonReliability: 85 },
  { pattern: /70b|27b|13b|mixtral|large|405b|mistral-small/i, tier: 'large', jsonReliability: 95 },
];

const AVOID_AGENT_PATTERNS = [/llama3\.2:3b|llama3\.2$|:1b|:2b|tiny|mini|vl|vision|embed|nomic/i];

function modelBaseName(name: string): string {
  return name.split(':')[0].toLowerCase();
}

function matchesPreferredTag(installedName: string, preferredName: string): boolean {
  if (installedName === preferredName) return true;
  const preferredBase = modelBaseName(preferredName);
  const installedBase = modelBaseName(installedName);
  if (preferredBase !== installedBase) return false;
  const preferredTag = preferredName.includes(':') ? preferredName.split(':')[1] : null;
  if (!preferredTag || preferredTag === 'latest') return true;
  return installedName.startsWith(`${preferredBase}:`) &&
    (installedName.includes(`:${preferredTag}`) || installedName.endsWith(`:${preferredTag}`));
}

export function pickBestInstalledModel(installed: OllamaModel[] | string[]): string | null {
  const names = installed.map(m => (typeof m === 'string' ? m : m.name));

  for (const preferred of AGENT_MODEL_PREFERENCE) {
    const match = names.find(n => {
      if (AVOID_AGENT_PATTERNS.some(p => p.test(n))) return false;
      return matchesPreferredTag(n, preferred);
    });
    if (match) return match;
  }

  let best: { name: string; score: number } | null = null;
  for (const name of names) {
    if (AVOID_AGENT_PATTERNS.some(p => p.test(name))) continue;
    const cap = getModelCapability(name);
    if (cap.fallbackOnly || cap.tier === 'small') continue;
    if (!best || cap.jsonReliability > best.score) {
      best = { name, score: cap.jsonReliability };
    }
  }
  return best?.name ?? null;
}

/** Resolve best installed Ollama model for Agent Discovery at runtime */
export async function resolveAgentConfig(config?: AIConfig): Promise<AIConfig> {
  const base = config || loadAIConfig();
  if (base.provider !== 'ollama') return base;

  const resolved = await resolveOllamaModel(base);
  if (resolved.error) return base;
  return { ...base, model: resolved.model };
}

export function getModelCapability(modelName: string): ModelCapability {
  const known = AAISM_OFFLINE_MODELS.find(m =>
    modelName === m.name || modelName.startsWith(m.name.split(':')[0])
  );
  if (known) return known;

  for (const { pattern, tier, jsonReliability } of MODEL_TIER_PATTERNS) {
    if (pattern.test(modelName)) {
      return {
        name: modelName,
        tier,
        jsonReliability,
        sizeGb: tier === 'small' ? '~2-3GB' : tier === 'medium' ? '~4-8GB' : '10GB+',
        gpuRam: tier === 'small' ? '4GB' : tier === 'medium' ? '8GB+' : '16GB+',
        description: `${tier} tier model`,
      };
    }
  }

  return {
    name: modelName,
    tier: 'medium',
    jsonReliability: 70,
    sizeGb: 'Unknown',
    gpuRam: '8GB+',
    description: 'Custom model',
  };
}

export function isSmallModel(modelName: string): boolean {
  return getModelCapability(modelName).tier === 'small';
}

export function getModelWarning(modelName: string): string | null {
  const cap = getModelCapability(modelName);
  if (cap.tier === 'small') {
    return `Model "${modelName}" is too small for reliable JSON output in Agent Discovery. Switch to qwen2.5:7b or llama3.1:8b for best results.`;
  }
  if (/vl|vision/i.test(modelName)) {
    return `Model "${modelName}" is vision-only — use a text model like qwen2.5:7b for Agent Discovery.`;
  }
  if (cap.jsonReliability < 70) {
    return `Model "${modelName}" has low JSON reliability (${cap.jsonReliability}%). Consider qwen2.5:7b for Agent Discovery.`;
  }
  return null;
}

export function getRecommendedFallbackModel(): string {
  return AGENT_MODEL_PREFERENCE[0];
}

// Check if Ollama is running and get available models
export async function checkOllamaStatus(baseUrl = DEFAULT_OLLAMA_URL): Promise<{ running: boolean; models: OllamaModel[]; error?: string }> {
  const result = await testOllamaConnection(baseUrl);
  if (!result.connected) {
    return {
      running: false,
      models: [],
      error: result.error ?? 'Ollama is not running. Open Settings → AI Provider and click "Open Ollama app".',
    };
  }
  return {
    running: true,
    models: result.models as OllamaModel[],
  };
}

export { testOllamaConnection, normalizeOllamaBaseUrl, DEFAULT_OLLAMA_URL };

/** Alias for Settings — fetch installed Ollama models */
export async function detectOllamaModels(baseUrl = 'http://localhost:11434'): Promise<OllamaModel[]> {
  const status = await checkOllamaStatus(baseUrl);
  return status.models;
}

export async function pullOllamaModel(
  modelName: string,
  baseUrl = 'http://localhost:11434',
  onProgress?: (status: string) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.status) onProgress?.(parsed.status);
          } catch { /* skip partial lines */ }
        }
      }
    }

    onProgress?.('Model downloaded successfully!');
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to download model: ${error}` };
  }
}

export const AAISM_CONTEXT = `You are an expert AI Security Manager exam preparation assistant. You help users prepare for the ISACA AAISM (Artificial Intelligence Security Manager) certification exam.

## AAISM Exam Domains:

### Domain 1: AI Governance (approximately 25%)
Key topics:
- AI governance frameworks and organizational structures
- AI strategy development and alignment with business objectives
- AI policies, standards, and procedures
- AI ethics and responsible AI principles
- Regulatory compliance (EU AI Act, NIST AI RMF, ISO/IEC 42001)
- Stakeholder management and communication
- AI literacy and awareness programs

### Domain 2: AI Risk Management (approximately 25%)
Key topics:
- AI risk identification and assessment methodologies
- AI-specific threats: adversarial attacks, model poisoning, data poisoning
- Prompt injection and jailbreaking attacks
- Privacy risks and data protection
- Bias and fairness risks
- Security controls for AI systems
- Third-party and supply chain AI risks
- Risk monitoring and reporting

### Domain 3: AI Development & Implementation (approximately 25%)
Key topics:
- AI/ML development lifecycle (CRISP-DM, MLOps)
- Data management: collection, quality, labeling, governance
- Model development: training, validation, testing
- Feature engineering and selection
- Model explainability and interpretability
- Secure AI development practices
- AI testing methodologies
- Deployment strategies (shadow, canary, blue-green)

### Domain 4: AI Operations & Monitoring (approximately 25%)
Key topics:
- AI operations management and MLOps
- Model performance monitoring
- Data drift and concept drift detection
- AI incident management and response
- Model maintenance, retraining, and versioning
- Continuous improvement processes
- AI system decommissioning

## Key Frameworks & Standards:
- NIST AI Risk Management Framework (AI RMF)
- EU AI Act and risk classification
- ISO/IEC 42001 AI Management System
- OWASP Top 10 for LLMs
- MITRE ATLAS (Adversarial Threat Landscape for AI Systems)

## Exam Tips:
- Focus on understanding concepts, not memorizing
- Questions often test "best" or "most important" actions
- Consider risk-based thinking in all answers
- Governance and management perspectives are key
`;

const JSON_SYSTEM_HINT = `You MUST respond with valid JSON only. No markdown, no code fences, no explanation text before or after the JSON.`;

function modelExistsInRegistry(models: OllamaModel[], modelName: string): boolean {
  const names = models.map(m => m.name);
  if (names.includes(modelName)) return true;
  const base = modelName.split(':')[0];
  return names.some(n => n === base || n.startsWith(`${base}:`));
}

/** Resolve an installed Ollama model — auto-fallback when configured model is missing */
export async function resolveOllamaModel(config: AIConfig): Promise<{ model: string; fallbackUsed: boolean; error?: string }> {
  const baseUrl = config.baseUrl ?? defaultConfigs.ollama.baseUrl!;
  const status = await checkOllamaStatus(baseUrl);

  if (!status.running) {
    return {
      model: config.model,
      fallbackUsed: false,
      error: status.error ?? 'Ollama not running. Open Settings → AI Provider and click "Open Ollama app".',
    };
  }

  if (status.models.length === 0) {
    return {
      model: config.model,
      fallbackUsed: false,
      error: 'No models installed. Run: ollama pull llama3.1:8b',
    };
  }

  if (modelExistsInRegistry(status.models, config.model)) {
    return { model: config.model, fallbackUsed: false };
  }

  const best = pickBestInstalledModel(status.models);
  if (best) {
    return { model: best, fallbackUsed: true };
  }

  return {
    model: config.model,
    fallbackUsed: false,
    error: `Model ${config.model} not found — run: ollama pull llama3.1:8b`,
  };
}

function formatOllamaError(status: number, statusText: string, bodyText: string, model: string): string {
  const lower = bodyText.toLowerCase();
  if (status === 404 || lower.includes('not found') || lower.includes('does not exist')) {
    return `Model "${model}" not found — run: ollama pull ${model.includes(':') ? model : `${model}:latest`}`;
  }
  if (status === 405) {
    return 'Ollama endpoint error — ensure Ollama is updated and /api/chat is available';
  }
  return `Ollama error (${status} ${statusText})`;
}

async function callOllama(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  try {
    const resolved = await resolveOllamaModel(config);
    if (resolved.error) {
      return { content: '', error: resolved.error };
    }

    const model = resolved.model;
    const temperature = options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7);
    const body: Record<string, unknown> = {
      model,
      messages: options?.jsonMode
        ? messages.map((m, i) =>
            i === 0 && m.role === 'system'
              ? { ...m, content: `${m.content}\n\n${JSON_SYSTEM_HINT}` }
              : m
          )
        : messages,
      stream: false,
      options: {
        temperature,
        num_predict: 4096,
      },
    };

    if (options?.jsonMode) {
      body.format = 'json';
    }

    const baseUrl = config.baseUrl ?? defaultConfigs.ollama.baseUrl!;
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(formatOllamaError(response.status, response.statusText, bodyText, model));
    }

    const data = await response.json();
    const content = data.message?.content || '';
    if (!content) {
      return { content: '', error: 'Ollama returned empty response — try a different model' };
    }
    return { content };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('not found') || msg.includes('ollama pull')) {
      return { content: '', error: msg };
    }
    return { content: '', error: `Ollama connection failed. Make sure Ollama is running locally. ${msg}` };
  }
}

async function callClaude(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'Claude API key not configured' };
  }

  try {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.content?.[0]?.text || '' };
  } catch (error) {
    return { content: '', error: `Claude API error: ${error}` };
  }
}

/** Client-side Groq throttle — max calls per rolling minute */
const GROQ_MAX_CALLS_PER_MINUTE = 30;
const groqCallTimestamps: number[] = [];

function checkGroqRateLimit(): string | null {
  const now = Date.now();
  while (groqCallTimestamps.length > 0 && now - groqCallTimestamps[0] >= 60_000) {
    groqCallTimestamps.shift();
  }
  if (groqCallTimestamps.length >= GROQ_MAX_CALLS_PER_MINUTE) {
    const waitSec = Math.ceil((60_000 - (now - groqCallTimestamps[0])) / 1000);
    return `Groq rate limit reached (${GROQ_MAX_CALLS_PER_MINUTE}/min). Retry in ~${waitSec}s.`;
  }
  groqCallTimestamps.push(now);
  return null;
}

async function callGroq(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'Groq API key not configured. Get a free key at https://console.groq.com' };
  }

  const rateError = checkGroqRateLimit();
  if (rateError) return { content: '', error: rateError };

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: 4096,
        temperature: options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7),
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    return { content: '', error: sanitizeErrorMessage(`Groq API error: ${raw}`) };
  }
}

async function callOpenAI(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'OpenAI API key not configured' };
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: 4096,
        temperature: options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7),
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: `OpenAI API error: ${error}` };
  }
}

export async function chat(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  const hasSystem = messages.some(m => m.role === 'system');
  const fullMessages: Message[] = hasSystem
    ? messages
    : [{ role: 'system', content: AAISM_CONTEXT }, ...messages];

  switch (config.provider) {
    case 'ollama':
      return callOllama(config, fullMessages, options);
    case 'groq':
      return callGroq(config, fullMessages, options);
    case 'claude':
      return callClaude(config, fullMessages);
    case 'openai':
      return callOpenAI(config, fullMessages, options);
    default:
      return { content: '', error: 'Unknown AI provider' };
  }
}

export async function chatJson(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  return chat(config, messages, { jsonMode: true, temperature: 0.1 });
}

export async function generateQuestions(
  config: AIConfig,
  domain: number,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<AIResponse> {
  const prompt = `Generate ${count} ${difficulty} difficulty multiple-choice practice questions for AAISM Domain ${domain}.

For each question provide:
1. The question text
2. Four answer options (A, B, C, D)
3. The correct answer letter
4. A detailed explanation of why the answer is correct

Format as JSON array:
[
  {
    "question": "Question text here",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation here"
  }
]

Make questions exam-realistic, testing conceptual understanding not just memorization.`;

  return chatJson(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function explainConcept(
  config: AIConfig,
  concept: string,
  domain?: number
): Promise<AIResponse> {
  const domainContext = domain ? `Focus on Domain ${domain} perspective.` : '';

  const prompt = `Explain this AAISM exam concept in detail: "${concept}"

${domainContext}

Provide:
1. **Definition**: Clear, concise definition
2. **Key Points**: 3-5 essential points to remember
3. **Real-World Example**: Practical example
4. **Exam Relevance**: Why this matters for the AAISM exam
5. **Related Concepts**: Other topics this connects to
6. **Common Exam Traps**: Misconceptions to avoid

Use clear formatting with headers and bullet points.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function analyzeWeakAreas(
  config: AIConfig,
  quizHistory: { domain: number; score: number; }[]
): Promise<AIResponse> {
  const prompt = `Analyze this quiz performance history and provide study recommendations:

Quiz History:
${JSON.stringify(quizHistory, null, 2)}

Provide:
1. **Weak Areas**: Identify domains/topics that need more focus
2. **Strength Areas**: What the student is doing well
3. **Recommended Study Plan**: Specific actions for next 2 weeks
4. **Key Topics to Review**: List specific concepts to focus on
5. **Practice Suggestions**: Types of questions to practice

Be specific and actionable.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function createStudyGuide(
  config: AIConfig,
  domain: number,
  topic?: string
): Promise<AIResponse> {
  const topicFocus = topic ? `Specifically focus on: ${topic}` : '';

  const prompt = `Create a comprehensive study guide for AAISM Domain ${domain}.
${topicFocus}

Include:
1. **Overview**: What this domain covers
2. **Key Concepts**: Detailed breakdown of main topics
3. **Important Terms**: Definitions to memorize
4. **Frameworks & Standards**: Relevant standards to know
5. **Exam Tips**: How questions are typically asked
6. **Quick Reference**: Bullet points for quick review
7. **Sample Questions**: 3 example questions with answers

Format with clear headers and organized sections.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

const AI_CONFIG_KEY = AI_CONFIG_STORAGE_KEY;

/** Mask an API key for display — e.g. gsk_•••••••• */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const visible = key.startsWith('gsk_') ? 'gsk_' : key.slice(0, 4);
  return `${visible}${'•'.repeat(8)}`;
}

/** True when cloud provider has a key or Ollama is selected (local). */
export function isAIConfigured(config?: AIConfig): boolean {
  const c = config ?? loadAIConfig();
  if (c.provider === 'ollama') return true;
  return Boolean(c.apiKey?.trim());
}

/** Read legacy aaism-ai-config only — avoids circular call through loadAIConfig */
export function loadLegacyAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AIConfig;
      if (parsed.provider === 'ollama' && (parsed.model === 'llama3.2' || parsed.model === 'llama3.2:3b')) {
        parsed.model = 'qwen2.5:7b';
      }
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return {
    provider: 'ollama',
    ...defaultConfigs.ollama,
  } as AIConfig;
}

function loadAIConfigFromStorage(): AIConfig {
  try {
    if (localStorage.getItem(CONNECTORS_CONFIG_KEY)) {
      return buildAIConfigFromConnectors();
    }
  } catch {
    /* fall through to legacy */
  }
  return loadLegacyAIConfig();
}

export function loadAIConfig(): AIConfig {
  return loadAIConfigFromStorage();
}

/** Load AI config with Groq fallback when primary provider lacks credentials or Ollama fails */
export async function loadAIConfigWithFallback(): Promise<AIConfig> {
  try {
    if (localStorage.getItem(CONNECTORS_CONFIG_KEY)) {
      return (await resolveAIConfigWithFallback()).config;
    }
  } catch {
    /* fall through */
  }
  return loadAIConfigFromStorage();
}

/** Resolve config for agent runs — fresh read, Ollama model resolution, Groq only when Ollama fails */
export async function resolveAIConfigForRun(config?: AIConfig): Promise<AIConfig> {
  if (config) return config;
  const { config: resolved } = await resolveAIConfigWithFallback();
  return resolved;
}

export function saveAIConfig(config: AIConfig, options?: { skipDispatch?: boolean }): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    if (localStorage.getItem(CONNECTORS_CONFIG_KEY)) {
      syncAIConfigToConnectors(config);
    }
    if (!options?.skipDispatch) {
      dispatchAIConfigChanged(config);
    }
  } catch {
    // Storage quota or private mode — never log config (may contain API keys)
  }
}

/** Remove stored API key without clearing other settings */
export function clearAIConfigApiKey(): void {
  const config = loadAIConfig();
  saveAIConfig({ ...config, apiKey: undefined });
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/gsk_[a-zA-Z0-9_-]+/g, 'gsk_***').replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***');
}

export interface GroqConnectionResult {
  success: boolean;
  message: string;
  models?: GroqModelOption[];
}

/** Fetch chat-capable models from Groq /v1/models */
export async function fetchGroqModels(config: AIConfig): Promise<GroqConnectionResult> {
  if (!config.apiKey?.trim()) {
    return { success: false, message: 'Groq API key not configured. Get a free key at console.groq.com' };
  }

  const rateError = checkGroqRateLimit();
  if (rateError) return { success: false, message: rateError };

  try {
    const baseUrl = config.baseUrl ?? defaultConfigs.groq.baseUrl!;
    const response = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, message: 'Invalid Groq API key — verify at console.groq.com' };
      }
      return { success: false, message: `Groq API error (${response.status}) — check console.groq.com status` };
    }

    const data = await response.json();
    const models = parseGroqModelsFromApi(data);
    const count = models.length;
    return {
      success: true,
      message: `Connected! ${count} model${count === 1 ? '' : 's'} available on your Groq account.`,
      models,
    };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    return { success: false, message: sanitizeErrorMessage(`Groq unreachable: ${raw}`) };
  }
}

/** Test Groq via /models — avoids chat round-trip and never exposes the key in errors */
export async function testGroqConnection(config: AIConfig): Promise<GroqConnectionResult> {
  return fetchGroqModels(config);
}

export async function testConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === 'groq') {
    return testGroqConnection(config);
  }

  const response = await chat(config, [
    { role: 'user', content: 'Say "Connection successful!" in exactly those words.' },
  ]);

  if (response.error) {
    return { success: false, message: sanitizeErrorMessage(response.error) };
  }

  return { success: true, message: 'Connected successfully!' };
}
