import { QuizAttempt, GamificationState } from '../types';
import { initialState, loadState as loadAppState } from '../data/initialData';
import { initialGamificationState } from '../data/gamificationData';
import { EXAM_PASS_THRESHOLD } from '../constants/examConfig';
import { DEFAULT_CERT_ID, getCertification } from '../data/certifications/registry';
import { getActiveCertId } from './certContextService';
import { recordMissionComplete } from './memoryService';

export const PROGRESS_STORAGE_KEY = 'aaism-progress';

const LEGACY_APP_KEY = 'aaism-study-app-state';
const LEGACY_GAMIFICATION_KEY = 'aaism-gamification';

export interface DomainBreakdown {
  correct: number;
  total: number;
  pct: number;
}

export interface ExamAttemptRecord {
  id: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeUsedSeconds: number;
  passed: boolean;
  passThreshold: number;
  domainBreakdown: Record<number, DomainBreakdown>;
  flaggedCount: number;
  pausedCount: number;
}

export interface LabProgressRecord {
  labId: string;
  completedAt: string;
  stepsCompleted: string[];
  score: number;
}

export interface MissionLogEntry {
  id: string;
  completedAt: string;
  goalType: 'domain-focus' | 'weak-drill' | 'daily-30min';
  goalLabel: string;
  domainId: number;
  xpEarned: number;
  quizScore?: number;
  tasksCompleted: string[];
  tomorrowSuggestion?: string;
}

export interface CertProgressSlice {
  domainScores: Record<number, number[]>;
  quizHistory: QuizAttempt[];
  examAttempts: ExamAttemptRecord[];
  examDate: string | null;
  passThreshold: number;
  totalQuizzesTaken: number;
  perfectQuizzes: number;
  labProgress: LabProgressRecord[];
  missionLog: MissionLogEntry[];
}

/** @deprecated v1 flat snapshot — migrated to v2 on load */
interface ProgressSnapshotV1 {
  version: 1;
  domainScores: Record<number, number[]>;
  quizHistory: QuizAttempt[];
  examAttempts: ExamAttemptRecord[];
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
  xp: number;
  level: number;
  examDate: string | null;
  passThreshold: number;
  totalQuizzesTaken: number;
  perfectQuizzes: number;
  totalStudyMinutes: number;
  migratedAt?: string;
}

export interface ProgressSnapshot {
  version: 2;
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
  xp: number;
  level: number;
  totalStudyMinutes: number;
  byCert: Record<string, CertProgressSlice>;
  migratedAt?: string;
}

function defaultCertSlice(): CertProgressSlice {
  return {
    domainScores: {},
    quizHistory: [],
    examAttempts: [],
    examDate: null,
    passThreshold: EXAM_PASS_THRESHOLD,
    totalQuizzesTaken: 0,
    perfectQuizzes: 0,
    labProgress: [],
    missionLog: [],
  };
}

