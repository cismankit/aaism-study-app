import { getLabById, getLabsForCert, getLabsForDomain } from '../data/labs';
import type { LabDefinition } from '../data/labs/types';
import {
  getCertSlice,
  loadProgress,
  saveProgress,
  type LabProgressRecord,
} from './progressService';
import { getActiveCertId } from './certContextService';

export { getLabsForCert, getLabsForDomain, getLabById };

const LAB_PROGRESS_KEY = 'aaism-lab-step-progress';

interface StepProgressCache {
  [labId: string]: string[];
}

function loadStepCache(): StepProgressCache {
  try {
    const raw = localStorage.getItem(LAB_PROGRESS_KEY);
    return raw ? JSON.parse(raw) as StepProgressCache : {};
  } catch {
    return {};
  }
}

function saveStepCache(cache: StepProgressCache): void {
  try {
    localStorage.setItem(LAB_PROGRESS_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export function getLabProgress(certId?: string): LabProgressRecord[] {
  return getCertSlice(certId).labProgress ?? [];
}

export function isLabCompleted(labId: string, certId?: string): boolean {
  return getLabProgress(certId).some(p => p.labId === labId);
}

export function getCompletedStepIds(labId: string): string[] {
  const cache = loadStepCache();
  return cache[labId] ?? [];
}

export function markStepComplete(labId: string, stepId: string): void {
  const cache = loadStepCache();
  const existing = cache[labId] ?? [];
  if (!existing.includes(stepId)) {
    cache[labId] = [...existing, stepId];
    saveStepCache(cache);
  }
}

export function unmarkStep(labId: string, stepId: string): void {
  const cache = loadStepCache();
  cache[labId] = (cache[labId] ?? []).filter(id => id !== stepId);
  saveStepCache(cache);
}

export function getLabCompletionPct(lab: LabDefinition, certId?: string): number {
  if (isLabCompleted(lab.id, certId)) return 100;
  const total = lab.steps?.length ?? lab.analysisQuestions?.length ?? lab.decisions?.length ?? 1;
  const done = getCompletedStepIds(lab.id).length;
  return Math.min(100, Math.round((done / total) * 100));
}

export function completeLab(
  labId: string,
  score: number,
  stepsCompleted: string[],
  certId?: string,
): LabProgressRecord {
  const id = certId ?? getActiveCertId();
  const snap = loadProgress();
  const slice = snap.byCert[id];
  if (!slice) throw new Error('Cert slice not found');

  const existing = slice.labProgress ?? [];
  const filtered = existing.filter(p => p.labId !== labId);
  const record: LabProgressRecord = {
    labId,
    completedAt: new Date().toISOString(),
    stepsCompleted,
    score: Math.max(0, Math.min(100, score)),
  };
  slice.labProgress = [...filtered, record];

  const lab = getLabById(labId);
  if (lab) {
    const domainScores = slice.domainScores[lab.domainId] ?? [];
    slice.domainScores[lab.domainId] = [...domainScores, record.score];
  }

  snap.byCert[id] = slice;
  saveProgress(snap);

  const cache = loadStepCache();
  delete cache[labId];
  saveStepCache(cache);

  return record;
}

export function findLabForTopic(certId: string, domainId: number, topic?: string): LabDefinition | undefined {
  const domainLabs = getLabsForDomain(certId, domainId);
  if (!topic) return domainLabs[0];
  const lower = topic.toLowerCase();
  return domainLabs.find(l =>
    l.title.toLowerCase().includes(lower) ||
    l.tags?.some(t => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower)),
  ) ?? domainLabs[0];
}

export function getLabStatsForCert(certId?: string): { completed: number; total: number } {
  const id = certId ?? getActiveCertId();
  const total = getLabsForCert(id).length;
  const completed = getLabProgress(id).length;
  return { completed, total };
}
