/**
 * Platform registry — policy rules, quality gates, and security posture.
 */

import {
  SECURITY_POLICY,
  SECURITY_POLICY_VERSION,
  SECRET_STORAGE_KEYS,
  AI_KILL_SWITCH_SESSION_KEY,
  AI_KILL_SWITCH_PERSIST_KEY,
  RATE_LIMITS,
  CSP_CONNECT_SRC,
  isSafeFetchUrl,
  isAllowedOllamaUrl,
  isAllowedHttpsUrl,
  isAllowedCloudAiBaseUrl,
  validateUrlForFetch,
  sanitizeSecretsInMessage,
  isAIKillSwitchActive,
  createRateLimiter,
  type FetchUrlPurpose,
} from './securityPolicy';

export const PLATFORM_REGISTRY = {
  id: 'aegis-platform',
  securityVersion: SECURITY_POLICY_VERSION,
  security: SECURITY_POLICY,
} as const;

export {
  SECURITY_POLICY,
  SECURITY_POLICY_VERSION,
  SECRET_STORAGE_KEYS,
  AI_KILL_SWITCH_SESSION_KEY,
  AI_KILL_SWITCH_PERSIST_KEY,
  RATE_LIMITS,
  CSP_CONNECT_SRC,
  isSafeFetchUrl,
  isAllowedOllamaUrl,
  isAllowedHttpsUrl,
  isAllowedCloudAiBaseUrl,
  validateUrlForFetch,
  sanitizeSecretsInMessage,
  isAIKillSwitchActive,
  createRateLimiter,
  type FetchUrlPurpose,
};

export interface PlatformRule {
  action: string;
  rationale: string;
}

export interface QualityGate {
  id: string;
  label: string;
  npmScript?: string;
  description: string;
}

/** Actions the platform permits (study, analysis, read-only ops). */
export const PLATFORM_RULES = {
  allowed: [
    {
      action: 'Exam study assistance',
      rationale: 'Grounded answers from domain guides, glossary, and curated question banks.',
    },
    {
      action: 'Scenario-based judgment drills',
      rationale: 'BEST/MOST/FIRST pattern practice and case studies for exam prep.',
    },
    {
      action: 'Read-only security log analysis',
      rationale: 'Ops copilot on user-pasted logs and IOCs — no outbound exploitation.',
    },
    {
      action: 'Agent discovery of exam questions',
      rationale: 'Curated question generation from public frameworks (NIST, OWASP, MITRE).',
    },
    {
      action: 'Content generation for study outreach',
      rationale: 'LinkedIn posts, threads, and README drafts from public study intel.',
    },
    {
      action: 'Career intel from pasted public data',
      rationale: 'Job-description analysis and skill-gap mapping — no profile scraping.',
    },
    {
      action: 'Local LLM inference (Ollama)',
      rationale: 'On-device inference when user configures a local endpoint.',
    },
    {
      action: 'Progress export and restore',
      rationale: 'User-initiated backup of quiz scores and study progress.',
    },
  ] as PlatformRule[],
  forbidden: [
    {
      action: 'Autonomous exploitation',
      rationale: 'No automated attacks against live systems without explicit user scope.',
    },
    {
      action: 'Credential stuffing or brute-force',
      rationale: 'No password spraying, hash cracking, or credential abuse workflows.',
    },
    {
      action: 'Malware or weaponized payload generation',
      rationale: 'No exploit code, droppers, or operational malware for real targets.',
    },
    {
      action: 'Unauthorized access or lateral movement',
      rationale: 'No guidance to bypass auth, pivot networks, or access non-consented assets.',
    },
    {
      action: 'Social engineering against real individuals',
      rationale: 'No phishing templates aimed at identifiable people or orgs.',
    },
    {
      action: 'Private profile or PII scraping',
      rationale: 'No LinkedIn scraping, doxxing, or harvesting non-public personal data.',
    },
    {
      action: 'Data exfiltration commands',
      rationale: 'No outbound transfers of sensitive data to third-party endpoints.',
    },
    {
      action: 'AI actions while kill switch is engaged',
      rationale: 'Emergency stop blocks all in-flight and new agent/LLM calls.',
    },
  ] as PlatformRule[],
};

/** Release checklist — mirrored by scripts/quality-gate.mjs. */
export const QUALITY_GATES: QualityGate[] = [
  {
    id: 'tsc',
    label: 'TypeScript compiles',
    npmScript: 'tsc',
    description: 'Zero type errors across src/ before any bundle ships.',
  },
  {
    id: 'build-pages',
    label: 'GitHub Pages build',
    npmScript: 'build:pages',
    description: 'Production Vite build with GITHUB_PAGES base path succeeds.',
  },
  {
    id: 'smoke',
    label: 'AI smoke tests',
    npmScript: 'run-smoke-tests.mjs',
    description: 'Ollama chat, ops copilot JSON, mission orchestrator, and discovery JSON parse.',
  },
  {
    id: 'version-sync',
    label: 'Version metadata synced',
    npmScript: 'sync:version',
    description: 'package.json semver + git hash + build date written to appMeta.generated.ts.',
  },
  {
    id: 'no-secrets',
    label: 'No secrets in client bundle',
    description: 'API keys stay in localStorage; no hardcoded tokens in shipped JS.',
  },
  {
    id: 'csp',
    label: 'CSP configured',
    description: 'index.html Content-Security-Policy restricts script and connect sources.',
  },
];

/** npm script that runs automated gates (tsc + build:pages + smoke). */
export const QUALITY_GATE_SCRIPT = 'quality:gate';

const FORBIDDEN_PHRASES = PLATFORM_RULES.forbidden.map((r) => r.action.toLowerCase());

/** Scan user input for forbidden action phrases from PLATFORM_RULES. */
export function findForbiddenTerm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const rule of PLATFORM_RULES.forbidden) {
    if (lower.includes(rule.action.toLowerCase())) return rule.action;
  }
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      const match = PLATFORM_RULES.forbidden.find(
        (r) => r.action.toLowerCase().includes(phrase) || phrase.includes(r.action.toLowerCase()),
      );
      return match?.action ?? phrase;
    }
  }
  return null;
}

export function forbiddenContentMessage(action: string): string {
  const rule = PLATFORM_RULES.forbidden.find((r) => r.action === action);
  return rule
    ? `Blocked: ${action}. ${rule.rationale}`
    : `Blocked: ${action} is not permitted on this platform.`;
}

/** System-prompt block listing allowed and forbidden platform actions. */
export function buildPlatformRegistryPromptBlock(): string {
  const allowed = PLATFORM_RULES.allowed.map((r) => `- ${r.action}`).join('\n');
  const forbidden = PLATFORM_RULES.forbidden
    .map((r) => `- **${r.action}** — ${r.rationale}`)
    .join('\n');
  return `## Platform registry (${PLATFORM_REGISTRY.id})

### Allowed actions
${allowed}

### Forbidden actions (never perform or recommend)
${forbidden}`;
}
