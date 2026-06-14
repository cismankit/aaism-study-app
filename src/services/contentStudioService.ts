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
  checkOllamaStatus,
  loadAIConfig,
  type AIConfig,
  type AIProvider,
} from './aiService';

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

export async function resolveContentProvider(): Promise<ContentProviderStatus> {
  const config = loadAIConfig();

  if (config.provider === 'ollama') {
    const status = await checkOllamaStatus(config.baseUrl);
    if (status.running && status.models.length > 0) {
      return {
        provider: 'ollama',
        label: 'Ollama (local)',
        configured: true,
        message: `${status.models.length} model(s) ready`,
      };
    }
    return {
      provider: 'none',
      label: 'Ollama offline',
      configured: false,
      message: 'Start Ollama locally or configure Groq in Settings',
    };
  }

  if (config.provider === 'groq') {
    if (config.apiKey?.trim()) {
      return { provider: 'groq', label: 'Groq (free tier)', configured: true };
    }
    return {
      provider: 'none',
      label: 'Groq key missing',
      configured: false,
      message: 'Add a free API key at console.groq.com → Settings',
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

export async function generateContent(
  source: ContentSource,
  formatId: ContentFormatId,
  config?: AIConfig,
): Promise<GeneratedContent> {
  const template = getContentTemplate(formatId);
  const context = buildSourceContext(source);
  const providerStatus = await resolveContentProvider();
  const aiConfig = config ?? loadAIConfig();

  const canUseLlm =
    (aiConfig.provider === 'ollama' && providerStatus.provider === 'ollama') ||
    (aiConfig.provider === 'groq' && providerStatus.provider === 'groq' && !!aiConfig.apiKey);

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

  const userPrompt = buildPrompt(template, source, context);
  const response = await chat(aiConfig, [
    {
      role: 'system',
      content: `You are an AAISM content strategist. Generate publish-ready content for security practitioners and certification candidates.\n\n${template.systemHint}`,
    },
    { role: 'user', content: userPrompt },
  ]);

  const content = response.error
    ? `${buildStaticOutput(template, source, context)}\n\n---\n*LLM unavailable (${response.error}). Showing template fallback.*`
    : (response.content || buildStaticOutput(template, source, context));

  return {
    formatId,
    formatLabel: template.label,
    content,
    provider: providerStatus.provider,
    usedLlm: !response.error,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateBatch(
  source: ContentSource,
  formatIds: ContentFormatId[],
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];
  for (const id of formatIds) {
    results.push(await generateContent(source, id));
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

export { CONTENT_TEMPLATES };
