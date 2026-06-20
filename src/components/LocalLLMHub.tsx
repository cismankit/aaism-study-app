import { useState, useEffect, useCallback } from 'react';
import {
  checkOllamaStatus,
  pullOllamaModel,
  pickBestInstalledModel,
  type OllamaModel,
} from '../services/aiService';
import {
  getConnectorState,
  saveConnectorsConfig,
  loadConnectorsConfig,
} from '../services/connectorRegistry';
import { RECOMMENDED_OLLAMA_PULLS } from '../data/connectors/definitions';
import { detectGpuHint } from '../services/gpuDetection';
import {
  canUseOllamaApi,
  openOllamaApp,
  runOllamaTestPrompt,
} from '../services/ollamaAppService';
import { isTauri } from '../utils/tauriEnv';
import {
  Server, Copy, Check, Loader2, Download, RefreshCw, AlertCircle, CheckCircle2,
  ExternalLink, Play, ChevronRight, Terminal, Sparkles,
} from 'lucide-react';

interface LocalLLMHubProps {
  onModelChange?: (model: string) => void;
}

type HubStatus = 'connected' | 'not-running' | 'model-missing' | 'unknown';
type WizardStep = 1 | 2 | 3;

export default function LocalLLMHub({ onModelChange }: LocalLLMHubProps) {
  const ollamaState = getConnectorState('ollama');
  const baseUrl = ollamaState.fields.baseUrl || 'http://localhost:11434';
  const defaultModel = ollamaState.fields.model || 'gemma4:latest';

  const [localApi, setLocalApi] = useState(false);
  const [running, setRunning] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openingOllama, setOpeningOllama] = useState(false);
  const [openMessage, setOpenMessage] = useState('');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const gpu = detectGpuHint();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const status = await checkOllamaStatus(baseUrl);
    setRunning(status.running);
    setModels(status.models);
    setRefreshing(false);
    return status;
  }, [baseUrl]);

  useEffect(() => {
    setLocalApi(canUseOllamaApi());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setSelectedModel(defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    if (running && models.length > 0) {
      const installed = models.some(m => m.name === selectedModel || m.name.startsWith(selectedModel.split(':')[0] + ':'));
      setWizardStep(installed ? 3 : 2);
    } else if (running) {
      setWizardStep(2);
    } else {
      setWizardStep(1);
    }
  }, [running, models, selectedModel]);

  const modelInstalled = models.some(
    m => m.name === selectedModel || m.name.startsWith(selectedModel.split(':')[0] + ':'),
  );

  const hubStatus: HubStatus = !running
    ? 'not-running'
    : models.length === 0
      ? 'model-missing'
      : !modelInstalled
        ? 'model-missing'
        : 'connected';

  const statusConfig: Record<HubStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    connected: {
      label: 'Connected',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
    },
    'not-running': {
      label: 'Not running',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: AlertCircle,
    },
    'model-missing': {
      label: 'Model missing',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: AlertCircle,
    },
    unknown: {
      label: 'Checking…',
      className: 'bg-cockpit-track text-cockpit-muted border-theme',
      icon: Server,
    },
  };

  const statusInfo = statusConfig[hubStatus];
  const StatusIcon = statusInfo.icon;
  const autoPick = models.length > 0 ? pickBestInstalledModel(models) : null;

  const setDefaultModel = (modelName: string) => {
    setSelectedModel(modelName);
    const config = loadConnectorsConfig();
    config.connectors.ollama = {
      ...(config.connectors.ollama ?? { enabled: true, fields: {} }),
      enabled: true,
      fields: { ...ollamaState.fields, baseUrl, model: modelName },
    };
    saveConnectorsConfig(config);
    onModelChange?.(modelName);
  };

  const handleOpenOllama = async () => {
    setOpeningOllama(true);
    setOpenMessage('');
    const result = await openOllamaApp();
    setOpenMessage(result.message);
    setOpeningOllama(false);
    setTimeout(() => void refresh(), 2500);
  };

  const handlePull = async (modelName: string) => {
    const cmd = `ollama pull ${modelName}`;
    if (!localApi || !running) {
      await navigator.clipboard.writeText(cmd);
      setCopied(modelName);
      setTimeout(() => setCopied(null), 2000);
      return;
    }

    setPulling(modelName);
    setPullStatus('Starting download…');
    const result = await pullOllamaModel(modelName, baseUrl, setPullStatus);
    setPulling(null);
    if (result.success) {
      await refresh();
      setDefaultModel(modelName);
      setPullStatus('');
      setWizardStep(3);
    } else {
      setPullStatus(result.error ?? 'Pull failed');
    }
  };

  const handleTest = async () => {
    const model = modelInstalled ? selectedModel : (autoPick ?? selectedModel);
    setTesting(true);
    setTestResult(null);
    const result = await runOllamaTestPrompt(baseUrl, model);
    setTestResult(result);
    setTesting(false);
    if (result.ok && model !== selectedModel) {
      setDefaultModel(model);
    }
  };

  const copyCmd = async (cmd: string, id: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const wizardSteps = [
    { n: 1 as const, label: 'Install & start' },
    { n: 2 as const, label: 'Pull model' },
    { n: 3 as const, label: 'Test' },
  ];

  const recommendedForMac = RECOMMENDED_OLLAMA_PULLS.filter(rec => {
    if (!gpu.estimatedVramGb) return rec.macRam === '16GB';
    if (gpu.estimatedVramGb >= 24) return true;
    if (gpu.estimatedVramGb >= 12) return rec.macRam !== '32GB';
    return rec.macRam === '8GB' || rec.name === 'gemma4:latest';
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-cockpit">Local LLM Hub</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${statusInfo.className}`}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </span>
          {isTauri() && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 border border-violet-500/30">
              Mac app
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="text-xs px-3 py-1.5 rounded-lg bg-cockpit-track border border-theme hover:opacity-90 flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-xs text-cockpit-muted">
        <strong className="text-cockpit">You don&apos;t need Terminal</strong> — use the buttons below.
        {isTauri() && ' The Mac app talks to Ollama directly (no CORS).'}
      </p>

      {/* Wizard stepper */}
      <div className="flex items-center gap-1 text-xs">
        {wizardSteps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWizardStep(s.n)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                wizardStep === s.n
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : wizardStep > s.n
                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                    : 'bg-cockpit-track text-cockpit-muted border-theme'
              }`}
            >
              <span className="font-mono font-bold">{s.n}</span>
              {s.label}
              {wizardStep > s.n && <Check className="w-3 h-3" />}
            </button>
            {i < wizardSteps.length - 1 && <ChevronRight className="w-3 h-3 text-cockpit-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Install & start */}
      {wizardStep === 1 && (
        <div className="p-4 rounded-xl border border-theme bg-cockpit-track/30 space-y-3">
          <h4 className="text-sm font-medium text-cockpit">Step 1 — Install &amp; start Ollama</h4>
          <p className="text-xs text-cockpit-muted">
            Ollama runs locally on your Mac. Download once, then launch the app — it starts the server automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-cockpit-track border border-theme hover:opacity-90"
            >
              Download Ollama <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => void handleOpenOllama()}
              disabled={openingOllama}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {openingOllama ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Open Ollama app
            </button>
            {running && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 px-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Server detected
              </span>
            )}
          </div>
          {openMessage && <p className="text-xs text-cockpit-muted">{openMessage}</p>}
          {running && (
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              Continue to pull a model <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Step 2: Pull model */}
      {wizardStep === 2 && (
        <div className="p-4 rounded-xl border border-theme bg-cockpit-track/30 space-y-3">
          <h4 className="text-sm font-medium text-cockpit">Step 2 — Pull a model</h4>
          <p className="text-xs text-cockpit-muted">
            {gpu.isAppleSilicon
              ? `Apple Silicon detected (~${gpu.estimatedVramGb ?? '?'}GB unified memory). Highlighted models fit your Mac.`
              : 'Pick a model sized for your GPU memory.'}
            {' '}GLM-5 is not on Ollama yet — use Gemma 4 or Qwen 2.5 instead.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {recommendedForMac.slice(0, 4).map(rec => {
              const installed = models.some(m => m.name === rec.name || m.name.startsWith(rec.name.split(':')[0] + ':'));
              const cmd = `ollama pull ${rec.name}`;
              const isPrimary =
                (gpu.estimatedVramGb && gpu.estimatedVramGb >= 24 && rec.name === 'gemma4:31b') ||
                (gpu.estimatedVramGb && gpu.estimatedVramGb >= 12 && gpu.estimatedVramGb < 24 && rec.name === 'gemma4:latest') ||
                (gpu.estimatedVramGb && gpu.estimatedVramGb < 12 && rec.name === 'gemma4:e4b');
              return (
                <div
                  key={rec.name}
                  className={`p-3 rounded-lg border flex flex-col gap-2 ${
                    isPrimary ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-theme bg-cockpit-track/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <code className="text-xs font-mono font-medium text-cockpit">{rec.name}</code>
                        {isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> For your Mac
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-cockpit-muted mt-0.5">{rec.description}</p>
                      <p className="text-[10px] text-cockpit-muted">{rec.macRam} RAM</p>
                    </div>
                    {installed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 shrink-0">
                        installed
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void handlePull(rec.name)}
                      disabled={pulling === rec.name || installed}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {pulling === rec.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : localApi && running ? (
                        <Download className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {installed ? 'Installed' : localApi && running ? 'Pull' : 'Copy cmd'}
                    </button>
                    {installed && (
                      <button
                        type="button"
                        onClick={() => { setDefaultModel(rec.name); setWizardStep(3); }}
                        className="px-2 py-1.5 rounded text-[11px] font-medium border border-emerald-600 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        Use
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void copyCmd(cmd, rec.name)}
                      className="p-1.5 rounded border border-theme hover:bg-theme-muted"
                      title="Copy Terminal command"
                    >
                      {copied === rec.name ? <Check className="w-3 h-3 text-emerald-500" /> : <Terminal className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {pullStatus && pulling && (
            <div className="flex items-center gap-2 text-xs text-cockpit-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              {pullStatus}
            </div>
          )}
          {!running && (
            <p className="text-xs text-amber-600">
              Ollama not detected — go back to Step 1 and click &quot;Open Ollama app&quot;.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Test */}
      {wizardStep === 3 && (
        <div className="p-4 rounded-xl border border-theme bg-cockpit-track/30 space-y-3">
          <h4 className="text-sm font-medium text-cockpit">Step 3 — Test your setup</h4>
          <p className="text-xs text-cockpit-muted">
            Sends a short prompt to <code className="font-mono">{modelInstalled ? selectedModel : (autoPick ?? 'your model')}</code>.
            If this succeeds, AI features in Aegis are ready.
          </p>
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={testing || !running}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run test prompt
          </button>
          {testResult && (
            <div className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {testResult.message}
            </div>
          )}
          {hubStatus === 'connected' && testResult?.ok && (
            <p className="text-xs text-emerald-600 font-medium">All set — Ollama is online and responding.</p>
          )}
        </div>
      )}

      {autoPick && (
        <p className="text-xs text-cockpit-muted">
          Agent auto-pick: <code className="font-mono text-emerald-600">{autoPick}</code>
        </p>
      )}

      {/* Installed models */}
      {models.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-cockpit mb-2">
            Installed ({models.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {models.map(m => (
              <button
                key={m.name}
                type="button"
                onClick={() => setDefaultModel(m.name)}
                className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                  selectedModel === m.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cockpit-track border border-theme text-cockpit hover:bg-theme-muted'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-cockpit-muted mt-2">
            Default model: <code className="font-mono">{selectedModel}</code>
          </p>
        </div>
      )}

      {/* Advanced Terminal commands */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs text-cockpit-muted hover:text-cockpit flex items-center gap-1"
        >
          <Terminal className="w-3 h-3" />
          {showAdvanced ? 'Hide' : 'Show'} advanced Terminal commands
          <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>
        {showAdvanced && (
          <div className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-300 font-mono text-xs space-y-2">
            <p className="text-gray-500"># Only if you prefer Terminal.app</p>
            {['ollama serve', 'ollama pull gemma4:latest', 'ollama pull qwen2.5:7b'].map(cmd => (
              <div key={cmd} className="flex items-center justify-between gap-2">
                <code>{cmd}</code>
                <button type="button" onClick={() => void copyCmd(cmd, cmd)} className="p-1 hover:bg-gray-800 rounded">
                  {copied === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
