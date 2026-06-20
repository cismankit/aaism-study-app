import { loadProgress } from './progressService';

/** Features hidden until unlock — routes stay in codebase, gated in nav + search */
export type GatedFeatureId =
  | 'team-packs'
  | 'content-studio'
  | 'donate'
  | 'feature-request'
  | 'my-updates'
  | 'bug-reports'
  | 'osint-arsenal'
  | 'scenario-lab';

export const PRO_FEATURES: GatedFeatureId[] = [
  'team-packs',
  'content-studio',
  'donate',
  'feature-request',
  'my-updates',
  'bug-reports',
  'osint-arsenal',
  'scenario-lab',
];

/** Always visible day 1 — hero loop + core study path */
export const CORE_FEATURE_ROUTES = [
  '/',
  '/mission',
  '/study',
  '/exam',
  '/intel',
  '/knowledge',
  '/agent',
  '/cheatsheet',
  '/career',
  '/ops',
  '/settings',
  '/help',
  '/privacy',
  '/playbooks',
  '/cram',
  '/knowledge/visual',
] as const;

export const FEATURE_ROUTE_MAP: Record<GatedFeatureId, string[]> = {
  'team-packs': ['/packs'],
  'content-studio': ['/studio'],
  donate: ['/donate', '/donate/success', '/donate/cancel'],
  'feature-request': ['/feature-request'],
  'my-updates': ['/my-updates'],
  'bug-reports': ['/support'],
  'osint-arsenal': ['/osint'],
  'scenario-lab': ['/scenarios'],
};

export const SHOW_ALL_TOOLS_KEY = 'aegis-show-all-tools';
export const FIRST_VISIT_KEY = 'aegis-first-visit';
export const MISSION_NUDGE_DISMISSED_KEY = 'aegis-mission-nudge-dismissed';

const UNLOCK_MISSION_COUNT = 3;
const UNLOCK_DAYS = 7;

export function ensureFirstVisitRecorded(): void {
  if (!localStorage.getItem(FIRST_VISIT_KEY)) {
    localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
  }
}

export function getDaysSinceFirstVisit(): number {
  ensureFirstVisitRecorded();
  const raw = localStorage.getItem(FIRST_VISIT_KEY);
  if (!raw) return 0;
  const ms = Date.now() - new Date(raw).getTime();
  return Math.floor(ms / 86_400_000);
}

export function isWithinFirstWeek(): boolean {
  return getDaysSinceFirstVisit() < UNLOCK_DAYS;
}

export function getShowAllToolsOverride(): boolean {
  return localStorage.getItem(SHOW_ALL_TOOLS_KEY) === 'true';
}

export function setShowAllToolsOverride(enabled: boolean): void {
  localStorage.setItem(SHOW_ALL_TOOLS_KEY, enabled ? 'true' : 'false');
}

export function getTotalMissionCount(): number {
  const snap = loadProgress();
  return Object.values(snap.byCert).reduce(
    (sum, slice) => sum + (slice.missionLog?.length ?? 0),
    0,
  );
}

export function isFullCatalogUnlocked(): boolean {
  if (getShowAllToolsOverride()) return true;
  if (getTotalMissionCount() >= UNLOCK_MISSION_COUNT) return true;
  if (getDaysSinceFirstVisit() >= UNLOCK_DAYS) return true;
  return false;
}

export function getUnlockProgress(): {
  missions: number;
  missionsNeeded: number;
  days: number;
  daysNeeded: number;
} {
  return {
    missions: getTotalMissionCount(),
    missionsNeeded: UNLOCK_MISSION_COUNT,
    days: getDaysSinceFirstVisit(),
    daysNeeded: UNLOCK_DAYS,
  };
}

export function getUnlockedFeatures(): Set<GatedFeatureId> {
  if (isFullCatalogUnlocked()) return new Set(PRO_FEATURES);
  return new Set();
}

export function isFeatureUnlocked(featureId: GatedFeatureId): boolean {
  return getUnlockedFeatures().has(featureId);
}

export function isRouteGated(pathname: string): boolean {
  if (isFullCatalogUnlocked()) return false;
  for (const featureId of PRO_FEATURES) {
    const routes = FEATURE_ROUTE_MAP[featureId];
    if (routes.some(r => r === pathname || (r !== '/' && pathname.startsWith(r)))) {
      return true;
    }
  }
  return false;
}

export function getFeatureIdForRoute(pathname: string): GatedFeatureId | null {
  for (const featureId of PRO_FEATURES) {
    const routes = FEATURE_ROUTE_MAP[featureId];
    if (routes.some(r => r === pathname || (r !== '/' && pathname.startsWith(r)))) {
      return featureId;
    }
  }
  return null;
}

export function hasCompletedMissionToday(certId: string): boolean {
  const snap = loadProgress();
  const log = snap.byCert[certId]?.missionLog ?? [];
  const today = new Date().toDateString();
  return log.some(m => new Date(m.completedAt).toDateString() === today);
}

export function shouldDefaultToMission(certId: string, readiness: number): boolean {
  if (sessionStorage.getItem(MISSION_NUDGE_DISMISSED_KEY) === 'true') return false;
  if (hasCompletedMissionToday(certId)) return false;
  return readiness < 30 || isWithinFirstWeek();
}

export function dismissMissionNudge(): void {
  sessionStorage.setItem(MISSION_NUDGE_DISMISSED_KEY, 'true');
}
