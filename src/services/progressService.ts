import { QuizAttempt, GamificationState } from '../types';
import { initialState, loadState as loadAppState } from '../data/initialData';
import { initialGamificationState } from '../data/gamificationData';
import { EXAM_PASS_THRESHOLD } from '../constants/examConfig';

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

export interface ProgressSnapshot {
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

function defaultSnapshot(): ProgressSnapshot {
  return {
    version: 1,
    domainScores: {},
    quizHistory: [],
    examAttempts: [],
    streak: { current: 0, longest: 0, lastActivityDate: null },
    xp: 0,
    level: 1,
    examDate: null,
    passThreshold: EXAM_PASS_THRESHOLD,
    totalQuizzesTaken: 0,
    perfectQuizzes: 0,
    totalStudyMinutes: 0,
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

  snap.quizHistory = app.quizAttempts ?? [];
  snap.examDate = app.examDate ?? null;
  snap.domainScores = game.domainScores ?? {};
  snap.streak = {
    current: game.currentStreak ?? 0,
    longest: game.longestStreak ?? 0,
    lastActivityDate: game.lastActivityDate ?? null,
  };
  snap.xp = game.xp ?? 0;
  snap.level = game.level ?? 1;
  snap.totalQuizzesTaken = game.totalQuizzesTaken ?? 0;
  snap.perfectQuizzes = game.perfectQuizzes ?? 0;
  snap.totalStudyMinutes = game.totalStudyMinutes ?? 0;
  snap.migratedAt = new Date().toISOString();
  return snap;
}

export function loadProgress(): ProgressSnapshot {
  const existing = readJson<ProgressSnapshot>(PROGRESS_STORAGE_KEY);
  if (existing?.version === 1) return existing;

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

/** Sync legacy stores into unified progress (call after context updates) */
export function syncFromContexts(
  quizAttempts: QuizAttempt[],
  examDate: string | null,
  gamification: GamificationState,
): void {
  const snap = loadProgress();
  snap.quizHistory = quizAttempts;
  snap.examDate = examDate;
  snap.domainScores = gamification.domainScores;
  snap.streak = {
    current: gamification.currentStreak,
    longest: gamification.longestStreak,
    lastActivityDate: gamification.lastActivityDate,
  };
  snap.xp = gamification.xp;
  snap.level = gamification.level;
  snap.totalQuizzesTaken = gamification.totalQuizzesTaken;
  snap.perfectQuizzes = gamification.perfectQuizzes;
  snap.totalStudyMinutes = gamification.totalStudyMinutes;
  saveProgress(snap);
}

export function addExamAttempt(
  attempt: Omit<ExamAttemptRecord, 'id'>,
): ExamAttemptRecord {
  const snap = loadProgress();
  const record: ExamAttemptRecord = { ...attempt, id: crypto.randomUUID() };
  snap.examAttempts = [...snap.examAttempts, record];
  saveProgress(snap);
  return record;
}

export function getExamAttempts(): ExamAttemptRecord[] {
  return loadProgress().examAttempts;
}

export function getPassThreshold(): number {
  return loadProgress().passThreshold;
}

export function setPassThreshold(threshold: number): void {
  const snap = loadProgress();
  snap.passThreshold = Math.max(50, Math.min(100, threshold));
  saveProgress(snap);
}

export function getDomainProgress(): Array<{ domainId: number; avg: number; count: number }> {
  const { domainScores } = loadProgress();
  return [1, 2, 3, 4].map(domainId => {
    const scores = domainScores[domainId] ?? [];
    const avg = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { domainId, avg, count: scores.length };
  });
}

export function getReadinessScore(): number {
  const snap = loadProgress();
  const domainAvgs = getDomainProgress().filter(d => d.count > 0).map(d => d.avg);
  const domainReadiness = domainAvgs.length > 0
    ? Math.round(domainAvgs.reduce((a, b) => a + b, 0) / domainAvgs.length)
    : 0;

  const recent = snap.quizHistory.slice(-10);
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
    const parsed = JSON.parse(json) as ProgressSnapshot;
    if (parsed.version !== 1) return { ok: false, error: 'Unsupported progress file version' };
    saveProgress(parsed);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }
}

export function updateProgressFields(partial: Partial<ProgressSnapshot>): void {
  const snap = loadProgress();
  saveProgress({ ...snap, ...partial });
}

export function getLatestExamAttempt(): ExamAttemptRecord | null {
  const attempts = getExamAttempts();
  return attempts.length > 0 ? attempts[attempts.length - 1] : null;
}
