// AI Service Layer - Supports multiple providers
// Ollama (local/offline), Groq (free), Claude API, OpenAI API

export type AIProvider = 'ollama' | 'groq' | 'claude' | 'openai';

export type ModelTier = 'small' | 'medium' | 'large';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  /** Optional separate model for validation/critic pass (multi-agent) */
  validationModel?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest?: string;
}

export interface ModelCapability {
  name: string;
  tier: ModelTier;
  jsonReliability: number; // 0-100
  sizeGb: string;
  gpuRam: string;
  description: string;
  recommended?: boolean;
  fallbackOnly?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export interface ChatOptions {
  jsonMode?: boolean;
  temperature?: number;
}

// Default configurations for each provider
export const defaultConfigs: Record<AIProvider, Partial<AIConfig>> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.1:8b',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    model: 'llama-3.3-70b-versatile',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
  },
};

/** Top offline models for AAISM Agent Discovery */
export const AAISM_OFFLINE_MODELS: ModelCapability[] = [
  { name: 'llama3.1:8b', tier: 'medium', jsonReliability: 92, sizeGb: '~4.7GB', gpuRam: '8GB+', description: 'Best balance of quality and JSON reliability', recommended: true },
  { name: 'qwen2.5:7b', tier: 'medium', jsonReliability: 90, sizeGb: '~4.4GB', gpuRam: '8GB+', description: 'Excellent structured output, strong reasoning', recommended: true },
  { name: 'mistral:7b', tier: 'medium', jsonReliability: 85, sizeGb: '~4.1GB', gpuRam: '8GB+', description: 'Good JSON, fast inference' },
  { name: 'phi3:medium', tier: 'medium', jsonReliability: 82, sizeGb: '~7.9GB', gpuRam: '8GB+', description: 'Microsoft model, good instruction following' },
  { name: 'gemma2:9b', tier: 'medium', jsonReliability: 80, sizeGb: '~5.4GB', gpuRam: '10GB+', description: 'Google model, quality responses' },
  { name: 'llama3.2:3b', tier: 'small', jsonReliability: 35, sizeGb: '~2GB', gpuRam: '4GB', description: 'Too small for reliable JSON — fallback only', fallbackOnly: true },
];

export const RECOMMENDED_OLLAMA_MODELS = AAISM_OFFLINE_MODELS.map(m => ({
  name: m.name,
  description: m.description,
}));

const MODEL_TIER_PATTERNS: Array<{ pattern: RegExp; tier: ModelTier; jsonReliability: number }> = [
  { pattern: /llama3\.2:1b|1b|tiny|mini/i, tier: 'small', jsonReliability: 20 },
  { pattern: /llama3\.2:3b|llama3\.2$|3b|phi3:mini|gemma2:2b/i, tier: 'small', jsonReliability: 35 },
  { pattern: /llama3\.1:8b|llama3\.1$|mistral|qwen2\.5|phi3:medium|gemma2:9b|7b|8b|9b/i, tier: 'medium', jsonReliability: 85 },
  { pattern: /70b|13b|mixtral|large|405b/i, tier: 'large', jsonReliability: 95 },
];

export function getModelCapability(modelName: string): ModelCapability {
  const known = AAISM_OFFLINE_MODELS.find(m =>
    modelName === m.name || modelName.startsWith(m.name.split(':')[0])
  );
  if (known) return known;

  for (const { pattern, tier, jsonReliability } of MODEL_TIER_PATTERNS) {
    if (pattern.test(modelName)) {
      return {
        name: modelName,
        tier,
        jsonReliability,
        sizeGb: tier === 'small' ? '~2-3GB' : tier === 'medium' ? '~4-8GB' : '10GB+',
        gpuRam: tier === 'small' ? '4GB' : tier === 'medium' ? '8GB+' : '16GB+',
        description: `${tier} tier model`,
      };
    }
  }

  return {
    name: modelName,
    tier: 'medium',
    jsonReliability: 70,
    sizeGb: 'Unknown',
    gpuRam: '8GB+',
    description: 'Custom model',
  };
}

export function isSmallModel(modelName: string): boolean {
  return getModelCapability(modelName).tier === 'small';
}

export function getModelWarning(modelName: string): string | null {
  const cap = getModelCapability(modelName);
  if (cap.tier === 'small') {
    return `Model "${modelName}" is too small for reliable JSON output in Agent Discovery. Switch to llama3.1:8b or qwen2.5:7b for best results.`;
  }
  if (cap.jsonReliability < 70) {
    return `Model "${modelName}" has low JSON reliability (${cap.jsonReliability}%). Consider llama3.1:8b for Agent Discovery.`;
  }
  return null;
}

