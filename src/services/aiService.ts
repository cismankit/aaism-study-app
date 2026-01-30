// AI Service Layer - Supports multiple providers
// Ollama (local/offline), Groq (free), Claude API, OpenAI API

export type AIProvider = 'ollama' | 'groq' | 'claude' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export interface OllamaModel {
  name: string;
  size: string;
  modified_at: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

// Default configurations for each provider
export const defaultConfigs: Record<AIProvider, Partial<AIConfig>> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    model: 'llama-3.3-70b-versatile', // Free, fast, and capable
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

// Available Ollama models (common ones for AAISM study)
export const RECOMMENDED_OLLAMA_MODELS = [
  { name: 'llama3.2', description: 'Fast, good for general Q&A (3B params)' },
  { name: 'llama3.2:1b', description: 'Ultra-fast, lightweight (1B params)' },
  { name: 'llama3.1', description: 'Balanced performance (8B params)' },
  { name: 'mistral', description: 'Great reasoning (7B params)' },
  { name: 'phi3', description: 'Microsoft, efficient (3.8B params)' },
  { name: 'gemma2', description: 'Google, quality responses (9B params)' },
  { name: 'qwen2.5', description: 'Alibaba, multilingual (7B params)' },
];

// Check if Ollama is running and get available models
export async function checkOllamaStatus(): Promise<{ running: boolean; models: OllamaModel[]; error?: string }> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      return { running: false, models: [], error: 'Ollama not responding' };
    }
    
    const data = await response.json();
    return { 
      running: true, 
      models: data.models || [] 
    };
  } catch {
    return { 
      running: false, 
      models: [], 
      error: 'Ollama is not running. Start it with: ollama serve' 
    };
  }
}

// Pull/download an Ollama model
export async function pullOllamaModel(modelName: string, onProgress?: (status: string) => void): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: false }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }
    
    onProgress?.('Model downloaded successfully!');
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to download model: ${error}` };
  }
}

// AAISM Context - Domain knowledge for the AI
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

// Ollama API call
async function callOllama(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false,
      }),
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

// Claude API call
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

// Groq API call (FREE! - Uses OpenAI-compatible API)
async function callGroq(config: AIConfig, messages: Message[]): Promise<AIResponse> {
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
        temperature: 0.7,
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

// OpenAI API call
async function callOpenAI(config: AIConfig, messages: Message[]): Promise<AIResponse> {
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

// Main AI service function
export async function chat(config: AIConfig, messages: Message[]): Promise<AIResponse> {
  // Prepend AAISM context as system message if not present
  const hasSystem = messages.some(m => m.role === 'system');
  const fullMessages: Message[] = hasSystem 
    ? messages 
    : [{ role: 'system', content: AAISM_CONTEXT }, ...messages];

  switch (config.provider) {
    case 'ollama':
      return callOllama(config, fullMessages);
    case 'groq':
      return callGroq(config, fullMessages);
    case 'claude':
      return callClaude(config, fullMessages);
    case 'openai':
      return callOpenAI(config, fullMessages);
    default:
      return { content: '', error: 'Unknown AI provider' };
  }
}

// Specialized AI functions

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

  return chat(config, [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt }
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
    { role: 'user', content: prompt }
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
    { role: 'user', content: prompt }
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
    { role: 'user', content: prompt }
  ]);
}

// Storage helpers for AI config
const AI_CONFIG_KEY = 'aaism-ai-config';

export function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  // Default to Ollama
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

// Test connection to AI provider
export async function testConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  const response = await chat(config, [
    { role: 'user', content: 'Say "Connection successful!" in exactly those words.' }
  ]);

  if (response.error) {
    return { success: false, message: response.error };
  }

  return { success: true, message: 'Connected successfully!' };
}
