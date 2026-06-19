import type { DomainGuide } from '../aaismDomainGuide';

export type CertCategory = 'cybersecurity' | 'ai' | 'blockchain' | 'quantum';

export type CertStatus = 'active' | 'preview' | 'coming-soon';

export interface CertDomain {
  id: number;
  name: string;
  shortName: string;
  weight?: string;
  icon?: string;
}

export interface Certification {
  id: string;
  name: string;
  shortName: string;
  category: CertCategory;
  vendor: string;
  domains: CertDomain[];
  examFormat?: { questions: number; minutes: number; passingScore?: number };
  description: string;
  color: string;
  status: CertStatus;
  domainGuides?: DomainGuide[];
}