export function getRecommendedFallbackModel(): string {
  return 'llama3.1:8b';
}

// Check if Ollama is running and get available models
export async function checkOllamaStatus(baseUrl = 'http://localhost:11434'): Promise<{ running: boolean; models: OllamaModel[]; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { running: false, models: [], error: 'Ollama not responding' };
    }

    const data = await response.json();
    return {
      running: true,
      models: data.models || [],
    };
  } catch {
    return {
      running: false,
      models: [],
      error: 'Ollama is not running. Start it with: ollama serve',
    };
  }
}

/** Alias for Settings — fetch installed Ollama models */
export async function detectOllamaModels(baseUrl = 'http://localhost:11434'): Promise<OllamaModel[]> {
  const status = await checkOllamaStatus(baseUrl);
  return status.models;
}

export async function pullOllamaModel(
  modelName: string,
  baseUrl = 'http://localhost:11434',
  onProgress?: (status: string) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.status) onProgress?.(parsed.status);
          } catch { /* skip partial lines */ }
        }
      }
    }

    onProgress?.('Model downloaded successfully!');
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to download model: ${error}` };
  }
}

export const AAISM_CONTEXT = `You are an expert AI Security Manager exam preparation assistant. You help users prepare for the ISACA AAISM (Artificial Intelligence Security Manager) certification exam.

## AAISM Exam Domains:

### Domain 1: AI Governance (approximately 25%)
Key topics:
- AI governance frameworks and organizational structures
- AI strategy development and alignment with business objectives
- AI policies, standards, and procedures
- AI ethics and responsible AI principles
- Regulatory compliance (EU AI Act, NIST AI RMF, ISO/IEC 42001)
- Stakeholder management and communication
- AI literacy and awareness programs

### Domain 2: AI Risk Management (approximately 25%)
Key topics:
- AI risk identification and assessment methodologies
- AI-specific threats: adversarial attacks, model poisoning, data poisoning
- Prompt injection and jailbreaking attacks
- Privacy risks and data protection
- Bias and fairness risks
- Security controls for AI systems
- Third-party and supply chain AI risks
- Risk monitoring and reporting

### Domain 3: AI Development & Implementation (approximately 25%)
Key topics:
- AI/ML development lifecycle (CRISP-DM, MLOps)
- Data management: collection, quality, labeling, governance
- Model development: training, validation, testing
- Feature engineering and selection
- Model explainability and interpretability
- Secure AI development practices
- AI testing methodologies
- Deployment strategies (shadow, canary, blue-green)

### Domain 4: AI Operations & Monitoring (approximately 25%)
Key topics:
- AI operations management and MLOps
- Model performance monitoring
- Data drift and concept drift detection
- AI incident management and response
- Model maintenance, retraining, and versioning
- Continuous improvement processes
- AI system decommissioning

## Key Frameworks & Standards:
- NIST AI Risk Management Framework (AI RMF)
- EU AI Act and risk classification
- ISO/IEC 42001 AI Management System
- OWASP Top 10 for LLMs
- MITRE ATLAS (Adversarial Threat Landscape for AI Systems)

