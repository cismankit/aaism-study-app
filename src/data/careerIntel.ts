/** Career intelligence types and tech stack taxonomy — public data only. */

import type { ProvenanceMeta } from '../types/provenance';

export interface CareerProvenance {
  overall: ProvenanceMeta;
  sections: Record<string, ProvenanceMeta>;
}

export interface TechStackTag {
  category: TechStackCategory;
  label: string;
}

export type TechStackCategory =
  | 'language'
  | 'cloud'
  | 'security'
  | 'framework'
  | 'data'
  | 'devops'
  | 'compliance'
  | 'other';

export const TECH_STACK_TAXONOMY: Record<TechStackCategory, string[]> = {
  language: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby', 'SQL'],
  cloud: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'Cloudflare'],
  security: ['SIEM', 'EDR', 'IAM', 'Zero Trust', 'SOAR', 'PAM', 'WAF', 'DLP', 'SAST', 'DAST'],
  framework: ['React', 'Node.js', 'Spring', 'Django', 'FastAPI', '.NET'],
  data: ['PostgreSQL', 'MongoDB', 'Redis', 'Snowflake', 'Databricks', 'Kafka'],
  devops: ['CI/CD', 'GitHub Actions', 'Jenkins', 'Ansible', 'Prometheus', 'Grafana'],
  compliance: ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI DSS', 'HIPAA', 'GDPR', 'FedRAMP'],
  other: ['Agile', 'ITIL', 'ServiceNow', 'Jira'],
};

export interface CompanyProfile {
  id: string;
  companyName: string;
  careersUrl?: string;
  createdAt: string;
  updatedAt: string;
  techStack: TechStackTag[];
  hiringThemes: string[];
  openRolesSummary: string;
  seniorityMix: string;
  certAlignment: Array<{ cert: string; relevance: string; matchScore: number }>;
  cultureSignals: string[];
  rawNotes?: string;
  provenance?: CareerProvenance;
}

export interface JobAnalysis {
  id: string;
  title: string;
  analyzedAt: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  techStack: TechStackTag[];
  teamHints: string[];
  interviewPrep: string[];
  certTieIns: string[];
  questionsForHumans: string[];
  seniorityLevel: string;
  provenance?: CareerProvenance;
}

export interface PeopleMapResult {
  id: string;
  companyName: string;
  roleTitle: string;
  createdAt: string;
  orgHypothesis: string[];
  contactsToReach: Array<{ role: string; why: string; priority: 'high' | 'medium' | 'low' }>;
  outreachDraft: string;
  publicFootprintTips: string[];
  ethicsNote: string;
  provenance?: CareerProvenance;
}

export const CAREER_ETHICS_BANNER =
  'Public information only. Paste data you found yourself. No automated scraping of private profiles. Connect as humans.';

export const CAREER_STORAGE_KEY = 'aaism-career-profiles';

export function inferTechTags(text: string): TechStackTag[] {
  const lower = text.toLowerCase();
  const found: TechStackTag[] = [];
  for (const [category, labels] of Object.entries(TECH_STACK_TAXONOMY) as [TechStackCategory, string[]][]) {
    for (const label of labels) {
      if (lower.includes(label.toLowerCase())) {
        found.push({ category, label });
      }
    }
  }
  return found;
}
