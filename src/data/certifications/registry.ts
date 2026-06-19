import { AAISM_DOMAIN_GUIDES } from '../aaismDomainGuide';
import type { Certification } from './types';

export const DEFAULT_CERT_ID = 'aaism';

const AAISM_DOMAINS = [
  { id: 1, name: 'AI Governance & Program Management', shortName: 'Governance', weight: '31%', icon: '🏛️' },
  { id: 2, name: 'AI Risk Management', shortName: 'Risk', weight: '31%', icon: '⚠️' },
  { id: 3, name: 'AI Technologies & Controls', shortName: 'Tech & Controls', weight: '38%', icon: '⚙️' },
  { id: 4, name: 'AI Operations', shortName: 'Operations', weight: 'Part of D3', icon: '📊' },
];

const CISSP_DOMAINS = [
  { id: 1, name: 'Security and Risk Management', shortName: 'Risk Mgmt', weight: '16%', icon: '🛡️' },
  { id: 2, name: 'Asset Security', shortName: 'Assets', weight: '10%', icon: '📦' },
  { id: 3, name: 'Security Architecture and Engineering', shortName: 'Architecture', weight: '13%', icon: '🏗️' },
  { id: 4, name: 'Communication and Network Security', shortName: 'Network', weight: '13%', icon: '🌐' },
  { id: 5, name: 'Identity and Access Management', shortName: 'IAM', weight: '13%', icon: '🔑' },
  { id: 6, name: 'Security Assessment and Testing', shortName: 'Assessment', weight: '12%', icon: '🔍' },
  { id: 7, name: 'Security Operations', shortName: 'SecOps', weight: '13%', icon: '⚡' },
  { id: 8, name: 'Software Development Security', shortName: 'DevSec', weight: '11%', icon: '💻' },
];

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'aaism',
    name: 'Artificial Intelligence Security Manager',
    shortName: 'AAISM',
    category: 'ai',
    vendor: 'ISACA',
    domains: AAISM_DOMAINS,
    examFormat: { questions: 90, minutes: 150, passingScore: 65 },
    description: 'ISACA certification for AI security governance, risk, and controls across the enterprise AI lifecycle.',
    color: '#10b981',
    status: 'active',
    domainGuides: AAISM_DOMAIN_GUIDES,
  },
  {
    id: 'cissp',
    name: 'Certified Information Systems Security Professional',
    shortName: 'CISSP',
    category: 'cybersecurity',
    vendor: '(ISC)²',
    domains: CISSP_DOMAINS,
    examFormat: { questions: 150, minutes: 180, passingScore: 70 },
    description: 'Premier cybersecurity certification covering eight domains of security leadership and technical depth.',
    color: '#3b82f6',
    status: 'preview',
  },
  {
    id: 'security-plus',
    name: 'CompTIA Security+',
    shortName: 'Security+',
    category: 'cybersecurity',
    vendor: 'CompTIA',
    domains: [
      { id: 1, name: 'General Security Concepts', shortName: 'Concepts', icon: '🛡️' },
      { id: 2, name: 'Threats, Vulnerabilities, and Mitigations', shortName: 'Threats', icon: '⚠️' },
      { id: 3, name: 'Security Architecture', shortName: 'Architecture', icon: '🏗️' },
      { id: 4, name: 'Security Operations', shortName: 'SecOps', icon: '⚡' },
      { id: 5, name: 'Security Program Management', shortName: 'Program', icon: '📋' },
    ],
    examFormat: { questions: 90, minutes: 90, passingScore: 75 },
    description: 'Entry-level cybersecurity certification validating baseline skills for security practitioners.',
    color: '#ef4444',
    status: 'preview',
  },
  {
    id: 'ceh',
    name: 'Certified Ethical Hacker',
    shortName: 'CEH',
    category: 'cybersecurity',
    vendor: 'EC-Council',
    domains: [
      { id: 1, name: 'Reconnaissance & Footprinting', shortName: 'Recon', icon: '👁️' },
      { id: 2, name: 'Scanning & Enumeration', shortName: 'Scanning', icon: '📡' },
      { id: 3, name: 'System Hacking', shortName: 'Hacking', icon: '💻' },
      { id: 4, name: 'Malware & Social Engineering', shortName: 'Malware', icon: '🦠' },
      { id: 5, name: 'Web & Network Attacks', shortName: 'Web/Net', icon: '🌐' },
    ],
    examFormat: { questions: 125, minutes: 240, passingScore: 70 },
    description: 'Offensive security certification focused on ethical hacking methodology and attack vectors.',
    color: '#a855f7',
    status: 'preview',
  },
  {
    id: 'cais',
    name: 'Certified Artificial Intelligence Security',
    shortName: 'CAIS',
    category: 'ai',
    vendor: 'ISC2 / AI Security Alliance',
    domains: [
      { id: 1, name: 'AI Threat Landscape', shortName: 'Threats', icon: '🎯' },
      { id: 2, name: 'Secure AI Development', shortName: 'DevSecAI', icon: '🔒' },
      { id: 3, name: 'AI Governance & Compliance', shortName: 'Governance', icon: '🏛️' },
      { id: 4, name: 'Operational AI Security', shortName: 'Ops', icon: '⚙️' },
    ],
    examFormat: { questions: 100, minutes: 120, passingScore: 70 },
    description: 'AI-focused security certification bridging ML engineering and enterprise security operations.',
    color: '#06b6d4',
    status: 'preview',
  },
  {
    id: 'cbsp',
    name: 'Certified Blockchain Security Professional',
    shortName: 'CBSP',
    category: 'blockchain',
    vendor: 'Blockchain Council',
    domains: [
      { id: 1, name: 'Blockchain Fundamentals', shortName: 'Fundamentals', icon: '🔗' },
      { id: 2, name: 'Smart Contract Security', shortName: 'Contracts', icon: '📝' },
      { id: 3, name: 'Consensus & Network Security', shortName: 'Consensus', icon: '🌐' },
      { id: 4, name: 'Wallet & Key Management', shortName: 'Keys', icon: '🔑' },
    ],
    examFormat: { questions: 75, minutes: 90, passingScore: 70 },
    description: 'Blockchain security certification covering smart contracts, consensus attacks, and key custody.',
    color: '#f59e0b',
    status: 'preview',
  },
  {
    id: 'qist',
    name: 'Quantum Information Security Technician',
    shortName: 'QIST',
    category: 'quantum',
    vendor: 'Quantum Industry Consortium',
    domains: [
      { id: 1, name: 'Quantum Fundamentals & Post-Quantum Crypto', shortName: 'PQC', icon: '⚛️' },
    ],
    examFormat: { questions: 60, minutes: 90, passingScore: 70 },
    description: 'Emerging quantum security track — qubits, QKD basics, and NIST post-quantum migration planning.',
    color: '#8b5cf6',
    status: 'coming-soon',
  },
];

export function getCertification(id: string): Certification | undefined {
  return CERTIFICATIONS.find(c => c.id === id);
}

export function getCertificationsByCategory(category: Certification['category']): Certification[] {
  return CERTIFICATIONS.filter(c => c.category === category);
}

export const CERT_CATEGORIES: Array<{ id: Certification['category']; label: string }> = [
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'ai', label: 'AI' },
  { id: 'blockchain', label: 'Blockchain' },
  { id: 'quantum', label: 'Quantum' },
];
