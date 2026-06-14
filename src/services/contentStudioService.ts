import {
  type ContentFormatId,
  type ContentTemplate,
  CONTENT_TEMPLATES,
  fillTemplatePlaceholders,
  getContentTemplate,
} from '../data/contentTemplates';
import { AAISM_DOMAIN_GUIDES } from '../data/aaismDomainGuide';
import { topics } from '../data/knowledgeBase';
import {
  chat,
  loadAIConfig,
  resolveOllamaModel,
  type AIConfig,
  type AIProvider,
} from './aiService';
import { checkLLMHealth, type LLMHealthReport } from './llmHealthService';

export type ContentSourceType = 'domain-topic' | 'knowledge-topic' | 'intel-headline' | 'custom';

export interface ContentSource {
  type: ContentSourceType;
  domain?: number;
  topic?: string;
  headline?: string;
  intelSource?: string;
  customPrompt?: string;
}

export interface ContentProviderStatus {
  provider: AIProvider | 'none';
  label: string;
  configured: boolean;
  message?: string;
}

export interface GeneratedContent {
  formatId: ContentFormatId;
  formatLabel: string;
  content: string;
  provider: ContentProviderStatus['provider'];
  usedLlm: boolean;
  generatedAt: string;
}

export interface ContentStudioPayload {
  exportedAt: string;
  source: ContentSource;
  context: string;
  formats: ContentFormatId[];
  templates: Array<{ id: ContentFormatId; prompt: string }>;
  instructions: string;
}

const DOMAIN_NAMES: Record<number, string> = {
  1: 'AI Governance',
  2: 'AI Risk Management',
  3: 'AI Technologies & Controls',
  4: 'AI Operations & Monitoring',
};

export function getDomainName(domain: number): string {
  return AAISM_DOMAIN_GUIDES.find(g => g.id === domain)?.shortName
    ?? DOMAIN_NAMES[domain]
    ?? `Domain ${domain}`;
}

export function buildSourceContext(source: ContentSource): string {
  switch (source.type) {
    case 'knowledge-topic': {
      const kbTopic = topics.find(t =>
        t.id === source.topic || t.title.toLowerCase() === (source.topic ?? '').toLowerCase(),
      );
      if (kbTopic) {
        return [
          kbTopic.description,
          ...kbTopic.keyPoints.map(p => `• ${p}`),
          ...kbTopic.examTips.map(t => `Exam tip: ${t}`),
        ].join('\n');
      }
      return source.topic ?? 'General AAISM study topic';
    }
    case 'intel-headline':
      return [
        `Headline: ${source.headline ?? 'Latest AI security intel'}`,
        source.intelSource ? `Source: ${source.intelSource}` : '',
        'Angle: Connect this news to AAISM exam domains and practitioner controls.',
      ].filter(Boolean).join('\n');
    case 'custom':
      return source.customPrompt ?? 'Custom AAISM study content';
    case 'domain-topic':
    default:
      return source.topic
        ? `Study focus: ${source.topic} within AAISM certification scope.`
        : 'General AAISM certification study content across governance, risk, development, and operations.';
  }
}

export function resolveSourceFromParams(params: URLSearchParams): ContentSource {
  const topic = params.get('topic') ?? undefined;
  const domain = parseInt(params.get('domain') ?? '1', 10);
  const headline = params.get('headline') ?? undefined;
  const intelSource = params.get('source') ?? undefined;
  const prompt = params.get('prompt') ?? undefined;
  const format = params.get('format') as ContentFormatId | null;

  if (headline) {
    return { type: 'intel-headline', headline, intelSource, domain };
  }
  if (prompt) {
    return { type: 'custom', customPrompt: prompt, domain };
  }
  if (topic && topics.some(t => t.id === topic || t.title === topic)) {
    const kb = topics.find(t => t.id === topic || t.title === topic);
    return { type: 'knowledge-topic', topic: kb?.title ?? topic, domain: kb?.domain ?? domain };
  }
  if (topic) {
    return { type: 'domain-topic', topic, domain };
  }

  return { type: 'domain-topic', domain, topic: format ? undefined : 'AI Security Governance' };
}

export async function resolveContentProvider(health?: LLMHealthReport | null): Promise<ContentProviderStatus> {
  const config = loadAIConfig();
  const report = health ?? await checkLLMHealth();

  if (config.provider === 'ollama') {
    const ollama = report.providers.ollama;
    if (ollama?.healthy) {
      return {
        provider: 'ollama',
        label: 'Ollama (local)',
        configured: true,
        message: ollama.message,
      };
    }
    return {
      provider: 'none',
      label: 'Ollama offline',
      configured: false,
      message: ollama?.message ?? 'Start Ollama locally or configure Groq in Settings',
    };
  }

  if (config.provider === 'groq') {
    const groq = report.providers.groq;
    if (groq?.healthy) {
      return { provider: 'groq', label: 'Groq (free tier)', configured: true, message: groq.message };
    }
    return {
      provider: 'none',
      label: 'Groq key missing',
      configured: false,
      message: groq?.message ?? 'Add a free API key at console.groq.com → Settings',
    };
  }

  return {
    provider: 'none',
    label: 'No free provider',
    configured: false,
    message: 'Switch to Ollama or Groq in Settings for LLM generation',
  };
}

function buildPrompt(template: ContentTemplate, source: ContentSource, context: string): string {
  const domain = source.domain ?? 1;
  return fillTemplatePlaceholders(template.promptTemplate, {
    topic: source.topic ?? source.headline ?? 'AI Security',
    domain,
    domainName: getDomainName(domain),
    context,
  });
}

