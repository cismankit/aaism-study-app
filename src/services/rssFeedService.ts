import { RSS_SOURCES, type RssSource, type RssSourceCategory } from '../data/rssSources';
import { TOPIC_HEAT_MAP, TRAP_PATTERNS, COMMUNITY_INSIGHTS } from '../data/communityIntelligence';
import { getPipelineStats } from './agentService';
import { loadInsights } from './intelligenceAgent';

export interface IntelFeedItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  link: string;
  publishedAt: string;
  category: RssSourceCategory;
  relevanceScore?: number;
  isLive: boolean;
}

const CACHE_KEY = 'aaism_rss_cache';
const CACHE_TTL_MS = 30 * 60 * 1000;

const AAISM_KEYWORDS: Array<{ term: string; weight: number }> = [
  { term: 'artificial intelligence', weight: 3 },
  { term: 'machine learning', weight: 3 },
  { term: 'llm', weight: 4 },
  { term: 'large language model', weight: 4 },
  { term: 'generative ai', weight: 4 },
  { term: 'ai security', weight: 5 },
  { term: 'ai governance', weight: 5 },
  { term: 'model poisoning', weight: 5 },
  { term: 'adversarial', weight: 4 },
  { term: 'prompt injection', weight: 5 },
  { term: 'data poisoning', weight: 5 },
  { term: 'mlops', weight: 4 },
  { term: 'eu ai act', weight: 5 },
  { term: 'nist', weight: 4 },
  { term: 'iso 42001', weight: 5 },
  { term: 'ai rmf', weight: 5 },
  { term: 'risk management', weight: 3 },
  { term: 'owasp', weight: 4 },
  { term: 'supply chain', weight: 3 },
  { term: 'zero trust', weight: 3 },
  { term: 'isaca', weight: 4 },
  { term: 'aaism', weight: 5 },
  { term: 'cism', weight: 3 },
  { term: 'governance', weight: 3 },
  { term: 'compliance', weight: 2 },
  { term: 'privacy', weight: 2 },
  { term: 'ransomware', weight: 2 },
  { term: 'vulnerability', weight: 2 },
  { term: 'breach', weight: 2 },
];

interface FeedCache {
  fetchedAt: string;
  items: IntelFeedItem[];
}

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
}

interface Rss2JsonResponse {
  status: string;
  items?: Rss2JsonItem[];
  message?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(re);
  return match ? decodeXmlEntities(match[1]) : '';
}

function parseRssXml(xml: string, source: RssSource): IntelFeedItem[] {
  const items: IntelFeedItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  for (const block of blocks.slice(0, 8)) {
    const title = extractTag(block, 'title');
    if (!title) continue;

    let link = extractTag(block, 'link');
    if (!link) {
      const linkMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      link = linkMatch?.[1] ?? source.homepage;
    }

    const pubDate =
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated') ||
      new Date().toISOString();

    const description =
      extractTag(block, 'description') ||
      extractTag(block, 'summary') ||
      extractTag(block, 'content');

    const summary = stripHtml(description).slice(0, 220) || title;
    const publishedAt = normalizeDate(pubDate);

    items.push({
      id: `${source.id}-${hashString(link + title)}`,
      title,
      summary,
      source: source.name,
      sourceUrl: source.homepage,
      link,
      publishedAt,
      category: source.category,
      relevanceScore: scoreRelevance(`${title} ${summary}`),
      isLive: true,
    });
  }

  return items;
}

function normalizeDate(raw: string): string {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function scoreRelevance(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const { term, weight } of AAISM_KEYWORDS) {
    if (lower.includes(term)) score += weight;
  }
  return score;
}

function readCache(): FeedCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as FeedCache;
    if (Date.now() - new Date(cache.fetchedAt).getTime() > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(items: IntelFeedItem[]): void {
  try {
    const cache: FeedCache = { fetchedAt: new Date().toISOString(), items };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota or private mode — ignore
  }
}

function readStaleCache(): IntelFeedItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as FeedCache).items ?? [];
  } catch {
    return [];
  }
}

