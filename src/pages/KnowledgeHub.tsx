import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Eye, Zap, ExternalLink,
  ChevronDown, ChevronUp, Star, Search,
  Layers,
  GitBranch, Github, FileText, Video, Globe, Wrench,
  Lightbulb, Target, Maximize2, X, ArrowRight
} from 'lucide-react';
import {
  VISUAL_RESOURCES, REFERENCE_LINKS, CONCEPT_MAPS,
  CATEGORY_META, type VisualCategory, type VisualResource,
  type ReferenceLink, type ConceptMap
} from '../data/visualKnowledgeData';

// ─── Sub-Components ───

function ImageCard({ resource, onExpand }: { resource: VisualResource; onExpand: (r: VisualResource) => void }) {
  const [imgError, setImgError] = useState(false);
  const meta = CATEGORY_META[resource.category];
  
  const domainColors: Record<string, string> = {
    D1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    D2: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    D3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ALL: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300">
      {/* Image */}
      <div 
        className="relative h-48 bg-gray-100 dark:bg-gray-900 cursor-pointer overflow-hidden"
        onClick={() => onExpand(resource)}
      >
        {!imgError ? (
          <img
            src={resource.imageUrl}
            alt={resource.title}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl">{meta.emoji}</span>
            <span className="text-xs">Click to view source</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(resource); }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 size={14} className="text-white" />
        </button>
        {resource.highYield && (
          <span className="absolute top-2 left-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Star size={10} fill="currentColor" /> HIGH YIELD
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-white">{resource.title}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${domainColors[resource.domain]}`}>
            {resource.domain}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {resource.description}
        </p>

        {resource.examTip && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-2.5">
            <p className="text-xs text-yellow-800 dark:text-yellow-300 flex gap-1.5">
              <Target size={12} className="flex-shrink-0 mt-0.5" />
              <span><strong>Exam Tip:</strong> {resource.examTip}</span>
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {tag}
            </span>
          ))}
          {resource.tags.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
              +{resource.tags.length - 4}
            </span>
          )}
        </div>

        {/* Source Link */}
        <a
          href={resource.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2"
        >
          <ExternalLink size={12} />
          {resource.sourceName}
        </a>
      </div>
    </div>
  );
}

function ConceptMapCard({ map }: { map: ConceptMap }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[map.category];
  const relevanceColors = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };

  return (
    <div className={`rounded-xl border ${map.examRelevance === 'critical' ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xl">{meta.emoji}</span>
        <span className="flex-1 text-sm">{map.title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${relevanceColors[map.examRelevance]}`}>
          {map.examRelevance.toUpperCase()}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          {map.domain}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          {/* ASCII Diagram */}
          <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono leading-relaxed whitespace-pre">
              {map.diagram.trim()}
            </pre>
          </div>
          
          {/* Key Points */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Key Points</h4>
            <ul className="space-y-1.5">
              {map.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <ArrowRight size={12} className="flex-shrink-0 mt-0.5 text-primary-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceLink({ link }: { link: ReferenceLink }) {
  const typeConfig: Record<string, { icon: typeof Github; color: string; label: string }> = {
    github: { icon: Github, color: 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700', label: 'GitHub' },
    official: { icon: Globe, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30', label: 'Official' },
    guide: { icon: BookOpen, color: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30', label: 'Guide' },
    tool: { icon: Wrench, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30', label: 'Tool' },
    video: { icon: Video, color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30', label: 'Video' },
    paper: { icon: FileText, color: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30', label: 'Paper' },
    cheatsheet: { icon: Zap, color: 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30', label: 'Cheat Sheet' },
  };

  const config = typeConfig[link.type] || typeConfig.guide;
  const Icon = config.icon;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
    >
      <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
            {link.title}
          </h4>
          {link.stars && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium whitespace-nowrap">
              {link.stars}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{link.description}</p>
      </div>
      <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

// ─── Image Lightbox Modal ───

function ImageLightbox({ resource, onClose }: { resource: VisualResource; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const meta = CATEGORY_META[resource.category];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
          <X size={18} />
        </button>

        {/* Image */}
        <div className="bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center min-h-[300px] max-h-[60vh]">
          {!imgError ? (
            <img
              src={resource.imageUrl}
              alt={resource.title}
              className="max-w-full max-h-[55vh] object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <span className="text-6xl">{meta.emoji}</span>
              <p className="text-sm">Image not available — visit source below</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[30vh]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{resource.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
          
          {resource.examTip && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex gap-2">
                <Target size={14} className="flex-shrink-0 mt-0.5" />
                <span><strong>Exam Tip:</strong> {resource.examTip}</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>

          <a
            href={resource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            <ExternalLink size={14} />
            View on {resource.sourceName} →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ───

type ViewMode = 'visuals' | 'diagrams' | 'resources';
type DomainFilter = 'ALL' | 'D1' | 'D2' | 'D3';

function FilterBar({
  search, setSearch,
  categoryFilter, setCategoryFilter,
  domainFilter, setDomainFilter,
  viewMode, setViewMode,
  highYieldOnly, setHighYieldOnly,
}: {
  search: string; setSearch: (s: string) => void;
  categoryFilter: VisualCategory | 'all'; setCategoryFilter: (c: VisualCategory | 'all') => void;
  domainFilter: DomainFilter; setDomainFilter: (d: DomainFilter) => void;
  viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
  highYieldOnly: boolean; setHighYieldOnly: (b: boolean) => void;
}) {
  const categories = Object.entries(CATEGORY_META);

  return (
    <div className="space-y-3">
      {/* View Mode Tabs */}
      <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
        {([
          { id: 'visuals' as ViewMode, label: 'Visual Diagrams', icon: Eye, count: VISUAL_RESOURCES.length },
          { id: 'diagrams' as ViewMode, label: 'Concept Maps', icon: GitBranch, count: CONCEPT_MAPS.length },
          { id: 'resources' as ViewMode, label: 'Resources & Tools', icon: Layers, count: REFERENCE_LINKS.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg font-medium transition-all text-sm flex-1 justify-center ${
              viewMode === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              viewMode === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics, frameworks, attacks..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Domain Filter */}
        <div className="flex gap-1">
          {(['ALL', 'D1', 'D2', 'D3'] as DomainFilter[]).map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                domainFilter === d
                  ? d === 'D1' ? 'bg-blue-500 text-white'
                  : d === 'D2' ? 'bg-red-500 text-white'
                  : d === 'D3' ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {d === 'ALL' ? 'All' : d}
            </button>
          ))}
        </div>

        {/* High Yield Toggle */}
        <button
          onClick={() => setHighYieldOnly(!highYieldOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            highYieldOnly
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Star size={12} fill={highYieldOnly ? 'currentColor' : 'none'} />
          High Yield
        </button>
      </div>

      {/* Category Chips */}
      {viewMode === 'visuals' && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>
          {categories.map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key as VisualCategory)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === key
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Resource Type Filter ───

function ResourceTypeFilter({ 
  activeType, setActiveType 
}: { 
  activeType: string; 
  setActiveType: (t: string) => void;
}) {
  const types = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'official', label: 'Official Docs', icon: Globe },
    { id: 'github', label: 'GitHub Repos', icon: Github },
    { id: 'tool', label: 'Interactive Tools', icon: Wrench },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'paper', label: 'Papers', icon: FileText },
    { id: 'cheatsheet', label: 'Cheat Sheets', icon: Zap },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
      {types.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveType(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            activeType === t.id
              ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <t.icon size={12} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Stats Banner ───

function StatsBanner() {
  const highYieldCount = VISUAL_RESOURCES.filter(r => r.highYield).length;
  const criticalMaps = CONCEPT_MAPS.filter(m => m.examRelevance === 'critical').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Visual Diagrams', value: VISUAL_RESOURCES.length, icon: Eye, color: 'from-cyan-500 to-blue-600' },
        { label: 'Concept Maps', value: CONCEPT_MAPS.length, icon: GitBranch, color: 'from-purple-500 to-pink-600' },
        { label: 'Resources & Tools', value: REFERENCE_LINKS.length, icon: Layers, color: 'from-green-500 to-emerald-600' },
        { label: 'High-Yield Items', value: highYieldCount + criticalMaps, icon: Star, color: 'from-yellow-500 to-orange-600' },
      ].map(stat => (
        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
            <stat.icon size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Component ───

export default function KnowledgeHub() {
  const [viewMode, setViewMode] = useState<ViewMode>('visuals');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VisualCategory | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('ALL');
  const [highYieldOnly, setHighYieldOnly] = useState(false);
  const [expandedResource, setExpandedResource] = useState<VisualResource | null>(null);
  const [resourceType, setResourceType] = useState('all');

  const searchLower = search.toLowerCase();

  const filteredVisuals = useMemo(() => {
    return VISUAL_RESOURCES.filter(r => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (domainFilter !== 'ALL' && r.domain !== domainFilter && r.domain !== 'ALL') return false;
      if (highYieldOnly && !r.highYield) return false;
      if (searchLower && !r.title.toLowerCase().includes(searchLower) && 
          !r.description.toLowerCase().includes(searchLower) &&
          !r.tags.some(t => t.toLowerCase().includes(searchLower))) return false;
      return true;
    });
  }, [categoryFilter, domainFilter, highYieldOnly, searchLower]);

  const filteredMaps = useMemo(() => {
    return CONCEPT_MAPS.filter(m => {
      if (domainFilter !== 'ALL' && m.domain !== domainFilter && m.domain !== 'ALL') return false;
      if (highYieldOnly && m.examRelevance !== 'critical') return false;
      if (searchLower && !m.title.toLowerCase().includes(searchLower) &&
          !m.keyPoints.some(p => p.toLowerCase().includes(searchLower))) return false;
      return true;
    });
  }, [domainFilter, highYieldOnly, searchLower]);

  const filteredLinks = useMemo(() => {
    return REFERENCE_LINKS.filter(l => {
      if (resourceType !== 'all' && l.type !== resourceType) return false;
      if (searchLower && !l.title.toLowerCase().includes(searchLower) &&
          !l.description.toLowerCase().includes(searchLower)) return false;
      return true;
    });
  }, [resourceType, searchLower]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          Visual Knowledge Hub
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          One picture is worth a thousand words — master every concept visually
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Curated diagrams, concept maps, GitHub repos, official docs & interactive tools
        </p>
        <Link
          to="/knowledge"
          className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          ← Back to Domain Guides & Learning Paths
        </Link>
      </div>

      {/* Stats */}
      <StatsBanner />

      {/* Filters */}
      <FilterBar
        search={search} setSearch={setSearch}
        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
        domainFilter={domainFilter} setDomainFilter={setDomainFilter}
        viewMode={viewMode} setViewMode={setViewMode}
        highYieldOnly={highYieldOnly} setHighYieldOnly={setHighYieldOnly}
      />

      {/* Content */}
      {viewMode === 'visuals' && (
        <div>
          {filteredVisuals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Eye size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No visuals match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVisuals.map(r => (
                <ImageCard key={r.id} resource={r} onExpand={setExpandedResource} />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'diagrams' && (
        <div className="space-y-3">
          {filteredMaps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <GitBranch size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No concept maps match your filters</p>
            </div>
          ) : (
            filteredMaps.map(m => (
              <ConceptMapCard key={m.id} map={m} />
            ))
          )}
        </div>
      )}

      {viewMode === 'resources' && (
        <div className="space-y-4">
          <ResourceTypeFilter activeType={resourceType} setActiveType={setResourceType} />
          {filteredLinks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Layers size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No resources match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredLinks.map((l, i) => (
                <ResourceLink key={i} link={l} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Reference Footer */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4">
        <h3 className="text-sm font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 mb-3">
          <Lightbulb size={16} />
          Quick Visual Memory Aids
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-blue-600 dark:text-blue-400">NIST AI RMF:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">"GMMM" — Govern (umbrella) → Map → Measure → Manage</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-red-600 dark:text-red-400">EU AI Act Pyramid:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">"UHLM" — Unacceptable → High → Limited → Minimal (top-down)</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-purple-600 dark:text-purple-400">ISO 42001 PDCA:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Plan (6) → Do (7,8) → Check (9) → Act (10) — the ONLY certifiable AI standard</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-orange-600 dark:text-orange-400">Attack Types:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">"PEEB" — Poisoning, Evasion, Extraction, Backdoor (lifecycle order)</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-green-600 dark:text-green-400">PETs:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">"FDHS" — Federated (data local), Differential (add noise), Homomorphic (encrypted compute), Secure MPC</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <strong className="text-yellow-600 dark:text-yellow-400">ISACA Hierarchy:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Governance &gt; Management &gt; Technical — when in doubt, go UP</p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {expandedResource && (
        <ImageLightbox resource={expandedResource} onClose={() => setExpandedResource(null)} />
      )}
    </div>
  );
}
