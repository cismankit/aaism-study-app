export type ConnectorId =
  | 'ollama'
  | 'groq'
  | 'anthropic'
  | 'openai'
  | 'supabase'
  | 'rss-intel'
  | 'stripe'
  | 'razorpay';

export type ConnectorCategory = 'ai' | 'data' | 'payments' | 'sync';

export interface ConnectorFieldDef {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
}

export interface ConnectorDefinition {
  id: ConnectorId;
  name: string;
  category: ConnectorCategory;
  description: string;
  docsUrl?: string;
  requiredFields?: ConnectorFieldDef[];
}

export const CONNECTOR_DEFINITIONS: ConnectorDefinition[] = [
  {
    id: 'ollama',
    name: 'Local LLM (Ollama)',
    category: 'ai',
    description: 'Run models locally on your machine — private, offline-capable inference.',
    docsUrl: 'https://ollama.com',
    requiredFields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'http://localhost:11434' },
      { key: 'model', label: 'Default model', placeholder: 'qwen2.5:7b' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    category: 'ai',
    description: 'Fast cloud inference with a generous free tier.',
    docsUrl: 'https://console.groq.com',
    requiredFields: [{ key: 'apiKey', label: 'API key', secret: true, placeholder: 'gsk_…' }],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'ai',
    description: 'Claude models for reasoning, analysis, and agent workflows.',
    docsUrl: 'https://console.anthropic.com',
    requiredFields: [{ key: 'apiKey', label: 'API key', secret: true, placeholder: 'sk-ant-…' }],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    description: 'GPT models from OpenAI.',
    docsUrl: 'https://platform.openai.com/api-keys',
    requiredFields: [{ key: 'apiKey', label: 'API key', secret: true, placeholder: 'sk-…' }],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'sync',
    description: 'Cross-device progress and memory sync.',
    docsUrl: 'https://supabase.com/docs',
    requiredFields: [
      { key: 'url', label: 'Project URL', placeholder: 'https://xxx.supabase.co' },
      { key: 'anonKey', label: 'Anon key (public)', secret: true, placeholder: 'eyJ…' },
    ],
  },
  {
    id: 'rss-intel',
    name: 'RSS Intel',
    category: 'data',
    description: 'Live feed sources for Intel Hub and Command Center.',
    docsUrl: 'https://github.com/cismankit/aaism-study-app',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Hosted checkout URL for donations.',
    docsUrl: 'https://stripe.com/docs/payments/checkout',
    requiredFields: [
      { key: 'checkoutUrl', label: 'Checkout URL', placeholder: 'https://buy.stripe.com/…' },
    ],
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'payments',
    description: 'Payment link for donations (India).',
    docsUrl: 'https://razorpay.com/docs/payments/payment-links',
    requiredFields: [
      { key: 'paymentLink', label: 'Payment link', placeholder: 'https://razorpay.me/…' },
      { key: 'keyId', label: 'Key ID (optional)', placeholder: 'rzp_live_…' },
    ],
  },
];

export const CONNECTOR_BY_ID = Object.fromEntries(
  CONNECTOR_DEFINITIONS.map(d => [d.id, d]),
) as Record<ConnectorId, ConnectorDefinition>;

export const RECOMMENDED_OLLAMA_PULLS = [
  { name: 'gemma4:e4b', description: 'Gemma 4 4B · best for 8GB Mac', macRam: '8GB' },
  { name: 'gemma4:latest', description: 'Gemma 4 8B · recommended 16GB Mac', macRam: '16GB' },
  { name: 'gemma4:31b', description: 'Gemma 4 31B · best quality, 32GB+ only', macRam: '32GB' },
  { name: 'qwen2.5:7b', description: 'Top pick for structured JSON output', macRam: '8GB' },
  { name: 'llama3.1:8b', description: 'Balanced quality · proven fallback', macRam: '8GB' },
  { name: 'deepseek-r1:7b', description: 'Reasoning-focused · complex agent steps', macRam: '8GB' },
] as const;
