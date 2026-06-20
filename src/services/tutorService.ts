import type { Certification } from '../data/certifications/types';

export interface TutorFollowUp {
  text: string;
  icon: string;
}

export interface TutorQuickAction {
  icon: string;
  label: string;
  prompt: string;
}

/** Build a cert-specific system prompt for the AI tutor. */
export function buildCertTutorContext(cert: Certification): string {
  const domainBlocks = cert.domains
    .map(
      d =>
        `### Domain ${d.id}: ${d.name}${d.weight ? ` (${d.weight})` : ''}\n` +
        `- Focus on ${d.shortName} concepts tested on the ${cert.shortName} exam`,
    )
    .join('\n\n');

  const examFmt = cert.examFormat;
  const examLine = examFmt
    ? `${examFmt.questions} questions · ${examFmt.minutes} minutes · pass ~${examFmt.passingScore}%`
    : 'See official exam guide for format';

  return `You are an expert ${cert.shortName} exam preparation tutor. You help users prepare for the ${cert.vendor} ${cert.name} (${cert.shortName}) certification.

## ${cert.shortName} exam format
${examLine}

## ${cert.shortName} exam domains
${domainBlocks}

## Instructions
- Answer ONLY in the context of ${cert.shortName} and its domains above
- Use ${cert.vendor} exam mindset (scenario judgment, best/most appropriate answers)
- When generating practice questions, match ${cert.shortName} style and domain weights
- Do NOT reference other certifications unless the user explicitly compares them
- ${cert.description}`;
}

const GENERIC_FOLLOW_UPS: TutorFollowUp[] = [
  { text: 'Give me a practice question on this topic', icon: '❓' },
  { text: 'What are the key exam tips for this?', icon: '💡' },
  { text: 'How does this relate to other domains?', icon: '🔗' },
];

/** Per-cert curated follow-ups when domain keyword match fails */
const CERT_DOMAIN_FOLLOW_UPS: Record<string, Record<number, TutorFollowUp[]>> = {
  aaism: {
    1: [
      { text: 'What are the key AI governance frameworks?', icon: '🏛️' },
      { text: 'Explain the EU AI Act risk levels', icon: '⚖️' },
      { text: 'How to establish AI policies?', icon: '📋' },
    ],
    2: [
      { text: 'What are common AI attack vectors?', icon: '🎯' },
      { text: 'Explain data poisoning attacks', icon: '☠️' },
      { text: 'How to assess AI model risk?', icon: '📊' },
    ],
    3: [
      { text: 'What is MLOps?', icon: '🔧' },
      { text: 'Explain secure AI development lifecycle', icon: '🔒' },
      { text: 'Best practices for model testing', icon: '✅' },
    ],
    4: [
      { text: 'What is model drift?', icon: '📉' },
      { text: 'How to monitor AI in production?', icon: '👁️' },
      { text: 'AI incident response best practices', icon: '🚨' },
    ],
  },
  cissp: {
    1: [
      { text: 'Explain risk treatment options (accept, mitigate, transfer, avoid)', icon: '⚖️' },
      { text: 'What is the CISSP governance model?', icon: '🏛️' },
      { text: 'BCP vs DRP — key differences?', icon: '📋' },
    ],
    2: [
      { text: 'Data classification and handling requirements', icon: '📦' },
      { text: 'Asset retention and destruction best practices', icon: '🗑️' },
      { text: 'Privacy vs security in asset management', icon: '🔐' },
    ],
    3: [
      { text: 'Security architecture design principles', icon: '🏗️' },
      { text: 'Cryptography basics for CISSP', icon: '🔑' },
      { text: 'Secure SDLC integration points', icon: '💻' },
    ],
    4: [
      { text: 'Network segmentation strategies', icon: '🌐' },
      { text: 'VPN and remote access security', icon: '🔒' },
      { text: 'Wireless security controls', icon: '📡' },
    ],
    5: [
      { text: 'IAM lifecycle and provisioning', icon: '🔑' },
      { text: 'Federation and SSO concepts', icon: '🔗' },
      { text: 'Privileged access management', icon: '👤' },
    ],
    6: [
      { text: 'Penetration testing vs vulnerability assessment', icon: '🔍' },
      { text: 'Security assessment methodologies', icon: '📊' },
      { text: 'Audit and compliance testing', icon: '✅' },
    ],
    7: [
      { text: 'Incident response phases', icon: '🚨' },
      { text: 'SIEM and log management', icon: '📟' },
      { text: 'Disaster recovery testing', icon: '🔄' },
    ],
    8: [
      { text: 'Secure coding practices', icon: '💻' },
      { text: 'Software supply chain security', icon: '📦' },
      { text: 'DevSecOps integration', icon: '🔧' },
    ],
  },
  'security-plus': {
    1: [
      { text: 'CIA triad and security controls', icon: '🛡️' },
      { text: 'Zero trust fundamentals', icon: '🔐' },
      { text: 'Change management in security', icon: '📋' },
    ],
    2: [
      { text: 'Common attack types and mitigations', icon: '⚠️' },
      { text: 'Vulnerability scanning vs pen testing', icon: '🔍' },
      { text: 'Social engineering defenses', icon: '🎭' },
    ],
    3: [
      { text: 'Network security architecture', icon: '🏗️' },
      { text: 'Cloud security shared responsibility', icon: '☁️' },
      { text: 'Encryption use cases', icon: '🔑' },
    ],
    4: [
      { text: 'Incident response steps', icon: '🚨' },
      { text: 'Digital forensics basics', icon: '🔬' },
      { text: 'Automation and orchestration (SOAR)', icon: '⚡' },
    ],
    5: [
      { text: 'Risk management frameworks', icon: '📊' },
      { text: 'Security policies and procedures', icon: '📋' },
      { text: 'Third-party risk management', icon: '🤝' },
    ],
  },
};

