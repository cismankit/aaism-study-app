import {
  CERTIFICATIONS,
  DEFAULT_CERT_ID,
  getCertification,
  type Certification,
} from '../data/certifications';

const ACTIVE_CERT_KEY = 'aaism-active-cert';
const DEFAULT_CERT_KEY = 'aaism-default-cert';

export function getActiveCertId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_CERT_KEY);
    if (stored && getCertification(stored)) return stored;
  } catch {
    /* ignore */
  }
  return getDefaultCertId();
}

export function setActiveCertId(certId: string): void {
  const cert = getCertification(certId);
  if (!cert) return;
  localStorage.setItem(ACTIVE_CERT_KEY, certId);
}

export function getDefaultCertId(): string {
  try {
    const stored = localStorage.getItem(DEFAULT_CERT_KEY);
    if (stored && getCertification(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_CERT_ID;
}

export function setDefaultCertId(certId: string): void {
  const cert = getCertification(certId);
  if (!cert) return;
  localStorage.setItem(DEFAULT_CERT_KEY, certId);
  if (!localStorage.getItem(ACTIVE_CERT_KEY)) {
    localStorage.setItem(ACTIVE_CERT_KEY, certId);
  }
}

export function getActiveCertification(): Certification {
  return getCertification(getActiveCertId()) ?? CERTIFICATIONS[0];
}

export function buildCertTrainingContext(cert: Certification): string {
  const domainLines = cert.domains.map(
    d => `- Domain ${d.id}: ${d.name}${d.weight ? ` (${d.weight})` : ''}`,
  );
  const format = cert.examFormat
    ? `${cert.examFormat.questions} questions / ${cert.examFormat.minutes} minutes`
    : 'varies by vendor';

  return `You are an expert certification exam preparation assistant for ${cert.name} (${cert.shortName}) by ${cert.vendor}.

Category: ${cert.category}
Exam format: ${format}

## Exam Domains:
${domainLines.join('\n')}

Focus on scenario-based, vendor-aligned questions with clear BEST/MOST/FIRST answer patterns. Reference frameworks and controls appropriate to ${cert.shortName}.`;
}
