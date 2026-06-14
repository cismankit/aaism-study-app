import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GROQ_MODELS,
  maskApiKey,
  testGroqConnection,
  clearAIConfigApiKey,
  type AIConfig,
} from '../services/aiService';
import {
  Eye, EyeOff, Shield, Loader2, Check, X, ExternalLink, Sparkles, Trash2,
} from 'lucide-react';

interface GroqApiKeySectionProps {
  config: AIConfig;
  onChange: (config: AIConfig) => void;
  savedKey?: string;
}

export default function GroqApiKeySection({ config, onChange, savedKey }: GroqApiKeySectionProps) {
  const [showKey, setShowKey] = useState(false);
  const [editingKey, setEditingKey] = useState(() => !(savedKey || config.apiKey)?.trim());
  const [persistedKey, setPersistedKey] = useState(() => savedKey || config.apiKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const showMasked = Boolean(persistedKey.trim()) && !editingKey;

  useEffect(() => {
    if (savedKey?.trim()) {
      setPersistedKey(savedKey);
      setEditingKey(false);
    }
  }, [savedKey]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testGroqConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleClearKey = () => {
    if (!confirm('Remove your Groq API key from this browser?')) return;
    clearAIConfigApiKey();
    onChange({ ...config, apiKey: undefined });
    setPersistedKey('');
    setEditingKey(true);
    setTestResult(null);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Groq API Key (Free Tier)
        </h3>
        <ol className="text-sm text-green-800 dark:text-green-300 space-y-1.5 list-decimal list-inside">
          <li>
            Get a free key at{' '}
            <a
              href="https://console.groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium inline-flex items-center gap-0.5"
            >
              console.groq.com <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>Paste below — stored only in your browser <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded text-xs">localStorage</code>, never sent to our servers</li>
          <li>Select <strong>Groq</strong> as provider and pick a model (Llama 3.3 70B, Mixtral, etc.)</li>
        </ol>
        <p className="text-xs text-green-700 dark:text-green-400 mt-2">
          Free tier: ~14,400 requests/day · No credit card required
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <p><strong>Security:</strong> Your key stays on this device only. Do not share your screen while the key is visible.</p>
          <p>Use <strong>Clear API key</strong> before logging out of a shared computer, or use Danger Zone → Clear All Data.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
        </label>
        {showMasked ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300">
              {maskApiKey(persistedKey)}
            </code>
            <button
              type="button"
              onClick={() => {
                setEditingKey(true);
                onChange({ ...config, apiKey: '' });
              }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey || ''}
              onChange={e => onChange({ ...config, apiKey: e.target.value })}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="gsk_..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Saved to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">aaism-ai-config</code> in browser localStorage
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
        <select
          value={config.model}
          onChange={e => onChange({ ...config, model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {GROQ_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !config.apiKey?.trim()}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Test Connection
        </button>
        {persistedKey.trim() && (
          <button
            type="button"
            onClick={handleClearKey}
            className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear API key
          </button>
        )}
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
          testResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {testResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <X className="w-4 h-4 shrink-0 mt-0.5" />}
          {testResult.message}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Need help? See{' '}
        <Link to="/help" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Help Center → How to add Groq API key
        </Link>
      </p>
    </div>
  );
}
