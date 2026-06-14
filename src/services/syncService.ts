import { loadAIConfig, saveAIConfig, type AIConfig } from './aiService';
import { getCurrentSession, isSignedIn } from './authService';
import {
  loadProgress,
  saveProgress,
  type ProgressSnapshot,
  PROGRESS_STORAGE_KEY,
} from './progressService';

export const CLOUD_BLOB_PREFIX = 'aaism-cloud-blob-';
export const SYNC_META_KEY = 'aaism-sync-meta';

export interface CloudBlob {
  version: 1;
  userId: string;
  updatedAt: string;
  progress: ProgressSnapshot;
  /** AI config without apiKey — keys stay local by default */
  aiConfigMeta?: Pick<AIConfig, 'provider' | 'model' | 'baseUrl'>;
}

export interface SyncMeta {
  lastPushAt: string | null;
  lastPullAt: string | null;
  lastMergeAt: string | null;
}

function cloudKey(userId: string): string {
  return `${CLOUD_BLOB_PREFIX}${userId}`;
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

export function getSyncMeta(): SyncMeta {
  return readJson<SyncMeta>(SYNC_META_KEY) ?? {
    lastPushAt: null,
    lastPullAt: null,
    lastMergeAt: null,
  };
}

function updateSyncMeta(partial: Partial<SyncMeta>): void {
  writeJson(SYNC_META_KEY, { ...getSyncMeta(), ...partial });
}

/** Latest-wins merge per top-level field; arrays use longer/more recent history */
export function mergeProgress(local: ProgressSnapshot, remote: ProgressSnapshot): ProgressSnapshot {
  const localTime = local.migratedAt ?? (local.quizHistory.length > 0 ? local.quizHistory[local.quizHistory.length - 1].date : '');
  const remoteTime = remote.migratedAt ?? (remote.quizHistory.length > 0 ? remote.quizHistory[remote.quizHistory.length - 1].date : '');

  const pick = <K extends keyof ProgressSnapshot>(key: K): ProgressSnapshot[K] => {
    if (key === 'quizHistory') {
      const merged = [...local.quizHistory];
      const ids = new Set(merged.map(q => q.id));
      for (const q of remote.quizHistory) {
        if (!ids.has(q.id)) merged.push(q);
      }
      return merged.sort((a, b) => a.date.localeCompare(b.date)) as ProgressSnapshot[K];
    }
    if (key === 'examAttempts') {
      const merged = [...local.examAttempts];
      const ids = new Set(merged.map(e => e.id));
      for (const e of remote.examAttempts) {
        if (!ids.has(e.id)) merged.push(e);
      }
      return merged.sort((a, b) => a.date.localeCompare(b.date)) as ProgressSnapshot[K];
    }
    if (key === 'domainScores') {
      const out: Record<number, number[]> = { ...local.domainScores };
      for (const [d, scores] of Object.entries(remote.domainScores)) {
        const id = Number(d);
        const existing = out[id] ?? [];
        out[id] = existing.length >= scores.length ? existing : scores;
      }
      return out as ProgressSnapshot[K];
    }
    if (key === 'streak') {
      return (remote.streak.longest > local.streak.longest ? remote.streak : local.streak) as ProgressSnapshot[K];
    }
    if (key === 'xp' || key === 'level' || key === 'totalQuizzesTaken' || key === 'perfectQuizzes' || key === 'totalStudyMinutes') {
      const l = local[key] as number;
      const r = remote[key] as number;
      return (r > l ? remote[key] : local[key]) as ProgressSnapshot[K];
    }
    return (remoteTime > localTime ? remote[key] : local[key]) as ProgressSnapshot[K];
  };

  return {
    version: 1,
    domainScores: pick('domainScores'),
    quizHistory: pick('quizHistory'),
    examAttempts: pick('examAttempts'),
    streak: pick('streak'),
    xp: pick('xp'),
    level: pick('level'),
    examDate: pick('examDate'),
    passThreshold: pick('passThreshold'),
    totalQuizzesTaken: pick('totalQuizzesTaken'),
    perfectQuizzes: pick('perfectQuizzes'),
    totalStudyMinutes: pick('totalStudyMinutes'),
    migratedAt: new Date().toISOString(),
  };
}

function buildCloudBlob(): CloudBlob {
  const session = getCurrentSession();
  const config = loadAIConfig();
  return {
    version: 1,
    userId: session?.userId ?? 'unknown',
    updatedAt: new Date().toISOString(),
    progress: loadProgress(),
    aiConfigMeta: {
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
    },
  };
}

/** Push local progress to simulated cloud blob (localStorage keyed by userId) */
export async function pushProgressToCloud(): Promise<{ ok: boolean; message: string }> {
  const session = getCurrentSession();
  if (!session) return { ok: false, message: 'No session.' };

  const blob = buildCloudBlob();
  writeJson(cloudKey(session.userId), blob);
  updateSyncMeta({ lastPushAt: blob.updatedAt });

  return {
    ok: true,
    message: isSignedIn()
      ? 'Progress synced to cloud blob.'
      : 'Progress saved to anonymous cloud blob (sign in to link across devices).',
  };
}

/** Pull and merge remote blob into local progress */
export async function pullProgressFromCloud(): Promise<{ ok: boolean; message: string; merged: boolean }> {
  const session = getCurrentSession();
  if (!session) return { ok: false, message: 'No session.', merged: false };

  const remote = readJson<CloudBlob>(cloudKey(session.userId));
  if (!remote?.progress) {
    return { ok: false, message: 'No cloud backup found for this account.', merged: false };
  }

  const local = loadProgress();
  const merged = mergeProgress(local, remote.progress);
  saveProgress(merged);

  // Optionally merge non-secret AI config fields
  if (remote.aiConfigMeta) {
    const localConfig = loadAIConfig();
    saveAIConfig({ ...localConfig, ...remote.aiConfigMeta });
  }

  updateSyncMeta({
    lastPullAt: new Date().toISOString(),
    lastMergeAt: new Date().toISOString(),
  });

  return {
    ok: true,
    message: 'Cloud progress merged (latest wins per field). Reload to refresh UI.',
    merged: true,
  };
}

export function exportCloudBlobJson(): string {
  const session = getCurrentSession();
  if (!session) return '{}';
  const blob = readJson<CloudBlob>(cloudKey(session.userId)) ?? buildCloudBlob();
  return JSON.stringify(blob, null, 2);
}

export function importCloudBlobJson(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as CloudBlob;
    if (parsed.version !== 1 || !parsed.progress) {
      return { ok: false, error: 'Invalid cloud blob format' };
    }
    const session = getCurrentSession();
    if (!session) return { ok: false, error: 'No active session' };
    writeJson(cloudKey(session.userId), parsed);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}

/** Keys included in sync — apiKey explicitly excluded */
export const SYNC_STORAGE_KEYS = [PROGRESS_STORAGE_KEY, 'aaism-gamification', 'aaism-study-app-state'] as const;
