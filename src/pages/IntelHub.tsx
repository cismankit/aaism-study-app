import { useState, useRef, useEffect } from 'react';
import {
  Radar, Flame, AlertTriangle, Search, Lightbulb,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Play, BookOpen, ExternalLink, Star, Shield, Target,
  Zap, BarChart3, RefreshCw, Trash2, Globe, ChevronRight, PenLine,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SlidePanel from '../components/SlidePanel';
import {
  QUESTION_PATTERNS,
  TRAP_PATTERNS,
  TOPIC_HEAT_MAP,
  FORUM_SOURCES,
} from '../data/communityIntelligence';
import {
  researchExamPatterns,
  discoverTrapPatterns,
  analyzeQuestionPatterns,
  loadInsights,
  clearInsights,
  type IntelligenceInsight,
  type PatternAnalysis,
  type ResearchCallbacks,
} from '../services/intelligenceAgent';
import { loadAIConfig } from '../services/aiService';
import { useNavigate, Link } from 'react-router-dom';
import OSINTArsenal from './OSINTArsenal';

type IntelTab = 'patterns' | 'hot_topics' | 'traps' | 'research' | 'insights' | 'arsenal';

export default function IntelHub() {
  const [activeTab, setActiveTab] = useState<IntelTab>('patterns');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [selectedTrap, setSelectedTrap] = useState<typeof TRAP_PATTERNS[0] | null>(null);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [insights, setInsights] = useState<IntelligenceInsight[]>(loadInsights());
  const [isResearching, setIsResearching] = useState(false);
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchFocus, setResearchFocus] = useState('');
  const [researchDomain, setResearchDomain] = useState<number | undefined>(undefined);
  const [researchType, setResearchType] = useState<'patterns' | 'traps'>('patterns');
  const logEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setAnalysis(analyzeQuestionPatterns());
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [researchLogs]);

  const tabs: Array<{ id: IntelTab; label: string; icon: typeof Radar; description: string }> = [
    { id: 'patterns', label: 'Patterns', icon: Target, description: 'Exam question keywords, strategies, and drill links.' },
    { id: 'hot_topics', label: 'Hot Topics', icon: Flame, description: 'Community-reported topic frequency and heat rankings.' },
    { id: 'traps', label: 'Trap Alerts', icon: AlertTriangle, description: 'Common wrong-answer bait — click any trap for full detail.' },
    { id: 'research', label: 'Research', icon: Search, description: 'Run the AI agent to discover new patterns and traps.' },
    { id: 'insights', label: 'Insights', icon: Lightbulb, description: 'Saved research output and automated recommendations.' },
    { id: 'arsenal', label: 'Arsenal', icon: Globe, description: 'Curated OSINT-style source directory for AAISM exam and org intel.' },
  ];

  const activeTabMeta = tabs.find(t => t.id === activeTab);

  const callbacks: ResearchCallbacks = {
    onLog: (message, type) => {
      const prefix = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'thinking' ? '◌' : '→';
      setResearchLogs(prev => [...prev, `${prefix} ${message}`]);
    },
    onProgress: (_phase, message) => {
      setResearchLogs(prev => [...prev, `▸ ${message}`]);
    },
  };

  async function handleResearch() {
    setIsResearching(true);
    setResearchLogs([]);
    try {
      if (researchType === 'patterns') {
        await researchExamPatterns(callbacks, researchFocus || undefined);
      } else {
        await discoverTrapPatterns(callbacks, researchDomain);
      }
      setInsights(loadInsights());
    } catch (e) {
      setResearchLogs(prev => [...prev, `✗ Error: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setIsResearching(false);
    }
  }

  const frequencyColors: Record<string, string> = {
    very_high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const trendIcons: Record<string, typeof TrendingUp> = {
    rising: TrendingUp,
    stable: Minus,
    declining: TrendingDown,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Radar}
        iconClassName="text-purple-500"
        title="Intel Hub"
        subtitle="Deep dive into exam patterns, traps, and community intelligence — use Live Feed in the top bar for RSS stream."
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTabMeta && (
        <p className="text-sm text-gray-400 -mt-2">{activeTabMeta.description}</p>
      )}

      {/* Tab Content */}
      {activeTab === 'patterns' && (
        <PatternsTab
          expandedPattern={expandedPattern}
          setExpandedPattern={setExpandedPattern}
          frequencyColors={frequencyColors}
          analysis={analysis}
          navigate={navigate}
        />
      )}

      {activeTab === 'hot_topics' && (
        <HotTopicsTab trendIcons={trendIcons} />
      )}

      {activeTab === 'traps' && (
        <TrapsTab
          onSelectTrap={setSelectedTrap}
          frequencyColors={frequencyColors}
        />
      )}

      {activeTab === 'research' && (
        <ResearchTab
          isResearching={isResearching}
          researchLogs={researchLogs}
          researchFocus={researchFocus}
          setResearchFocus={setResearchFocus}
          researchType={researchType}
          setResearchType={setResearchType}
          researchDomain={researchDomain}
          setResearchDomain={setResearchDomain}
          handleResearch={handleResearch}
          logEndRef={logEndRef}
        />
      )}

      {activeTab === 'insights' && (
        <InsightsTab
          insights={insights}
          setInsights={setInsights}
          analysis={analysis}
        />
      )}

      {activeTab === 'arsenal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Practitioner-grade intelligence sources — full tree browser on the dedicated page.
            </p>
            <Link
              to="/osint"
              className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 flex-shrink-0"
            >
              Full OSINT Arsenal <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <OSINTArsenal compact />
        </div>
      )}

      <SlidePanel
        open={!!selectedTrap}
        onClose={() => setSelectedTrap(null)}
        title={selectedTrap?.name ?? ''}
        subtitle={selectedTrap ? selectedTrap.frequency.replace('_', ' ') : undefined}
      >
        {selectedTrap && <TrapDetail trap={selectedTrap} />}
      </SlidePanel>
    </div>
  );
}

function TrapDetail({ trap }: { trap: typeof TRAP_PATTERNS[0] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{trap.description}</p>
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Example</h4>
        <p className="text-sm">{trap.example}</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Why Students Fall For It</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{trap.whyStudentsFail}</p>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">How to Avoid</h4>
        <p className="text-sm">{trap.howToAvoid}</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        {trap.domains.map(d => (
          <span key={d} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">D{d}</span>
        ))}
      </div>
    </div>
  );
}

// ============ PATTERNS TAB ============

function PatternsTab({
  expandedPattern,
  setExpandedPattern,
  frequencyColors,
  analysis,
  navigate,
}: {
  expandedPattern: string | null;
  setExpandedPattern: (id: string | null) => void;
  frequencyColors: Record<string, string>;
  analysis: PatternAnalysis | null;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="space-y-4">
      {/* Pattern distribution summary */}
      {analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Your Question Bank Pattern Distribution
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(analysis.patternDistribution).map(([pattern, count]) => (
              <div key={pattern} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{pattern}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern cards */}
      <div className="grid gap-4">
        {QUESTION_PATTERNS.map(pattern => {
          const isExpanded = expandedPattern === pattern.id;
          return (
            <div
              key={pattern.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">{pattern.keyword}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{pattern.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{pattern.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${frequencyColors[pattern.examFrequency]}`}>
                    {pattern.examFrequency.replace('_', ' ')}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">Strategy</h4>
                    <p className="text-sm">{pattern.strategy}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Tips</h4>
                    <ul className="space-y-1">
                      {pattern.tips.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="w-3 h-3 mt-1 text-yellow-500 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Example</h4>
                    <p className="text-sm font-medium mb-1">{pattern.example.stem}</p>
                    <div className="text-xs space-y-1 mt-2">
                      <p className="text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Trap: {pattern.example.trap}
                      </p>
                      <p className="text-green-600 dark:text-green-400">
                        <Shield className="w-3 h-3 inline mr-1" />
                        Correct: {pattern.example.correct}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 italic mt-1">{pattern.example.reasoning}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/scenarios?mode=drill&pattern=${pattern.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Practice {pattern.keyword} Pattern Drill
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ HOT TOPICS TAB ============

function HotTopicsTab({ trendIcons }: { trendIcons: Record<string, typeof TrendingUp> }) {
  const domainNames: Record<number, string> = {
    1: 'AI Governance',
    2: 'AI Risk',
    3: 'AI Development',
    4: 'AI Operations',
  };

  const domainColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    2: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    3: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    4: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Topic Heat Map — Community-Reported Exam Frequency
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Topics ranked by how frequently communities report seeing them on the AAISM exam. Higher heat = more likely to appear.
        </p>
      </div>

      <div className="space-y-2">
        {TOPIC_HEAT_MAP.map((topic, i) => {
          const TrendIcon = trendIcons[topic.trend] || Minus;
          const trendColor = topic.trend === 'rising' ? 'text-green-500' : topic.trend === 'declining' ? 'text-red-500' : 'text-gray-400';

          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6">#{i + 1}</span>
                  <div>
                    <h4 className="font-medium">{topic.topic}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${domainColors[topic.domain]}`}>
                      D{topic.domain}: {domainNames[topic.domain]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{topic.trend}</span>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{
                      color: `hsl(${120 - (topic.heat / 100) * 120}, 70%, 50%)`,
                    }}>
                      {topic.heat}
                    </div>
                    <div className="text-[10px] text-gray-400">heat</div>
                  </div>
                </div>
              </div>

              {/* Heat bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${topic.heat}%`,
                    background: `linear-gradient(90deg, hsl(120, 70%, 50%), hsl(${120 - (topic.heat / 100) * 120}, 70%, 50%))`,
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">{topic.communityNotes}</p>
              <Link
                to={`/studio?topic=${encodeURIComponent(topic.topic)}&domain=${topic.domain}`}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                <PenLine className="w-3.5 h-3.5" />
                Create post from this
              </Link>
            </div>
          );
        })}
      </div>

      {/* Forum sources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Intelligence Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FORUM_SOURCES.map((source, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{source.platform}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  source.reliability === 'high'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : source.reliability === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {source.reliability} reliability
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {source.communities.slice(0, 3).map((c, j) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{source.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TRAPS TAB ============

function TrapsTab({
  onSelectTrap,
  frequencyColors,
}: {
  onSelectTrap: (trap: typeof TRAP_PATTERNS[0]) => void;
  frequencyColors: Record<string, string>;
}) {
  const freqMap: Record<string, string> = {
    very_common: 'very_high',
    common: 'high',
    occasional: 'medium',
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Known Exam Traps
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
          Click a trap for examples and avoidance strategies.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TRAP_PATTERNS.map(trap => (
          <button
            key={trap.id}
            onClick={() => onSelectTrap(trap)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-red-400 dark:hover:border-red-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm">{trap.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{trap.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {trap.domains.map(d => (
                    <span key={d} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">D{d}</span>
                  ))}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${frequencyColors[freqMap[trap.frequency]]}`}>
                    {trap.frequency.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ RESEARCH TAB ============

function ResearchTab({
  isResearching,
  researchLogs,
  researchFocus,
  setResearchFocus,
  researchType,
  setResearchType,
  researchDomain,
  setResearchDomain,
  handleResearch,
  logEndRef,
}: {
  isResearching: boolean;
  researchLogs: string[];
  researchFocus: string;
  setResearchFocus: (v: string) => void;
  researchType: 'patterns' | 'traps';
  setResearchType: (v: 'patterns' | 'traps') => void;
  researchDomain: number | undefined;
  setResearchDomain: (v: number | undefined) => void;
  handleResearch: () => void;
  logEndRef: React.RefObject<HTMLDivElement>;
}) {
  const aiConfig = loadAIConfig();

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          LLM Research Agent
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Use your AI provider ({aiConfig.provider} / {aiConfig.model}) to research exam patterns and discover new traps on-demand.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setResearchType('patterns')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                researchType === 'patterns'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1" />
              Pattern Research
            </button>
            <button
              onClick={() => setResearchType('traps')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                researchType === 'traps'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Trap Discovery
            </button>
          </div>

          {researchType === 'patterns' ? (
            <input
              type="text"
              value={researchFocus}
              onChange={(e) => setResearchFocus(e.target.value)}
              placeholder="Optional focus area (e.g., 'BEST pattern questions', 'EU AI Act')"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            />
          ) : (
            <select
              value={researchDomain ?? ''}
              onChange={(e) => setResearchDomain(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Domains</option>
              <option value="1">Domain 1: AI Governance</option>
              <option value="2">Domain 2: AI Risk Management</option>
              <option value="3">Domain 3: AI Development</option>
              <option value="4">Domain 4: AI Operations</option>
            </select>
          )}

          <button
            onClick={handleResearch}
            disabled={isResearching}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isResearching ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Researching...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Research Agent</>
            )}
          </button>
        </div>
      </div>

      {researchLogs.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-80 overflow-y-auto">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Zap className="w-4 h-4" />
            Research Agent Console
          </div>
          {researchLogs.map((log, i) => (
            <div key={i} className={`text-xs py-0.5 ${
              log.startsWith('✓') ? 'text-green-400' :
              log.startsWith('⚠') || log.startsWith('✗') ? 'text-yellow-400' :
              log.startsWith('◌') ? 'text-blue-300' :
              'text-gray-300'
            }`}>
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

// ============ INSIGHTS TAB ============

function InsightsTab({
  insights,
  setInsights,
  analysis,
}: {
  insights: IntelligenceInsight[];
  setInsights: (v: IntelligenceInsight[]) => void;
  analysis: PatternAnalysis | null;
}) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Recommendations from analysis */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" />
            Automated Recommendations
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Saved research insights */}
      {insights.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Research History ({insights.length})</h3>
            <button
              onClick={() => { clearInsights(); setInsights([]); }}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          </div>

          {insights.map(insight => {
            const isExpanded = expandedInsight === insight.id;
            const typeColors: Record<string, string> = {
              pattern_research: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              trap_discovery: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              scenario: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              pattern_analysis: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              hot_topic: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            };

            return (
              <div key={insight.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[insight.type] || 'bg-gray-100'}`}>
                      {insight.type.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                      {insight.content.length > 2000 ? insight.content.slice(0, 2000) + '...' : insight.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No research insights yet</p>
          <p className="text-sm mt-1">Run the Research Agent to generate insights about exam patterns and traps</p>
        </div>
      )}
    </div>
  );
}
