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
    id: 'rel-2026-06-13',
    version: '1.4.0',
    title: 'Content Studio & Gemma 4 clarity',
    description:
      'New /studio route generates LinkedIn posts, YouTube scripts, threads, and READMEs from study intel. Gemma 4 FAQ explains Ollama availability with auto-detect for new tags.',
    shippedAt: '2026-06-13',
    tags: ['content-studio', 'ollama', 'gemma4'],
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
