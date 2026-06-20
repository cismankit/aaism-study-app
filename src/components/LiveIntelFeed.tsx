import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, ExternalLink, RefreshCw, AlertCircle, Radio,
  X, ChevronRight, PenLine, Sparkles, Loader2, CheckCircle,
} from 'lucide-react';
import SlidePanel from './SlidePanel';
import {
  fetchLiveIntelFeed,
  formatTimeAgo,
  formatPublishedDate,
  getCategoryColor,
  type IntelFeedItem,
} from '../services/rssFeedService';
import { RSS_SOURCES } from '../data/rssSources';
import { generateQuestionsFromIntel } from '../services/intelToQuestionsService';
import ConfidenceBadge from './ConfidenceBadge';
import { buildRssItemConfidence } from '../services/confidenceService';

interface LiveIntelFeedProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  compact?: boolean;
}

export default function LiveIntelFeed({ onClose, showCloseButton, compact }: LiveIntelFeedProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<IntelFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<IntelFeedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingQs, setGeneratingQs] = useState(false);
  const [genResult, setGenResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadFeed = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchLiveIntelFeed({ force });
      setItems(result.items);
      setFetchedAt(result.fetchedAt);
      setActiveSources(result.activeSources);
      setOffline(result.offline);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feeds');
      setOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  function handleItemClick(item: IntelFeedItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (item.isLive && item.link.startsWith('http')) {
      setSelectedItem(item);
    } else if (item.link.startsWith('/')) {
      navigate(item.link);
      onClose?.();
    } else if (item.link.startsWith('http')) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  }

  function handleReadAtSource() {
    if (!selectedItem?.link) return;
    window.open(selectedItem.link, '_blank', 'noopener,noreferrer');
  }

  async function handleGenerateQuestions() {
    if (!selectedItem || generatingQs) return;
    setGeneratingQs(true);
    setGenResult(null);
    try {
      const result = await generateQuestionsFromIntel(selectedItem);
      if (result.success) {
        setGenResult({
          success: true,
          message: `${result.leads.length} exam questions added to Agent Leads — review in Agent Discovery.`,
        });
      } else {
        setGenResult({ success: false, message: result.error ?? 'Generation failed' });
      }
    } catch (e) {
      setGenResult({
        success: false,
        message: e instanceof Error ? e.message : 'Generation failed',
      });
    } finally {
      setGeneratingQs(false);
    }
  }

  const liveCount = items.filter(i => i.isLive).length;

  return (
    <>
      <div className="h-full flex flex-col relative z-10 pointer-events-auto">
        {/* Header — click to refresh */}
        <button
          type="button"
          onClick={() => loadFeed(true)}
          disabled={refreshing}
          className="w-full px-4 py-3 border-b border-theme flex-shrink-0 hover:bg-theme-muted dark:hover:bg-gray-700/30 transition-colors text-left cursor-pointer"
          title="Click to refresh feed"
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold text-cockpit">Live Intel Feed</span>
            <div className="ml-auto flex items-center gap-2">
              {liveCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">RSS</span>
                </div>
              )}
              <RefreshCw className={`w-3.5 h-3.5 text-cockpit-subtle ${refreshing ? 'animate-spin' : ''}`} />
              {showCloseButton && onClose && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClose(); } }}
                  className="p-1 rounded hover:bg-cockpit-track dark:hover:bg-gray-600 ml-1"
                  aria-label="Close live feed"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
          {fetchedAt && (
            <p className="text-[10px] text-cockpit-subtle mt-1">
              RSS stream · Updated {formatTimeAgo(fetchedAt)} · {liveCount} live articles
            </p>
          )}
        </button>

        {/* Error / offline banner */}
        {(offline || error) && !loading && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {error ?? 'Could not fetch feeds — showing cached/offline intel'}
              </p>
              <button
                type="button"
                onClick={() => loadFeed(true)}
                className="text-[11px] text-amber-800 dark:text-amber-300 underline mt-0.5"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Feed list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <FeedSkeleton count={compact ? 4 : 6} />
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-theme-muted">
              No intel items available. Try refreshing.
            </div>
          ) : (
            items.map(item => (
              <FeedItemRow
                key={item.id}
                item={item}
                onClick={(e) => handleItemClick(item, e)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-4 py-2.5 border-t border-theme flex-shrink-0 bg-theme-muted/80 dark:bg-gray-900/50">
            <p className="text-[10px] text-cockpit-muted dark:text-theme-faint mb-1.5">
              {fetchedAt
                ? `Last updated ${formatTimeAgo(fetchedAt)} · ${activeSources.length || RSS_SOURCES.length} sources`
                : `${RSS_SOURCES.length} sources configured`}
            </p>
            <div className="flex flex-wrap gap-1">
              {(activeSources.length > 0 ? activeSources : RSS_SOURCES.map(s => s.name)).slice(0, compact ? 4 : 8).map(name => (
                <span
                  key={name}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-cockpit-track text-cockpit-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <SlidePanel
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title ?? ''}
        subtitle={selectedItem ? `${selectedItem.source} · ${formatPublishedDate(selectedItem.publishedAt)}` : undefined}
        width="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(selectedItem.category)}`}>
                {selectedItem.category}
              </span>
              {selectedItem.isLive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3" /> LIVE RSS
                </span>
              )}
              <ConfidenceBadge
                confidence={buildRssItemConfidence({
                  title: selectedItem.title,
                  source: selectedItem.source,
                  sourceUrl: selectedItem.sourceUrl,
                  link: selectedItem.link,
                  isLive: selectedItem.isLive,
                })}
                compact
              />
              {selectedItem.relevanceScore != null && selectedItem.relevanceScore > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cockpit-track text-cockpit-muted">
                  AAISM relevance {selectedItem.relevanceScore}
                </span>
              )}
            </div>
            <p className="text-sm text-theme-secondary leading-relaxed">
              {selectedItem.summary}
            </p>
            <div className="text-[11px] text-cockpit-muted space-y-1">
              <p>
                <span className="font-medium text-cockpit">Published:</span>{' '}
                {formatPublishedDate(selectedItem.publishedAt)} ({formatTimeAgo(selectedItem.publishedAt)})
              </p>
              {selectedItem.link.startsWith('http') && (
                <p className="truncate">
                  <span className="font-medium text-cockpit">Source URL:</span>{' '}
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {selectedItem.link}
                  </a>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generatingQs}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {generatingQs ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate 3 exam Qs</>
                )}
              </button>
              <button
                type="button"
                onClick={handleReadAtSource}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Read at source
              </button>
              <Link
                to={`/studio?headline=${encodeURIComponent(selectedItem.title)}&source=${encodeURIComponent(selectedItem.source)}`}
                onClick={() => onClose?.()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Create post from this
              </Link>
              {genResult && (
                <div className={`w-full flex items-start gap-2 text-xs p-2 rounded-lg ${
                  genResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {genResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{genResult.message}</span>
                  {genResult.success && (
                    <Link to="/agent" onClick={() => onClose?.()} className="underline ml-auto shrink-0">View leads →</Link>
                  )}
                </div>
              )}
              <a
                href={selectedItem.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-theme text-sm hover:bg-theme-muted dark:hover:bg-gray-700 transition-colors"
              >
                {selectedItem.source}
              </a>
            </div>
          </div>
        )}
      </SlidePanel>
    </>
  );
}

function FeedItemRow({
  item,
  onClick,
}: {
  item: IntelFeedItem;
  onClick: (e: React.MouseEvent) => void;
}) {
  const isExternal = item.link.startsWith('http');
  const confidence = buildRssItemConfidence({
    title: item.title,
    source: item.source,
    sourceUrl: item.sourceUrl,
    link: item.link,
    isLive: item.isLive,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b border-theme/50 hover:bg-theme-muted dark:hover:bg-gray-700/30 transition-colors group cursor-pointer relative z-10"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cockpit-track text-cockpit-muted">
              {item.source}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
            {item.isLive && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse-dot" />
                LIVE
              </span>
            )}
            <ConfidenceBadge confidence={confidence} compact />
            <span className="text-[10px] text-cockpit-subtle ml-auto flex-shrink-0" title={formatPublishedDate(item.publishedAt)}>
              {formatPublishedDate(item.publishedAt)}
            </span>
          </div>
          <p className="text-xs font-semibold text-cockpit line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.title}
          </p>
          <p className="text-[11px] text-cockpit-muted line-clamp-1 mt-0.5">
            {item.summary}
          </p>
          {isExternal && (
            <p className="text-[9px] text-cockpit-subtle truncate mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {item.link}
            </p>
          )}
        </div>
        <div className="mt-1 flex-shrink-0 text-cockpit-subtle dark:text-cockpit-muted group-hover:text-emerald-500 transition-colors">
          {isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </div>
    </button>
  );
}

function FeedSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-theme/50 animate-pulse">
          <div className="flex gap-2 mb-2">
            <div className="h-3 w-16 bg-cockpit-track rounded" />
            <div className="h-3 w-12 bg-cockpit-track rounded" />
          </div>
          <div className="h-3.5 w-full bg-cockpit-track rounded mb-1.5" />
          <div className="h-3 w-4/5 bg-cockpit-track rounded" />
        </div>
      ))}
    </>
  );
}

/** Full-page feed panel for Intel Hub tab */
export function LiveRssFeedPanel() {
  const [items, setItems] = useState<IntelFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<IntelFeedItem | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [generatingQs, setGeneratingQs] = useState(false);
  const [genResult, setGenResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetchLiveIntelFeed({ force });
      setItems(result.items);
      setFetchedAt(result.fetchedAt);
      setOffline(result.offline);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const liveItems = items.filter(i => i.isLive);
  const sources = [...new Set(liveItems.map(i => i.source))];

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
    return true;
  });

  const categories = ['all', 'threat', 'governance', 'exam', 'community', 'framework'] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-cockpit flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500" />
            Live RSS Intelligence
          </h2>
          <p className="text-sm text-cockpit-muted mt-0.5">
            Real-time security &amp; AI governance news from {RSS_SOURCES.length} curated sources
            {fetchedAt && ` · Updated ${formatTimeAgo(fetchedAt)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {offline && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Could not fetch feeds — showing cached/offline intel
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-cockpit-track dark:bg-gray-800 text-cockpit-muted hover:bg-cockpit-track dark:hover:bg-gray-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`text-[11px] px-2 py-1 rounded-full ${sourceFilter === 'all' ? 'bg-gray-800 dark:bg-cockpit-track text-white dark:text-cockpit' : 'bg-cockpit-track dark:bg-gray-800 text-cockpit-muted'}`}
          >
            All sources
          </button>
          {sources.map(src => (
            <button
              key={src}
              type="button"
              onClick={() => setSourceFilter(src)}
              className={`text-[11px] px-2 py-1 rounded-full ${sourceFilter === src ? 'bg-gray-800 dark:bg-cockpit-track text-white dark:text-cockpit' : 'bg-cockpit-track dark:bg-gray-800 text-cockpit-muted'}`}
            >
              {src}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-theme overflow-hidden bg-theme-elevated">
        {loading ? (
          <FeedSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">No items match filters.</div>
        ) : (
          filtered.map(item => (
            <FeedItemRow
              key={item.id}
              item={item}
              onClick={(e) => {
                e.preventDefault();
                if (item.isLive && item.link.startsWith('http')) {
                  setSelectedItem(item);
                } else if (item.link.startsWith('http')) {
                  window.open(item.link, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          ))
        )}
      </div>

      <SlidePanel
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title ?? ''}
        subtitle={selectedItem ? `${selectedItem.source} · ${formatPublishedDate(selectedItem.publishedAt)}` : undefined}
      >
        {selectedItem && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{selectedItem.summary}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={generatingQs}
                onClick={async () => {
                  setGeneratingQs(true);
                  setGenResult(null);
                  try {
                    const result = await generateQuestionsFromIntel(selectedItem);
                    setGenResult({
                      success: result.success,
                      message: result.success
                        ? `${result.leads.length} exam Qs added to Agent Leads`
                        : (result.error ?? 'Generation failed'),
                    });
                  } finally {
                    setGeneratingQs(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {generatingQs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate 3 exam Qs
              </button>
              <button
                type="button"
                onClick={() => window.open(selectedItem.link, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" /> Read at source
              </button>
              <Link
                to={`/studio?headline=${encodeURIComponent(selectedItem.title)}&source=${encodeURIComponent(selectedItem.source)}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium"
              >
                <PenLine className="w-4 h-4" /> Create post from this
              </Link>
              {genResult && (
                <p className={`w-full text-xs ${genResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {genResult.message}
                  {genResult.success && <Link to="/agent" className="underline ml-2">View leads →</Link>}
                </p>
              )}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
