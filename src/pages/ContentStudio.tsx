import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PenLine, ChevronRight, ChevronDown, Copy, Check, Download,
  Loader2, Server, Sparkles, Settings, Layers, FileText,
  ExternalLink, AlertCircle, RefreshCw,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import {
  type ContentFormatId,
  BATCH_FORMAT_IDS,
  CONTENT_TEMPLATES,
  getContentTemplate,
} from '../data/contentTemplates';
import {
  type ContentSource,
  buildStudioPayload,
  downloadJson,
  downloadMarkdown,
  generateBatch,
  generateContent,
  getDomainName,
  resolveContentProvider,
  resolveSourceFromParams,
  type ContentProviderStatus,
  type GeneratedContent,
} from '../services/contentStudioService';
import { AAISM_DOMAIN_GUIDES } from '../data/aaismDomainGuide';
import { topics } from '../data/knowledgeBase';

type StudioStep = 1 | 2 | 3 | 4;

const FORMAT_ICONS: Record<ContentFormatId, string> = {
  linkedin: '💼',
  'twitter-thread': '🐦',
  'youtube-outline': '▶️',
  'youtube-shorts': '⚡',
  'github-readme': '📦',
  'blog-intro': '📝',
  'exam-carousel': '🎠',
};

export default function ContentStudio() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<StudioStep>(1);
  const [source, setSource] = useState<ContentSource>(() => resolveSourceFromParams(searchParams));
  const [sourceType, setSourceType] = useState<ContentSource['type']>(source.type);
  const [selectedFormats, setSelectedFormats] = useState<ContentFormatId[]>(['linkedin']);
  const [batchMode, setBatchMode] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedContent[]>([]);
  const [activeTab, setActiveTab] = useState<ContentFormatId>('linkedin');
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState<ContentProviderStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFreeOptions, setShowFreeOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProvider = useCallback(async () => {
    setProvider(await resolveContentProvider());
  }, []);

  useEffect(() => {
    refreshProvider();
  }, [refreshProvider]);

  useEffect(() => {
    const resolved = resolveSourceFromParams(searchParams);
    setSource(resolved);
    setSourceType(resolved.type);
    const formatParam = searchParams.get('format') as ContentFormatId | null;
    if (formatParam && CONTENT_TEMPLATES.some(t => t.id === formatParam)) {
      setSelectedFormats([formatParam]);
      setActiveTab(formatParam);
    }
    if (resolved.topic || resolved.headline || resolved.customPrompt) {
      setStep(2);
    }
  }, [searchParams]);

  function updateSource(patch: Partial<ContentSource>) {
    setSource(prev => ({ ...prev, ...patch }));
  }

  function toggleFormat(id: ContentFormatId) {
    if (batchMode) return;
    setSelectedFormats([id]);
    setActiveTab(id);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setStep(3);
    try {
      const formatIds = batchMode ? BATCH_FORMAT_IDS : selectedFormats;
      const results = formatIds.length > 1
        ? await generateBatch(source, formatIds)
        : [await generateContent(source, formatIds[0])];
      setOutputs(results);
      setActiveTab(results[0].formatId);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  }

  async function copyOutput() {
    const current = outputs.find(o => o.formatId === activeTab);
    if (!current) return;
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCurrent() {
    const current = outputs.find(o => o.formatId === activeTab);
    if (!current) return;
    const slug = (source.topic ?? source.headline ?? 'content')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    downloadMarkdown(`${current.formatId}-${slug}.md`, current.content);
  }

  function exportPayload() {
    const formatIds = batchMode ? BATCH_FORMAT_IDS : selectedFormats;
    downloadJson('content-studio-payload.json', buildStudioPayload(source, formatIds));
  }

  const activeOutput = outputs.find(o => o.formatId === activeTab);
  const activeTemplate = activeOutput ? getContentTemplate(activeOutput.formatId) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        icon={PenLine}
        iconClassName="text-violet-500"
        title="Content Studio"
        subtitle="Turn AAISM study intel into LinkedIn posts, YouTube scripts, GitHub READMEs, and more — powered by free LLMs."
        action={
          <div className="flex items-center gap-2">
            <ProviderBadge provider={provider} onRefresh={refreshProvider} />
            {!provider?.configured && (
              <Link
                to="/settings"
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> Settings
              </Link>
            )}
          </div>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {(['Source', 'Format', 'Generate', 'Output'] as const).map((label, i) => {
          const n = (i + 1) as StudioStep;
          const active = step >= n;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                active ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {n}
              </span>
              <span className={active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}>{label}</span>
              {i < 3 && <ChevronRight className="w-3 h-3 text-gray-400" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Source */}
      {step === 1 && (
        <SectionCard title="Step 1 — Choose Source" icon={Layers} iconClassName="text-violet-500">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { id: 'domain-topic' as const, label: 'Domain + Topic' },
                { id: 'knowledge-topic' as const, label: 'Knowledge Base' },
                { id: 'intel-headline' as const, label: 'Intel Headline' },
                { id: 'custom' as const, label: 'Custom Prompt' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSourceType(opt.id); updateSource({ type: opt.id }); }}
                  className={`p-3 rounded-lg text-xs font-medium border transition-all ${
                    sourceType === opt.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">AAISM Domain</label>
                <select
                  value={source.domain ?? 1}
                  onChange={e => updateSource({ domain: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  {AAISM_DOMAIN_GUIDES.map(g => (
                    <option key={g.id} value={g.id}>D{g.id}: {g.shortName}</option>
                  ))}
                </select>
              </div>

              {sourceType === 'knowledge-topic' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Knowledge Base Topic</label>
                  <select
                    value={source.topic ?? ''}
                    onChange={e => {
                      const t = topics.find(x => x.title === e.target.value);
                      updateSource({ topic: e.target.value, domain: t?.domain });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Select topic…</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.title}>D{t.domain}: {t.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === 'domain-topic' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Topic</label>
                  <input
                    type="text"
                    value={source.topic ?? ''}
                    onChange={e => updateSource({ topic: e.target.value })}
                    placeholder="e.g. NIST AI RMF, prompt injection"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              )}

              {sourceType === 'intel-headline' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">RSS / Intel Headline</label>
                    <input
                      type="text"
                      value={source.headline ?? ''}
                      onChange={e => updateSource({ headline: e.target.value })}
                      placeholder="Paste headline from Intel Hub or Live Feed"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Source (optional)</label>
                    <input
                      type="text"
                      value={source.intelSource ?? ''}
                      onChange={e => updateSource({ intelSource: e.target.value })}
                      placeholder="e.g. Krebs on Security, NIST"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </>
              )}

              {sourceType === 'custom' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Custom Prompt</label>
                  <textarea
                    value={source.customPrompt ?? ''}
                    onChange={e => updateSource({ customPrompt: e.target.value })}
                    rows={4}
                    placeholder="Describe what you want to create content about…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 flex items-center gap-2"
            >
              Next: Choose Format <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </SectionCard>
      )}

      {/* Step 2: Format */}
      {step === 2 && (
        <SectionCard title="Step 2 — Choose Format" icon={FileText} iconClassName="text-violet-500">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={batchMode}
                onChange={e => {
                  setBatchMode(e.target.checked);
                  if (e.target.checked) setSelectedFormats(BATCH_FORMAT_IDS);
                }}
                className="rounded border-gray-300"
              />
              <span className="font-medium">Batch mode — generate LinkedIn, Shorts, Thread & GitHub together</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CONTENT_TEMPLATES.map(fmt => {
                const selected = batchMode
                  ? BATCH_FORMAT_IDS.includes(fmt.id)
                  : selectedFormats.includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    onClick={() => toggleFormat(fmt.id)}
                    disabled={batchMode && !BATCH_FORMAT_IDS.includes(fmt.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                    } ${batchMode && !BATCH_FORMAT_IDS.includes(fmt.id) ? 'opacity-40' : ''}`}
                  >
                    <div className="text-2xl mb-2">{FORMAT_ICONS[fmt.id]}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{fmt.shortLabel}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{fmt.description}</div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || selectedFormats.length === 0}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 3: Generating */}
      {step === 3 && generating && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500">
            Generating {batchMode ? `${BATCH_FORMAT_IDS.length} formats` : selectedFormats[0]} via {provider?.label ?? 'template fallback'}…
          </p>
        </div>
      )}

      {/* Step 4: Output */}
      {step === 4 && outputs.length > 0 && (
        <div className="space-y-4">
          {outputs.length > 1 && (
            <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
              {outputs.map(o => (
                <button
                  key={o.formatId}
                  onClick={() => setActiveTab(o.formatId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === o.formatId
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {o.formatLabel}
                  {!o.usedLlm && <span className="ml-1 opacity-70">(template)</span>}
                </button>
              ))}
            </div>
          )}

          {activeOutput && (
            <SectionCard
              title={activeOutput.formatLabel}
              icon={FileText}
              iconClassName="text-violet-500"
              action={
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeOutput.usedLlm
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {activeOutput.usedLlm ? `via ${activeOutput.provider}` : 'template only'}
                  </span>
                  <button onClick={copyOutput} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Copy">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={downloadCurrent} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Download .md">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              }
            >
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed max-h-[480px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {activeOutput.content}
              </pre>
            </SectionCard>
          )}

          {activeTemplate && (
            <SectionCard title="Publish Checklist" icon={Check} iconClassName="text-emerald-500" compact>
              <ul className="space-y-1.5">
                {activeTemplate.publishChecklist.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                    <span className="text-emerald-500 font-bold">{i + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              Regenerate
            </button>
            <button onClick={() => { setStep(1); setOutputs([]); }} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              New source
            </button>
          </div>
        </div>
      )}

      {/* Free LLM options */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowFreeOptions(!showFreeOptions)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Free LLM options</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFreeOptions ? 'rotate-180' : ''}`} />
        </button>
        {showFreeOptions && (
          <div className="p-4 space-y-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <Server className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Ollama (local, unlimited)</p>
                <p className="text-xs mt-1">Run models like qwen2.5:7b or gemma3:12b on your machine. No API key. Best for privacy and batch generation.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Groq free API</p>
                <p className="text-xs mt-1">
                  Fast cloud inference with a generous free tier. Get a key at{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                    console.groq.com
                  </a>{' '}
                  and add it in <Link to="/settings" className="text-emerald-500 hover:underline">Settings</Link>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ExternalLink className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Google Colab + notebook LLM</p>
                <p className="text-xs mt-1">
                  Export <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">content-studio-payload.json</code> and paste prompts into a Colab notebook running Llama, Mistral, or Gemma. Process offline when browser providers are unavailable.
                </p>
                <button
                  onClick={exportPayload}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export content-studio-payload.json
                </button>
              </div>
            </div>
            {!provider?.configured && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                No LLM provider configured — outputs use static templates. Configure Ollama or Groq for AI-generated content.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Context preview */}
      <p className="text-[11px] text-gray-400 text-center">
        Domain {source.domain ?? 1}: {getDomainName(source.domain ?? 1)}
        {source.topic && ` · ${source.topic}`}
        {source.headline && ` · ${source.headline}`}
      </p>
    </div>
  );
}

function ProviderBadge({ provider, onRefresh }: { provider: ContentProviderStatus | null; onRefresh: () => void }) {
  if (!provider) return null;
  const Icon = provider.provider === 'ollama' ? Server : provider.provider === 'groq' ? Sparkles : AlertCircle;
  const color = provider.configured
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';

  return (
    <button
      onClick={onRefresh}
      className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${color}`}
      title={provider.message ?? 'Refresh provider status'}
    >
      <Icon className="w-3 h-3" />
      {provider.label}
      <RefreshCw className="w-2.5 h-2.5 opacity-50" />
    </button>
  );
}
