import { useState } from 'react';
import { 
  AIConfig, 
  AIProvider, 
  defaultConfigs, 
  loadAIConfig, 
  saveAIConfig,
  testConnection 
} from '../services/aiService';
import { Settings, Check, X, Loader2, Server, Cloud, Zap, Sparkles } from 'lucide-react';

export default function AISettings() {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const providers: { id: AIProvider; name: string; icon: typeof Server; description: string; badge?: string }[] = [
    { 
      id: 'ollama', 
      name: 'Ollama (Local)', 
      icon: Server, 
      description: 'Run AI locally on your machine. Free, private, no API key needed.' 
    },
    { 
      id: 'groq', 
      name: 'Groq', 
      icon: Sparkles, 
      description: 'Blazing fast inference. FREE tier with generous limits!',
      badge: '🆓 FREE'
    },
    { 
      id: 'claude', 
      name: 'Claude (Anthropic)', 
      icon: Zap, 
      description: 'Anthropic\'s Claude models. Requires API key.' 
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: Cloud, 
      description: 'GPT models from OpenAI. Requires API key.' 
    },
  ];

  const handleProviderChange = (provider: AIProvider) => {
    setConfig({
      ...config,
      provider,
      ...defaultConfigs[provider],
    });
    setTestResult(null);
    setSaved(false);
  };

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-primary-500" />
          AI Settings
        </h1>
        <p className="text-gray-600 mt-2">Configure your AI provider for the study assistant</p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">AI Provider</h2>
        <div className="space-y-3">
          {providers.map(({ id, name, icon: Icon, description, badge }) => (
            <button
              key={id}
              onClick={() => handleProviderChange(id)}
              className={`w-full p-4 rounded-lg border text-left transition-colors flex items-start gap-4 ${
                config.provider === id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${config.provider === id ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <Icon size={24} className={config.provider === id ? 'text-primary-600' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{name}</span>
                  {badge && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {badge}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
              {config.provider === id && (
                <Check className="text-primary-600" size={20} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Provider-specific Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        
        {config.provider === 'ollama' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Ollama Setup</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                <li>Run: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2</code></li>
                <li>Ollama runs on localhost:11434 by default</li>
              </ol>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="http://localhost:11434"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="llama3.2">Llama 3.2 (Recommended)</option>
                <option value="llama3.1">Llama 3.1</option>
                <option value="llama3">Llama 3</option>
                <option value="mistral">Mistral</option>
                <option value="mixtral">Mixtral</option>
                <option value="phi3">Phi-3</option>
                <option value="gemma2">Gemma 2</option>
                <option value="qwen2.5">Qwen 2.5</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Make sure you've pulled this model: <code>ollama pull {config.model}</code>
              </p>
            </div>
          </div>
        )}

        {config.provider === 'groq' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">🎉 Groq - Free & Lightning Fast!</h3>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Create a free account at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">console.groq.com</a></li>
                <li>Go to API Keys and create a new key</li>
                <li>Paste your API key below</li>
              </ol>
              <p className="text-xs text-green-600 mt-2">
                ✓ Free tier: ~14,400 requests/day · No credit card required
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="gsk_..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Faster)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                <option value="gemma2-9b-it">Gemma 2 9B</option>
              </select>
            </div>
          </div>
        )}

        {config.provider === 'claude' && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Claude API Setup</h3>
              <p className="text-sm text-purple-700">
                Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="sk-ant-..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recommended)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Faster)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (Most Capable)</option>
              </select>
            </div>
          </div>
        )}

        {config.provider === 'openai' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">OpenAI API Setup</h3>
              <p className="text-sm text-green-700">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="sk-..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster/Cheaper)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Test & Save */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Test Connection</h2>
        
        <div className="flex gap-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {testing ? <Loader2 size={18} className="animate-spin" /> : null}
            Test Connection
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            {saved ? <Check size={18} /> : null}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {testResult.success ? (
              <Check className="text-green-600" size={20} />
            ) : (
              <X className="text-red-600" size={20} />
            )}
            <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              {testResult.message}
            </span>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Advanced</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Base URL (Optional)</label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Custom API endpoint..."
            />
            <p className="text-xs text-gray-500 mt-1">
              For proxies, local deployments, or Azure OpenAI endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">🔒 Privacy Note</h3>
        <p className="text-sm text-gray-600">
          {config.provider === 'ollama' 
            ? 'Ollama runs entirely on your machine. Your data never leaves your computer.'
            : 'Your conversations are sent to the API provider. API keys are stored locally in your browser only.'
          }
        </p>
      </div>
    </div>
  );
}
