import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Crosshair, Search, ChevronDown, ChevronUp, Star, ExternalLink,
  Shield, Filter, Rss, AlertCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import SlidePanel from '../components/SlidePanel';
import {
  OSINT_SOURCES,
  OSINT_CATEGORIES,
  OSINT_ATTRIBUTION,
  BADGE_LEGEND,
  getHighValueSources,
  getSourcesByCategory,
  searchSources,
  type OsintSource,
  type OsintBadge,
  type OsintCategoryId,
} from '../data/osintSources';

const BADGE_STYLES: Record<OsintBadge, string> = {
  free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  registration: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  local: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  rss: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const RELEVANCE_LABELS = {
  exam: 'Exam prep',
  org: 'Org practice',
  both: 'Exam + Org',
};

function SourceBadge({ badge }: { badge?: OsintBadge }) {
  if (!badge) return null;
  const meta = BADGE_LEGEND[badge];
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${BADGE_STYLES[badge]}`}
      title={meta.description}
    >
      {meta.abbr}
    </span>
  );
}

function SourceRow({ source, onSelect }: { source: OsintSource; onSelect: (s: OsintSource) => void }) {
  return (
    <button
      onClick={() => onSelect(source)}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-emerald-500 transition-colors truncate flex-1">
        {source.name}
      </span>
      <SourceBadge badge={source.badge} />
      {source.highValue && <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />}
      {source.aaismDomain && (
        <span className="text-[10px] text-gray-400 flex-shrink-0">D{source.aaismDomain}</span>
      )}
    </button>
  );
}

function SourceDetail({ source }: { source: OsintSource }) {
  const isInternal = source.url.startsWith('/');
  const category = OSINT_CATEGORIES.find(c => c.id === source.category);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{source.description}</p>

      <div className="flex flex-wrap gap-2">
        {source.badge && (
          <span className={`text-xs px-2 py-1 rounded-full ${BADGE_STYLES[source.badge]}`}>
            {BADGE_LEGEND[source.badge].label}
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {RELEVANCE_LABELS[source.relevance]}
        </span>
        {source.aaismDomain && (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            Domain {source.aaismDomain}
          </span>
        )}
        {source.pullType === 'rss' && (
          <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
            <Rss className="w-3 h-3" /> Live Feed
          </span>
        )}
      </div>

      {category && (
        <p className="text-xs text-gray-400">
          Category: {category.name}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {source.tags.map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
            {tag}
          </span>
        ))}
      </div>

      {source.opsecNote && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
            <AlertCircle className="w-4 h-4" /> OPSEC / Ethics
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-300">{source.opsecNote}</p>
        </div>
      )}

      {isInternal ? (
        <Link
          to={source.url}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          Open in AAISM →
        </Link>
      ) : (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          Open Tool <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

interface OSINTArsenalProps {
  compact?: boolean;
}

export default function OSINTArsenal({ compact = false }: OSINTArsenalProps) {
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<number | ''>('');
  const [badgeFilter, setBadgeFilter] = useState<OsintBadge | ''>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<OsintCategoryId>>(
    () => new Set(compact ? ['ai_threat_intel'] : OSINT_CATEGORIES.map(c => c.id))
  );
  const [selectedSource, setSelectedSource] = useState<OsintSource | null>(null);

  const filteredSources = useMemo(
    () =>
      searchSources(query, {
        domain: domainFilter || undefined,
        badge: badgeFilter || undefined,
      }),
    [query, domainFilter, badgeFilter]
  );

  const highValueSources = useMemo(() => getHighValueSources(), []);

  function toggleCategory(id: OsintCategoryId) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredByCategory = (catId: OsintCategoryId) =>
    filteredSources.filter(s => s.category === catId);

  return (
    <div className={compact ? 'space-y-4' : 'max-w-7xl mx-auto space-y-6'}>
      {!compact && (
        <PageHeader
          icon={Crosshair}
          iconClassName="text-cyan-500"
          title="OSINT Arsenal"
          subtitle="Curated practitioner-grade intelligence sources for AAISM exam prep and org AI security — tree browser inspired by OSINT Framework."
        />
      )}

      {/* Attribution */}
      <div className="rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
          {OSINT_ATTRIBUTION}
        </p>
      </div>

      {/* Badge legend */}
      <SectionCard title="Badge Legend" icon={Filter} iconClassName="text-gray-400" compact>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(BADGE_LEGEND) as [OsintBadge, typeof BADGE_LEGEND.free][]).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`px-1.5 py-0.5 rounded font-bold ${BADGE_STYLES[key]}`}>{meta.abbr}</span>
              <span>{meta.label} — {meta.description}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* High Value Picks */}
      {!compact && (
        <SectionCard
          title="High Value Picks"
          icon={Star}
          iconClassName="text-amber-500"
          action={<span className="text-[10px] text-gray-400">{highValueSources.length} editor picks</span>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {highValueSources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source)}
                className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 transition-colors bg-gray-50 dark:bg-gray-700/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{source.name}</span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2">{source.description}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sources, tags, descriptions..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value ? Number(e.target.value) : '')}
          className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">All Domains</option>
          <option value="1">D1 Governance</option>
          <option value="2">D2 Risk</option>
          <option value="3">D3 Development</option>
          <option value="4">D4 Operations</option>
        </select>
        <select
          value={badgeFilter}
          onChange={e => setBadgeFilter(e.target.value as OsintBadge | '')}
          className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">All Badges</option>
          {(Object.keys(BADGE_LEGEND) as OsintBadge[]).map(b => (
            <option key={b} value={b}>{BADGE_LEGEND[b].label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400">
        {filteredSources.length} of {OSINT_SOURCES.length} sources
        {query || domainFilter || badgeFilter ? ' matching filters' : ''}
      </p>

      {/* Category tree */}
      <div className="space-y-2">
        {OSINT_CATEGORIES.map(category => {
          const sources = filteredByCategory(category.id);
          if (sources.length === 0 && (query || domainFilter || badgeFilter)) return null;
          const isExpanded = expandedCategories.has(category.id);
          const totalInCategory = getSourcesByCategory(category.id).length;

          return (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {category.name}
                    <span className="text-[10px] font-normal text-gray-400">
                      ({sources.length}{sources.length !== totalInCategory ? ` / ${totalInCategory}` : ''})
                    </span>
                  </h3>
                  {!compact && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{category.description}</p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isExpanded && sources.length > 0 && (
                <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-700 pt-1">
                  {sources.map(source => (
                    <SourceRow key={source.id} source={source} onSelect={setSelectedSource} />
                  ))}
                </div>
              )}

              {isExpanded && sources.length === 0 && (
                <p className="px-4 pb-3 text-xs text-gray-400">No sources match current filters.</p>
              )}
            </div>
          );
        })}
      </div>

      <SlidePanel
        open={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        title={selectedSource?.name ?? ''}
        subtitle={selectedSource ? OSINT_CATEGORIES.find(c => c.id === selectedSource.category)?.name : undefined}
      >
        {selectedSource && <SourceDetail source={selectedSource} />}
      </SlidePanel>
    </div>
  );
}

export function OSINTArsenalPreview() {
  const highValue = getHighValueSources().slice(0, 6);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        {OSINT_SOURCES.length} curated sources across {OSINT_CATEGORIES.length} categories — practitioner-grade intel for AAISM.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {highValue.map(s => (
          s.url.startsWith('/') ? (
            <Link
              key={s.id}
              to={s.url}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <span className="font-medium truncate block">{s.name}</span>
            </Link>
          ) : (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <span className="font-medium truncate block">{s.name}</span>
            </a>
          )
        ))}
      </div>
      <Link
        to="/osint"
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400"
      >
        Open full OSINT Arsenal →
      </Link>
    </div>
  );
}
