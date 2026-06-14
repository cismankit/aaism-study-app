/**
 * Multi-model agent ensemble settings — discover on Groq, critic on Ollama.
 */

export const ENSEMBLE_CONFIG_KEY = 'aaism-ensemble-config';

export interface EnsembleConfig {
  enabled: boolean;
  /** Provider for DiscoverAgent — default Groq when key present */
  discoverProvider: 'groq' | 'ollama';
  /** Provider for LLM Critic pass — default Ollama */
  criticProvider: 'groq' | 'ollama';
  /** Groq API key reserved for ensemble discover when primary provider is Ollama */
  groqApiKey?: string;
}

const DEFAULT_ENSEMBLE: EnsembleConfig = {
  enabled: false,
  discoverProvider: 'groq',
  criticProvider: 'ollama',
};

export function loadEnsembleConfig(): EnsembleConfig {
  try {
    const raw = localStorage.getItem(ENSEMBLE_CONFIG_KEY);
    if (raw) return { ...DEFAULT_ENSEMBLE, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_ENSEMBLE };
}

export function saveEnsembleConfig(config: EnsembleConfig): void {
  try {
    localStorage.setItem(ENSEMBLE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function isEnsembleEnabled(): boolean {
  return loadEnsembleConfig().enabled;
}