function defaultSnapshot(): ProgressSnapshot {
  return {
    version: 2,
    streak: { current: 0, longest: 0, lastActivityDate: null },
    xp: 0,
    level: 1,
    totalStudyMinutes: 0,
    byCert: { [DEFAULT_CERT_ID]: defaultCertSlice() },
  };
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function migrateFromLegacy(): ProgressSnapshot {
  const snap = defaultSnapshot();
  const app = readJson<typeof initialState>(LEGACY_APP_KEY) ?? loadAppState();
  const game = readJson<GamificationState>(LEGACY_GAMIFICATION_KEY) ?? initialGamificationState;

  const aaism = defaultCertSlice();
  aaism.quizHistory = app.quizAttempts ?? [];
  aaism.examDate = app.examDate ?? null;
  aaism.domainScores = game.domainScores ?? {};
  aaism.totalQuizzesTaken = game.totalQuizzesTaken ?? 0;
  aaism.perfectQuizzes = game.perfectQuizzes ?? 0;
  aaism.labProgress = [];
  aaism.missionLog = [];

  snap.byCert[DEFAULT_CERT_ID] = aaism;
  snap.streak = {
    current: game.currentStreak ?? 0,
    longest: game.longestStreak ?? 0,
    lastActivityDate: game.lastActivityDate ?? null,
  };
  snap.xp = game.xp ?? 0;
  snap.level = game.level ?? 1;
  snap.totalStudyMinutes = game.totalStudyMinutes ?? 0;
  snap.migratedAt = new Date().toISOString();
  return snap;
}

function migrateV1ToV2(v1: ProgressSnapshotV1): ProgressSnapshot {
  const snap = defaultSnapshot();
  snap.byCert[DEFAULT_CERT_ID] = {
    domainScores: v1.domainScores ?? {},
    quizHistory: v1.quizHistory ?? [],
    examAttempts: v1.examAttempts ?? [],
    examDate: v1.examDate ?? null,
    passThreshold: v1.passThreshold ?? EXAM_PASS_THRESHOLD,
    totalQuizzesTaken: v1.totalQuizzesTaken ?? 0,
    perfectQuizzes: v1.perfectQuizzes ?? 0,
    labProgress: [],
    missionLog: [],
  };
  snap.streak = v1.streak ?? snap.streak;
  snap.xp = v1.xp ?? 0;
  snap.level = v1.level ?? 1;
  snap.totalStudyMinutes = v1.totalStudyMinutes ?? 0;
  snap.migratedAt = new Date().toISOString();
  return snap;
}

export function getCertSlice(certId?: string): CertProgressSlice {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  if (!snap.byCert[id]) {
    snap.byCert[id] = defaultCertSlice();
    saveProgress(snap);
  }
  const slice = snap.byCert[id];
  if (!slice.labProgress) {
    slice.labProgress = [];
    saveProgress(snap);
  }
  if (!slice.missionLog) {
    slice.missionLog = [];
    saveProgress(snap);
  }
  return slice;
}

export function loadProgress(): ProgressSnapshot {
  const existing = readJson<ProgressSnapshot | ProgressSnapshotV1>(PROGRESS_STORAGE_KEY);
  if (existing?.version === 2) {
    if (!existing.byCert[DEFAULT_CERT_ID]) {
      existing.byCert[DEFAULT_CERT_ID] = defaultCertSlice();
      saveProgress(existing);
    }
    return existing;
  }
  if (existing?.version === 1) {
    const migrated = migrateV1ToV2(existing);
    saveProgress(migrated);
    return migrated;
  }

  const migrated = migrateFromLegacy();
  saveProgress(migrated);
  return migrated;
}

export function saveProgress(data: ProgressSnapshot): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function domainIdsForCert(certId: string): number[] {
  const cert = getCertification(certId);
  if (cert?.domains.length) return cert.domains.map(d => d.id);
  return [1, 2, 3, 4];
}

/** Sync legacy stores into unified progress for active (or specified) cert */
export function syncFromContexts(
  quizAttempts: QuizAttempt[],
  examDate: string | null,
  gamification: GamificationState,
  certId?: string,
): void {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  snap.byCert[id] = {
    ...(snap.byCert[id] ?? defaultCertSlice()),
    quizHistory: quizAttempts,
    examDate,
    domainScores: gamification.domainScores,
    totalQuizzesTaken: gamification.totalQuizzesTaken,
    perfectQuizzes: gamification.perfectQuizzes,
  };
  snap.streak = {
    current: gamification.currentStreak,
    longest: gamification.longestStreak,
    lastActivityDate: gamification.lastActivityDate,
  };
  snap.xp = gamification.xp;
  snap.level = gamification.level;
  snap.totalStudyMinutes = gamification.totalStudyMinutes;
  saveProgress(snap);
}

export function loadCertIntoContexts(certId: string): {
  domainScores: GamificationState['domainScores'];
  quizHistory: QuizAttempt[];
  examDate: string | null;
  gamificationPartial: Pick<GamificationState, 'totalQuizzesTaken' | 'perfectQuizzes'>;
} {
  const slice = getCertSlice(certId);
  return {
    domainScores: slice.domainScores,
    quizHistory: slice.quizHistory,
    examDate: slice.examDate,
    gamificationPartial: {
      totalQuizzesTaken: slice.totalQuizzesTaken,
      perfectQuizzes: slice.perfectQuizzes,
    },
  };
}

/** Build gamification state from unified progress store (preferred over legacy key). */
export function getGamificationStateFromProgress(certId?: string): GamificationState {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id] ?? defaultCertSlice();
  return {
    ...initialGamificationState,
    xp: snap.xp,
    level: snap.level,
    currentStreak: snap.streak.current,
    longestStreak: snap.streak.longest,
    lastActivityDate: snap.streak.lastActivityDate,
    totalQuizzesTaken: slice.totalQuizzesTaken,
    perfectQuizzes: slice.perfectQuizzes,
    totalStudyMinutes: snap.totalStudyMinutes,
    domainScores: slice.domainScores,
    unlockedBadges: [],
    dailyChallenges: [],
  };
}

export const PROGRESS_CHANGED_EVENT = 'aaism-progress-changed';

export function notifyProgressChanged(): void {
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT));
}

