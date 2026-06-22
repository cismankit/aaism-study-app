export interface ReleaseEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  shippedAt: string;
  featureRequestIds?: string[];
  tags?: string[];
}

/** Versions align with package.json — no fictional future semver */
export const releaseFeed: ReleaseEntry[] = [
  {
    id: 'rel-2026-06-20',
    version: '1.0.0',
    title: 'Aegis MVP — mission loop & multi-cert beta',
    description:
      'Mission-first daily loop, Command Center readiness HUD, practice + timed exam, Intel Hub, Ops Lab, and cert switcher with AAISM depth plus preview tracks.',
    shippedAt: '2026-06-20',
    tags: ['mission', 'command-center', 'mvp', 'build-966fb81'],
  },
];

export const LAST_SEEN_RELEASE_KEY = 'aaism_last_seen_release';
export const WHATS_NEW_BANNER_DISMISSED_KEY = 'aaism_whats_new_banner_dismissed';

export function hasUnseenReleases(): boolean {
  const lastSeen = localStorage.getItem(LAST_SEEN_RELEASE_KEY);
  return getNewReleasesSince(lastSeen).length > 0;
}

export function isWhatsNewBannerDismissedForLatest(): boolean {
  const dismissed = localStorage.getItem(WHATS_NEW_BANNER_DISMISSED_KEY);
  const latest = getLatestRelease();
  return !!latest && dismissed === latest.id;
}

export function getLatestRelease(): ReleaseEntry | null {
  if (releaseFeed.length === 0) return null;
  return releaseFeed.reduce((latest, entry) =>
    entry.shippedAt > latest.shippedAt ? entry : latest,
  );
}

export const LAST_SEEN_BUILD_KEY = 'aaism_last_seen_build';

export function getReleasesSinceBuild(buildHash: string): ReleaseEntry[] {
  const idx = releaseFeed.findIndex(r => r.tags?.includes(`build-${buildHash}`));
  if (idx === -1) {
    return releaseFeed.slice(-3);
  }
  return releaseFeed.slice(idx + 1);
}

export function getNewReleasesSince(lastSeenId: string | null): ReleaseEntry[] {
  if (!lastSeenId) return releaseFeed;
  const idx = releaseFeed.findIndex(r => r.id === lastSeenId);
  if (idx === -1) return releaseFeed;
  return releaseFeed.slice(idx + 1);
}

export function getReleasesForRequest(
  requestId: string,
  requestTags?: string[],
): ReleaseEntry[] {
  const tags = requestTags ?? [];
  return releaseFeed.filter(
    r =>
      r.featureRequestIds?.includes(requestId) ||
      r.tags?.some(t => tags.includes(t)),
  );
}