function buildStaticOutput(template: ContentTemplate, source: ContentSource, context: string): string {
  const domain = source.domain ?? 1;
  return fillTemplatePlaceholders(template.staticFallback, {
    topic: source.topic ?? source.headline ?? 'AI Security',
    domain,
    domainName: getDomainName(domain),
    context: context.slice(0, 400),
  });
}

export const PLATFORM_CHAR_LIMITS: Partial<Record<ContentFormatId, number>> = {
  linkedin: 3000,
  'twitter-thread': 280,
  'youtube-outline': 5000,
  'youtube-shorts': 1000,
  'github-readme': 10000,
  'blog-intro': 2000,
  'exam-carousel': 2200,
};

export function getCharLimit(formatId: ContentFormatId): number {
  return PLATFORM_CHAR_LIMITS[formatId] ?? getContentTemplate(formatId).maxLength ?? 3000;
}

export function getCharCount(content: string, formatId: ContentFormatId): { count: number; limit: number; withinLimit: boolean } {
  const limit = getCharLimit(formatId);
  if (formatId === 'twitter-thread') {
    const tweets = content.split(/\n(?=\d+\/\d+)/).filter(Boolean);
    const longest = tweets.reduce((max, t) => Math.max(max, t.length), content.length);
    return { count: longest, limit: 280, withinLimit: longest <= 280 };
  }
  return { count: content.length, limit, withinLimit: content.length <= limit };
}

export function buildReadyChecklist(
  content: string,
  formatId: ContentFormatId,
  usedLlm: boolean,
): Array<{ label: string; passed: boolean }> {
  const template = getContentTemplate(formatId);
  const chars = getCharCount(content, formatId);
  return [
    { label: 'LLM generation succeeded', passed: usedLlm },
    { label: `Within ${chars.limit} character limit (${chars.count}/${chars.limit})`, passed: chars.withinLimit },
    { label: 'Content is not empty', passed: content.trim().length > 20 },
    { label: 'No template fallback marker', passed: !content.includes('template fallback') && !content.includes('LLM unavailable') },
    ...template.publishChecklist.slice(0, 2).map(item => ({
      label: item,
      passed: content.length > 50,
    })),
  ];
}

export async function generateContent(
  source: ContentSource,
  formatId: ContentFormatId,
  config?: AIConfig,
  health?: LLMHealthReport | null,
): Promise<GeneratedContent> {
  const template = getContentTemplate(formatId);
  const context = buildSourceContext(source);
  const report = health ?? await checkLLMHealth();
  const providerStatus = await resolveContentProvider(report);
  const aiConfig = config ?? loadAIConfig();

  const canUseLlm = report.overallHealthy && providerStatus.configured;

  if (!canUseLlm) {
    return {
      formatId,
      formatLabel: template.label,
      content: buildStaticOutput(template, source, context),
      provider: 'none',
      usedLlm: false,
      generatedAt: new Date().toISOString(),
    };
  }

  let effectiveConfig = aiConfig;
  if (aiConfig.provider === 'ollama') {
    const resolved = await resolveOllamaModel(aiConfig);
    if (resolved.error) {
      return {
        formatId,
        formatLabel: template.label,
        content: buildStaticOutput(template, source, context),
        provider: 'none',
        usedLlm: false,
        generatedAt: new Date().toISOString(),
      };
    }
    effectiveConfig = { ...aiConfig, model: resolved.model };
  }

  const userPrompt = buildPrompt(template, source, context);
  const response = await chat(effectiveConfig, [
    {
      role: 'system',
      content: `You are an AAISM content strategist. Generate publish-ready content for security practitioners and certification candidates.\n\n${template.systemHint}`,
    },
    { role: 'user', content: userPrompt },
  ]);

  if (response.error) {
    throw new Error(response.error);
  }

  const content = response.content || buildStaticOutput(template, source, context);

  return {
    formatId,
    formatLabel: template.label,
    content,
    provider: providerStatus.provider,
    usedLlm: true,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateBatch(
  source: ContentSource,
  formatIds: ContentFormatId[],
  health?: LLMHealthReport | null,
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];
  for (const id of formatIds) {
    results.push(await generateContent(source, id, undefined, health));
  }
  return results;
}

export function buildStudioPayload(
  source: ContentSource,
  formatIds: ContentFormatId[],
): ContentStudioPayload {
  const context = buildSourceContext(source);
  return {
    exportedAt: new Date().toISOString(),
    source,
    context,
    formats: formatIds,
    templates: formatIds.map(id => {
      const template = getContentTemplate(id);
      return { id, prompt: buildPrompt(template, source, context) };
    }),
    instructions:
      'Paste this JSON into a Google Colab notebook or external LLM workflow. Run each template prompt and save outputs as markdown files.',
  };
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExportBundle(outputs: GeneratedContent[], source: ContentSource): void {
  const slug = (source.topic ?? source.headline ?? 'content')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const sections = outputs.map(o =>
    `# ${o.formatLabel}\n\n<!-- format: ${o.formatId} | provider: ${o.provider} | llm: ${o.usedLlm} -->\n\n${o.content}\n`
  );
  const bundle = [
    `# Content Studio Export — ${new Date().toLocaleDateString()}`,
    `Source: ${source.type} | Domain ${source.domain ?? 1}`,
    '',
    ...sections,
  ].join('\n---\n\n');
  downloadMarkdown(`content-studio-${slug}-bundle.md`, bundle);
}

export { CONTENT_TEMPLATES };
