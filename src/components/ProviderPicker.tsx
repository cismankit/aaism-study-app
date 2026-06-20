import { useState, useEffect } from 'react';
import {
  getPrimaryAiProvider,
  setPrimaryAiProvider,
  getAiConnectors,
  getConnectorState,
  saveConnectorsConfig,
  loadConnectorsConfig,
  buildAIConfigFromConnectors,
  PROVIDER_TO_CONNECTOR,
  type ConnectorRuntime,
  type ConnectorId,
} from '../services/connectorRegistry';
import {
  type AIProvider,
  defaultConfigs,
  saveAIConfig,
} from '../services/aiService';
import { Server, Sparkles, Zap, Cloud, Check, AlertCircle } from 'lucide-react';

const PROVIDER_OPTIONS: {
  id: AIProvider;
  label: string;
  icon: typeof Server;
  connectorId: string;
  hint: string;
}[] = [
  { id: 'ollama', label: 'Ollama (local)', icon: Server, connectorId: 'ollama', hint: 'Private · offline' },
  { id: 'groq', label: 'Groq', icon: Sparkles, connectorId: 'groq', hint: 'Free cloud · fast' },
  { id: 'claude', label: 'Anthropic', icon: Zap, connectorId: 'anthropic', hint: 'Claude models' },
  { id: 'openai', label: 'OpenAI', icon: Cloud, connectorId: 'openai', hint: 'GPT models' },
];

interface ProviderPickerProps {
  onChange?: (provider: AIProvider) => void;
  compact?: boolean;
}

export default function ProviderPicker({ onChange, compact = false }: ProviderPickerProps) {
  const [primary, setPrimary] = useState<AIProvider>(() => getPrimaryAiProvider());
  const [connectors, setConnectors] = useState<ConnectorRuntime[]>(() => getAiConnectors());

  useEffect(() => {
    setConnectors(getAiConnectors());
  }, [primary]);

  const handleSelect = (provider: AIProvider) => {
    setPrimary(provider);
    setPrimaryAiProvider(provider);

    const cid = PROVIDER_TO_CONNECTOR[provider];
    const config = loadConnectorsConfig();
    const existing = config.connectors[cid] ?? { enabled: true, fields: {} };
    config.connectors[cid] = { ...existing, enabled: true };
    saveConnectorsConfig(config);

    const aiConfig = buildAIConfigFromConnectors(config);
    saveAIConfig({ ...aiConfig, provider, ...defaultConfigs[provider] });
    onChange?.(provider);
    setConnectors(getAiConnectors());
  };

  const getConnectorStatus = (connectorId: string): ConnectorRuntime | undefined =>
    connectors.find(c => c.id === connectorId);

  return (
    <div className="space-y-3">
      {!compact && (
        <div>
          <h4 className="text-sm font-semibold text-cockpit mb-1">Primary AI provider</h4>
          <p className="text-xs text-cockpit-muted">
            Used globally for Agent Discovery, Ops Copilot, Tutor, and study assistant.
            Fallback: Groq if primary lacks a key.
          </p>
        </div>
      )}

      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
        {PROVIDER_OPTIONS.map(({ id, label, icon: Icon, connectorId, hint }) => {
          const conn = getConnectorStatus(connectorId);
          const isActive = primary === id;
          const state = conn ? getConnectorState(conn.id as ConnectorId) : null;
          const configured =
            id === 'ollama'
              ? Boolean(state?.enabled)
              : Boolean(state?.fields.apiKey?.trim());

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-theme bg-theme-elevated hover:border-emerald-500/40'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20' : 'bg-cockpit-track'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-cockpit-muted'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-cockpit">{label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-cockpit-muted">{hint}</p>
                {conn && (
                  <span className={`inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${
                    conn.status === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : conn.status === 'error'
                        ? 'bg-red-500/15 text-red-600'
                        : configured
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-cockpit-track text-cockpit-muted'
                  }`}>
                    {conn.status === 'connected' ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5" />
                    )}
                    {conn.status === 'connected' ? 'Connected' : conn.status === 'error' ? 'Error' : configured ? 'Configured' : 'Not configured'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
