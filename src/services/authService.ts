/** Local-first auth scaffold — no backend required until Supabase/Clerk env is configured */

export const AUTH_STORAGE_KEY = 'aaism-auth';
export const PENDING_MAGIC_LINK_KEY = 'aaism-pending-magic-link';

export interface AuthSession {
  userId: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: string;
  lastSignInAt: string;
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
  } catch (e) {
    console.error(`Failed to write ${key}:`, e);
  }
}

function generateUserId(): string {
  return `anon_${crypto.randomUUID().slice(0, 12)}`;
}

/** Ensure an anonymous session exists (default on first visit) */
export function getOrCreateSession(): AuthSession {
  const existing = readJson<AuthSession>(AUTH_STORAGE_KEY);
  if (existing?.userId) return existing;

  const session: AuthSession = {
    userId: generateUserId(),
    isAnonymous: true,
    createdAt: new Date().toISOString(),
    lastSignInAt: new Date().toISOString(),
  };
  writeJson(AUTH_STORAGE_KEY, session);
  return session;
}

export function getCurrentSession(): AuthSession | null {
  return readJson<AuthSession>(AUTH_STORAGE_KEY);
}

export function isSignedIn(): boolean {
  const s = getCurrentSession();
  return Boolean(s && !s.isAnonymous && s.email);
}

/** Simulated magic-link sign-in — stores email locally; real Supabase hook via env */
export async function signInWithEmail(email: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && typeof supabaseUrl === 'string' && !supabaseUrl.includes('placeholder')) {
    return {
      ok: false,
      message: 'Supabase URL detected — configure VITE_SUPABASE_ANON_KEY and wire auth in syncService.',
    };
  }

  // Local-first: derive stable userId from email hash for cross-device simulation
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const userId = `user_${hashHex}`;

  const session: AuthSession = {
    userId,
    email: trimmed,
    isAnonymous: false,
    createdAt: getCurrentSession()?.createdAt ?? new Date().toISOString(),
    lastSignInAt: new Date().toISOString(),
  };
  writeJson(AUTH_STORAGE_KEY, session);
  writeJson(PENDING_MAGIC_LINK_KEY, { email: trimmed, verifiedAt: new Date().toISOString() });

  return {
    ok: true,
    message: `Signed in as ${trimmed}. Progress will sync to your cloud blob on this device.`,
  };
}

export function signOut(): void {
  const session = getOrCreateSession();
  const anon: AuthSession = {
    userId: generateUserId(),
    isAnonymous: true,
    createdAt: session.createdAt,
    lastSignInAt: new Date().toISOString(),
  };
  writeJson(AUTH_STORAGE_KEY, anon);
  localStorage.removeItem(PENDING_MAGIC_LINK_KEY);
}

export function getSessionLabel(): string {
  const s = getCurrentSession();
  if (!s) return 'Guest';
  if (s.email) return s.email;
  return `Anonymous (${s.userId.slice(0, 8)}…)`;
}
