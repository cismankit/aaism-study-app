/**
 * Aegis unified memory — structured cognition body persisted in localStorage
 * and optionally synced to Supabase `aegis_user_memory`.
 *
 * Supabase SQL (run once in SQL editor):
 * ```sql
 * create table if not exists public.aegis_user_memory (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text not null default 'local',
 *   memory jsonb not null,
 *   updated_at timestamptz not null default now()
 * );
 * alter table public.aegis_user_memory enable row level security;
 * create policy "anon read own" on public.aegis_user_memory for select using (true);
 * create policy "anon upsert" on public.aegis_user_memory for insert with check (true);
 * create policy "anon update" on public.aegis_user_memory for update using (true);
 * ```
 */

import { isAllowedHttpsUrl } from '../data/securityPolicy';
import { PROGRESS_STORAGE_KEY, type MissionLogEntry } from './progressService';
import { CAREER_STORAGE_KEY, type CompanyProfile } from '../data/careerIntel';
import { loadIntegrationsConfig } from './integrationsConfigService';
import { getActiveCertId, getDefaultCertId } from './certContextService';

export const MEMORY_STORAGE_KEY = 'aegis-memory-v1';

export interface AgentConversationSummary {
  id: string;
  persona: string;
  summary: string;
  certId?: string;
  at: string;
}

export interface OutreachDraftMemory {
  id: string;
  company: string;
  draft: string;
  at: string;
}

export interface AegisMemory {
  version: 1;
  profile: {
    displayName?: string;
    jobSeekerMode: boolean;
    defaultCert: string;
    sessionCount: number;
  };
  cognition: {
    weakDomains: Record<string, number[]>;
    lastMission?: MissionLogEntry;
    learningGoals: string[];
  };
  career: {
    savedCompanies: CompanyProfile[];
    outreachDrafts: OutreachDraftMemory[];
  };
  agent: {
    recentSummaries: AgentConversationSummary[];
    preferences: Record<string, string | boolean | number>;
  };
  sync: {
    lastSyncedAt?: string;
    remoteId?: string;
    lastError?: string;
  };
}

const MAX_SUMMARIES = 20;
const MAX_OUTREACH = 10;

function emptyMemory(): AegisMemory {
  return {
    version: 1,
    profile: {
      jobSeekerMode: false,
      defaultCert: getDefaultCertId(),
      sessionCount: 0,
    },
    cognition: {
      weakDomains: {},
      learningGoals: [],
    },
    career: {
      savedCompanies: [],
      outreachDrafts: [],
    },
    agent: {
      recentSummaries: [],
      preferences: {},
    },
    sync: {},
  };
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
    console.error(`memoryService: failed to write ${key}`, e);
  }
}

let memoryCache: AegisMemory | null = null;
let migrated = false;

export function loadMemory(): AegisMemory {
  if (memoryCache && migrated) return memoryCache;

  const stored = readJson<AegisMemory>(MEMORY_STORAGE_KEY);
  if (stored?.version === 1) {
    memoryCache = stored;
    migrated = true;
    return stored;
  }

  memoryCache = mergeFromLegacyStores();
  saveMemory(memoryCache);
  migrated = true;
  return memoryCache;
}

export function saveMemory(memory: AegisMemory): void {
  memoryCache = memory;
  writeJson(MEMORY_STORAGE_KEY, memory);
}

export function mergeFromLegacyStores(): AegisMemory {
  const memory = emptyMemory();

  const integrations = loadIntegrationsConfig();
  memory.profile.jobSeekerMode = integrations.jobSeekerMode ?? false;
  memory.profile.defaultCert = getDefaultCertId();

  const progress = readJson<{
    byCert?: Record<string, { missionLog?: MissionLogEntry[]; domainScores?: Record<number, number[]> }>;
  }>(PROGRESS_STORAGE_KEY);

  if (progress?.byCert) {
    for (const [certId, slice] of Object.entries(progress.byCert)) {
      const weak: number[] = [];
      if (slice.domainScores) {
        for (const [domainId, scores] of Object.entries(slice.domainScores)) {
          if (scores.length === 0) continue;
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg < 60) weak.push(Number(domainId));
        }
      }
      if (weak.length > 0) memory.cognition.weakDomains[certId] = weak;

      const log = slice.missionLog;
      if (log?.length) {
        const latest = log[log.length - 1];
        if (!memory.cognition.lastMission || latest.completedAt > memory.cognition.lastMission.completedAt) {
          memory.cognition.lastMission = latest;
        }
      }
    }
  }

  const careerProfiles = readJson<CompanyProfile[]>(CAREER_STORAGE_KEY);
  if (careerProfiles?.length) {
    memory.career.savedCompanies = careerProfiles.slice(0, 20);
  }

  const weakAreas = readJson<Array<{ domain?: number; certId?: string }>>('aaism_weak_areas');
  if (weakAreas?.length) {
    const certId = getActiveCertId();
    const domains = new Set(memory.cognition.weakDomains[certId] ?? []);
    weakAreas.forEach(w => {
      if (w.domain) domains.add(w.domain);
    });
    memory.cognition.weakDomains[certId] = [...domains];
  }

  const onboardingHint = localStorage.getItem('aaism-onboarding-hint');
  if (onboardingHint) {
    memory.cognition.learningGoals.push(onboardingHint);
  }

  memory.profile.sessionCount = Number(sessionStorage.getItem('aegis-session-count') ?? 0) || 1;
  return memory;
}

