import { chat, loadAIConfig, type Message } from './aiService';

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

export interface OpsAnalysisResult {
  summary: string;
  findings: string[];
  nextSteps: string[];
  commands: string[];
  mitreMapping: string[];
  raw?: string;
  error?: string;
}

const SAFETY_PREAMBLE = `You assist authorized security professionals in lab and enterprise environments only.
Never provide exploit code, credential attacks, or instructions for unauthorized access.
Focus on defensive analysis, triage, and remediation recommendations.`;

export const OPS_AGENT_PROFILES: OpsAgentProfile[] = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    codename: 'Recon Specialist',
    posture: 'Offensive / recon posture',
    description: 'OSINT enrichment, attack surface mapping, and external exposure analysis.',
    accent: 'text-orange-600 dark:text-orange-400',
    systemPrompt: `${SAFETY_PREAMBLE}

You are OpenClaw — an offensive reconnaissance analyst persona.
Focus on: attack surface enumeration, OSINT pivots, exposed services, subdomain patterns, and MITRE ATT&CK mapping.
Return structured JSON with keys: summary, findings (array), nextSteps (array), commands (array of safe recon commands), mitreMapping (array of technique IDs with brief labels).
Commands must be read-only / passive (dig, curl -I, whois, nslookup) — no exploitation.`,
  },
  {
    id: 'hermes',
    name: 'Hermes',
    codename: 'Tactical Analyst',
    posture: 'Fast triage',
    description: 'Log triage, IOC extraction, alert correlation, and quick containment recommendations.',
    accent: 'text-cyan-600 dark:text-cyan-400',
    systemPrompt: `${SAFETY_PREAMBLE}

You are Hermes — a fast tactical SOC analyst.
Focus on: log parsing, IOC extraction (IPs, domains, hashes), timeline reconstruction, severity scoring.
Return structured JSON with keys: summary, findings, nextSteps, commands (grep/awk/siem query examples), mitreMapping.
Be concise and actionable — operators need answers in under 30 seconds of reading.`,
  },
  {
    id: 'claude-analyst',
    name: 'Claude Analyst',
    codename: 'Deep Reasoning',
    posture: 'Strategic analysis',
    description: 'Incident reports, risk assessments, root cause analysis, and executive summaries.',
    accent: 'text-violet-600 dark:text-violet-400',
    systemPrompt: `${SAFETY_PREAMBLE}

You are Claude Analyst — a senior security strategist with deep reasoning capability.
Focus on: root cause analysis, business impact, risk scoring, compliance implications, and structured incident reports.
Return structured JSON with keys: summary, findings, nextSteps, commands (investigation commands only), mitreMapping.
Write for both technical and leadership audiences.`,
  },
];

export function getOpsAgent(id: OpsAgentId): OpsAgentProfile {
  return OPS_AGENT_PROFILES.find(a => a.id === id) ?? OPS_AGENT_PROFILES[0];
}

function parseAnalysisResponse(content: string): OpsAnalysisResult {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<OpsAnalysisResult>;
      return {
        summary: parsed.summary ?? 'Analysis complete.',
        findings: parsed.findings ?? [],
        nextSteps: parsed.nextSteps ?? [],
        commands: parsed.commands ?? [],
        mitreMapping: parsed.mitreMapping ?? [],
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

  return parseAnalysisResponse(response.content);
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
