import { AAISM_LABS } from './aaism';
import { CISSP_LABS } from './cissp';
import { SECONDARY_CERT_LABS } from './secondary';
import type { LabDefinition } from './types';

export type { LabDefinition, LabStep, LabType, LabProgressRecord, AnalysisQuestion, DecisionNode } from './types';

export const ALL_LABS: LabDefinition[] = [
  ...AAISM_LABS,
  ...CISSP_LABS,
  ...SECONDARY_CERT_LABS,
];

export function getLabsForCert(certId: string): LabDefinition[] {
  return ALL_LABS.filter(l => l.certId === certId);
}

export function getLabsForDomain(certId: string, domainId: number): LabDefinition[] {
  return ALL_LABS.filter(l => l.certId === certId && l.domainId === domainId);
}

export function getLabById(labId: string): LabDefinition | undefined {
  return ALL_LABS.find(l => l.id === labId);
}

export function getLabStats(certId: string): { total: number; byDomain: Record<number, number> } {
  const labs = getLabsForCert(certId);
  const byDomain: Record<number, number> = {};
  labs.forEach(l => { byDomain[l.domainId] = (byDomain[l.domainId] ?? 0) + 1; });
  return { total: labs.length, byDomain };
}
