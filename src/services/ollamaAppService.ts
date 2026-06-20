import { isTauri } from '../utils/tauriEnv';
import { isLocalhost } from './gpuDetection';
import { isAllowedOllamaUrl } from '../data/securityPolicy';
import { combineAbortSignals } from './killSwitchService';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const OLLAMA_FETCH_TIMEOUT_MS = 8_000;

export interface OllamaTagModel {
  name: string;
  size?: number;
  modified_at?: string;
}

export interface OllamaConnectionTest {
  connected: boolean;
  models: OllamaTagModel[];
  defaultModel: string | null;
  latencyMs: number;
  baseUrl: string;
  error?: string;
}

type OllamaFetchInit = RequestInit & { timeout?: number };

let tauriFetchPromise: Promise<(url: string, init?: OllamaFetchInit) => Promise<Response>> | null = null;

async function getTauriFetch(): Promise<(url: string, init?: OllamaFetchInit) => Promise<Response>> {
  if (!tauriFetchPromise) {
    tauriFetchPromise = import('@tauri-apps/plugin-http').then(m => m.fetch);
  }
  return tauriFetchPromise;
}

/**
 * Fetch Ollama API — in the Tauri Mac app uses native HTTP (reqwest) to bypass
 * CORS: Ollama returns 403 for Origin http://tauri.localhost while Node/CLI works.
 */
export async function ollamaFetch(url: string, init?: OllamaFetchInit): Promise<Response> {
  const { timeout, signal: callerSignal, ...rest } = init ?? {};
  const ms = timeout ?? OLLAMA_FETCH_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(ms);
  const signal = callerSignal
    ? combineAbortSignals(timeoutSignal, callerSignal)
    : timeoutSignal;

  if (isTauri()) {
    const fetchFn = await getTauriFetch();
    return fetchFn(url, { ...rest, signal, timeout: ms } as RequestInit);
  }
  return fetch(url, { ...rest, signal });
}

/** Normalize user-entered Ollama base URL — always falls back to localhost:11434. */
export function normalizeOllamaBaseUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_OLLAMA_URL;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function modelNameMatches(names: string[], configured: string): boolean {
  if (names.includes(configured)) return true;
  const base = configured.split(':')[0];
  return names.some(n => n === base || n.startsWith(`${base}:`));
}

/** True when the app can call Ollama's localhost API (browser dev, Tauri Mac app). */
export function canUseOllamaApi(): boolean {
  if (typeof window === 'undefined') return false;
  if (isTauri()) return true;
  return isLocalhost();
}

/** Probe Ollama /api/tags — used by health checks and Settings test buttons. */
export async function testOllamaConnection(
  baseUrl?: string,
  configuredModel?: string,
): Promise<OllamaConnectionTest> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  if (!isAllowedOllamaUrl(url)) {
    return {
      connected: false,
      models: [],
      defaultModel: null,
      latencyMs: 0,
      baseUrl: url,
      error: 'Invalid Ollama URL — only localhost or 127.0.0.1 over http(s) is allowed',
    };
  }
  return probeOllama(url, configuredModel, url !== DEFAULT_OLLAMA_URL);
}

async function probeOllama(
  url: string,
  configuredModel: string | undefined,
  allowFallback: boolean,
): Promise<OllamaConnectionTest> {
  const start = performance.now();
  try {
    const response = await ollamaFetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(OLLAMA_FETCH_TIMEOUT_MS),
      timeout: OLLAMA_FETCH_TIMEOUT_MS,
    });
    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      const corsHint =
        response.status === 403 && isTauri()
          ? ' (CORS blocked in WebView — rebuild app with HTTP plugin)'
          : '';
      if (allowFallback) return probeOllama(DEFAULT_OLLAMA_URL, configuredModel, false);
      return {
        connected: false,
        models: [],
        defaultModel: null,
        latencyMs,
        baseUrl: url,
        error: `Ollama not responding (${response.status})${corsHint}`,
      };
    }

    const data = (await response.json()) as { models?: OllamaTagModel[] };
    const models = data.models ?? [];
    const names = models.map(m => m.name);
    const defaultModel =
      configuredModel && modelNameMatches(names, configuredModel)
        ? configuredModel
        : names[0] ?? null;

    return { connected: true, models, defaultModel, latencyMs, baseUrl: url };
  } catch (err) {
    if (allowFallback) return probeOllama(DEFAULT_OLLAMA_URL, configuredModel, false);
    return {
      connected: false,
      models: [],
      defaultModel: null,
      latencyMs: Math.round(performance.now() - start),
      baseUrl: url,
      error: err instanceof Error ? err.message : 'Ollama is not running',
    };
  }
}

/** Open the Ollama desktop app on macOS (no Terminal required). */
export async function openOllamaApp(): Promise<{ ok: boolean; message: string }> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open('/Applications/Ollama.app');
      return { ok: true, message: 'Opening Ollama…' };
    } catch {
      try {
        const { Command } = await import('@tauri-apps/plugin-shell');
        await Command.create('open', ['-a', 'Ollama']).execute();
        return { ok: true, message: 'Opening Ollama…' };
      } catch {
        return { ok: false, message: 'Could not open Ollama — install from ollama.com/download' };
      }
    }
  }

  if (typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)) {
    window.open('https://ollama.com/download', '_blank', 'noopener,noreferrer');
    return { ok: true, message: 'Opened Ollama download page — install, then launch the app' };
  }

  window.open('https://ollama.com/download', '_blank', 'noopener,noreferrer');
  return { ok: true, message: 'Opened Ollama download page' };
}

export async function runOllamaTestPrompt(
  baseUrl: string,
  model: string,
): Promise<{ ok: boolean; message: string; reply?: string }> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  try {
    const response = await ollamaFetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: 'Reply with exactly: OK',
        stream: false,
        options: { num_predict: 16 },
      }),
      signal: AbortSignal.timeout(30_000),
      timeout: 30_000,
    });

    if (!response.ok) {
      return { ok: false, message: `Ollama error: ${response.status} ${response.statusText}` };
    }

    const data = (await response.json()) as { response?: string };
    const reply = (data.response ?? '').trim();
    if (!reply) {
      return { ok: false, message: 'Ollama responded but returned empty text' };
    }
    return { ok: true, message: `Success — model replied: "${reply.slice(0, 80)}"`, reply };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Test prompt failed — is Ollama running?',
    };
  }
}
