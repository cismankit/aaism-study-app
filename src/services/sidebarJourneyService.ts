import { getCertification } from '../data/certifications/registry';
import { getPipelineStats } from './agentService';
import { isJobSeekerModeEnabled } from './integrationsConfigService';
import { loadMemory } from './memoryService';
import {
  getExamAttempts,
  getMissionLog,
  getTodayActivityCounts,
  getWeakestDomain,
} from './progressService';

export interface NextBestAction {
  to: string;
  label: string;
  hint?: string;
}

export type LoopStepId = 'learn' | 'work' | 'earn';

export interface DailyLoopStep {
  id: LoopStepId;
  label: string;
  to: string;
  done: boolean;
  subtitle: string;
}

export interface FocusContext {
  domainId: number | null;
  domainShortName: string | null;
  focusLabel: string;
  missionDoneToday: boolean;
  lastMissionGoal?: string;
  loopDoneCount: number;
  loopTotal: number;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasMissionCompletedToday(certId: string): boolean {
  return getTodayActivityCounts(certId).missions > 0;
}

function resolveFocusDomain(certId: string): number | null {
  const today = todayIsoDate();
  const todayMission = [...getMissionLog(certId)].reverse().find(m => m.completedAt.startsWith(today));
  if (todayMission) return todayMission.domainId;

  const weak = getWeakestDomain(certId);
  if (weak) return weak.domainId;

  const lastMission = loadMemory().cognition.lastMission;
  if (lastMission) return lastMission.domainId;

  return null;
}

function domainShortName(certId: string, domainId: number | null): string | null {
  if (!domainId) return null;
  const cert = getCertification(certId);
  return cert?.domains.find(d => d.id === domainId)?.shortName ?? `D${domainId}`;
}

export function getFocusContext(certId: string): FocusContext {
  const cert = getCertification(certId);
  const domainId = resolveFocusDomain(certId);
  const shortName = domainShortName(certId, domainId);
  const missionDoneToday = hasMissionCompletedToday(certId);
  const todayMission = [...getMissionLog(certId)].reverse().find(m => m.completedAt.startsWith(todayIsoDate()));
  const steps = getDailyLoopSteps(certId);

  let focusLabel = `${cert?.shortName ?? 'Cert'} · Learn · Work · Earn`;
  if (shortName) {
    focusLabel = missionDoneToday
      ? `${shortName} · loop in progress`
      : `${shortName} focus today`;
  }

  return {
    domainId,
    domainShortName: shortName,
    focusLabel,
    missionDoneToday,
    lastMissionGoal: todayMission?.goalLabel ?? loadMemory().cognition.lastMission?.goalLabel,
    loopDoneCount: steps.filter(s => s.done).length,
    loopTotal: steps.length,
  };
}

export function getDailyLoopSteps(certId: string): DailyLoopStep[] {
  const cert = getCertification(certId);
  const domainId = resolveFocusDomain(certId);
  const activity = getTodayActivityCounts(certId);
  const missionDone = activity.missions > 0;
  const workDone = missionDone || activity.quizzes > 0 || activity.labs > 0;
  const today = todayIsoDate();
  const examDone = getExamAttempts(certId).some(e => e.date.startsWith(today));
  const stats = getPipelineStats();
  const agentDone = Boolean(stats.lastRunAt?.startsWith(today));
  const earnDone = examDone || agentDone;
  const jobSeeker = isJobSeekerModeEnabled();
  const qCount = cert?.examFormat?.questions ?? 90;
  const passScore = cert?.examFormat?.passingScore ?? 65;
  const domainLabel = domainId ? `D${domainId} drill` : 'Domain quiz';

  return [
    {
      id: 'learn',
      label: 'Learn',
      to: '/',
      done: missionDone,
      subtitle: '25-min mission loop',
    },
    {
      id: 'work',
      label: 'Work',
      to: domainId ? `/study?tab=quiz&domain=${domainId}` : '/study?tab=quiz',
      done: workDone,
      subtitle: `${domainLabel} · Ops Lab`,
    },
    {
      id: 'earn',
      label: 'Earn',
      to: jobSeeker ? '/career' : '/exam',
      done: earnDone,
      subtitle: jobSeeker
        ? `${qCount}Q sim · Career intel`
        : `${qCount}Q sim · ${passScore}% pass`,
    },
  ];
}

export function getNextBestAction(certId: string): NextBestAction {
  const steps = getDailyLoopSteps(certId);
  const nextStep = steps.find(s => !s.done) ?? steps[0];
  return {
    to: nextStep.to,
    label: nextStep.label,
    hint: nextStep.subtitle,
  };
}

export function getSessionFocusLabel(certId: string): string {
  return getFocusContext(certId).focusLabel;
}

/** Routes where child pages show the shared focus context bar */
export function isLoopChildRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/mission' || pathname === '/command') return false;
  const loopPrefixes = ['/study', '/exam', '/intel', '/agent', '/ops', '/knowledge', '/career', '/cheatsheet', '/cram', '/scenarios'];
  return loopPrefixes.some(prefix => pathname.startsWith(prefix));
}
