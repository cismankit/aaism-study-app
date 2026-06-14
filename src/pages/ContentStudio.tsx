import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PenLine, ChevronRight, ChevronDown, Copy, Check, Download,
  Loader2, Server, Sparkles, Settings, Layers, FileText,
  ExternalLink, AlertCircle, RefreshCw, XCircle, CheckCircle2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import ContentPreview from '../components/ContentPreview';
import {
  type ContentFormatId,
  BATCH_FORMAT_IDS,
  CONTENT_TEMPLATES,
  getContentTemplate,
} from '../data/contentTemplates';
import {
  type ContentSource,
  buildStudioPayload,
  buildReadyChecklist,
  downloadExportBundle,
  downloadJson,
  downloadMarkdown,
  generateBatch,
  generateContent,
  getCharCount,
  getDomainName,
  resolveContentProvider,
  resolveSourceFromParams,
  type ContentProviderStatus,
  type GeneratedContent,
} from '../services/contentStudioService';
import { checkLLMHealth, getFixSteps, subscribeLLMHealth, type LLMHealthReport } from '../services/llmHealthService';
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
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<ContentFormatId>('linkedin');
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState<ContentProviderStatus | null>(null);
  const [health, setHealth] = useState<LLMHealthReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFreeOptions, setShowFreeOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProvider = useCallback(async () => {
    const report = await checkLLMHealth();
    setHealth(report);
    setProvider(await resolveContentProvider(report));
  }, []);

  useEffect(() => {
    refreshProvider();
    return subscribeLLMHealth(setHealth);
  }, [refreshProvider]);

  useEffect(() => {
    if (health) {
      void resolveContentProvider(health).then(setProvider);
    }
  }, [health]);

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

  function getDisplayContent(output: GeneratedContent): string {
    return editedContent[output.formatId] ?? output.content;
  }

  async function handleGenerate() {
    if (!health?.overallHealthy) {
      const steps = getFixSteps(health);
      setError(`LLM not ready. ${steps.join(' → ')}`);
      return;
    }

    setGenerating(true);
    setError(null);
    setStep(3);
    try {
      const formatIds = batchMode ? BATCH_FORMAT_IDS : selectedFormats;
      const results = formatIds.length > 1
        ? await generateBatch(source, formatIds, health)
        : [await generateContent(source, formatIds[0], undefined, health)];
      setOutputs(results);
      const edits: Record<string, string> = {};
      results.forEach(r => { edits[r.formatId] = r.content; });
      setEditedContent(edits);
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
    await navigator.clipboard.writeText(getDisplayContent(current));
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
    downloadMarkdown(`${current.formatId}-${slug}.md`, getDisplayContent(current));
  }

  function exportPayload() {
    const formatIds = batchMode ? BATCH_FORMAT_IDS : selectedFormats;
    downloadJson('content-studio-payload.json', buildStudioPayload(source, formatIds));
  }

  function exportAll() {
    const withEdits = outputs.map(o => ({ ...o, content: getDisplayContent(o) }));
    downloadExportBundle(withEdits, source);
  }

  const activeOutput = outputs.find(o => o.formatId === activeTab);
  const activeContent = activeOutput ? getDisplayContent(activeOutput) : '';
  const charStats = activeOutput ? getCharCount(activeContent, activeOutput.formatId) : null;
  const checklist = activeOutput ? buildReadyChecklist(activeContent, activeOutput.formatId, activeOutput.usedLlm) : [];
  const allReady = checklist.length > 0 && checklist.every(c => c.passed);
  const fixSteps = getFixSteps(health);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        icon={PenLine}
        iconClassName="text-violet-500"
        title="Content Studio"
        subtitle="Turn AAISM study intel into LinkedIn posts, YouTube scripts, GitHub READMEs, and more — powered by free LLMs."
        action={
          <div className="flex items-center gap-2">
            <ProviderBadge provider={provider} health={health} onRefresh={refreshProvider} />
            <Link
              to="/settings"
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 flex items-center gap-1"
            >
              <Settings className="w-3 h-3" /> Settings
            </Link>
          </div>
        }
      />

      {!health?.overallHealthy && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">LLM provider not ready</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
              Generation is blocked until the provider is healthy. Fix steps:
            </p>
            <ol className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1 list-decimal list-inside">
              {fixSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <button onClick={refreshProvider} className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry health check
            </button>
          </div>
        </div>
      )}

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
                disabled={generating || selectedFormats.length === 0 || !health?.overallHealthy}
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
            Generating {batchMode ? `${BATCH_FORMAT_IDS.length} formats` : selectedFormats[0]} via {provider?.label ?? 'LLM'}…
          </p>
        </div>
      )}

      {/* Step 4: Output — split editor + preview */}
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

          {activeOutput && !activeOutput.usedLlm && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Template fallback only</strong> — LLM did not generate this content. Fix your provider in Settings, then regenerate for publish-ready output.
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Editor pane */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Editor</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeOutput?.usedLlm
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {activeOutput?.usedLlm ? `via ${activeOutput.provider}` : 'template only'}
                  </span>
                  {charStats && (
                    <span className={`text-[10px] font-mono ${charStats.withinLimit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {charStats.count}/{charStats.limit}
                    </span>
                  )}
                  <button onClick={copyOutput} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Copy">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={downloadCurrent} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Download .md">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={activeContent}
                onChange={e => setEditedContent(prev => ({ ...prev, [activeTab]: e.target.value }))}
                rows={18}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Preview pane */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Live Preview — {getContentTemplate(activeTab).platform}
              </h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/30 min-h-[400px]">
                <ContentPreview formatId={activeTab} content={activeContent} />
              </div>
            </div>
          </div>

          {/* Ready to post checklist */}
          <SectionCard title="Ready to Post" icon={CheckCircle2} iconClassName={allReady ? 'text-emerald-500' : 'text-amber-500'} compact>
            <ul className="space-y-1.5">
              {checklist.map((item, i) => (
                <li key={i} className="text-xs flex items-center gap-2">
                  {item.passed
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  }
                  <span className={item.passed ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            {allReady && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                ✓ All checks passed — ready to copy and post!
              </p>
            )}
          </SectionCard>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              Regenerate
            </button>
            <button onClick={() => { setStep(1); setOutputs([]); setEditedContent({}); }} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              New source
            </button>
            {outputs.length > 1 && (
              <button onClick={exportAll} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export all formats (.md bundle)
              </button>
            )}
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
                <p className="text-xs mt-1">
                  Run Gemma 4 (<code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">gemma4:e4b</code>,{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">gemma4:31b</code>) or qwen2.5:7b on your machine.
                  Gemma 4 beats Gemma 3 for JSON/agent workflows. No API key — best for privacy.
                </p>
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
                  </a>
                  {' '}—{' '}
                  <Link to="/settings" className="text-emerald-500 hover:underline font-medium">
                    Add Groq key in Settings →
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ExternalLink className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Google Colab + notebook LLM</p>
                <p className="text-xs mt-1">
                  Export <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">content-studio-payload.json</code> and paste prompts into a Colab notebook running Llama, Mistral, or Gemma.
                </p>
                <button
                  onClick={exportPayload}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export content-studio-payload.json
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        Domain {source.domain ?? 1}: {getDomainName(source.domain ?? 1)}
        {source.topic && ` · ${source.topic}`}
        {source.headline && ` · ${source.headline}`}
      </p>
    </div>
  );
}

function ProviderBadge({ provider, health, onRefresh }: {
  provider: ContentProviderStatus | null;
  health: LLMHealthReport | null;
  onRefresh: () => void;
}) {
  if (!provider) return null;
  const healthy = health?.overallHealthy ?? provider.configured;
  const Icon = provider.provider === 'ollama' ? Server : provider.provider === 'groq' ? Sparkles : AlertCircle;
  const color = healthy
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30'
    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-500/30';

  return (
    <button
      onClick={onRefresh}
      className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${color}`}
      title={provider.message ?? 'Refresh provider status'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${healthy ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500'}`} />
      <Icon className="w-3 h-3" />
      {healthy ? provider.label : 'LLM offline'}
      <RefreshCw className="w-2.5 h-2.5 opacity-50" />
    </button>
  );
}