## Exam Tips:
- Focus on understanding concepts, not memorizing
- Questions often test "best" or "most important" actions
- Consider risk-based thinking in all answers
- Governance and management perspectives are key
`;

const JSON_SYSTEM_HINT = `You MUST respond with valid JSON only. No markdown, no code fences, no explanation text before or after the JSON.`;

async function callOllama(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  try {
    const temperature = options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7);
    const body: Record<string, unknown> = {
      model: config.model,
      messages: options?.jsonMode
        ? messages.map((m, i) =>
            i === 0 && m.role === 'system'
              ? { ...m, content: `${m.content}\n\n${JSON_SYSTEM_HINT}` }
              : m
          )
        : messages,
      stream: false,
      options: {
        temperature,
        num_predict: 4096,
      },
    };

    if (options?.jsonMode) {
      body.format = 'json';
    }

    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.message?.content || '' };
  } catch (error) {
    return { content: '', error: `Ollama connection failed. Make sure Ollama is running locally. Error: ${error}` };
  }
}

async function callClaude(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'Claude API key not configured' };
  }

  try {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.content?.[0]?.text || '' };
  } catch (error) {
    return { content: '', error: `Claude API error: ${error}` };
  }
}

async function callGroq(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'Groq API key not configured. Get a free key at https://console.groq.com' };
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: 4096,
        temperature: options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7),
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: `Groq API error: ${error}` };
  }
}

async function callOpenAI(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  if (!config.apiKey) {
    return { content: '', error: 'OpenAI API key not configured' };
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: 4096,
        temperature: options?.temperature ?? (options?.jsonMode ? 0.1 : 0.7),
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: `OpenAI API error: ${error}` };
  }
}

export async function chat(config: AIConfig, messages: Message[], options?: ChatOptions): Promise<AIResponse> {
  const hasSystem = messages.some(m => m.role === 'system');
  const fullMessages: Message[] = hasSystem
    ? messages
    : [{ role: 'system', content: AAISM_CONTEXT }, ...messages];

  switch (config.provider) {
    case 'ollama':
      return callOllama(config, fullMessages, options);
    case 'groq':
      return callGroq(config, fullMessages, options);
    case 'claude':
      return callClaude(config, fullMessages);
    case 'openai':
      return callOpenAI(config, fullMessages, options);
    default:
      return { content: '', error: 'Unknown AI provider' };
  }
}

export async function chatJson(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  return chat(config, messages, { jsonMode: true, temperature: 0.1 });
}

export async function generateQuestions(
  config: AIConfig,
  domain: number,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<AIResponse> {
  const prompt = `Generate ${count} ${difficulty} difficulty multiple-choice practice questions for AAISM Domain ${domain}.

For each question provide:
1. The question text
2. Four answer options (A, B, C, D)
3. The correct answer letter
4. A detailed explanation of why the answer is correct

Format as JSON array:
[
  {
    "question": "Question text here",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation here"
  }
]

Make questions exam-realistic, testing conceptual understanding not just memorization.`;

  return chatJson(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function explainConcept(
  config: AIConfig,
  concept: string,
  domain?: number
): Promise<AIResponse> {
  const domainContext = domain ? `Focus on Domain ${domain} perspective.` : '';

  const prompt = `Explain this AAISM exam concept in detail: "${concept}"

${domainContext}

Provide:
1. **Definition**: Clear, concise definition
2. **Key Points**: 3-5 essential points to remember
3. **Real-World Example**: Practical example
4. **Exam Relevance**: Why this matters for the AAISM exam
5. **Related Concepts**: Other topics this connects to
6. **Common Exam Traps**: Misconceptions to avoid

Use clear formatting with headers and bullet points.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function analyzeWeakAreas(
  config: AIConfig,
  quizHistory: { domain: number; score: number; }[]
): Promise<AIResponse> {
  const prompt = `Analyze this quiz performance history and provide study recommendations:

Quiz History:
${JSON.stringify(quizHistory, null, 2)}

Provide:
1. **Weak Areas**: Identify domains/topics that need more focus
2. **Strength Areas**: What the student is doing well
3. **Recommended Study Plan**: Specific actions for next 2 weeks
4. **Key Topics to Review**: List specific concepts to focus on
5. **Practice Suggestions**: Types of questions to practice

Be specific and actionable.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

export async function createStudyGuide(
  config: AIConfig,
  domain: number,
  topic?: string
): Promise<AIResponse> {
  const topicFocus = topic ? `Specifically focus on: ${topic}` : '';

  const prompt = `Create a comprehensive study guide for AAISM Domain ${domain}.
${topicFocus}

Include:
1. **Overview**: What this domain covers
2. **Key Concepts**: Detailed breakdown of main topics
3. **Important Terms**: Definitions to memorize
4. **Frameworks & Standards**: Relevant standards to know
5. **Exam Tips**: How questions are typically asked
6. **Quick Reference**: Bullet points for quick review
7. **Sample Questions**: 3 example questions with answers

Format with clear headers and organized sections.`;

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ]);
}

const AI_CONFIG_KEY = 'aaism-ai-config';

export function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AIConfig;
      // Migrate legacy default
      if (parsed.provider === 'ollama' && (parsed.model === 'llama3.2' || parsed.model === 'llama3.2:3b')) {
        parsed.model = 'llama3.1:8b';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  return {
    provider: 'ollama',
    ...defaultConfigs.ollama,
  } as AIConfig;
}

export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config:', e);
  }
}

export async function testConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  const response = await chat(config, [
    { role: 'user', content: 'Say "Connection successful!" in exactly those words.' },
  ]);

  if (response.error) {
    return { success: false, message: response.error };
  }

  return { success: true, message: 'Connected successfully!' };
}
