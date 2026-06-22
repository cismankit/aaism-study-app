export interface ReleaseEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  shippedAt: string;
  featureRequestIds?: string[];
  tags?: string[];
}

export const releaseFeed: ReleaseEntry[] = [
  {
    id: 'rel-2026-06-01',
    version: '1.2.0',
    title: 'Regional donation tabs & support hub',
    description:
      'Donate page now supports India (UPI/Razorpay), US (PayPal/Stripe), Europe (Wise/SEPA), and global crypto. Support page links to GitHub Issues.',
    shippedAt: '2026-06-01',
    tags: ['donations', 'support'],
  },
  {
    id: 'rel-2026-06-10',
    version: '1.3.0',
    title: 'Feature request flow with OTA updates',
    description:
      'Submit feature ideas in-app, pay by tier, and track status on My Updates. Shipped features appear in your personal release feed.',
    shippedAt: '2026-06-10',
    tags: ['feature-request', 'ota', 'payments'],
    featureRequestIds: ['demo-boost-001'],
  },
  {
    id: 'rel-2026-06-12',
    version: '1.3.1',
    title: 'Command Center "What\'s New" banner',
    description:
      'See platform-wide changelog highlights when new releases ship. Dismissible banner tracks last-seen release in localStorage.',
    shippedAt: '2026-06-12',
    tags: ['command-center', 'changelog'],
  },
  {
    id: 'rel-2026-06-20',
    version: '1.5.0',
    title: 'Differentiated visuals & mission intel traps',
    description:
      'Three.js orbital hero stays on Mission only — Command gets 2D readiness + 7-day sparkline, Practice gets domain strip, Exam gets proof ring. Cert-specific orb palettes, agent council live status, goal picker, and Intel Hub traps feed mission intel step.',
    shippedAt: '2026-06-20',
    tags: ['mission', 'command-center', 'visual', 'build-966fb81'],
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
