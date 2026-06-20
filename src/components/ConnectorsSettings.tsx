import { useState, useCallback, useEffect } from 'react';
import {
  getAllConnectors,
  setConnectorState,
  testConnector,
  loadConnectorsConfig,
  saveConnectorsConfig,
  type ConnectorRuntime,
  type ConnectorId,
} from '../services/connectorRegistry';
import ProviderPicker from './ProviderPicker';
import LocalLLMHub from './LocalLLMHub';
import GroqApiKeySection from './GroqApiKeySection';
import AIConnectionStatusPill from './AIConnectionStatusPill';
import { loadAIConfig, saveAIConfig, type AIConfig } from '../services/aiService';
import {
  Plug, Loader2, Check, X, ExternalLink, ChevronDown, ChevronUp, TestTube2,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI Providers',
  sync: 'Sync',
  data: 'Data',
  payments: 'Payments',
};

function StatusBadge({
  status,
  checking,
  lastMessage,
}: {
  status: ConnectorRuntime['status'];
  checking?: boolean;
  lastMessage?: string;
}) {
  const styles = {
    connected: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    disconnected: 'bg-cockpit-track text-cockpit-muted border-theme',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
    checking: 'bg-cockpit-track text-cockpit-muted border-theme',
  };
  const labels = {
    connected: 'Connected',
    disconnected: 'Off',
    error: 'Error',
    checking: 'Checking…',
  };
  const effectiveStatus = checking ? 'checking' : status;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${styles[effectiveStatus]}`}
      title={lastMessage}
    >
      {checking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {labels[effectiveStatus]}
    </span>
  );
}

function ConnectorCard({
  connector,
  expanded,
  onToggle,
  onUpdate,
  liveChecking,
}: {
  connector: ConnectorRuntime;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
  liveChecking?: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [fields, setFields] = useState(connector.fields);
  const [saved, setSaved] = useState(false);

  const handleToggleEnable = () => {
    setConnectorState(connector.id, {
      enabled: !connector.enabled,
      fields,
    });
    onUpdate();
  };

  const handleSaveFields = () => {
    setConnectorState(connector.id, {
      enabled: connector.enabled,
      fields,
    });
    const config = loadConnectorsConfig();
    saveConnectorsConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onUpdate();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setConnectorState(connector.id, { enabled: connector.enabled, fields });
    const result = await testConnector(connector.id);
    setTestResult(result);
    setTesting(false);
    onUpdate();
  };

  const inputClass =
    'w-full px-3 py-2 border border-theme rounded-lg bg-theme-page text-cockpit focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono';

  return (
    <div className="rounded-xl border border-theme bg-theme-elevated overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-cockpit-track/30 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
      >
        <Plug className="w-4 h-4 text-emerald-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-cockpit text-sm">{connector.name}</span>
            <StatusBadge
              status={connector.enabled ? connector.status : 'disconnected'}
              checking={liveChecking && connector.enabled}
              lastMessage={connector.lastMessage}
            />
            <span className="text-[10px] text-cockpit-muted uppercase tracking-wide">
              {connector.category}
            </span>
          </div>
          <p className="text-xs text-cockpit-muted mt-0.5 truncate">{connector.description}</p>
        </div>
        <label
          className="flex items-center gap-2 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-[10px] text-cockpit-muted">{connector.enabled ? 'On' : 'Off'}</span>
          <input
            type="checkbox"
            checked={connector.enabled}
            onChange={handleToggleEnable}
            className="rounded border-theme text-emerald-600 focus:ring-emerald-500"
          />
        </label>
        {expanded ? <ChevronUp className="w-4 h-4 text-cockpit-muted" /> : <ChevronDown className="w-4 h-4 text-cockpit-muted" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-theme space-y-3">
          {connector.id === 'ollama' && connector.enabled && (
            <LocalLLMHub onModelChange={model => setFields(f => ({ ...f, model }))} />
          )}

          {connector.id === 'groq' && connector.enabled && (
            <GroqWrapper fields={fields} onFieldsChange={setFields} />
          )}

          {connector.requiredFields && connector.id !== 'ollama' && connector.id !== 'groq' && (
            <div className="space-y-2">
              {connector.requiredFields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-theme-secondary mb-1">{field.label}</label>
                  <input
                    type={field.secret ? 'password' : 'text'}
                    value={fields[field.key] ?? ''}
                    onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}

          {connector.id === 'rss-intel' && connector.enabled && (
            <p className="text-xs text-cockpit-muted">
              Built-in RSS sources power Intel Hub. No API key required — enable to show live feeds on Command Center.
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {connector.requiredFields && connector.id !== 'groq' && (
              <button
                type="button"
                onClick={handleSaveFields}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700"
              >
                {saved ? '✓ Saved' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !connector.enabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cockpit-track border border-theme hover:opacity-90 disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube2 className="w-3 h-3" />}
              Test connection
            </button>
            {connector.docsUrl && (
              <a
                href={connector.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-emerald-600 hover:underline"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {testResult && (
            <div className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              {testResult.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
              {testResult.message}
            </div>
          )}

          {connector.lastMessage && !testResult && (
            <p className="text-[10px] text-cockpit-muted">
              Last check: {connector.lastMessage}
              {connector.lastChecked && ` · ${new Date(connector.lastChecked).toLocaleString()}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function GroqWrapper({
  fields,
  onFieldsChange,
}: {
  fields: Record<string, string>;
  onFieldsChange: (f: Record<string, string>) => void;
}) {
  const [config, setConfig] = useState<AIConfig>(() => ({
    ...loadAIConfig(),
    provider: 'groq',
    apiKey: fields.apiKey,
    model: fields.model || loadAIConfig().model,
  }));

  const handleChange = (c: AIConfig) => {
    setConfig(c);
    onFieldsChange({
      apiKey: c.apiKey ?? '',
      model: c.model,
    });
    const registryConfig = loadConnectorsConfig();
    registryConfig.connectors.groq = {
      enabled: true,
      fields: { apiKey: c.apiKey ?? '', model: c.model },
    };
    saveConnectorsConfig(registryConfig);
    saveAIConfig(c);
  };

  return (
    <GroqApiKeySection
      config={config}
      onChange={handleChange}
      savedKey={fields.apiKey}
    />
  );
}

export default function ConnectorsSettings() {
  const [connectors, setConnectors] = useState<ConnectorRuntime[]>(() => getAllConnectors());
  const [expandedId, setExpandedId] = useState<ConnectorId | null>('ollama');
  const [liveChecking, setLiveChecking] = useState(false);

  const refresh = useCallback(() => {
    setConnectors(getAllConnectors());
  }, []);

  useEffect(() => {
    const onPollStart = () => setLiveChecking(true);
    const onPollDone = () => {
      refresh();
      setLiveChecking(false);
    };
    window.addEventListener('aaism-connectors-poll-start', onPollStart);
    window.addEventListener('aaism-connectors-refreshed', onPollDone);
    return () => {
      window.removeEventListener('aaism-connectors-poll-start', onPollStart);
      window.removeEventListener('aaism-connectors-refreshed', onPollDone);
    };
  }, [refresh]);

  const grouped = connectors.reduce<Record<string, ConnectorRuntime[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <AIConnectionStatusPill />

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <h3 className="font-semibold text-cockpit flex items-center gap-2 mb-1">
          <Plug className="w-4 h-4 text-emerald-500" />
          Pluggable Connectors
        </h3>
        <p className="text-xs text-cockpit-muted">
          Enable only what you need. Secrets stay in <code className="text-[10px]">localStorage</code> — never sent to Aegis servers.
          Config key: <code className="text-[10px]">aegis-connectors-config</code>
        </p>
      </div>

      <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
        <ProviderPicker onChange={refresh} />
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wide mb-2">
            {CATEGORY_LABELS[category] ?? category}
          </h4>
          <div className="space-y-2">
            {items.map(c => (
              <ConnectorCard
                key={c.id}
                connector={c}
                expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                onUpdate={refresh}
                liveChecking={liveChecking}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