export function incrementSessionCount(): void {
  const memory = loadMemory();
  memory.profile.sessionCount += 1;
  sessionStorage.setItem('aegis-session-count', String(memory.profile.sessionCount));
  saveMemory(memory);
}

export function recordMissionComplete(entry: MissionLogEntry, _certId: string): void {
  const memory = loadMemory();
  memory.cognition.lastMission = entry;
  saveMemory(memory);
  void pushToSupabase(memory);
}

export function recordWeakDomains(certId: string, domainIds: number[]): void {
  const memory = loadMemory();
  memory.cognition.weakDomains[certId] = [...new Set(domainIds)];
  saveMemory(memory);
}

export function recordAgentSummary(summary: Omit<AgentConversationSummary, 'id' | 'at'>): void {
  const memory = loadMemory();
  const entry: AgentConversationSummary = {
    ...summary,
    id: `sum_${Date.now()}`,
    at: new Date().toISOString(),
  };
  memory.agent.recentSummaries = [entry, ...memory.agent.recentSummaries].slice(0, MAX_SUMMARIES);
  saveMemory(memory);
  void pushToSupabase(memory);
}

export function recordCareerIntel(profiles: CompanyProfile[], outreachDraft?: OutreachDraftMemory): void {
  const memory = loadMemory();
  memory.career.savedCompanies = profiles.slice(0, 20);
  if (outreachDraft) {
    memory.career.outreachDrafts = [outreachDraft, ...memory.career.outreachDrafts].slice(0, MAX_OUTREACH);
  }
  saveMemory(memory);
  void pushToSupabase(memory);
}

export function recordQuizSession(certId: string, weakDomainIds: number[]): void {
  if (weakDomainIds.length === 0) return;
  const memory = loadMemory();
  const existing = new Set(memory.cognition.weakDomains[certId] ?? []);
  weakDomainIds.forEach(d => existing.add(d));
  memory.cognition.weakDomains[certId] = [...existing];
  saveMemory(memory);
}

export function buildMemoryContextForPrompt(maxTokens = 800): string {
  const memory = loadMemory();
  const lines: string[] = ['## User memory body (persistent across sessions)'];

  if (memory.profile.displayName) {
    lines.push(`- Operator: ${memory.profile.displayName}`);
  }
  lines.push(`- Active cert track default: ${memory.profile.defaultCert}`);
  lines.push(`- Sessions on platform: ${memory.profile.sessionCount}`);
  if (memory.profile.jobSeekerMode) {
    lines.push('- Job seeker mode: ON — prioritize career intel and role alignment');
  }

  const weakEntries = Object.entries(memory.cognition.weakDomains);
  if (weakEntries.length > 0) {
    lines.push('- Weak domains by cert:');
    weakEntries.forEach(([cert, domains]) => {
      lines.push(`  · ${cert}: domains ${domains.join(', ')}`);
    });
  }

  if (memory.cognition.lastMission) {
    const m = memory.cognition.lastMission;
    lines.push(`- Last mission (${m.completedAt.slice(0, 10)}): ${m.goalLabel}${m.quizScore != null ? ` — quiz ${m.quizScore}%` : ''}`);
    if (m.tomorrowSuggestion) lines.push(`  · Next suggestion: ${m.tomorrowSuggestion}`);
  }

  if (memory.cognition.learningGoals.length > 0) {
    lines.push(`- Learning goals: ${memory.cognition.learningGoals.slice(0, 3).join('; ')}`);
  }

  if (memory.career.savedCompanies.length > 0) {
    const names = memory.career.savedCompanies.slice(0, 5).map(c => c.companyName).join(', ');
    lines.push(`- Saved companies (${memory.career.savedCompanies.length}): ${names}`);
  }

  if (memory.agent.recentSummaries.length > 0) {
    lines.push('- Recent agent runs:');
    memory.agent.recentSummaries.slice(0, 3).forEach(s => {
      lines.push(`  · [${s.persona}] ${s.summary.slice(0, 120)}`);
    });
  }

  let text = lines.join('\n');
  const approxChars = maxTokens * 4;
  if (text.length > approxChars) {
    text = text.slice(0, approxChars) + '…';
  }
  return text;
}

