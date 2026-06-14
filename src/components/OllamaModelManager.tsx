import { useState, useEffect, useCallback } from 'react';
import {
  AAISM_OFFLINE_MODELS,
  pullOllamaModel,
  checkOllamaStatus,
  type OllamaModel,
  type ModelCapability,
} from '../services/aiService';
import { detectGpuHint, isLocalhost } from '../services/gpuDetection';
import {
  Download, Copy, Check, Loader2, Server, Cpu, ExternalLink,
  AlertTriangle, Star, Terminal,
} from 'lucide-react';

interface OllamaModelManagerProps {
  baseUrl?: string;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  const gb = bytes / (1024 ** 3);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(0)} MB`;
}

function jsonBadge(score: number): { label: string; className: string } {
  if (score >= 85) return { label: 'Excellent', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (score >= 70) return { label: 'Good', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  return { label: 'Poor for JSON', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
}

export default function OllamaModelManager({
  baseUrl = 'http://localhost:11434',
  selectedModel,
  onSelectModel,
}: OllamaModelManagerProps) {
  const [localMode, setLocalMode] = useState(false);
  const [ollamaRunning, setOllamaRunning] = useState(false);
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const gpu = detectGpuHint();

  const refreshModels = useCallback(async () => {
    if (!localMode) return;
    const status = await checkOllamaStatus(baseUrl);
    setOllamaRunning(status.running);
    setInstalledModels(status.models);
  }, [baseUrl, localMode]);

  useEffect(() => {
    setLocalMode(isLocalhost());
  }, []);

  useEffect(() => {
    if (localMode) refreshModels();
  }, [localMode, refreshModels]);

  const isInstalled = (name: string) =>
    installedModels.some(m => m.name === name || m.name.startsWith(name.split(':')[0]));

  const handlePull = async (model: ModelCapability) => {
    const cmd = `ollama pull ${model.name}`;
    if (!localMode || !ollamaRunning) {
      await navigator.clipboard.writeText(cmd);
      setCopied(model.name);
      setTimeout(() => setCopied(null), 2000);
      return;
    }

    setPulling(model.name);
    setPullStatus('Starting download...');
    const result = await pullOllamaModel(model.name, baseUrl, setPullStatus);
    setPulling(null);
    if (result.success) {
      await refreshModels();
      onSelectModel?.(model.name);
    } else {
      setPullStatus(result.error || 'Pull failed');
    }
  };

  const copyCommand = async (cmd: string, id: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* GPU Guidance */}
      <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-cyan-900 dark:text-cyan-200">GPU Acceleration</p>
            <p className="text-cyan-800 dark:text-cyan-300/90">{gpu.recommendation}</p>
            <div className="text-xs text-cyan-700 dark:text-cyan-400/80 space-y-1">
              <p>Detected: {gpu.renderer}</p>
              {gpu.estimatedVramGb && <p>Estimated memory: ~{gpu.estimatedVramGb}GB</p>}
              <p>
                Ollama auto-detects GPU (Metal on Mac, CUDA on NVIDIA, ROCm on AMD).
                Run <code className="bg-cyan-100 dark:bg-cyan-900/40 px-1 rounded">ollama ps</code> to verify GPU layers.
                Tune with <code className="bg-cyan-100 dark:bg-cyan-900/40 px-1 rounded">OLLAMA_NUM_GPU</code> env var.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Localhost status */}
      <div className="flex items-center gap-2 text-sm">
        <Server className="w-4 h-4 text-gray-500" />
        {localMode ? (
          ollamaRunning ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Ollama connected — {installedModels.length} model(s) installed
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              Ollama not detected on localhost — use commands below
            </span>
          )
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            GitHub Pages mode — copy commands to run locally
          </span>
        )}
        {!localMode && (
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 hover:underline text-xs ml-auto"
          >
            Get Ollama <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Recommended models table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 text-left text-xs text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Size</th>
              <th className="px-3 py-2 font-medium">JSON</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">GPU RAM</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {AAISM_OFFLINE_MODELS.map(model => {
              const badge = jsonBadge(model.jsonReliability);
              const installed = isInstalled(model.name);
              const isSelected = selectedModel === model.name;
              return (
                <tr
                  key={model.name}
                  className={`${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-white dark:bg-gray-800'}`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {model.recommended && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      <span className="font-mono text-xs font-medium text-gray-900 dark:text-white">{model.name}</span>
                      {installed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          installed
                        </span>
                      )}
                      {model.fallbackOnly && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          fallback
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{model.description}</p>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{model.sizeGb}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 hidden md:table-cell">{model.gpuRam}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {onSelectModel && (
                        <button
                          onClick={() => onSelectModel(model.name)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Use
                        </button>
                      )}
                      <button
                        onClick={() => handlePull(model)}
                        disabled={pulling === model.name}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                        title={localMode && ollamaRunning ? 'Pull via Ollama API' : 'Copy pull command'}
                      >
                        {pulling === model.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : copied === model.name ? (
                          <Check className="w-3 h-3" />
                        ) : localMode && ollamaRunning ? (
                          <Download className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {localMode && ollamaRunning ? 'Pull' : 'Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pullStatus && pulling && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {pullStatus}
        </div>
      )}

      {/* Installed models (localhost) */}
      {localMode && installedModels.length > 0 && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> Installed Models
          </p>
          <div className="flex flex-wrap gap-1.5">
            {installedModels.map(m => (
              <button
                key={m.name}
                onClick={() => onSelectModel?.(m.name)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  selectedModel === m.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {m.name} ({formatSize(m.size)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick setup commands */}
      <div className="p-3 rounded-lg bg-gray-900 text-gray-300 font-mono text-xs space-y-2">
        <p className="text-gray-500"># Recommended setup for Agent Discovery</p>
        {['ollama pull llama3.1:8b', 'ollama pull qwen2.5:7b'].map(cmd => (
          <div key={cmd} className="flex items-center justify-between gap-2">
            <code>{cmd}</code>
            <button
              onClick={() => copyCommand(cmd, cmd)}
              className="p-1 hover:bg-gray-800 rounded shrink-0"
              title="Copy command"
            >
              {copied === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>

      {selectedModel && AAISM_OFFLINE_MODELS.find(m => m.name === selectedModel)?.fallbackOnly && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>{selectedModel}</strong> is too small for reliable JSON in Agent Discovery.
            Switch to <strong>llama3.1:8b</strong> for best results.
          </p>
        </div>
      )}
    </div>
  );
}