/** Default empty-state follow-up chips per cert */
export function getCertDefaultFollowUps(cert: Certification): TutorFollowUp[] {
  const d1 = cert.domains[0];
  const d2 = cert.domains[1];
  const d3 = cert.domains[2];
  const short = cert.shortName;

  return [
    { text: `Give me an overview of ${short} Domain 1: ${d1?.shortName ?? 'foundations'}`, icon: '📚' },
    { text: `Generate a ${short} practice question`, icon: '❓' },
    { text: `What are the hardest ${short} exam topics?`, icon: '🎯' },
    ...(d2
      ? [{ text: `Explain ${d2.shortName} for ${short}`, icon: d2.icon ?? '⚠️' }]
      : []),
    ...(d3
      ? [{ text: `Key frameworks for ${d3.shortName}`, icon: d3.icon ?? '⚙️' }]
      : []),
  ].slice(0, 4);
}

export function getCertQuickActions(cert: Certification): TutorQuickAction[] {
  const short = cert.shortName;
  const firstDomain = cert.domains[0];
  return [
    { icon: '📚', label: 'Explain a concept', prompt: `Explain this ${short} concept: ` },
    { icon: '❓', label: 'Practice question', prompt: `Generate a ${short} practice question about ` },
    { icon: '🎯', label: 'Study tips', prompt: `What are the key ${short} study tips for ` },
    {
      icon: '📋',
      label: 'Domain overview',
      prompt: `Give me an overview of ${short} Domain 1${firstDomain ? `: ${firstDomain.name}` : ''}`,
    },
  ];
}

/** Infer which cert domain a message relates to. */
export function inferDomainFromText(cert: Certification, text: string): number {
  const lower = text.toLowerCase();

  for (const d of cert.domains) {
    const patterns = [
      `domain ${d.id}`,
      d.name.toLowerCase(),
      d.shortName.toLowerCase(),
    ];
    if (patterns.some(p => lower.includes(p))) {
      return d.id;
    }
  }

  return cert.domains[0]?.id ?? 1;
}

/** Generate cert-aware follow-up chips from conversation context. */
export function generateCertFollowUpQuestions(
  cert: Certification,
  topic: string,
): TutorFollowUp[] {
  const lower = topic.toLowerCase();
  const certFollowUps = CERT_DOMAIN_FOLLOW_UPS[cert.id];

  if (certFollowUps) {
    for (const d of cert.domains) {
      const patterns = [
        `domain ${d.id}`,
        d.name.toLowerCase(),
        d.shortName.toLowerCase(),
      ];
      if (patterns.some(p => lower.includes(p))) {
        const domainFollowUps = certFollowUps[d.id];
        if (domainFollowUps) {
          return domainFollowUps.slice(0, 3);
        }
      }
    }
  }

  return GENERIC_FOLLOW_UPS.map(q => ({
    ...q,
    text: q.text.replace('this', `${cert.shortName} exam content`),
  })).slice(0, 3);
}

export function tutorChatStorageKey(certId: string): string {
  return `aaism-tutor-chat-${certId}`;
}

/** One-time migration from legacy single-key tutor chat storage. */
export function migrateTutorChatStorage(certId: string): void {
  const legacyKey = 'aaism-tutor-chat';
  const newKey = tutorChatStorageKey(certId);
  try {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy && !localStorage.getItem(newKey) && certId === 'aaism') {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(legacyKey);
    }
  } catch {
    /* private mode / quota */
  }
}