async function fetchViaRss2Json(source: RssSource): Promise<IntelFeedItem[]> {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`);

  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== 'ok' || !data.items?.length) return [];

  return data.items.slice(0, 8).map(item => {
    const title = item.title?.trim() ?? 'Untitled';
    const summary = stripHtml(item.description ?? item.content ?? '').slice(0, 220) || title;
    const link = item.link ?? source.homepage;
    const publishedAt = normalizeDate(item.pubDate ?? new Date().toISOString());

    return {
      id: `${source.id}-${hashString(link + title)}`,
      title,
      summary,
      source: source.name,
      sourceUrl: source.homepage,
      link,
      publishedAt,
      category: source.category,
      relevanceScore: scoreRelevance(`${title} ${summary}`),
      isLive: true,
    };
  });
}

async function fetchViaAllOrigins(source: RssSource): Promise<IntelFeedItem[]> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`allorigins HTTP ${res.status}`);

  const data = (await res.json()) as { contents?: string };
  let contents = data.contents ?? '';
  if (!contents) return [];

  if (contents.startsWith('data:')) {
    const base64 = contents.split('base64,')[1];
    if (base64) contents = atob(base64);
  }

  return parseRssXml(contents, source);
}

async function fetchSourceFeed(source: RssSource): Promise<IntelFeedItem[]> {
  try {
    const viaJson = await fetchViaRss2Json(source);
    if (viaJson.length > 0) return viaJson;
  } catch {
    // fall through
  }

  try {
    return await fetchViaAllOrigins(source);
  } catch {
    return [];
  }
}

export function buildStaticIntelItems(): IntelFeedItem[] {
  const items: IntelFeedItem[] = [];
  const now = new Date().toISOString();

  TOPIC_HEAT_MAP.filter(t => t.trend === 'rising' && t.heat >= 85).forEach(topic => {
    items.push({
      id: `hot-${topic.topic}`,
      title: topic.topic,
      summary: `Heat ${topic.heat}/100 — ${topic.communityNotes.slice(0, 120)}`,
      source: 'Community Intel',
      sourceUrl: '/intel',
      link: '/intel',
      publishedAt: now,
      category: 'exam',
      relevanceScore: topic.heat,
      isLive: false,
    });
  });

  TRAP_PATTERNS.filter(t => t.frequency === 'very_common').slice(0, 3).forEach(trap => {
    items.push({
      id: `trap-${trap.id}`,
      title: trap.name,
      summary: trap.description.slice(0, 160),
      source: 'Trap Patterns',
      sourceUrl: '/intel',
      link: '/intel',
      publishedAt: now,
      category: 'exam',
      relevanceScore: 90,
      isLive: false,
    });
  });

  const stats = getPipelineStats();
  if (stats.totalLeads > 0) {
    items.push({
      id: 'agent-leads',
      title: `${stats.pendingCount} leads pending review`,
      summary: `${stats.approvedCount} approved, ${stats.totalQuestions} total questions in bank`,
      source: 'Agent Discovery',
      sourceUrl: '/agent',
      link: '/agent',
      publishedAt: stats.lastRunAt ?? now,
      category: 'community',
      relevanceScore: 50,
      isLive: false,
    });
  }

  loadInsights().slice(0, 3).forEach(insight => {
    items.push({
      id: insight.id,
      title: insight.title,
      summary: insight.content.slice(0, 160),
      source: 'Research Agent',
      sourceUrl: '/intel',
      link: '/intel',
      publishedAt: insight.createdAt,
      category: 'exam',
      relevanceScore: 60,
      isLive: false,
    });
  });

  COMMUNITY_INSIGHTS.filter(i => i.upvotes >= 200).slice(0, 3).forEach(ci => {
    items.push({
      id: ci.id,
      title: ci.title,
      summary: ci.content.slice(0, 160),
      source: 'Community',
      sourceUrl: '/intel',
      link: '/intel',
      publishedAt: now,
      category: ci.category === 'trap_alert' ? 'exam' : 'community',
      relevanceScore: Math.min(ci.upvotes / 10, 100),
      isLive: false,
    });
  });

  return items;
}

function mergeAndSort(liveItems: IntelFeedItem[], staticItems: IntelFeedItem[]): IntelFeedItem[] {
  const seen = new Set<string>();
  const merged: IntelFeedItem[] = [];

  for (const item of [...liveItems, ...staticItems]) {
    const key = item.link + item.title;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.sort((a, b) => {
    const liveBoost = (a.isLive ? 1000 : 0) - (b.isLive ? 1000 : 0);
    if (liveBoost !== 0) return -liveBoost;
    const scoreDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export interface FetchLiveIntelResult {
  items: IntelFeedItem[];
  fetchedAt: string;
  sourceCount: number;
  fromCache: boolean;
  offline: boolean;
  activeSources: string[];
}

export async function fetchLiveIntelFeed(options?: { force?: boolean }): Promise<FetchLiveIntelResult> {
  const staticItems = buildStaticIntelItems();

  if (!options?.force) {
    const cached = readCache();
    if (cached) {
      return {
        items: mergeAndSort(cached.items, staticItems),
        fetchedAt: cached.fetchedAt,
        sourceCount: RSS_SOURCES.length,
        fromCache: true,
        offline: false,
        activeSources: [...new Set(cached.items.map(i => i.source))],
      };
    }
  }

  const results = await Promise.allSettled(RSS_SOURCES.map(fetchSourceFeed));
  const liveItems: IntelFeedItem[] = [];
  const activeSources: string[] = [];

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      liveItems.push(...result.value);
      activeSources.push(RSS_SOURCES[idx].name);
    }
  });

  const fetchedAt = new Date().toISOString();
  let offline = false;

  if (liveItems.length > 0) {
    writeCache(liveItems);
  } else {
    const stale = readStaleCache();
    if (stale.length > 0) {
      liveItems.push(...stale);
      offline = true;
    } else {
      offline = true;
    }
  }

  return {
    items: mergeAndSort(liveItems, staticItems),
    fetchedAt,
    sourceCount: RSS_SOURCES.length,
    fromCache: false,
    offline,
    activeSources: [...new Set(activeSources)],
  };
}

export function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(diff)) return 'unknown';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function getCategoryColor(category: RssSourceCategory): string {
  const map: Record<RssSourceCategory, string> = {
    threat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    governance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    community: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    framework: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return map[category];
}
