const VERIFICATION_KEY = 'aaism-connection-verified';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface ConnectionVerification {
  provider: 'ollama' | 'groq';
  model: string;
  verifiedAt: string;
  expiresAt: string;
}

function readVerification(): ConnectionVerification | null {
  try {
    const raw = localStorage.getItem(VERIFICATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConnectionVerification;
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      localStorage.removeItem(VERIFICATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function markConnectionVerified(provider: 'ollama' | 'groq', model: string): void {
  const now = Date.now();
  const entry: ConnectionVerification = {
    provider,
    model,
    verifiedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  try {
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(entry));
  } catch { /* quota / private mode */ }
}

export function getConnectionVerification(): ConnectionVerification | null {
  return readVerification();
}

export function isConnectionVerified(provider?: 'ollama' | 'groq'): boolean {
  const entry = readVerification();
  if (!entry) return false;
  if (provider && entry.provider !== provider) return false;
  return true;
}

export function clearConnectionVerification(): void {
  try {
    localStorage.removeItem(VERIFICATION_KEY);
  } catch { /* ignore */ }
}
