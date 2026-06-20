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
import { isLocalhost } from '../services/gpuDetection';
import {
  Server, Copy, Check, Loader2, Download, RefreshCw, AlertCircle, CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface LocalLLMHubProps {
  onModelChange?: (model: string) => void;
}

type HubStatus = 'connected' | 'not-running' | 'model-missing' | 'unknown';

export default function LocalLLMHub({ onModelChange }: LocalLLMHubProps) {
  const ollamaState = getConnectorState('ollama');
  const baseUrl = ollamaState.fields.baseUrl || 'http://localhost:11434';
  const defaultModel = ollamaState.fields.model || 'qwen2.5:7b';

  const [localMode, setLocalMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const status = await checkOllamaStatus(baseUrl);
    setRunning(status.running);
    setModels(status.models);
    setRefreshing(false);
    return status;
  }, [baseUrl]);

  useEffect(() => {
    setLocalMode(isLocalhost());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setSelectedModel(defaultModel);
  }, [defaultModel]);

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

  const handlePull = async (modelName: string) => {
    const cmd = `ollama pull ${modelName}`;
    if (!localMode || !running) {
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
    } else {
      setPullStatus(result.error ?? 'Pull failed');
    }
  };

  const copyCmd = async (cmd: string, id: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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

      {!localMode && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-cockpit-muted">
          <strong className="text-cockpit">Browser mode:</strong> Run Ollama locally or use the{' '}
          <strong>Aegis Mac app</strong> for one-click model pulls via the Ollama API.
          Copy the commands below and run them in Terminal.
        </div>
      )}

      {localMode && !running && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-cockpit-muted">
          Start Ollama: <code className="font-mono bg-cockpit-track px-1 rounded">ollama serve</code>
          {' '}· Install from{' '}
          <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">
            ollama.com <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {autoPick && (
        <p className="text-xs text-cockpit-muted">
          Agent auto-pick: <code className="font-mono text-emerald-600">{autoPick}</code>
        </p>
      )}

      {/* Recommended pulls */}
      <div>
        <h4 className="text-sm font-medium text-cockpit mb-2">Recommended models</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {RECOMMENDED_OLLAMA_PULLS.map(rec => {
            const installed = models.some(m => m.name === rec.name || m.name.startsWith(rec.name.split(':')[0]));
            const cmd = `ollama pull ${rec.name}`;
            return (
              <div
                key={rec.name}
                className="p-3 rounded-lg border border-theme bg-cockpit-track/50 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <code className="text-xs font-mono font-medium text-cockpit">{rec.name}</code>
                    <p className="text-[10px] text-cockpit-muted mt-0.5">{rec.description}</p>
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
                    onClick={() => handlePull(rec.name)}
                    disabled={pulling === rec.name}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {pulling === rec.name ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : localMode && running ? (
                      <Download className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {localMode && running ? 'Pull' : 'Copy cmd'}
                  </button>
                  {installed && (
                    <button
                      type="button"
                      onClick={() => setDefaultModel(rec.name)}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium border ${
                        selectedModel === rec.name
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-theme text-cockpit hover:bg-theme-muted'
                      }`}
                    >
                      Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => copyCmd(cmd, rec.name)}
                    className="p-1.5 rounded border border-theme hover:bg-theme-muted"
                    title="Copy command"
                  >
                    {copied === rec.name ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pullStatus && pulling && (
        <div className="flex items-center gap-2 text-xs text-cockpit-muted">
          <Loader2 className="w-3 h-3 animate-spin" />
          {pullStatus}
        </div>
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

      <div className="p-3 rounded-lg bg-gray-900 text-gray-300 font-mono text-xs">
        <p className="text-gray-500 mb-1"># Quick start</p>
        <div className="flex items-center justify-between gap-2">
          <code>ollama pull llama3.1:8b</code>
          <button type="button" onClick={() => copyCmd('ollama pull llama3.1:8b', 'quick')} className="p-1 hover:bg-gray-800 rounded">
            {copied === 'quick' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
