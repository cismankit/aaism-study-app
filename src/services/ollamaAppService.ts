import { isTauri } from '../utils/tauriEnv';
import { isLocalhost } from './gpuDetection';

/** True when the app can call Ollama's localhost API (browser dev, Tauri Mac app). */
export function canUseOllamaApi(): boolean {
  if (typeof window === 'undefined') return false;
  return isLocalhost() || isTauri();
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
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: 'Reply with exactly: OK',
        stream: false,
        options: { num_predict: 16 },
      }),
      signal: AbortSignal.timeout(30_000),
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
