import { getMissionLog, getWeakestDomain } from './progressService';

export interface NextBestAction {
  to: string;
  label: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasMissionCompletedToday(certId: string): boolean {
  const today = todayIsoDate();
  return getMissionLog(certId).some(entry => entry.completedAt.startsWith(today));
}

export function getNextBestAction(certId: string): NextBestAction {
  if (!hasMissionCompletedToday(certId)) {
    return { to: '/mission', label: 'Mission' };
  }
  const weak = getWeakestDomain(certId);
  if (weak) {
    return { to: '/study', label: 'Practice' };
  }
  return { to: '/', label: 'Command' };
}

export function getSessionFocusLabel(certId: string): string {
  const weak = getWeakestDomain(certId);
  if (weak) return `D${weak.domainId} focus`;
  return 'Overview';
}
