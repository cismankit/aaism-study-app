import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot, Play, CheckCircle, Clock, Zap, Target, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, Trash2, Filter, BarChart3,
  Shield, Search, Sparkles, AlertTriangle, Check, X, Eye,
  Activity, Database, Layers, ArrowRight, Settings, Terminal,
  StopCircle,
} from 'lucide-react';
import {
  runDiscoveryAgent,
  PRESET_STRATEGIES,
  getPipelineStats,
  analyzeCoverage,
  type AgentCallbacks,
  type LiveLogEntry,
} from '../services/agentService';
import {
  loadPipelineState,
  updateLeadStatus,
  bulkUpdateLeads,
  clearPipeline,
  cancelRun,
  deleteRun,
  cleanupStaleRuns,
  type QuestionLead,
  type AgentRun,
  type AgentPipelineState,
  type DiscoveryStrategy,
} from '../services/agentStore';
import { loadAIConfig } from '../services/aiService';

type ViewTab = 'pipeline' | 'leads' | 'analytics' | 'history';
type LeadFilter = 'all' | 'pending_review' | 'approved' | 'auto_approved' | 'rejected';

export default function AgentDiscovery() {
  const [activeTab, setActiveTab] = useState<ViewTab>('pipeline');
  const [pipelineState, setPipelineState] = useState<AgentPipelineState>(loadPipelineState());
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [phaseMessage, setPhaseMessage] = useState('');
  const [liveLogs, setLiveLogs] = useState<LiveLogEntry[]>([]);
  const [runStartTime, setRunStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const aiConfig = loadAIConfig();
  const stats = getPipelineStats();

  const refreshState = useCallback(() => {
    setPipelineState(loadPipelineState());
  }, []);

  useEffect(() => {
    const cleaned = cleanupStaleRuns();
    if (cleaned > 0) {
      setLiveLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        phase: 'populate',
        type: 'warning' as const,
        message: `Cleaned up ${cleaned} stale run(s) from previous session`,
      }]);
    }
    refreshState();
  }, [refreshState]);

  // Elapsed timer
  useEffect(() => {
    if (!runStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [runStartTime]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  const callbacks: AgentCallbacks = {
    onPhaseChange: (phase, message) => {
      setCurrentPhase(phase);
      setPhaseMessage(message);
    },
    onLog: (entry) => {
      setLiveLogs(prev => [...prev, entry]);
    },
    onLeadsFound: () => refreshState(),
    onComplete: () => {
      setIsRunning(false);
      setCurrentPhase('');
      setPhaseMessage('');
      setRunStartTime(null);
      refreshState();
    },
    onError: (err) => {
      setIsRunning(false);
      setRunStartTime(null);
      setError(err);
      refreshState();
    },
  };

  const handleRunStrategy = async (strategy: DiscoveryStrategy) => {
    setError(null);
    setLiveLogs([]);
    setElapsed(0);
    setRunStartTime(Date.now());
    setIsRunning(true);
    setShowStrategyPicker(false);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await runDiscoveryAgent(strategy, { ...callbacks, signal: controller.signal });
    abortControllerRef.current = null;
  };

  const handleStopAgent = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleApproveLead = (leadId: string) => {
    updateLeadStatus(leadId, 'approved');
    refreshState();
  };

  const handleRejectLead = (leadId: string) => {
    updateLeadStatus(leadId, 'rejected');
    refreshState();
  };

  const handleBulkApprove = () => {
    if (selectedLeads.size === 0) return;
    bulkUpdateLeads([...selectedLeads], 'approved');
    setSelectedLeads(new Set());
    refreshState();
  };

  const handleBulkReject = () => {
    if (selectedLeads.size === 0) return;
    bulkUpdateLeads([...selectedLeads], 'rejected');
    setSelectedLeads(new Set());
    refreshState();
  };

  const handleClearPipeline = () => {
    if (confirm('Clear all agent data? This cannot be undone.')) {
      clearPipeline();
      refreshState();
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const filteredLeads = pipelineState.leads.filter(l =>
    leadFilter === 'all' ? true : l.status === leadFilter
  ).sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());

  const domainNames: Record<number, string> = {
    1: 'AI Governance',
    2: 'AI Risk',
    3: 'AI Tech & Controls',
    4: 'AI Operations',
  };

  const statusColors: Record<string, string> = {
    pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    discovered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    auto_approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Agent Discovery</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Agentic AI auto-discovers ISACA-matching questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Settings size={12} />
            {aiConfig.provider} / {aiConfig.model}
          </div>
          <button
            onClick={handleClearPipeline}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear pipeline"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Live Agent Console */}
      {(isRunning || liveLogs.length > 0) && (
        <div className="bg-gray-900 dark:bg-black rounded-xl border border-gray-700 overflow-hidden shadow-xl">
          {/* Console Header */}
          <div className="px-4 py-2.5 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : liveLogs.some(l => l.type === 'warning') ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-300">
                  agent-discovery {isRunning ? `— ${currentPhase || 'init'}` : '— done'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Phase Progress Dots */}
              <div className="flex gap-1 items-center">
                {['analyze', 'discover', 'deduplicate', 'score', 'populate'].map((phase, i) => {
                  const phaseIdx = ['analyze', 'discover', 'deduplicate', 'score', 'populate'].indexOf(currentPhase);
                  return (
                    <div key={phase} className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          phase === currentPhase
                            ? 'bg-green-400 scale-150'
                            : phaseIdx > i
                              ? 'bg-green-500'
                              : !isRunning && liveLogs.length > 0
                                ? 'bg-green-500'
                                : 'bg-gray-600'
                        }`}
                        title={phase}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Elapsed Timer */}
              <span className="text-xs font-mono text-gray-400 tabular-nums">
                {isRunning ? `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}` : 'completed'}
              </span>
              {isRunning && (
                <button
                  onClick={handleStopAgent}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors text-xs font-medium"
                  title="Stop agent"
                >
                  <StopCircle size={12} />
                  Stop
                </button>
              )}
              {!isRunning && liveLogs.length > 0 && (
                <button
                  onClick={() => setLiveLogs([])}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                  title="Clear console"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Console Body — Scrolling Log Feed */}
          <div className="max-h-72 overflow-y-auto p-3 font-mono text-xs space-y-0.5 scrollbar-thin">
            {liveLogs.map((entry, i) => {
              const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
              const phaseColor: Record<string, string> = {
                analyze: 'text-cyan-400',
                discover: 'text-violet-400',
                deduplicate: 'text-purple-400',
                score: 'text-yellow-400',
                populate: 'text-green-400',
                error: 'text-red-400',
              };
              const typePrefix: Record<string, string> = {
                info: '│',
                success: '✓',
                warning: '⚠',
                thinking: '◌',
              };
              const typeColor: Record<string, string> = {
                info: 'text-gray-400',
                success: 'text-green-400',
                warning: 'text-yellow-400',
                thinking: 'text-violet-400 animate-pulse',
              };
              return (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-600 shrink-0">{time}</span>
                  <span className={`shrink-0 ${phaseColor[entry.phase] || 'text-gray-400'}`}>
                    [{entry.phase}]
                  </span>
                  <span className={`shrink-0 ${typeColor[entry.type]}`}>
                    {typePrefix[entry.type]}
                  </span>
                  <span className={`${
                    entry.type === 'success' ? 'text-green-300' :
                    entry.type === 'warning' ? 'text-yellow-300' :
                    entry.type === 'thinking' ? 'text-violet-300 italic' :
                    'text-gray-300'
                  }`}>
                    {entry.message}
                  </span>
                </div>
              );
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-violet-400">
                <span className="animate-pulse">▊</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Console Footer */}
          {isRunning && (
            <div className="px-4 py-2 bg-gray-800 dark:bg-gray-900 border-t border-gray-700 flex items-center justify-between">
              <div className="text-[10px] text-gray-500 flex items-center gap-2">
                <RefreshCw size={10} className="animate-spin" />
                {phaseMessage}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500">
                  {liveLogs.length} log entries
                </span>
                <button
                  onClick={handleStopAgent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors text-[11px] font-medium"
                >
                  <StopCircle size={11} />
                  Stop Agent
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
          {aiConfig.provider === 'ollama' && error.includes('parse') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Quick Fix: Try Groq (FREE)</span>
              </div>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-5 list-decimal">
                <li>Get a free API key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline font-medium">console.groq.com</a></li>
                <li>Go to Dashboard → Settings tab</li>
                <li>Select Groq as provider, paste your key</li>
                <li>Run the agent again — works instantly</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total Leads', value: stats.totalLeads, icon: Layers, iconClass: 'text-violet-500' },
          { label: 'Pending', value: stats.pendingCount, icon: Clock, iconClass: 'text-yellow-500' },
          { label: 'Approved', value: stats.approvedCount, icon: CheckCircle, iconClass: 'text-green-500' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: Target, iconClass: 'text-blue-500' },
          { label: 'Coverage Gaps', value: stats.coverageGaps, icon: AlertTriangle, iconClass: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={12} className={s.iconClass} />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {([
          { id: 'pipeline' as ViewTab, label: 'Pipeline', icon: Zap },
          { id: 'leads' as ViewTab, label: `Leads (${stats.totalLeads})`, icon: Database },
          { id: 'analytics' as ViewTab, label: 'Analytics', icon: BarChart3 },
          { id: 'history' as ViewTab, label: 'History', icon: Activity },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'pipeline' && (
        <PipelineTab
          isRunning={isRunning}
          showStrategyPicker={showStrategyPicker}
          setShowStrategyPicker={setShowStrategyPicker}
          onRunStrategy={handleRunStrategy}
          stats={stats}
          domainNames={domainNames}
        />
      )}

      {activeTab === 'leads' && (
        <LeadsTab
          leads={filteredLeads}
          leadFilter={leadFilter}
          setLeadFilter={setLeadFilter}
          expandedLead={expandedLead}
          setExpandedLead={setExpandedLead}
          selectedLeads={selectedLeads}
          toggleLeadSelection={toggleLeadSelection}
          onApprove={handleApproveLead}
          onReject={handleRejectLead}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          statusColors={statusColors}
          domainNames={domainNames}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab domainNames={domainNames} />
      )}

      {activeTab === 'history' && (
        <HistoryTab runs={pipelineState.runs} onRefresh={refreshState} />
      )}
    </div>
  );
}

// ============ PIPELINE TAB ============

function PipelineTab({
  isRunning, showStrategyPicker, setShowStrategyPicker, onRunStrategy, stats, domainNames,
}: {
  isRunning: boolean;
  showStrategyPicker: boolean;
  setShowStrategyPicker: (v: boolean) => void;
  onRunStrategy: (s: DiscoveryStrategy) => void;
  stats: ReturnType<typeof getPipelineStats>;
  domainNames: Record<number, string>;
}) {
  return (
    <div className="space-y-4">
      {/* Launch Agent */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Launch Discovery Agent</h2>
            </div>
            <button
              onClick={() => setShowStrategyPicker(!showStrategyPicker)}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isRunning
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isRunning ? (
                <><RefreshCw size={14} className="animate-spin" /> Running...</>
              ) : (
                <><Play size={14} /> {showStrategyPicker ? 'Close' : 'Run Agent'}</>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose a discovery strategy to find ISACA-matching exam questions
          </p>
        </div>

        {showStrategyPicker && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_STRATEGIES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onRunStrategy(preset.strategy)}
                className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {preset.name}
                  </span>
                  <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
                    {preset.strategy.questionCount} Qs
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-400">{preset.strategy.type}</span>
                  {preset.strategy.targetDomain && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      D{preset.strategy.targetDomain}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    auto-approve &ge; {preset.strategy.autoApproveThreshold}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Flow */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Activity size={14} className="text-violet-500" />
          Pipeline Flow
        </h3>
        <div className="flex items-center justify-between">
          {[
            { label: 'Discovered', count: stats.totalLeads, iconBgClass: 'bg-blue-100 dark:bg-blue-900/30', iconClass: 'text-blue-500', icon: Search },
            { label: 'Deduped', count: stats.totalLeads, iconBgClass: 'bg-violet-100 dark:bg-violet-900/30', iconClass: 'text-violet-500', icon: Filter },
            { label: 'Pending', count: stats.pendingCount, iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/30', iconClass: 'text-yellow-500', icon: Clock },
            { label: 'Approved', count: stats.approvedCount, iconBgClass: 'bg-green-100 dark:bg-green-900/30', iconClass: 'text-green-500', icon: CheckCircle },
            { label: 'In Bank', count: stats.approvedQuestions, iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30', iconClass: 'text-emerald-500', icon: Database },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="text-center">
                <div className={`w-10 h-10 rounded-full ${step.iconBgClass} flex items-center justify-center mx-auto mb-1`}>
                  <step.icon size={16} className={step.iconClass} />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{step.count}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{step.label}</div>
              </div>
              {i < 4 && <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Domain Coverage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield size={14} className="text-violet-500" />
          Agent-Discovered by Domain
        </h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(d => {
            const count = stats.domainDistribution[d] || 0;
            const max = Math.max(...Object.values(stats.domainDistribution), 1);
            return (
              <div key={d} className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-600 dark:text-gray-400 truncate">D{d}: {domainNames[d]}</div>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono font-bold text-gray-900 dark:text-white w-8 text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ LEADS TAB ============

function LeadsTab({
  leads, leadFilter, setLeadFilter, expandedLead, setExpandedLead,
  selectedLeads, toggleLeadSelection, onApprove, onReject, onBulkApprove, onBulkReject,
  statusColors, domainNames,
}: {
  leads: QuestionLead[];
  leadFilter: LeadFilter;
  setLeadFilter: (f: LeadFilter) => void;
  expandedLead: string | null;
  setExpandedLead: (id: string | null) => void;
  selectedLeads: Set<string>;
  toggleLeadSelection: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  statusColors: Record<string, string>;
  domainNames: Record<number, string>;
}) {
  return (
    <div className="space-y-3">
      {/* Filter + Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'pending_review', 'approved', 'auto_approved', 'rejected'] as LeadFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setLeadFilter(f)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                leadFilter === f
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        {selectedLeads.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{selectedLeads.size} selected</span>
            <button onClick={onBulkApprove} className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium hover:bg-green-200">
              <Check size={12} /> Approve
            </button>
            <button onClick={onBulkReject} className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium hover:bg-red-200">
              <X size={12} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Bot size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No leads yet. Run the agent to discover questions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <div
              key={lead.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:border-violet-300 dark:hover:border-violet-700"
            >
              <div className="p-3 flex items-start gap-3">
                {/* Select */}
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={() => toggleLeadSelection(lead.id)}
                  className="mt-1 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[lead.status]}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                      D{lead.question.domain}: {domainNames[lead.question.domain]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      lead.question.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      lead.question.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                      'bg-green-100 dark:bg-green-900/30 text-green-600'
                    }`}>
                      {lead.question.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 dark:text-white leading-snug">{lead.question.question}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Target size={10} className="text-blue-500" />
                      <span className="text-[10px] text-gray-500">Confidence: {lead.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Filter size={10} className="text-purple-500" />
                      <span className="text-[10px] text-gray-500">Similarity: {lead.similarityScore}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400">{lead.question.topic}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                  >
                    {expandedLead === lead.id ? <ChevronUp size={14} /> : <Eye size={14} />}
                  </button>
                  {(lead.status === 'pending_review' || lead.status === 'discovered') && (
                    <>
                      <button
                        onClick={() => onApprove(lead.id)}
                        className="p-1.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => onReject(lead.id)}
                        className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                        title="Reject"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedLead === lead.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Options</div>
                    {lead.question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`text-xs py-1 px-2 rounded mb-0.5 ${
                          i === lead.question.correctAnswer
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {opt} {i === lead.question.correctAnswer && '✓'}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Explanation</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{lead.question.explanation}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Agent Reasoning</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">{lead.reasoning}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ ANALYTICS TAB ============

function AnalyticsTab({ domainNames }: { domainNames: Record<number, string> }) {
  const coverage = analyzeCoverage();
  const stats = getPipelineStats();

  const highGaps = coverage.gaps.filter(g => g.priority === 'high').slice(0, 10);
  const topTopics = Object.entries(coverage.topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Bank</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{coverage.totalQuestions}</div>
          <div className="text-[10px] text-green-500">+{stats.approvedQuestions} from agent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-[10px] text-gray-500 uppercase mb-1">High-Priority Gaps</div>
          <div className="text-2xl font-bold text-orange-500">{stats.coverageGaps}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Agent Runs</div>
          <div className="text-2xl font-bold text-violet-500">{stats.totalRuns}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Avg Confidence</div>
          <div className="text-2xl font-bold text-blue-500">{stats.avgConfidence}%</div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Question Bank by Domain</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(d => {
            const count = coverage.domainCounts[d] || 0;
            const total = coverage.totalQuestions;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={d}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">D{d}: {domainNames[d]}</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: d === 1 ? '#8b5cf6' : d === 2 ? '#f59e0b' : d === 3 ? '#10b981' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Difficulty Distribution</h3>
        <div className="flex gap-4">
          {(['easy', 'medium', 'hard'] as const).map(diff => {
            const count = coverage.difficultyCounts[diff] || 0;
            const valueColor = diff === 'easy' ? 'text-green-500' : diff === 'medium' ? 'text-yellow-500' : 'text-red-500';
            return (
              <div key={diff} className="flex-1 text-center">
                <div className={`text-2xl font-bold ${valueColor}`}>{count}</div>
                <div className="text-xs text-gray-500 capitalize">{diff}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Coverage Gaps */}
      {highGaps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" />
            Top Coverage Gaps (Zero Questions)
          </h3>
          <div className="space-y-1">
            {highGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">D{gap.domain}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">{gap.topic}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  gap.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                  gap.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>{gap.difficulty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Topics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-green-500" />
          Top Topics by Question Count
        </h3>
        <div className="space-y-1.5">
          {topTopics.map(([topic, count]) => {
            const maxCount = topTopics[0]?.[1] || 1;
            return (
              <div key={topic} className="flex items-center gap-2">
                <div className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">{topic}</div>
                <div className="w-32 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono font-bold w-6 text-right text-gray-900 dark:text-white">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ HISTORY TAB ============

function HistoryTab({ runs, onRefresh }: { runs: AgentRun[]; onRefresh: () => void }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const handleCancel = (runId: string) => {
    cancelRun(runId);
    onRefresh();
  };

  const handleDelete = (runId: string) => {
    if (confirm('Delete this run from history?')) {
      deleteRun(runId);
      onRefresh();
    }
  };

  const formatDuration = (run: AgentRun) => {
    const start = new Date(run.startedAt).getTime();
    const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
    const secs = Math.floor((end - start) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  const getTimeSince = (dateStr: string) => {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
    completed: { bg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', dot: 'bg-green-500', label: 'completed' },
    running: { bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500 animate-pulse', label: 'running' },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', dot: 'bg-red-500', label: 'failed' },
    cancelled: { bg: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', label: 'cancelled' },
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Activity size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No agent runs yet. Launch a discovery to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map(run => {
        const cfg = statusConfig[run.status] || statusConfig.failed;
        const isStuck = run.status === 'running';
        const lastLogEntry = run.log[run.log.length - 1];
        const lastPhase = lastLogEntry?.phase || 'init';

        return (
          <div key={run.id} className={`bg-white dark:bg-gray-800 rounded-lg border overflow-hidden transition-all ${
            isStuck
              ? 'border-yellow-400/50 dark:border-yellow-500/30'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <button
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {run.strategy.type.replace(/_/g, ' ')} — {run.strategy.questionCount} Qs
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-2">
                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                    <span>·</span>
                    <span>{run.leadsFound} leads found</span>
                    <span>·</span>
                    <span>{formatDuration(run)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg}`}>
                  {cfg.label}
                </span>
                {expandedRun === run.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Stuck run warning banner */}
            {isStuck && expandedRun !== run.id && (
              <div className="px-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle size={12} />
                  <span>This run appears stuck — last activity: {getTimeSince(lastLogEntry?.timestamp || run.startedAt)} (phase: {lastPhase})</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancel(run.id); }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <StopCircle size={11} />
                  Stop & Mark Failed
                </button>
              </div>
            )}

            {/* Expanded details */}
            {expandedRun === run.id && (
              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {/* Run info summary */}
                <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> Started: {new Date(run.startedAt).toLocaleString()}
                    </span>
                    {run.completedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} /> Ended: {new Date(run.completedAt).toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Activity size={10} /> Duration: {formatDuration(run)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={10} /> Last phase: {lastPhase}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isStuck && (
                      <button
                        onClick={() => handleCancel(run.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-medium hover:bg-red-200 transition-colors"
                      >
                        <StopCircle size={11} />
                        Stop & Mark Failed
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(run.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-[11px] transition-colors"
                      title="Delete this run"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Strategy details */}
                <div className="px-3 pb-2">
                  <div className="flex gap-2 flex-wrap text-[10px]">
                    <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
                      {run.strategy.type.replace(/_/g, ' ')}
                    </span>
                    {run.strategy.targetDomain && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                        Domain {run.strategy.targetDomain}
                      </span>
                    )}
                    {run.strategy.targetDifficulty && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                        {run.strategy.targetDifficulty}
                      </span>
                    )}
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                      auto-approve ≥ {run.strategy.autoApproveThreshold}%
                    </span>
                  </div>
                </div>

                {/* Agent log */}
                {run.log.length > 0 ? (
                  <div className="px-3 pb-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase mb-2">Agent Log ({run.log.length} entries)</div>
                    <div className="space-y-1 font-mono max-h-60 overflow-y-auto bg-gray-900 dark:bg-black rounded-lg p-2">
                      {run.log.map((entry, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="text-gray-600 shrink-0 w-16">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          <span className={`shrink-0 px-1 rounded text-[10px] ${
                            entry.phase === 'analyze' ? 'bg-cyan-900/50 text-cyan-400' :
                            entry.phase === 'discover' ? 'bg-violet-900/50 text-violet-400' :
                            entry.phase === 'deduplicate' ? 'bg-purple-900/50 text-purple-400' :
                            entry.phase === 'score' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-green-900/50 text-green-400'
                          }`}>{entry.phase}</span>
                          <span className="text-gray-400">{entry.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 pb-3 text-[11px] text-gray-500 italic">
                    No log entries recorded for this run.
                  </div>
                )}

                {/* Error display */}
                {run.error && (
                  <div className="mx-3 mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{run.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