export function exportMemoryJson(): string {
  return JSON.stringify(loadMemory(), null, 2);
}

export function importMemoryJson(raw: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(raw) as AegisMemory;
    if (parsed.version !== 1) return { ok: false, error: 'Unsupported memory version' };
    saveMemory(parsed);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}

export function clearMemory(): void {
  memoryCache = null;
  migrated = false;
  localStorage.removeItem(MEMORY_STORAGE_KEY);
  memoryCache = mergeFromLegacyStores();
  saveMemory(memoryCache);
}

function getSupabaseConfig(): { url: string; key: string } | null {
  const cfg = loadIntegrationsConfig();
  const url = cfg.supabaseUrl?.trim();
  const key = cfg.supabaseAnonKey?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

export async function pushToSupabase(memory?: AegisMemory): Promise<{ ok: boolean; message: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return { ok: false, message: 'Supabase not configured — add URL + anon key in Integrations.' };
  }
  if (!isAllowedHttpsUrl(cfg.url, { allowLocalhost: true })) {
    return { ok: false, message: 'Supabase URL must use HTTPS.' };
  }

  const body = memory ?? loadMemory();
  const remoteId = body.sync.remoteId ?? 'local';

  try {
    const res = await fetch(`${cfg.url}/rest/v1/aegis_user_memory`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: remoteId,
        memory: body,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      body.sync.lastError = errText.slice(0, 200);
      saveMemory(body);
      return { ok: false, message: `Sync failed (${res.status}): ${errText.slice(0, 120)}` };
    }

    const rows = await res.json() as Array<{ id: string }>;
    body.sync.lastSyncedAt = new Date().toISOString();
    body.sync.remoteId = rows[0]?.id ?? remoteId;
    body.sync.lastError = undefined;
    saveMemory(body);
    return { ok: true, message: 'Memory synced to Supabase.' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    body.sync.lastError = msg;
    saveMemory(body);
    return { ok: false, message: msg };
  }
}

export async function pullFromSupabase(): Promise<{ ok: boolean; message: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return { ok: false, message: 'Supabase not configured.' };
  }
  if (!isAllowedHttpsUrl(cfg.url, { allowLocalhost: true })) {
    return { ok: false, message: 'Supabase URL must use HTTPS.' };
  }

  const local = loadMemory();
  const remoteId = local.sync.remoteId ?? 'local';

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/aegis_user_memory?user_id=eq.${encodeURIComponent(remoteId)}&order=updated_at.desc&limit=1`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
      },
    );

    if (!res.ok) {
      return { ok: false, message: `Pull failed (${res.status})` };
    }

    const rows = await res.json() as Array<{ memory: AegisMemory; id: string; updated_at: string }>;
    if (!rows.length) {
      return { ok: false, message: 'No remote memory found — push first to create a row.' };
    }

    const remote = rows[0].memory;
    remote.sync = {
      ...remote.sync,
      lastSyncedAt: rows[0].updated_at,
      remoteId: rows[0].id,
    };
    saveMemory(remote);
    return { ok: true, message: 'Memory pulled from Supabase.' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export function getMemoryStats(): {
  weakDomainCount: number;
  missionCount: number;
  companyCount: number;
  summaryCount: number;
  lastSyncedAt?: string;
} {
  const m = loadMemory();
  const weakDomainCount = Object.values(m.cognition.weakDomains).reduce((n, d) => n + d.length, 0);
  return {
    weakDomainCount,
    missionCount: m.cognition.lastMission ? 1 : 0,
    companyCount: m.career.savedCompanies.length,
    summaryCount: m.agent.recentSummaries.length,
    lastSyncedAt: m.sync.lastSyncedAt,
  };
}

/** Initialize memory on app boot */
export function initMemory(): void {
  loadMemory();
  if (!sessionStorage.getItem('aegis-memory-session-init')) {
    incrementSessionCount();
    sessionStorage.setItem('aegis-memory-session-init', '1');
  }
}