export function addExamAttempt(
  attempt: Omit<ExamAttemptRecord, 'id'>,
  certId?: string,
): ExamAttemptRecord {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id] ?? defaultCertSlice();
  const record: ExamAttemptRecord = { ...attempt, id: crypto.randomUUID() };
  slice.examAttempts = [...slice.examAttempts, record];
  snap.byCert[id] = slice;
  saveProgress(snap);
  return record;
}

export function getExamAttempts(certId?: string): ExamAttemptRecord[] {
  return getCertSlice(certId).examAttempts;
}

export function getPassThreshold(certId?: string): number {
  return getCertSlice(certId).passThreshold;
}

export function setPassThreshold(threshold: number, certId?: string): void {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id] ?? defaultCertSlice();
  slice.passThreshold = Math.max(50, Math.min(100, threshold));
  snap.byCert[id] = slice;
  saveProgress(snap);
}

export function getDomainProgress(certId?: string): Array<{ domainId: number; avg: number; count: number }> {
  const id = certId ?? getActiveCertId();
  const { domainScores } = getCertSlice(id);
  return domainIdsForCert(id).map(domainId => {
    const scores = domainScores[domainId] ?? [];
    const avg = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { domainId, avg, count: scores.length };
  });
}

export function getReadinessScore(certId?: string): number {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = getCertSlice(id);
  const domainAvgs = getDomainProgress(id).filter(d => d.count > 0).map(d => d.avg);
  const domainReadiness = domainAvgs.length > 0
    ? Math.round(domainAvgs.reduce((a, b) => a + b, 0) / domainAvgs.length)
    : 0;

  const recent = slice.quizHistory.slice(-10);
  const avgQuiz = recent.length > 0
    ? Math.round(recent.reduce((s, q) => s + q.score, 0) / recent.length)
    : 0;

  const streakBonus = Math.min(snap.streak.current, 30) / 30 * 20;
  return Math.round(domainReadiness * 0.5 + avgQuiz * 0.3 + streakBonus);
}

export function exportProgressJson(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

export function importProgressJson(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as ProgressSnapshot | ProgressSnapshotV1;
    if (parsed.version === 1) {
      saveProgress(migrateV1ToV2(parsed));
      return { ok: true };
    }
    if (parsed.version === 2) {
      saveProgress(parsed);
      return { ok: true };
    }
    return { ok: false, error: 'Unsupported progress file version' };
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }
}

export function updateProgressFields(
  partial: Partial<CertProgressSlice> & Partial<Pick<ProgressSnapshot, 'streak' | 'xp' | 'level' | 'totalStudyMinutes'>>,
  certId?: string,
): void {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id] ?? defaultCertSlice();
  const {
    streak,
    xp,
    level,
    totalStudyMinutes,
    ...certPartial
  } = partial;

  snap.byCert[id] = { ...slice, ...certPartial };
  if (streak !== undefined) snap.streak = streak;
  if (xp !== undefined) snap.xp = xp;
  if (level !== undefined) snap.level = level;
  if (totalStudyMinutes !== undefined) snap.totalStudyMinutes = totalStudyMinutes;
  saveProgress(snap);
}

export function getLatestExamAttempt(certId?: string): ExamAttemptRecord | null {
  const attempts = getExamAttempts(certId);
  return attempts.length > 0 ? attempts[attempts.length - 1] : null;
}

export function getMissionLog(certId?: string): MissionLogEntry[] {
  return getCertSlice(certId).missionLog ?? [];
}

export function addMissionLogEntry(
  entry: Omit<MissionLogEntry, 'id'>,
  certId?: string,
): MissionLogEntry {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id] ?? defaultCertSlice();
  const record: MissionLogEntry = { ...entry, id: crypto.randomUUID() };
  slice.missionLog = [...(slice.missionLog ?? []), record];
  snap.byCert[id] = slice;
  saveProgress(snap);
  recordMissionComplete(record, id);
  return record;
}

export function getWeakestDomain(certId?: string): { domainId: number; avg: number } | null {
  const progress = getDomainProgress(certId).filter(d => d.count > 0);
  if (progress.length === 0) return null;
  const weakest = progress.reduce((a, b) => (a.avg < b.avg ? a : b));
  return { domainId: weakest.domainId, avg: weakest.avg };
}

export function getTodayActivityCounts(certId?: string): {
  quizzes: number;
  labs: number;
  missions: number;
} {
  const today = new Date().toISOString().slice(0, 10);
  const slice = getCertSlice(certId);
  return {
    quizzes: slice.quizHistory.filter(q => q.date.startsWith(today)).length,
    labs: (slice.labProgress ?? []).filter(l => l.completedAt.startsWith(today)).length,
    missions: (slice.missionLog ?? []).filter(m => m.completedAt.startsWith(today)).length,
  };
}
