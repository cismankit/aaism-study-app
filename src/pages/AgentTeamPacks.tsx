import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Play, CheckCircle, Loader2, Copy, Check, ArrowRight,
  Radar, PenLine, Briefcase, Zap, LifeBuoy, Sparkles, Bot,
  ExternalLink, StopCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { AGENT_TEAM_PACKS, getTeamPack, type TeamPack } from '../data/agentTeamPacks';
import { OPS_AGENT_PROFILES, type OpsAgentId } from '../services/opsAgentService';
import {
  runTeamPackMission,
  type TeamPackPhase,
  type StepStatus,
  type TeamPackResult,
} from '../services/teamPackService';
import { useCert } from '../context/CertContext';

const PACK_ICONS: Record<TeamPack['icon'], typeof Radar> = {
  radar: Radar,
  'pen-line': PenLine,
  briefcase: Briefcase,
  zap: Zap,
  'life-buoy': LifeBuoy,
};

const PHASE_LABELS: Record<TeamPackPhase, string> = {
  idle: 'Ready',
  planning: 'Planning',
  executing: 'Executing',
  complete: 'Done',
  error: 'Error',
};

function PackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: TeamPack;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = PACK_ICONS[pack.icon];
  const agent = OPS_AGENT_PROFILES.find(a => a.id === pack.defaultAgent);

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-xl border p-4 transition-all hover:shadow-md ${
        selected
          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/30'
          : 'border-theme bg-theme-elevated hover:border-emerald-500/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-cockpit">{pack.name}</h3>
          <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">{pack.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {pack.linkedRoutes.slice(0, 2).map(r => (
              <span key={r.path} className="text-[10px] px-1.5 py-0.5 rounded bg-cockpit-track text-theme-muted">
                {r.label}
              </span>
            ))}
            {pack.linkedRoutes.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cockpit-track text-theme-muted">
                +{pack.linkedRoutes.length - 2}
              </span>
            )}
          </div>
          {agent && (
            <p className="text-[10px] text-theme-faint mt-2 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Lead: {agent.name}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function StepChecklist({ steps, phase }: { steps: StepStatus[]; phase: TeamPackPhase }) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm transition-all ${
            step.status === 'done'
              ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10'
              : step.status === 'running'
                ? 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-500/10 animate-pulse'
                : 'border-theme bg-theme-muted/30'
          }`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
            {step.status === 'done' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : step.status === 'running' ? (
              <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-theme-muted flex items-center justify-center text-[10px] text-theme-muted">
                {i + 1}
              </span>
            )}
          </div>
          <span className={step.status === 'done' ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-cockpit-muted'}>
            {step.label}
          </span>
        </div>
      ))}
      {phase !== 'idle' && (
        <p className="text-xs text-theme-muted text-center pt-1">
          Phase: <span className="font-medium text-cockpit">{PHASE_LABELS[phase]}</span>
        </p>
      )}
    </div>
  );
}

export default function AgentTeamPacks() {
  const { activeCert } = useCert();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const [selectedPackId, setSelectedPackId] = useState(AGENT_TEAM_PACKS[0].id);
  const [prompt, setPrompt] = useState('');
  const [agentId, setAgentId] = useState<OpsAgentId>('openclaw');
  const [phase, setPhase] = useState<TeamPackPhase>('idle');
  const [steps, setSteps] = useState<StepStatus[]>([]);
  const [result, setResult] = useState<TeamPackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pack = getTeamPack(selectedPackId) ?? AGENT_TEAM_PACKS[0];

  const selectPack = (id: string) => {
    const p = getTeamPack(id);
    if (!p) return;
    setSelectedPackId(id);
    setAgentId(p.defaultAgent);
    setPrompt('');
    setResult(null);
    setError(null);
    setPhase('idle');
    setSteps([]);
  };

  const isRunning = phase === 'planning' || phase === 'executing';

  const handleRun = useCallback(async () => {
    if (!prompt.trim() || isRunning) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult(null);
    setError(null);
    setSteps(pack.steps.map(s => ({ id: s.id, label: s.label, status: 'pending' })));

    try {
      await runTeamPackMission(
        pack.id,
        prompt.trim(),
        agentId,
        {
          onPhaseChange: setPhase,
          onStepsUpdate: setSteps,
          onComplete: setResult,
          onError: setError,
        },
        controller.signal,
      );
    } catch (e) {
      if ((e as Error).message !== 'Mission cancelled') {
        setError((e as Error).message);
        setPhase('error');
      }
    }
  }, [prompt, isRunning, pack, agentId]);

  const handleStop = () => {
    abortRef.current?.abort();
    setPhase('idle');
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    if (!result?.navigateTo) return;
    const params = new URLSearchParams(result.navigateParams ?? {});
    const qs = params.toString();
    navigate(qs ? `${result.navigateTo}?${qs}` : result.navigateTo);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Agentic Team Packs"
        subtitle={`Prompt → watch agents execute → get cert-aware results for ${activeCert.shortName}. Simulated multi-step runs with LLM output — not live browser automation.`}
        icon={Users}
        iconClassName="text-emerald-500"
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-theme-muted tracking-widest px-1">TEAM PACKS</h2>
          <div className="grid gap-3">
            {AGENT_TEAM_PACKS.map(p => (
              <PackCard
                key={p.id}
                pack={p}
                selected={p.id === selectedPackId}
                onSelect={() => selectPack(p.id)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title={`${pack.name} Mission`} icon={Sparkles} iconClassName="text-emerald-500">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {pack.linkedRoutes.map(r => (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg border border-theme hover:bg-cockpit-track transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {r.label}
                  </Link>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-theme-muted block mb-1.5">Lead agent</label>
                <div className="flex flex-wrap gap-2">
                  {OPS_AGENT_PROFILES.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAgentId(a.id)}
                      disabled={isRunning}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        agentId === a.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-theme text-theme-muted hover:bg-cockpit-track'
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-theme-muted block mb-1.5">
                  Mission prompt <span className="text-theme-faint">({activeCert.shortName}-aware)</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={isRunning}
                  rows={3}
                  placeholder={pack.samplePrompts[0]}
                  className="w-full rounded-lg border border-theme bg-theme-elevated px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pack.samplePrompts.map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(sample.replace('CISSP', activeCert.shortName))}
                      disabled={isRunning}
                      className="text-[10px] px-2 py-1 rounded-full bg-cockpit-track text-theme-muted hover:text-cockpit transition-colors"
                    >
                      {sample.length > 48 ? sample.slice(0, 48) + '…' : sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={!prompt.trim() || isRunning}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run team
                </button>
                {isRunning && (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </button>
                )}
              </div>

              {(steps.length > 0 || phase !== 'idle') && (
                <StepChecklist steps={steps} phase={phase} />
              )}

              {error && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-500/10 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-3 border-t border-theme pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-cockpit flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Mission complete
                      </h3>
                      <p className="text-sm text-theme-muted mt-1">{result.summary}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-theme text-xs hover:bg-cockpit-track"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                      {result.navigateTo && (
                        <button
                          onClick={handleNavigate}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                        >
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs p-4 rounded-lg bg-theme-muted/50 border border-theme overflow-x-auto max-h-64 whitespace-pre-wrap font-mono text-cockpit-muted">
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
