/**
 * Weekly AAISM Intel Digest — aggregates top RSS headlines + community heat topics.
 */

import { fetchLiveIntelFeed, type IntelFeedItem } from './rssFeedService';
import { TOPIC_HEAT_MAP } from '../data/communityIntelligence';

export interface WeeklyIntelDigest {
  generatedAt: string;
  weekLabel: string;
  topHeadlines: Array<{ title: string; source: string; summary: string; relevanceScore?: number }>;
  hotTopics: Array<{ topic: string; domain: number; heat: number; trend: string }>;
  summaryBullets: string[];
  studioPrompt: string;
}

function getWeekLabel(date = new Date()): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}, ${date.getFullYear()}`;
}

function pickTopHeadlines(items: IntelFeedItem[], limit = 5): WeeklyIntelDigest['topHeadlines'] {
  return items
    .filter(i => i.isLive)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, limit)
    .map(i => ({
      title: i.title,
      source: i.source,
      summary: i.summary,
      relevanceScore: i.relevanceScore,
    }));
}

function pickHotTopics(limit = 5): WeeklyIntelDigest['hotTopics'] {
  return TOPIC_HEAT_MAP.slice(0, limit).map(t => ({
    topic: t.topic,
    domain: t.domain,
    heat: t.heat,
    trend: t.trend,
  }));
}

function buildSummaryBullets(headlines: WeeklyIntelDigest['topHeadlines'], hotTopics: WeeklyIntelDigest['hotTopics']): string[] {
  const bullets: string[] = [];
  if (headlines.length > 0) {
    bullets.push(`Top RSS intel: ${headlines.slice(0, 2).map(h => h.title).join('; ')}`);
  }
  if (hotTopics.length > 0) {
    bullets.push(`Exam heat rising: ${hotTopics.filter(t => t.trend === 'rising').slice(0, 2).map(t => t.topic).join(', ') || hotTopics[0].topic}`);
  }
  bullets.push('Connect headlines to AAISM domains — governance, risk, development, and operations.');
  return bullets;
}

function buildStudioPrompt(digest: Omit<WeeklyIntelDigest, 'studioPrompt'>): string {
  const headlineBlock = digest.topHeadlines
    .map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.summary}`)
    .join('\n\n');

  const heatBlock = digest.hotTopics
    .map(t => `• D${t.domain} ${t.topic} — heat ${t.heat} (${t.trend})`)
    .join('\n');

  return `Weekly AAISM Intel Digest (${digest.weekLabel})

Write a practitioner-facing weekly digest post covering:

## Top RSS Headlines
${headlineBlock || 'No live RSS this week — focus on exam heat topics below.'}

## Community Exam Heat
${heatBlock}

## Tone & structure
- Open with a 1-sentence hook on why this week matters for AAISM candidates
- 3–5 bullet insights linking news → exam domains
- One actionable study tip
- Soft CTA to share or discuss
- Hashtags: #AAISM #AISecurity #ResponsibleAI

Keep under 1500 words. Professional, concise, no fluff.`;
}

export async function buildWeeklyIntelDigest(forceRefresh = false): Promise<WeeklyIntelDigest> {
  const feed = await fetchLiveIntelFeed({ force: forceRefresh });
  const topHeadlines = pickTopHeadlines(feed.items);
  const hotTopics = pickHotTopics();
  const generatedAt = new Date().toISOString();
  const weekLabel = getWeekLabel();

  const partial = {
    generatedAt,
    weekLabel,
    topHeadlines,
    hotTopics,
    summaryBullets: buildSummaryBullets(topHeadlines, hotTopics),
  };

  return {
    ...partial,
    studioPrompt: buildStudioPrompt(partial),
  };
}

/** URL to pre-fill Content Studio with the weekly digest */
export function getDigestStudioUrl(digest?: WeeklyIntelDigest): string {
  const prompt = digest?.studioPrompt ?? 'Weekly AAISM Intel Digest — aggregate top RSS and exam heat topics.';
  const params = new URLSearchParams({
    prompt,
    format: 'blog-intro',
    topic: 'Weekly AAISM Intel Digest',
  });
  return `/studio?${params.toString()}`;
}

/** Mission log entry for Command Center strip */
export function getDigestMissionLogEntry(digest: WeeklyIntelDigest): {
  id: string;
  time: string;
  tag: string;
  message: string;
  link: string;
} {
  return {
    id: 'weekly-intel-digest',
    time: new Date(digest.generatedAt).toLocaleDateString(),
    tag: 'DIGEST',
    message: `Weekly Intel Digest ready — ${digest.topHeadlines.length} headlines, ${digest.hotTopics.length} hot topics`,
    link: getDigestStudioUrl(digest),
  };
}

export const DIGEST_CACHE_KEY = 'aaism-weekly-digest-cache';

export function cacheDigest(digest: WeeklyIntelDigest): void {
  try {
    localStorage.setItem(DIGEST_CACHE_KEY, JSON.stringify(digest));
  } catch {
    // ignore
  }
}

export function loadCachedDigest(): WeeklyIntelDigest | null {
  try {
    const raw = localStorage.getItem(DIGEST_CACHE_KEY);
    if (raw) return JSON.parse(raw) as WeeklyIntelDigest;
  } catch {
    // ignore
  }
  return null;
}
