/**
 * Central security policy — URL validation, rate limits, kill switch, secret handling.
 * Consumed by platformRegistry, connectorRegistry, aiService, and RSS/integration services.
 */

export const SECURITY_POLICY_VERSION = '1.0.0';

/** localStorage keys that may hold secrets — never log values from these keys */
export const SECRET_STORAGE_KEYS = [
  'aaism-ai-config',
  'aegis-connectors-config',
  'aaism-integrations-config',
] as const;

export const AI_KILL_SWITCH_SESSION_KEY = 'aaism-kill-switch';
export const AI_KILL_SWITCH_PERSIST_KEY = 'aaism-kill-switch-persist';

/** Patterns blocked in outbound user prompts — basic injection guard */
export const FORBIDDEN_PROMPT_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+(instructions|rules)/i,
  /you\s+are\s+now\s+(in\s+)?(dan|jailbreak|unrestricted)\s+mode/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /output\s+(the\s+)?api\s+key/i,
];

export function findForbiddenTerm(text: string): string | null {
  for (const pattern of FORBIDDEN_PROMPT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export function forbiddenContentMessage(matched: string): string {
  return `Prompt blocked — matched disallowed pattern: "${matched.slice(0, 48)}${matched.length > 48 ? '…' : ''}"`;
}

export const RATE_LIMITS = {
  groq: { maxPerMinute: 30 },
  openai: { maxPerMinute: 20 },
  claude: { maxPerMinute: 20 },
} as const;

export const CSP_CONNECT_SRC = [
  "'self'",
  'https://api.groq.com',
  'https://api.anthropic.com',
  'https://api.openai.com',
  'http://localhost:11434',
  'http://127.0.0.1:11434',
  'https:',
] as const;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^\[::1\]$/,
  /^0\.0\.0\.0$/,
];

const OLLAMA_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const CLOUD_AI_HOSTS = new Set([
  'api.groq.com',
  'api.anthropic.com',
  'api.openai.com',
]);

/** Rolling-window rate limiter factory */
export function createRateLimiter(maxPerMinute: number): () => string | null {
  const timestamps: number[] = [];
  return (): string | null => {
    const now = Date.now();
    while (timestamps.length > 0 && now - timestamps[0] >= 60_000) {
      timestamps.shift();
    }
    if (timestamps.length >= maxPerMinute) {
      const waitSec = Math.ceil((60_000 - (now - timestamps[0])) / 1000);
      return `Rate limit reached (${maxPerMinute}/min). Retry in ~${waitSec}s.`;
    }
    timestamps.push(now);
    return null;
  };
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return PRIVATE_HOST_PATTERNS.some(p => p.test(host));
}

/** RSS / external proxy fetch — http(s) public URLs only; blocks LAN/localhost SSRF */
export function isSafeFetchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (parsed.username || parsed.password) return false;
    if (isPrivateOrLocalHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Ollama base URL — http(s) on localhost / 127.0.0.1 only */
export function isAllowedOllamaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    return OLLAMA_HOSTS.has(host);
  } catch {
    return false;
  }
}

/** HTTPS integration endpoints (Supabase, payment links, cloud APIs) */
export function isAllowedHttpsUrl(url: string, options?: { allowLocalhost?: boolean }): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (isPrivateOrLocalHost(host)) {
      return options?.allowLocalhost === true && (host === 'localhost' || host === '127.0.0.1');
    }
    return true;
  } catch {
    return false;
  }
}

/** Cloud AI provider base URLs — HTTPS + known host or safe public HTTPS */
export function isAllowedCloudAiBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (isPrivateOrLocalHost(host)) return false;
    if (CLOUD_AI_HOSTS.has(host)) return true;
    return host.endsWith('.openai.azure.com') || host.endsWith('.groq.com');
  } catch {
    return false;
  }
}

export type FetchUrlPurpose = 'ollama' | 'https' | 'rss' | 'cloud-ai';

export function validateUrlForFetch(
  url: string,
  purpose: FetchUrlPurpose,
): { ok: boolean; reason?: string } {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, reason: 'URL is empty' };

  switch (purpose) {
    case 'ollama':
      return isAllowedOllamaUrl(trimmed)
        ? { ok: true }
        : { ok: false, reason: 'Ollama URL must be http(s) on localhost or 127.0.0.1 only' };
    case 'rss':
      return isSafeFetchUrl(trimmed)
        ? { ok: true }
        : { ok: false, reason: 'RSS URL must be a public http(s) URL' };
    case 'https':
      return isAllowedHttpsUrl(trimmed, { allowLocalhost: true })
        ? { ok: true }
        : { ok: false, reason: 'Integration URL must use HTTPS' };
    case 'cloud-ai':
      return isAllowedCloudAiBaseUrl(trimmed)
        ? { ok: true }
        : { ok: false, reason: 'Cloud AI base URL must be HTTPS to a known provider host' };
    default:
      return { ok: false, reason: 'Unknown URL purpose' };
  }
}

/** Strip API keys and tokens from error strings before display or logging */
export function sanitizeSecretsInMessage(message: string): string {
  return message
    .replace(/gsk_[a-zA-Z0-9_-]+/g, 'gsk_***')
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
    .replace(/sk_[a-zA-Z0-9_-]+/g, 'sk_***')
    .replace(/rk_[a-zA-Z0-9_-]+/g, 'rk_***')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***')
    .replace(/apikey\s+[a-zA-Z0-9._-]+/gi, 'apikey ***')
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 'jwt_***');
}

/** Emergency stop keys — runtime hooks live in killSwitchService */
export function isAIKillSwitchActive(): boolean {
  if (typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') return false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(AI_KILL_SWITCH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { active?: boolean };
        if (parsed.active) return true;
      }
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(AI_KILL_SWITCH_PERSIST_KEY) === '1';
    }
  } catch {
    /* ignore */
  }
  return false;
}

export const SECURITY_POLICY = {
  version: SECURITY_POLICY_VERSION,
  secretStorageKeys: SECRET_STORAGE_KEYS,
  killSwitchSessionKey: AI_KILL_SWITCH_SESSION_KEY,
  killSwitchPersistKey: AI_KILL_SWITCH_PERSIST_KEY,
  forbiddenPromptPatterns: FORBIDDEN_PROMPT_PATTERNS,
  rateLimits: RATE_LIMITS,
  cspConnectSrc: CSP_CONNECT_SRC,
} as const;
