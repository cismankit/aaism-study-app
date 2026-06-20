import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Send, Copy, RefreshCw, Terminal, ChevronRight,
  AlertTriangle, Zap, Brain, Crosshair, ExternalLink,
} from 'lucide-react';
import {
  OPS_AGENT_PROFILES,
  analyzeWithOpsAgent,
  generateMiniLabFromIncident,
  type OpsAgentId,
  type OpsAnalysisResult,
  type MitreMappingEntry,
} from '../services/opsAgentService';
import { useCert } from '../context/CertContext';
import { loadAIConfig } from '../services/aiService';

const AGENT_ICONS: Record<OpsAgentId, typeof Zap> = {
  openclaw: Crosshair,
  hermes: Zap,
  'claude-analyst': Brain,
};

export default function OpsCopilotPanel() {
  const { activeCert } = useCert();
  const [agentId, setAgentId] = useState<OpsAgentId>('hermes');
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OpsAnalysisResult | null>(null);
  const [miniLab, setMiniLab] = useState<{ title: string; steps: string[]; type: string } | null>(null);
  const [labError, setLabError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiConfig = loadAIConfig();

  const handlePasteAnalyze = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInput(text);
        textareaRef.current?.focus();
      }
    } catch { /* clipboard denied */ }
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        void handlePasteAnalyze();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePasteAnalyze]);

  const runAnalysis = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setMiniLab(null);
    setLabError(null);
    try {
      const analysis = await analyzeWithOpsAgent(agentId, input, context || undefined);
      setResult(analysis);
    } finally {
      setLoading(false);
    }
  };

  const generateLab = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setLabError(null);
    setMiniLab(null);
    try {
      const lab = await generateMiniLabFromIncident(input, activeCert.id, 1);
      if (!lab) {
        setLabError('Mini-lab generation failed. Check AI settings and retry.');
      } else {
        setMiniLab(lab);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const agent = OPS_AGENT_PROFILES.find(a => a.id === agentId)!;
  const AgentIcon = AGENT_ICONS[agentId];

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Authorized testing / lab only.</strong> Ops Copilot provides analysis and defensive recommendations — no automated exploitation. Uses your {aiConfig.provider} key from Settings.
        </div>
      </div>

      {/* Agent selector */}
      <div className="grid sm:grid-cols-3 gap-3">
        {OPS_AGENT_PROFILES.map(a => {
          const Icon = AGENT_ICONS[a.id];
          const active = agentId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAgentId(a.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                active
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-theme bg-theme-elevated hover:border-theme-muted'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${a.accent}`} />
              <div className="font-semibold text-sm text-cockpit">{a.name}</div>
              <div className="text-[10px] text-theme-muted">{a.posture}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-theme-elevated rounded-xl border border-theme p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AgentIcon className={`w-5 h-5 ${agent.accent}`} />
          <span className="font-semibold text-sm text-cockpit">{agent.name}</span>
          <span className="text-xs text-theme-muted">— {agent.description}</span>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste logs, alert JSON, nmap output, domain info, code snippet..."
          className="w-full px-3 py-2.5 text-sm border border-theme rounded-lg bg-theme-muted dark:bg-gray-800 font-mono min-h-[140px]"
        />

        <input
          type="text"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Optional context (e.g., 'production SIEM alert', 'lab target 192.168.1.10')"
          className="w-full px-3 py-2 text-sm border border-theme rounded-lg bg-theme-elevated"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void handlePasteAnalyze()}
            className="text-xs px-3 py-2 rounded-lg bg-cockpit-track text-theme-muted hover:text-cockpit"
          >
            Paste from clipboard
          </button>
          <button
            onClick={() => void runAnalysis()}
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analyze
          </button>
          <button
            onClick={() => void generateLab()}
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50"
          >
            <Terminal className="w-4 h-4" />
            Generate mini-lab
          </button>
          <span className="text-[10px] text-theme-faint self-center ml-auto">⌘⇧V paste & focus</span>
        </div>
      </div>

      {result?.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
              <Link to="/settings" className="text-xs text-red-600 underline mt-1 inline-block">Configure AI in Settings →</Link>
            </div>
          </div>
          <button
            onClick={() => void runAnalysis()}
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry analysis
          </button>
        </div>
      )}

      {result && !result.error && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-theme-elevated border border-theme">
            <h4 className="text-sm font-semibold text-cockpit mb-2">Summary</h4>
            <p className="text-sm text-theme-secondary">{result.summary}</p>
          </div>

          {result.findings.length > 0 && (
            <ResultSection title="Findings" items={result.findings} />
          )}
          {result.nextSteps.length > 0 && (
            <ResultSection title="Next Steps" items={result.nextSteps} numbered />
          )}
          {result.commands.length > 0 && (
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-700">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Commands to Run
              </h4>
              <div className="space-y-2">
                {result.commands.map((cmd, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <code className="flex-1 text-xs text-gray-300 font-mono">{cmd}</code>
                    <button onClick={() => copyText(cmd)} className="text-gray-500 hover:text-emerald-400">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.mitreMapping.length > 0 && (
            <div className="p-4 rounded-xl bg-theme-elevated border border-theme">
              <h4 className="text-sm font-semibold text-cockpit mb-2">MITRE Mappings</h4>
              <div className="flex flex-wrap gap-2">
                {result.mitreMapping.map((m, i) => (
                  <MitreBadge key={i} entry={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {labError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {labError}
          </p>
          <button
            onClick={() => void generateLab()}
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry mini-lab
          </button>
        </div>
      )}

      {miniLab && (
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <h4 className="font-semibold text-sm text-violet-700 dark:text-violet-300 mb-2">Generated Mini-Lab: {miniLab.title}</h4>
          <ol className="text-sm text-theme-secondary space-y-1 list-decimal ml-5">
            {miniLab.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <Link
            to="/ops"
            className="inline-flex items-center gap-1 mt-3 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            Practice in Ops Lab <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function MitreBadge({ entry }: { entry: MitreMappingEntry }) {
  const lowConf = entry.confidence === 'low' || entry.inferred;
  const content = (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
      lowConf
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300/50'
        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    }`}>
      <span className="font-mono text-[10px] opacity-70">{entry.framework}</span>
      {entry.label}
      {lowConf && <span className="text-[9px] uppercase tracking-wide opacity-70">inferred</span>}
    </span>
  );

  if (entry.url) {
    return (
      <a href={entry.url} target="_blank" rel="noreferrer" className="hover:opacity-80 inline-flex items-center gap-0.5">
        {content}
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
    );
  }
  return content;
}

function ResultSection({ title, items, numbered }: { title: string; items: string[]; numbered?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-theme-elevated border border-theme">
      <h4 className="text-sm font-semibold text-cockpit mb-2">{title}</h4>
      {numbered ? (
        <ol className="text-sm text-theme-secondary space-y-1 list-decimal ml-5">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      ) : (
        <ul className="text-sm text-theme-secondary space-y-1">
          {items.map((item, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
