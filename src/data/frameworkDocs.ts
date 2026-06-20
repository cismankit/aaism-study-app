/** Official documentation URLs for framework crosswalk entries. */

export interface FrameworkDoc {
  url: string;
  publisher: string;
}

const FRAMEWORK_DOCS: Array<{ patterns: string[]; doc: FrameworkDoc }> = [
  {
    patterns: ['nist ai rmf', 'ai rmf', 'nist genai profile'],
    doc: { url: 'https://www.nist.gov/itl/ai-risk-management-framework', publisher: 'NIST' },
  },
  {
    patterns: ['nist csf', 'nist sp 800', 'nist blockchain', 'nist pqc', 'nist ssdf'],
    doc: { url: 'https://www.nist.gov/cyberframework', publisher: 'NIST' },
  },
  {
    patterns: ['iso/iec 42001', 'iso 42001', 'aims'],
    doc: { url: 'https://www.iso.org/standard/81230.html', publisher: 'ISO' },
  },
  {
    patterns: ['iso/iec 23894', 'iso 27001', 'iso 27002'],
    doc: { url: 'https://www.iso.org/isoiec-27001-information-security.html', publisher: 'ISO' },
  },
  {
    patterns: ['eu ai act'],
    doc: { url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', publisher: 'EU' },
  },
  {
    patterns: ['owasp top 10 for llm', 'owasp llm', 'llm01'],
    doc: { url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', publisher: 'OWASP' },
  },
  {
    patterns: ['owasp top 10', 'owasp testing', 'owasp samm', 'owasp ml', 'owasp smart contract'],
    doc: { url: 'https://owasp.org/www-project-top-10/', publisher: 'OWASP' },
  },
  {
    patterns: ['mitre atlas'],
    doc: { url: 'https://atlas.mitre.org/', publisher: 'MITRE' },
  },
  {
    patterns: ['mitre att&ck', 'mitre attack'],
    doc: { url: 'https://attack.mitre.org/', publisher: 'MITRE' },
  },
  {
    patterns: ['cobit', 'isaca', 'aaism'],
    doc: { url: 'https://www.isaca.org/resources/cobit', publisher: 'ISACA' },
  },
  {
    patterns: ['oecd ai'],
    doc: { url: 'https://oecd.ai/en/ai-principles', publisher: 'OECD' },
  },
  {
    patterns: ['pci-dss', 'pci dss'],
    doc: { url: 'https://www.pcisecuritystandards.org/', publisher: 'PCI SSC' },
  },
  {
    patterns: ['gdpr'],
    doc: { url: 'https://gdpr.eu/', publisher: 'EU' },
  },
  {
    patterns: ['cissp', 'isc2', '(isc)'],
    doc: { url: 'https://www.isc2.org/certifications/cissp', publisher: '(ISC)²' },
  },
  {
    patterns: ['comptia', 'security+'],
    doc: { url: 'https://www.comptia.org/certifications/security', publisher: 'CompTIA' },
  },
  {
    patterns: ['cis controls'],
    doc: { url: 'https://www.cisecurity.org/controls', publisher: 'CIS' },
  },
  {
    patterns: ['fair'],
    doc: { url: 'https://www.fairinstitute.org/', publisher: 'FAIR Institute' },
  },
  {
    patterns: ['enisa'],
    doc: { url: 'https://www.enisa.europa.eu/topics/artificial-intelligence', publisher: 'ENISA' },
  },
];

function normalizeFrameworkName(name: string): string {
  return name.toLowerCase().replace(/[®™]/g, '').trim();
}

export function getFrameworkDoc(name: string): FrameworkDoc | undefined {
  const normalized = normalizeFrameworkName(name);
  for (const entry of FRAMEWORK_DOCS) {
    if (entry.patterns.some(p => normalized.includes(p))) {
      return entry.doc;
    }
  }
  return undefined;
}

export function getFrameworkDocUrl(name: string): string | undefined {
  return getFrameworkDoc(name)?.url;
}
