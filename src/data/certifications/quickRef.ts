import type { Certification } from './types';
import type { DomainGuide } from '../aaismDomainGuide';
import { getCertification } from './registry';

export interface QuickRefMeta {
  title: string;
  subtitle: string;
  domainBadges: Array<{ label: string; weight?: string; heaviest?: boolean }>;
}

export interface QuickRefTab {
  id: string;
  label: string;
  type: 'frameworks' | 'domain' | 'exam-tips' | 'resources';
  domainId?: number;
}

export function getQuickRefMeta(cert: Certification): QuickRefMeta {
  const format = cert.examFormat;
  const passNote = format?.passingScore ? `, pass ≈ ${format.passingScore}%` : '';
  const subtitle = format
    ? `${format.questions} questions · ${format.minutes} minutes${passNote}`
    : 'Exam format varies by vendor';

  const weights = cert.domains
    .filter(d => d.weight)
    .map(d => ({ id: d.id, pct: parseInt(d.weight!.replace(/[^\d]/g, ''), 10) || 0 }));
  const maxWeight = Math.max(...weights.map(w => w.pct), 0);

  const domainBadges = cert.domains.map(d => ({
    label: `D${d.id}: ${d.shortName}${d.weight ? ` ${d.weight}` : ''}`,
    weight: d.weight,
    heaviest: d.weight ? parseInt(d.weight.replace(/[^\d]/g, ''), 10) === maxWeight && maxWeight > 0 : false,
  }));

  return {
    title: `${cert.shortName} Exam Quick Ref`,
    subtitle,
    domainBadges,
  };
}

export function getQuickRefTabs(cert: Certification): QuickRefTab[] {
  const tabs: QuickRefTab[] = [
    { id: 'frameworks', label: 'Key Frameworks', type: 'frameworks' },
  ];

  for (const domain of cert.domains) {
    if (domain.id === 4 && cert.id === 'aaism') continue;
    tabs.push({
      id: `domain-${domain.id}`,
      label: `D${domain.id}: ${domain.shortName}${domain.weight ? ` (${domain.weight})` : ''}`,
      type: 'domain',
      domainId: domain.id,
    });
  }

  tabs.push({ id: 'exam-tips', label: `${cert.vendor} Exam Tips`, type: 'exam-tips' });
  if (cert.id !== 'aaism') {
    tabs.push({ id: 'resources', label: 'Study Resources', type: 'resources' });
  }

  return tabs;
}

export function getDomainGuide(cert: Certification, domainId: number): DomainGuide | undefined {
  return cert.domainGuides?.find(g => g.id === domainId);
}

export function getAllFrameworks(cert: Certification): DomainGuide['frameworks'] {
  const guides = cert.domainGuides ?? [];
  const seen = new Set<string>();
  const out: DomainGuide['frameworks'] = [];
  for (const guide of guides) {
    for (const fw of guide.frameworks) {
      if (!seen.has(fw.name)) {
        seen.add(fw.name);
        out.push(fw);
      }
    }
  }
  return out.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.examWeight] - order[b.examWeight];
  });
}

export function getExamTips(cert: Certification): {
  patterns: DomainGuide['examPatterns'];
  traps: DomainGuide['trapAlerts'];
} {
  const guides = cert.domainGuides ?? [];
  return {
    patterns: guides.flatMap(g => g.examPatterns),
    traps: guides.flatMap(g => g.trapAlerts),
  };
}

export function getCertQuickRefResources(certId: string): Array<{ title: string; url: string; note?: string }> {
  const resources: Record<string, Array<{ title: string; url: string; note?: string }>> = {
    cissp: [
      { title: '(ISC)² CISSP Exam Outline', url: 'https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline', note: 'Official domain weights' },
      { title: 'CISSP Study Group', url: 'https://www.isc2.org/certifications/cissp', note: 'Vendor resources' },
      { title: 'NIST CSF 2.0', url: 'https://www.nist.gov/cyberframework', note: 'High-yield framework crosswalk' },
    ],
    'security-plus': [
      { title: 'CompTIA Security+ Exam Objectives', url: 'https://www.comptia.org/certifications/security', note: 'SY0-701 objectives' },
      { title: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', note: 'Maps to multiple domains' },
    ],
    ceh: [
      { title: 'EC-Council CEH Blueprint', url: 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', note: 'Official exam blueprint' },
    ],
    cais: [
      { title: 'NIST AI RMF', url: 'https://www.nist.gov/itl/ai-risk-management-framework', note: 'Core AI security framework' },
    ],
    cbsp: [
      { title: 'OWASP Smart Contract Top 10', url: 'https://owasp.org/www-project-smart-contract-top-10/', note: 'Smart contract security' },
    ],
    qist: [
      { title: 'NIST Post-Quantum Cryptography', url: 'https://csrc.nist.gov/projects/post-quantum-cryptography', note: 'PQC migration planning' },
    ],
  };
  return resources[certId] ?? [
    { title: 'Vendor exam outline', url: '#', note: 'Check your certification vendor for the latest outline' },
  ];
}

export function getQuickRefForCert(certId: string): { cert: Certification; meta: QuickRefMeta; tabs: QuickRefTab[] } | null {
  const cert = getCertification(certId);
  if (!cert) return null;
  return {
    cert,
    meta: getQuickRefMeta(cert),
    tabs: getQuickRefTabs(cert),
  };
}
