import { loadAIConfig, saveAIConfig, type AIConfig } from './aiService';
import { getEffectiveSupabaseConfig, isSupabaseConfigured } from './integrationsConfigService';
import { reportSyncError, clearSyncError } from './systemHealthService';
import { getCurrentSession, isSignedIn } from './authService';
import {
  loadProgress,
  saveProgress,
  type ProgressSnapshot,
  type CertProgressSlice,
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

/** Latest-wins merge per top-level field; cert slices merged per certId */
export function mergeProgress(local: ProgressSnapshot, remote: ProgressSnapshot): ProgressSnapshot {
  const localTime = local.migratedAt ?? '';
  const remoteTime = remote.migratedAt ?? '';

  const mergeCertSlice = (a: ProgressSnapshot['byCert'][string], b: ProgressSnapshot['byCert'][string]) => {
    const mergedQuiz = [...(a?.quizHistory ?? [])];
    const quizIds = new Set(mergedQuiz.map(q => q.id));
    for (const q of b?.quizHistory ?? []) {
      if (!quizIds.has(q.id)) mergedQuiz.push(q);
    }
    mergedQuiz.sort((x, y) => x.date.localeCompare(y.date));

    const mergedExams = [...(a?.examAttempts ?? [])];
    const examIds = new Set(mergedExams.map(e => e.id));
    for (const e of b?.examAttempts ?? []) {
      if (!examIds.has(e.id)) mergedExams.push(e);
    }
    mergedExams.sort((x, y) => x.date.localeCompare(y.date));

    const outScores: Record<number, number[]> = { ...(a?.domainScores ?? {}) };
    for (const [d, scores] of Object.entries(b?.domainScores ?? {})) {
      const id = Number(d);
      const existing = outScores[id] ?? [];
      outScores[id] = existing.length >= scores.length ? existing : scores;
    }

    const useRemote = remoteTime > localTime;
    return {
      domainScores: outScores,
      quizHistory: mergedQuiz,
      examAttempts: mergedExams,
      examDate: useRemote ? (b?.examDate ?? a?.examDate ?? null) : (a?.examDate ?? b?.examDate ?? null),
      passThreshold: useRemote ? (b?.passThreshold ?? a?.passThreshold ?? 65) : (a?.passThreshold ?? b?.passThreshold ?? 65),
      totalQuizzesTaken: Math.max(a?.totalQuizzesTaken ?? 0, b?.totalQuizzesTaken ?? 0),
      perfectQuizzes: Math.max(a?.perfectQuizzes ?? 0, b?.perfectQuizzes ?? 0),
      labProgress: mergeLabProgress(a?.labProgress, b?.labProgress),
      missionLog: mergeMissionLog(a?.missionLog, b?.missionLog),
    };
  };

  function mergeMissionLog(
    a: CertProgressSlice['missionLog'] | undefined,
    b: CertProgressSlice['missionLog'] | undefined,
  ): CertProgressSlice['missionLog'] {
    const combined = [...(a ?? []), ...(b ?? [])];
    const byId = new Map<string, CertProgressSlice['missionLog'][number]>();
    for (const rec of combined) {
      byId.set(rec.id, rec);
    }
    return Array.from(byId.values()).sort(
      (x, y) => new Date(x.completedAt).getTime() - new Date(y.completedAt).getTime(),
    );
  }

  function mergeLabProgress(
    a: CertProgressSlice['labProgress'] | undefined,
    b: CertProgressSlice['labProgress'] | undefined,
  ): CertProgressSlice['labProgress'] {
    const combined = [...(a ?? []), ...(b ?? [])];
    const byId = new Map<string, CertProgressSlice['labProgress'][number]>();
    for (const rec of combined) {
      const existing = byId.get(rec.labId);
      if (!existing || new Date(rec.completedAt) > new Date(existing.completedAt)) {
        byId.set(rec.labId, rec);
      }
    }
    return Array.from(byId.values());
  }

  const certIds = new Set([
    ...Object.keys(local.byCert ?? {}),
    ...Object.keys(remote.byCert ?? {}),
  ]);
  const byCert: ProgressSnapshot['byCert'] = {};
  for (const certId of certIds) {
    byCert[certId] = mergeCertSlice(local.byCert?.[certId], remote.byCert?.[certId]);
  }

  return {
    version: 2,
    byCert,
    streak: remote.streak.longest > local.streak.longest ? remote.streak : local.streak,
    xp: Math.max(local.xp, remote.xp),
    level: Math.max(local.level, remote.level),
    totalStudyMinutes: Math.max(local.totalStudyMinutes, remote.totalStudyMinutes),
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

/** Push local progress to cloud — Supabase when configured, always local blob fallback */
export async function pushProgressToCloud(): Promise<{ ok: boolean; message: string }> {
  const session = getCurrentSession();
  if (!session) {
    reportSyncError('No active session — sign in first.');
    return { ok: false, message: 'No session.' };
  }

  const blob = buildCloudBlob();
  writeJson(cloudKey(session.userId), blob);
  updateSyncMeta({ lastPushAt: blob.updatedAt });

  if (isSupabaseConfigured()) {
    const remote = await pushToSupabase(blob, session.userId);
    if (remote.ok) {
      clearSyncError();
      return {
        ok: true,
        message: isSignedIn()
          ? 'Progress synced to Supabase and local backup.'
          : 'Progress saved locally; Supabase backup attempted.',
      };
    }
    reportSyncError(remote.message);
    return {
      ok: true,
      message: `Saved locally. Supabase: ${remote.message}`,
    };
  }

  clearSyncError();
  return {
    ok: true,
    message: isSignedIn()
      ? 'Progress synced to cloud blob.'
      : 'Progress saved to anonymous cloud blob (sign in to link across devices).',
  };
}

async function pushToSupabase(blob: CloudBlob, userId: string): Promise<{ ok: boolean; message: string }> {
  const cfg = getEffectiveSupabaseConfig();
  if (!cfg) return { ok: false, message: 'Supabase not configured' };

  try {
    const res = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/aaism_sync_blobs`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        blob,
        updated_at: blob.updatedAt,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true, message: 'Synced to Supabase.' };
    return { ok: false, message: `Push failed (${res.status}) — ensure aaism_sync_blobs table exists.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

async function pullFromSupabase(userId: string): Promise<CloudBlob | null> {
  const cfg = getEffectiveSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url.replace(/\/$/, '')}/rest/v1/aaism_sync_blobs?user_id=eq.${encodeURIComponent(userId)}&select=blob`,
      {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ blob: CloudBlob }>;
    return rows[0]?.blob ?? null;
  } catch {
    return null;
  }
}

/** Pull and merge remote blob into local progress */
export async function pullProgressFromCloud(): Promise<{ ok: boolean; message: string; merged: boolean }> {
  const session = getCurrentSession();
  if (!session) {
    reportSyncError('No active session — sign in first.');
    return { ok: false, message: 'No session.', merged: false };
  }

  let remote = readJson<CloudBlob>(cloudKey(session.userId));

  if (isSupabaseConfigured()) {
    const supabaseBlob = await pullFromSupabase(session.userId);
    if (supabaseBlob?.progress) {
      remote = supabaseBlob;
      writeJson(cloudKey(session.userId), supabaseBlob);
    }
  }

  if (!remote?.progress) {
    const msg = isSupabaseConfigured()
      ? 'No cloud backup found — push first or check Supabase table.'
      : 'No cloud backup found for this account.';
    reportSyncError(msg);
    return { ok: false, message: msg, merged: false };
  }

  const local = loadProgress();
  const merged = mergeProgress(local, remote.progress);
  saveProgress(merged);

  if (remote.aiConfigMeta) {
    const localConfig = loadAIConfig();
    saveAIConfig({ ...localConfig, ...remote.aiConfigMeta });
  }

  updateSyncMeta({
    lastPullAt: new Date().toISOString(),
    lastMergeAt: new Date().toISOString(),
  });

  clearSyncError();
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
    if (parsed.progress.version !== 2) {
      return { ok: false, error: 'Unsupported progress version in cloud blob' };
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
