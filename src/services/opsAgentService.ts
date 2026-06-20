import { chat, loadAIConfig, type Message } from './aiService';
import { buildOpsSystemPrompt } from './agentPrompts';
import { recordAgentSummary } from './memoryService';

export type OpsAgentId = 'openclaw' | 'hermes' | 'claude-analyst';

export interface OpsAgentProfile {
  id: OpsAgentId;
  name: string;
  codename: string;
  posture: string;
  description: string;
  accent: string;
  systemPrompt: string;
}

export interface MitreMappingEntry {
  id: string;
  label: string;
  framework: 'ATT&CK' | 'ATLAS' | 'NIST' | 'other';
  url?: string;
  confidence: 'high' | 'low';
  inferred: boolean;
}

export interface OpsAnalysisResult {
  summary: string;
  findings: string[];
  nextSteps: string[];
  commands: string[];
  mitreMapping: MitreMappingEntry[];
  raw?: string;
  error?: string;
}

export const OPS_AGENT_PROFILES: OpsAgentProfile[] = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    codename: 'Recon Specialist',
    posture: 'Offensive / recon posture',
    description: 'OSINT enrichment, attack surface mapping, and external exposure analysis.',
    accent: 'text-orange-600 dark:text-orange-400',
    systemPrompt: '',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    codename: 'Tactical Analyst',
    posture: 'Fast triage',
    description: 'Log triage, IOC extraction, alert correlation, and quick containment recommendations.',
    accent: 'text-cyan-600 dark:text-cyan-400',
    systemPrompt: '',
  },
  {
    id: 'claude-analyst',
    name: 'Claude Analyst',
    codename: 'Deep Reasoning',
    posture: 'Strategic analysis',
    description: 'Incident reports, risk assessments, root cause analysis, and executive summaries.',
    accent: 'text-violet-600 dark:text-violet-400',
    systemPrompt: '',
  },
];

export function getOpsAgent(id: OpsAgentId): OpsAgentProfile {
  const base = OPS_AGENT_PROFILES.find(a => a.id === id) ?? OPS_AGENT_PROFILES[0];
  return { ...base, systemPrompt: buildOpsSystemPrompt(base.id) };
}

function resolveMitreUrl(id: string, framework?: string): { url: string; framework: MitreMappingEntry['framework'] } | null {
  const trimmed = id.trim();
  const upper = trimmed.toUpperCase();

  if (/^AML\.T\d+/i.test(trimmed)) {
    return { url: `https://atlas.mitre.org/techniques/${upper}`, framework: 'ATLAS' };
  }
  if (/^T\d{4}(\.\d+)?$/i.test(trimmed)) {
    return { url: `https://attack.mitre.org/techniques/${upper}/`, framework: 'ATT&CK' };
  }
  if (framework === 'NIST' || /AI\s*RMF|NIST/i.test(trimmed) || /NIST/i.test(framework ?? '')) {
    return { url: 'https://www.nist.gov/itl/ai-risk-management-framework', framework: 'NIST' };
  }
  if (framework === 'ATLAS') {
    return { url: 'https://atlas.mitre.org/', framework: 'ATLAS' };
  }
  if (framework === 'ATT&CK') {
    return { url: 'https://attack.mitre.org/', framework: 'ATT&CK' };
  }
  return null;
}

function normalizeMitreEntry(raw: unknown): MitreMappingEntry | null {
  if (typeof raw === 'string') {
    const idMatch = raw.match(/(AML\.T\d+|T\d{4}(?:\.\d+)?)/i);
    const id = idMatch?.[1] ?? raw.slice(0, 32);
    const resolved = resolveMitreUrl(id);
    const inferred = !idMatch;
    return {
      id,
      label: raw,
      framework: resolved?.framework ?? 'other',
      url: resolved?.url,
      confidence: inferred ? 'low' : 'high',
      inferred,
    };
  }

  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;
  const id = String(entry.id ?? entry.technique ?? '').trim();
  if (!id) return null;

  const frameworkRaw = String(entry.framework ?? '').toUpperCase();
  let framework: MitreMappingEntry['framework'] = 'other';
  if (frameworkRaw.includes('ATLAS')) framework = 'ATLAS';
  else if (frameworkRaw.includes('ATT&CK') || frameworkRaw.includes('ATTACK')) framework = 'ATT&CK';
  else if (frameworkRaw.includes('NIST')) framework = 'NIST';

  const inferred = Boolean(entry.inferred) || !/(AML\.T\d+|T\d{4})/i.test(id);
  const resolved = resolveMitreUrl(id, framework);
  const finalFramework = resolved?.framework ?? framework;

  return {
    id,
    label: String(entry.label ?? entry.name ?? id),
    framework: finalFramework,
    url: resolved?.url,
    confidence: inferred ? 'low' : 'high',
    inferred,
  };
}

function parseAnalysisResponse(content: string): OpsAnalysisResult {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const rawMappings = parsed.mitreMapping ?? parsed.mitre_mapping ?? [];
      const mitreMapping = (Array.isArray(rawMappings) ? rawMappings : [])
        .map(normalizeMitreEntry)
        .filter((m): m is MitreMappingEntry => m !== null);

      return {
        summary: String(parsed.summary ?? 'Analysis complete.'),
        findings: Array.isArray(parsed.findings) ? parsed.findings.map(String) : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
        commands: Array.isArray(parsed.commands) ? parsed.commands.map(String) : [],
        mitreMapping,
        raw: content,
      };
    }
  } catch { /* fall through */ }

  return {
    summary: content.slice(0, 500),
    findings: [],
    nextSteps: [],
    commands: [],
    mitreMapping: [],
    raw: content,
  };
}

export async function analyzeWithOpsAgent(
  agentId: OpsAgentId,
  input: string,
  context?: string,
): Promise<OpsAnalysisResult> {
  const agent = getOpsAgent(agentId);
  const config = loadAIConfig();

  const messages: Message[] = [
    { role: 'system', content: agent.systemPrompt },
    {
      role: 'user',
      content: context
        ? `Additional context: ${context}\n\nData to analyze:\n${input}`
        : `Analyze the following:\n${input}`,
    },
  ];

  const response = await chat(config, messages, { jsonMode: true, temperature: 0.3 });

  if (response.error) {
    return {
      summary: '',
      findings: [],
      nextSteps: [],
      commands: [],
      mitreMapping: [],
      error: response.error,
    };
  }

  const result = parseAnalysisResponse(response.content);
  if (!result.error && result.summary) {
    recordAgentSummary({
      persona: agentId,
      summary: result.summary.slice(0, 280),
      certId: undefined,
    });
  }
  return result;
}

export async function generateMiniLabFromIncident(
  input: string,
  certId: string,
  domainId: number,
): Promise<{ title: string; steps: string[]; type: string } | null> {
  const config = loadAIConfig();
  const response = await chat(config, [
    {
      role: 'system',
      content: 'Generate a mini hands-on lab from an incident. Return JSON: {title, type: "command"|"analysis"|"decision", steps: string[]}. Max 4 steps. Lab-only, no exploitation.',
    },
    {
      role: 'user',
      content: `Cert: ${certId}, Domain: ${domainId}\nIncident data:\n${input.slice(0, 3000)}`,
    },
  ], { jsonMode: true, temperature: 0.4 });

  if (response.error || !response.content) return null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* ignore */ }
  return null;
}
