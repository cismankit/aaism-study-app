// Comprehensive AAISM Exam Content
// Based on ISACA AAISM (AI Security Manager) Certification

import { ADDITIONAL_QUESTIONS } from './additionalQuestions';
import { SCENARIO_QUESTIONS } from './expandedQuestions';
import { BULK_QUESTIONS } from './bulkQuestions';
import { CAIS_QUESTIONS } from './certifications/content/cais/questions';
import { CBSP_QUESTIONS } from './certifications/content/cbsp/questions';
import { CEH_QUESTIONS } from './certifications/content/ceh/questions';
import { CISSP_QUESTIONS } from './certifications/content/cissp/questions';
import { QIST_QUESTIONS } from './certifications/content/qist/questions';
import { SECURITY_PLUS_QUESTIONS } from './certifications/content/security-plus/questions';
import { DEFAULT_CERT_ID, getCertification } from './certifications/registry';
import { getActiveCertId } from '../services/certContextService';
import { topics as kbTopics } from './knowledgeBase';

export interface ExamTopic {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  examTips?: string[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  topics: ExamTopic[];
  practiceQuestions: ExamQuestion[];
}

export interface Domain {
  id: number;
  name: string;
  weight: string;
  description: string;
  chapters: Chapter[];
  keyFrameworks: string[];
  learningObjectives: string[];
}

export interface ExamQuestion {
  id: string;
  domain: number;
  certId?: string;
  chapter?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export function resolveQuestionCertId(q: ExamQuestion): string {
  return q.certId ?? DEFAULT_CERT_ID;
}

export function getDomainsForCert(certId?: string) {
  const id = certId ?? getActiveCertId();
  const cert = getCertification(id);
  if (!cert) return ALL_DOMAINS;
  if (id === DEFAULT_CERT_ID) return ALL_DOMAINS;
  return cert.domains.map(d => ({
    id: d.id,
    name: d.name,
    weight: d.weight ?? '',
    description: d.shortName,
    chapters: [] as Chapter[],
    keyFrameworks: [] as string[],
    learningObjectives: [] as string[],
  }));
}

// ============================================
// DOMAIN 1: AI GOVERNANCE (25%)
// ============================================
export const DOMAIN_1: Domain = {
  id: 1,
  name: "AI Governance & Program Management",
  weight: "31%",
  description: "Advise stakeholders on implementing AI security solutions through appropriate and effective policy, data governance, program management and incident response.",
  keyFrameworks: [
    "NIST AI RMF (Risk Management Framework)",
    "ISO/IEC 42001 AI Management System",
    "EU AI Act",
    "OECD AI Principles",
    "IEEE Ethically Aligned Design"
  ],
  learningObjectives: [
    "Develop and implement AI governance frameworks",
    "Establish AI policies, standards, and procedures",
    "Ensure regulatory compliance and ethical AI practices",
    "Manage stakeholders and communicate AI strategies",
    "Build AI literacy across the organization"
  ],
  chapters: [
    {
      id: "1.1",
      number: 1,
      title: "AI Governance Frameworks",
      description: "Understanding and implementing organizational AI governance structures",
      topics: [
        {
          id: "1.1.1",
          title: "AI Governance Structure",
          description: "Organizational structures for AI oversight and decision-making",
          keyPoints: [
            "AI Governance Board/Committee roles and responsibilities",
            "Executive sponsorship and accountability",
            "Cross-functional governance teams",
            "AI Center of Excellence (CoE)",
            "Reporting lines and escalation paths",
            "Integration with existing governance (IT, Risk, Compliance)"
          ],
          examTips: [
            "Know the difference between strategic vs operational governance",
            "Understand who should be on an AI governance board"
          ]
        },
        {
          id: "1.1.2",
          title: "AI Strategy Alignment",
          description: "Aligning AI initiatives with business objectives",
          keyPoints: [
            "Business case development for AI",
            "AI roadmap and prioritization",
            "Resource allocation and budgeting",
            "Success metrics and KPIs",
            "Stakeholder buy-in and change management",
            "AI maturity assessment models"
          ]
        },
        {
          id: "1.1.3",
          title: "Governance Frameworks and Standards",
          description: "Key frameworks guiding AI governance",
          keyPoints: [
            "NIST AI RMF: Govern, Map, Measure, Manage functions",
            "ISO/IEC 42001: AI Management System requirements",
            "ISO/IEC 23894: AI Risk Management guidance",
            "OECD AI Principles: Human-centered values",
            "UNESCO Recommendation on AI Ethics",
            "Industry-specific frameworks (healthcare, finance)"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q1.1.1",
          domain: 1,
          chapter: "1.1",
          question: "What is the PRIMARY purpose of establishing an AI Governance Board?",
          options: [
            "A) To develop AI models for the organization",
            "B) To provide strategic oversight and ensure AI aligns with organizational objectives",
            "C) To replace the IT department in AI decisions",
            "D) To approve all AI vendor contracts"
          ],
          correctAnswer: 1,
          explanation: "The AI Governance Board provides strategic oversight, ensures alignment with business objectives, and sets policies. It does not develop models (technical teams do that) or replace existing departments.",
          difficulty: "medium",
          topic: "AI Governance Structure"
        },
        {
          id: "q1.1.2",
          domain: 1,
          chapter: "1.1",
          question: "Which framework provides a structured approach with Govern, Map, Measure, and Manage functions for AI risk management?",
          options: [
            "A) ISO/IEC 42001",
            "B) EU AI Act",
            "C) NIST AI Risk Management Framework",
            "D) OECD AI Principles"
          ],
          correctAnswer: 2,
          explanation: "NIST AI RMF specifically defines the Govern, Map, Measure, and Manage core functions. ISO/IEC 42001 is a management system standard, EU AI Act is regulation, and OECD provides principles.",
          difficulty: "easy",
          topic: "Governance Frameworks"
        },
        {
          id: "q1.1.3",
          domain: 1,
          chapter: "1.1",
          question: "An organization wants to assess its current AI capabilities before developing a governance strategy. What should they conduct FIRST?",
          options: [
            "A) AI risk assessment",
            "B) AI maturity assessment",
            "C) Vendor evaluation",
            "D) Technical architecture review"
          ],
          correctAnswer: 1,
          explanation: "An AI maturity assessment helps understand current capabilities, gaps, and readiness before developing strategy. Risk assessment comes after understanding what AI systems exist.",
          difficulty: "medium",
          topic: "AI Strategy Alignment"
        }
      ]
    },
    {
      id: "1.2",
      number: 2,
      title: "AI Policies and Procedures",
      description: "Developing and implementing AI policies, standards, and procedures",
      topics: [
        {
          id: "1.2.1",
          title: "AI Policy Development",
          description: "Creating comprehensive AI policies",
          keyPoints: [
            "Acceptable use policies for AI",
            "AI development and deployment policies",
            "Data policies for AI (collection, usage, retention)",
            "Third-party AI policies",
            "AI ethics policies",
            "Policy review and update cycles"
          ]
        },
        {
          id: "1.2.2",
          title: "AI Standards and Guidelines",
          description: "Technical and operational standards for AI",
          keyPoints: [
            "Model development standards",
            "Testing and validation standards",
            "Documentation requirements",
            "Performance benchmarks",
            "Security standards for AI",
            "Interoperability standards"
          ]
        },
        {
          id: "1.2.3",
          title: "AI Procedures and Processes",
          description: "Operational procedures for AI lifecycle",
          keyPoints: [
            "AI project approval procedures",
            "Model validation and sign-off procedures",
            "Incident response procedures",
            "Change management for AI",
            "Audit and review procedures",
            "Decommissioning procedures"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q1.2.1",
          domain: 1,
          chapter: "1.2",
          question: "Which of the following should be addressed FIRST when developing an AI acceptable use policy?",
          options: [
            "A) Technical architecture requirements",
            "B) Approved use cases and prohibited activities",
            "C) Vendor selection criteria",
            "D) Performance benchmarks"
          ],
          correctAnswer: 1,
          explanation: "An acceptable use policy should first define what is allowed and what is prohibited. Technical requirements and vendor criteria belong in other policies.",
          difficulty: "easy",
          topic: "AI Policy Development"
        }
      ]
    },
    {
      id: "1.3",
      number: 3,
      title: "AI Ethics and Responsible AI",
      description: "Implementing ethical AI principles and responsible AI practices",
      topics: [
        {
          id: "1.3.1",
          title: "Ethical AI Principles",
          description: "Core principles for ethical AI development and use",
          keyPoints: [
            "Fairness and non-discrimination",
            "Transparency and explainability",
            "Accountability and responsibility",
            "Privacy and data protection",
            "Safety and security",
            "Human oversight and control",
            "Beneficence (doing good)",
            "Non-maleficence (avoiding harm)"
          ],
          examTips: [
            "Understand the difference between ethics and compliance",
            "Know how to balance competing ethical principles"
          ]
        },
        {
          id: "1.3.2",
          title: "Responsible AI Implementation",
          description: "Putting ethical principles into practice",
          keyPoints: [
            "Ethics review boards and committees",
            "Ethical impact assessments",
            "Stakeholder engagement",
            "Grievance and redress mechanisms",
            "Responsible AI toolkits and checklists",
            "Continuous ethical monitoring"
          ]
        },
        {
          id: "1.3.3",
          title: "Bias and Fairness",
          description: "Understanding and mitigating AI bias",
          keyPoints: [
            "Types of bias: selection, measurement, algorithmic",
            "Historical and societal bias in data",
            "Fairness metrics and definitions",
            "Bias detection techniques",
            "Bias mitigation strategies",
            "Ongoing fairness monitoring"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q1.3.1",
          domain: 1,
          chapter: "1.3",
          question: "An AI hiring system consistently recommends fewer female candidates. This is MOST likely an example of:",
          options: [
            "A) Concept drift",
            "B) Model overfitting",
            "C) Historical bias in training data",
            "D) Adversarial attack"
          ],
          correctAnswer: 2,
          explanation: "If historical hiring data shows fewer females were hired, the model learns this pattern. This is historical/societal bias embedded in training data, not a technical error or attack.",
          difficulty: "medium",
          topic: "Bias and Fairness"
        },
        {
          id: "q1.3.2",
          domain: 1,
          chapter: "1.3",
          question: "Which principle requires that AI systems can justify their decisions in understandable terms?",
          options: [
            "A) Accountability",
            "B) Fairness",
            "C) Explainability",
            "D) Privacy"
          ],
          correctAnswer: 2,
          explanation: "Explainability (or transparency) requires AI to provide understandable justifications. Accountability is about who is responsible, fairness about equal treatment, privacy about data protection.",
          difficulty: "easy",
          topic: "Ethical AI Principles"
        }
      ]
    },
    {
      id: "1.4",
      number: 4,
      title: "Regulatory Compliance",
      description: "Understanding and complying with AI regulations",
      topics: [
        {
          id: "1.4.1",
          title: "EU AI Act",
          description: "European Union Artificial Intelligence Act requirements",
          keyPoints: [
            "Risk-based classification: Unacceptable, High, Limited, Minimal",
            "Prohibited AI practices (social scoring, manipulation)",
            "High-risk AI system requirements",
            "Transparency obligations",
            "Conformity assessments",
            "CE marking requirements",
            "Penalties and enforcement"
          ],
          examTips: [
            "Memorize the four risk categories and examples",
            "Know which applications are prohibited"
          ]
        },
        {
          id: "1.4.2",
          title: "Privacy Regulations and AI",
          description: "Data protection compliance for AI systems",
          keyPoints: [
            "GDPR and AI: lawful basis for processing",
            "Right to explanation for automated decisions",
            "Data minimization in AI",
            "Purpose limitation",
            "Data subject rights",
            "Cross-border data transfers",
            "Privacy by design for AI"
          ]
        },
        {
          id: "1.4.3",
          title: "Industry-Specific Regulations",
          description: "Sector-specific AI compliance requirements",
          keyPoints: [
            "Healthcare: FDA AI/ML guidance",
            "Financial services: SR 11-7, algorithmic trading rules",
            "Employment: EEOC guidance on AI hiring",
            "Automotive: autonomous vehicle regulations",
            "Defense: ethical AI guidelines",
            "Government: OMB AI guidance"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q1.4.1",
          domain: 1,
          chapter: "1.4",
          question: "Under the EU AI Act, which of the following would be classified as a HIGH-RISK AI system?",
          options: [
            "A) AI-powered spam filter",
            "B) AI system for employee recruitment",
            "C) AI chatbot for customer service",
            "D) AI recommendation engine for movies"
          ],
          correctAnswer: 1,
          explanation: "The EU AI Act classifies AI used in employment, including recruitment and hiring decisions, as high-risk due to significant impact on individuals' rights. Spam filters and entertainment recommendations are minimal risk.",
          difficulty: "medium",
          topic: "EU AI Act"
        },
        {
          id: "q1.4.2",
          domain: 1,
          chapter: "1.4",
          question: "Which practice is PROHIBITED under the EU AI Act?",
          options: [
            "A) Using AI for credit scoring",
            "B) AI-powered social scoring by governments",
            "C) Facial recognition in public spaces by law enforcement",
            "D) AI for medical diagnosis"
          ],
          correctAnswer: 1,
          explanation: "Social scoring by governments that leads to detrimental treatment is explicitly prohibited. Credit scoring, medical AI, and law enforcement facial recognition (with restrictions) are allowed under specific conditions.",
          difficulty: "hard",
          topic: "EU AI Act"
        }
      ]
    },
    {
      id: "1.5",
      number: 5,
      title: "Stakeholder Management",
      description: "Managing AI stakeholders and building AI literacy",
      topics: [
        {
          id: "1.5.1",
          title: "Stakeholder Identification",
          description: "Identifying and analyzing AI stakeholders",
          keyPoints: [
            "Internal stakeholders: executives, business units, IT, legal",
            "External stakeholders: customers, regulators, partners",
            "Affected communities and individuals",
            "Stakeholder mapping and analysis",
            "Interest vs influence matrix",
            "Engagement strategies by stakeholder type"
          ]
        },
        {
          id: "1.5.2",
          title: "AI Communication and Reporting",
          description: "Effective communication about AI",
          keyPoints: [
            "Executive reporting on AI initiatives",
            "Board-level AI risk reporting",
            "Technical vs non-technical communication",
            "Transparency with affected parties",
            "Crisis communication for AI incidents",
            "Public disclosure requirements"
          ]
        },
        {
          id: "1.5.3",
          title: "AI Literacy and Awareness",
          description: "Building organizational AI capabilities",
          keyPoints: [
            "AI literacy program development",
            "Role-based AI training",
            "Executive AI education",
            "Technical upskilling programs",
            "AI awareness campaigns",
            "Measuring AI literacy effectiveness"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q1.5.1",
          domain: 1,
          chapter: "1.5",
          question: "When developing an AI literacy program, which group should receive training FIRST?",
          options: [
            "A) Data scientists",
            "B) Executive leadership",
            "C) End users of AI systems",
            "D) All employees simultaneously"
          ],
          correctAnswer: 1,
          explanation: "Executive leadership should be trained first to ensure top-down support, appropriate resource allocation, and strategic alignment. They need to understand AI to make informed decisions.",
          difficulty: "medium",
          topic: "AI Literacy"
        }
      ]
    }
  ]
};

// ============================================
// DOMAIN 2: AI RISK MANAGEMENT (25%)
// ============================================
export const DOMAIN_2: Domain = {
  id: 2,
  name: "AI Risk Management",
  weight: "31%",
  description: "Assess and manage risks, threats, vulnerabilities and supply chain issues related to the enterprise-wide adoption of AI.",
  keyFrameworks: [
    "NIST AI RMF",
    "ISO/IEC 23894 AI Risk Management",
    "MITRE ATLAS",
    "OWASP Top 10 for LLMs",
    "ENISA AI Threat Landscape"
  ],
  learningObjectives: [
    "Identify and categorize AI-specific risks",
    "Conduct AI risk assessments",
    "Implement security controls for AI",
    "Manage third-party AI risks",
    "Monitor and report on AI risks"
  ],
  chapters: [
    {
      id: "2.1",
      number: 1,
      title: "AI Risk Identification",
      description: "Understanding and identifying AI-specific risks",
      topics: [
        {
          id: "2.1.1",
          title: "AI Threat Landscape",
          description: "Understanding threats specific to AI systems",
          keyPoints: [
            "Adversarial machine learning attacks",
            "Data poisoning attacks",
            "Model extraction/theft",
            "Model inversion attacks",
            "Prompt injection attacks",
            "Jailbreaking and guardrail bypass",
            "Supply chain attacks on AI",
            "Insider threats to AI systems"
          ],
          examTips: [
            "Know the difference between data poisoning and adversarial examples",
            "Understand attack surfaces at each AI lifecycle stage"
          ]
        },
        {
          id: "2.1.2",
          title: "Risk Categories",
          description: "Categories of AI risks",
          keyPoints: [
            "Security risks: confidentiality, integrity, availability",
            "Privacy risks: data exposure, inference attacks",
            "Safety risks: physical harm, critical failures",
            "Ethical risks: bias, discrimination, manipulation",
            "Operational risks: performance degradation, drift",
            "Reputational risks: public trust, brand damage",
            "Legal/Compliance risks: regulatory violations",
            "Financial risks: incorrect predictions, fraud"
          ]
        },
        {
          id: "2.1.3",
          title: "MITRE ATLAS Framework",
          description: "Adversarial Threat Landscape for AI Systems",
          keyPoints: [
            "ATLAS tactics and techniques",
            "Reconnaissance of AI systems",
            "Resource development for AI attacks",
            "Initial access to AI systems",
            "ML attack staging",
            "ML attack execution",
            "Impact on AI systems",
            "Mapping ATLAS to controls"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q2.1.1",
          domain: 2,
          chapter: "2.1",
          question: "An attacker adds carefully crafted noise to an image causing an AI classifier to misidentify it. This is an example of:",
          options: [
            "A) Data poisoning",
            "B) Adversarial example attack",
            "C) Model extraction",
            "D) Prompt injection"
          ],
          correctAnswer: 1,
          explanation: "Adversarial examples are inputs with intentional perturbations designed to cause misclassification at inference time. Data poisoning happens during training, model extraction steals the model, prompt injection targets LLMs.",
          difficulty: "medium",
          topic: "AI Threat Landscape"
        },
        {
          id: "q2.1.2",
          domain: 2,
          chapter: "2.1",
          question: "Which framework provides a knowledge base of adversarial tactics and techniques specifically for AI/ML systems?",
          options: [
            "A) NIST CSF",
            "B) MITRE ATT&CK",
            "C) MITRE ATLAS",
            "D) OWASP Top 10"
          ],
          correctAnswer: 2,
          explanation: "MITRE ATLAS (Adversarial Threat Landscape for AI Systems) specifically focuses on AI/ML adversarial tactics. ATT&CK is for general cybersecurity, NIST CSF is a cybersecurity framework, OWASP focuses on application security.",
          difficulty: "easy",
          topic: "MITRE ATLAS"
        },
        {
          id: "q2.1.3",
          domain: 2,
          chapter: "2.1",
          question: "An attacker manipulates the training data of a model to introduce a backdoor. This is known as:",
          options: [
            "A) Adversarial example",
            "B) Data poisoning",
            "C) Model inversion",
            "D) Membership inference"
          ],
          correctAnswer: 1,
          explanation: "Data poisoning involves corrupting training data to affect model behavior. This can include backdoor attacks where the model behaves normally except when triggered by specific inputs.",
          difficulty: "medium",
          topic: "AI Threat Landscape"
        }
      ]
    },
    {
      id: "2.2",
      number: 2,
      title: "AI Risk Assessment",
      description: "Methods for assessing AI risks",
      topics: [
        {
          id: "2.2.1",
          title: "Risk Assessment Methodologies",
          description: "Approaches to AI risk assessment",
          keyPoints: [
            "AI-specific risk assessment frameworks",
            "Impact and likelihood analysis",
            "Attack surface analysis",
            "Threat modeling for AI (STRIDE, PASTA)",
            "AI system inventory and classification",
            "Risk scoring and prioritization",
            "Qualitative vs quantitative assessment"
          ]
        },
        {
          id: "2.2.2",
          title: "Algorithmic Impact Assessment",
          description: "Assessing societal and individual impacts",
          keyPoints: [
            "Purpose and scope of AIAs",
            "Stakeholder impact analysis",
            "Fairness and bias assessment",
            "Privacy impact integration",
            "Human rights considerations",
            "Mitigation planning",
            "Documentation requirements"
          ]
        },
        {
          id: "2.2.3",
          title: "Third-Party AI Risk Assessment",
          description: "Assessing risks from AI vendors and partners",
          keyPoints: [
            "Vendor due diligence for AI",
            "AI-specific questionnaires",
            "Model cards and documentation review",
            "Data handling assessment",
            "Security control verification",
            "Contractual requirements",
            "Ongoing monitoring"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q2.2.1",
          domain: 2,
          chapter: "2.2",
          question: "What is the PRIMARY purpose of an Algorithmic Impact Assessment (AIA)?",
          options: [
            "A) To measure model accuracy",
            "B) To evaluate societal and individual impacts of an AI system",
            "C) To assess vendor security controls",
            "D) To determine computational requirements"
          ],
          correctAnswer: 1,
          explanation: "AIAs evaluate the broader impacts of AI on individuals and society, including fairness, rights, and potential harms. Technical performance and vendor assessments are separate activities.",
          difficulty: "medium",
          topic: "Algorithmic Impact Assessment"
        }
      ]
    },
    {
      id: "2.3",
      number: 3,
      title: "Security Controls for AI",
      description: "Implementing security controls to protect AI systems",
      topics: [
        {
          id: "2.3.1",
          title: "Data Protection Controls",
          description: "Securing data for AI",
          keyPoints: [
            "Data encryption at rest and in transit",
            "Data access controls and RBAC",
            "Data anonymization and pseudonymization",
            "Differential privacy techniques",
            "Federated learning for privacy",
            "Secure data pipelines",
            "Data lineage and provenance"
          ]
        },
        {
          id: "2.3.2",
          title: "Model Security Controls",
          description: "Protecting AI models",
          keyPoints: [
            "Model access controls",
            "Model signing and integrity",
            "Adversarial robustness testing",
            "Input validation and sanitization",
            "Output filtering and guardrails",
            "Rate limiting and monitoring",
            "Model watermarking"
          ]
        },
        {
          id: "2.3.3",
          title: "Infrastructure Security",
          description: "Securing AI infrastructure",
          keyPoints: [
            "Secure AI development environments",
            "MLOps security practices",
            "Container and orchestration security",
            "GPU and compute security",
            "API security for AI services",
            "Network segmentation",
            "Logging and monitoring"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q2.3.1",
          domain: 2,
          chapter: "2.3",
          question: "Which technique adds mathematical noise to data or queries to protect individual privacy while maintaining statistical utility?",
          options: [
            "A) Encryption",
            "B) Tokenization",
            "C) Differential privacy",
            "D) Data masking"
          ],
          correctAnswer: 2,
          explanation: "Differential privacy adds calibrated noise to prevent inference about individuals while maintaining aggregate statistical properties. It's specifically designed for privacy-preserving data analysis and AI.",
          difficulty: "hard",
          topic: "Data Protection"
        },
        {
          id: "q2.3.2",
          domain: 2,
          chapter: "2.3",
          question: "To protect against prompt injection attacks in an LLM application, which control is MOST effective?",
          options: [
            "A) Encrypting the model weights",
            "B) Input validation and output filtering",
            "C) Using a larger model",
            "D) Increasing rate limits"
          ],
          correctAnswer: 1,
          explanation: "Input validation (sanitizing prompts) and output filtering (checking responses) are the primary defenses against prompt injection. Encryption protects confidentiality, not injection attacks.",
          difficulty: "medium",
          topic: "Model Security"
        }
      ]
    },
    {
      id: "2.4",
      number: 4,
      title: "LLM and GenAI Risks",
      description: "Specific risks for Large Language Models and Generative AI",
      topics: [
        {
          id: "2.4.1",
          title: "OWASP Top 10 for LLMs",
          description: "Critical vulnerabilities in LLM applications",
          keyPoints: [
            "LLM01: Prompt Injection (direct and indirect)",
            "LLM02: Insecure Output Handling",
            "LLM03: Training Data Poisoning",
            "LLM04: Model Denial of Service",
            "LLM05: Supply Chain Vulnerabilities",
            "LLM06: Sensitive Information Disclosure",
            "LLM07: Insecure Plugin Design",
            "LLM08: Excessive Agency",
            "LLM09: Overreliance",
            "LLM10: Model Theft"
          ],
          examTips: [
            "Memorize all 10 categories and examples",
            "Know mitigation strategies for each"
          ]
        },
        {
          id: "2.4.2",
          title: "Generative AI Risks",
          description: "Risks specific to generative AI systems",
          keyPoints: [
            "Hallucinations and confabulation",
            "Deepfakes and synthetic media",
            "Copyright and IP infringement",
            "Misinformation generation",
            "Toxic content generation",
            "Data leakage through generation",
            "Prompt leaking",
            "Jailbreaking techniques"
          ]
        },
        {
          id: "2.4.3",
          title: "LLM Guardrails",
          description: "Implementing controls for LLMs",
          keyPoints: [
            "System prompt design",
            "Input guardrails and filters",
            "Output guardrails and moderation",
            "Content policies and enforcement",
            "Human-in-the-loop for critical actions",
            "Grounding and retrieval augmentation",
            "Confidence thresholds"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q2.4.1",
          domain: 2,
          chapter: "2.4",
          question: "According to OWASP Top 10 for LLMs, which vulnerability allows attackers to manipulate an LLM by embedding instructions in external data sources?",
          options: [
            "A) Direct prompt injection",
            "B) Indirect prompt injection",
            "C) Training data poisoning",
            "D) Insecure output handling"
          ],
          correctAnswer: 1,
          explanation: "Indirect prompt injection embeds malicious instructions in external data (websites, documents) that the LLM retrieves and processes. Direct injection is when the user directly inputs malicious prompts.",
          difficulty: "hard",
          topic: "OWASP LLM Top 10"
        },
        {
          id: "q2.4.2",
          domain: 2,
          chapter: "2.4",
          question: "An LLM confidently provides factually incorrect information. This is known as:",
          options: [
            "A) Data poisoning",
            "B) Hallucination",
            "C) Prompt injection",
            "D) Model theft"
          ],
          correctAnswer: 1,
          explanation: "Hallucination is when an LLM generates plausible but factually incorrect information with apparent confidence. It's an inherent limitation of generative models, not an attack.",
          difficulty: "easy",
          topic: "Generative AI Risks"
        }
      ]
    },
    {
      id: "2.5",
      number: 5,
      title: "Risk Monitoring and Reporting",
      description: "Ongoing AI risk monitoring and communication",
      topics: [
        {
          id: "2.5.1",
          title: "Continuous Risk Monitoring",
          description: "Monitoring AI risks over time",
          keyPoints: [
            "Key Risk Indicators (KRIs) for AI",
            "Real-time monitoring dashboards",
            "Anomaly detection for AI systems",
            "Performance degradation alerts",
            "Security event monitoring",
            "Compliance monitoring",
            "Third-party risk monitoring"
          ]
        },
        {
          id: "2.5.2",
          title: "Risk Reporting",
          description: "Communicating AI risks to stakeholders",
          keyPoints: [
            "Risk register maintenance",
            "Executive risk reporting",
            "Board-level risk dashboards",
            "Regulatory reporting requirements",
            "Incident reporting",
            "Trend analysis and forecasting",
            "Risk acceptance documentation"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q2.5.1",
          domain: 2,
          chapter: "2.5",
          question: "Which is the BEST example of a Key Risk Indicator (KRI) for an AI lending model?",
          options: [
            "A) Number of loan applications processed",
            "B) Model accuracy on test data",
            "C) Approval rate disparity across demographic groups",
            "D) Server uptime percentage"
          ],
          correctAnswer: 2,
          explanation: "Approval rate disparity is a leading indicator of potential fairness risks. Application volume and uptime are operational metrics, and test accuracy doesn't indicate ongoing production risks.",
          difficulty: "hard",
          topic: "Risk Monitoring"
        }
      ]
    }
  ]
};

// ============================================
// DOMAIN 3: AI DEVELOPMENT & IMPLEMENTATION (25%)
// ============================================
export const DOMAIN_3: Domain = {
  id: 3,
  name: "AI Technologies & Controls",
  weight: "38%",
  description: "Optimize AI security through security technologies, techniques, and controls tailored to AI systems including development, deployment, monitoring, and operations.",
  keyFrameworks: [
    "CRISP-DM",
    "MLOps Maturity Model",
    "Secure Software Development Framework",
    "ISO/IEC 25010 (Software Quality)"
  ],
  learningObjectives: [
    "Understand AI/ML development lifecycle",
    "Implement secure AI development practices",
    "Manage AI data quality and governance",
    "Test and validate AI systems",
    "Deploy AI systems securely"
  ],
  chapters: [
    {
      id: "3.1",
      number: 1,
      title: "AI/ML Development Lifecycle",
      description: "Understanding the AI development process",
      topics: [
        {
          id: "3.1.1",
          title: "CRISP-DM Methodology",
          description: "Cross-Industry Standard Process for Data Mining",
          keyPoints: [
            "Business Understanding: objectives, requirements",
            "Data Understanding: collection, exploration",
            "Data Preparation: cleaning, transformation",
            "Modeling: algorithm selection, training",
            "Evaluation: validation, testing",
            "Deployment: integration, monitoring",
            "Iterative nature of the process"
          ],
          examTips: [
            "Know all 6 phases and their key activities",
            "Understand the iterative, non-linear nature"
          ]
        },
        {
          id: "3.1.2",
          title: "MLOps Practices",
          description: "Operationalizing machine learning",
          keyPoints: [
            "MLOps definition and benefits",
            "CI/CD for ML pipelines",
            "Feature stores",
            "Model registries",
            "Experiment tracking",
            "Automated training pipelines",
            "Model serving infrastructure",
            "MLOps maturity levels"
          ]
        },
        {
          id: "3.1.3",
          title: "Development Environment Security",
          description: "Securing AI development infrastructure",
          keyPoints: [
            "Secure development environments",
            "Access controls for notebooks",
            "Code review practices",
            "Dependency management",
            "Secrets management",
            "Version control security",
            "Development-production separation"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q3.1.1",
          domain: 3,
          chapter: "3.1",
          question: "In CRISP-DM, which phase involves cleaning, transforming, and preparing data for modeling?",
          options: [
            "A) Data Understanding",
            "B) Data Preparation",
            "C) Modeling",
            "D) Evaluation"
          ],
          correctAnswer: 1,
          explanation: "Data Preparation is specifically about cleaning, transforming, and formatting data. Data Understanding is exploration, Modeling is algorithm training, Evaluation is testing.",
          difficulty: "easy",
          topic: "CRISP-DM"
        },
        {
          id: "q3.1.2",
          domain: 3,
          chapter: "3.1",
          question: "What is the PRIMARY purpose of a feature store in MLOps?",
          options: [
            "A) To store trained models",
            "B) To provide a centralized repository for reusable features",
            "C) To track experiments",
            "D) To serve predictions"
          ],
          correctAnswer: 1,
          explanation: "A feature store provides centralized storage and serving of features, enabling reuse across models and ensuring consistency between training and inference.",
          difficulty: "medium",
          topic: "MLOps"
        }
      ]
    },
    {
      id: "3.2",
      number: 2,
      title: "Data Management for AI",
      description: "Managing data throughout the AI lifecycle",
      topics: [
        {
          id: "3.2.1",
          title: "Data Collection and Quality",
          description: "Ensuring quality data for AI",
          keyPoints: [
            "Data collection strategies",
            "Data quality dimensions (accuracy, completeness, timeliness)",
            "Data validation and profiling",
            "Data labeling processes",
            "Active learning for labeling",
            "Crowdsourcing considerations",
            "Label quality assurance"
          ]
        },
        {
          id: "3.2.2",
          title: "Data Governance for AI",
          description: "Governing data used in AI",
          keyPoints: [
            "Data lineage and provenance",
            "Data cataloging for AI",
            "Metadata management",
            "Data ownership and stewardship",
            "Data access policies",
            "Data retention for AI",
            "Data disposal and deletion"
          ]
        },
        {
          id: "3.2.3",
          title: "Training Data Security",
          description: "Protecting training data",
          keyPoints: [
            "Training data poisoning prevention",
            "Data integrity verification",
            "Synthetic data generation",
            "Data augmentation security",
            "Secure data pipelines",
            "PII handling in training data",
            "Copyright and licensing compliance"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q3.2.1",
          domain: 3,
          chapter: "3.2",
          question: "Which data quality dimension refers to whether data accurately represents the real-world entity it describes?",
          options: [
            "A) Completeness",
            "B) Timeliness",
            "C) Accuracy",
            "D) Consistency"
          ],
          correctAnswer: 2,
          explanation: "Accuracy measures how well data reflects reality. Completeness is about missing values, timeliness about currency, consistency about uniformity across sources.",
          difficulty: "easy",
          topic: "Data Quality"
        }
      ]
    },
    {
      id: "3.3",
      number: 3,
      title: "Model Development",
      description: "Building and training AI models securely",
      topics: [
        {
          id: "3.3.1",
          title: "Algorithm Selection",
          description: "Choosing appropriate algorithms",
          keyPoints: [
            "Algorithm trade-offs (accuracy vs interpretability)",
            "Model complexity considerations",
            "Supervised vs unsupervised learning",
            "Deep learning considerations",
            "Pre-trained models and transfer learning",
            "Foundation models and fine-tuning",
            "Algorithm bias considerations"
          ]
        },
        {
          id: "3.3.2",
          title: "Model Explainability",
          description: "Making models interpretable",
          keyPoints: [
            "Intrinsic vs post-hoc explainability",
            "LIME (Local Interpretable Model-agnostic Explanations)",
            "SHAP (SHapley Additive exPlanations)",
            "Feature importance",
            "Attention visualization",
            "Counterfactual explanations",
            "Explainability requirements by use case"
          ]
        },
        {
          id: "3.3.3",
          title: "Secure Model Training",
          description: "Security during model development",
          keyPoints: [
            "Training environment security",
            "Hyperparameter tuning security",
            "Preventing overfitting to sensitive data",
            "Membership inference prevention",
            "Differential privacy in training",
            "Secure aggregation for federated learning",
            "Model integrity during training"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q3.3.1",
          domain: 3,
          chapter: "3.3",
          question: "Which technique provides local explanations by perturbing inputs and observing changes in predictions?",
          options: [
            "A) SHAP",
            "B) LIME",
            "C) Feature importance",
            "D) Attention maps"
          ],
          correctAnswer: 1,
          explanation: "LIME (Local Interpretable Model-agnostic Explanations) works by perturbing inputs around a prediction to understand local behavior. SHAP uses game theory, feature importance is global, attention maps are model-specific.",
          difficulty: "hard",
          topic: "Explainability"
        }
      ]
    },
    {
      id: "3.4",
      number: 4,
      title: "Testing and Validation",
      description: "Testing AI systems comprehensively",
      topics: [
        {
          id: "3.4.1",
          title: "Model Validation",
          description: "Validating model performance",
          keyPoints: [
            "Train/validation/test split strategies",
            "Cross-validation techniques",
            "Performance metrics selection",
            "Classification metrics (precision, recall, F1)",
            "Regression metrics (RMSE, MAE, R²)",
            "Threshold selection and calibration",
            "Baseline comparison"
          ]
        },
        {
          id: "3.4.2",
          title: "Bias and Fairness Testing",
          description: "Testing for bias",
          keyPoints: [
            "Fairness metrics (demographic parity, equalized odds)",
            "Disparate impact analysis",
            "Subgroup analysis",
            "Slice-based evaluation",
            "Bias detection tools",
            "Intersectional analysis",
            "Documentation of limitations"
          ]
        },
        {
          id: "3.4.3",
          title: "Security Testing",
          description: "Testing AI security",
          keyPoints: [
            "Adversarial robustness testing",
            "Penetration testing for AI",
            "Red teaming AI systems",
            "Fuzzing and boundary testing",
            "Evasion attack testing",
            "Data extraction testing",
            "API security testing"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q3.4.1",
          domain: 3,
          chapter: "3.4",
          question: "Which fairness metric requires equal positive prediction rates across protected groups?",
          options: [
            "A) Equalized odds",
            "B) Demographic parity",
            "C) Calibration",
            "D) Individual fairness"
          ],
          correctAnswer: 1,
          explanation: "Demographic parity (also called statistical parity) requires equal positive prediction rates regardless of group membership. Equalized odds considers true positive and false positive rates.",
          difficulty: "hard",
          topic: "Fairness Testing"
        }
      ]
    },
    {
      id: "3.5",
      number: 5,
      title: "Deployment Strategies",
      description: "Deploying AI systems safely",
      topics: [
        {
          id: "3.5.1",
          title: "Deployment Patterns",
          description: "Strategies for AI deployment",
          keyPoints: [
            "Shadow deployment (parallel running)",
            "Canary deployment (gradual rollout)",
            "Blue-green deployment",
            "A/B testing",
            "Feature flags for AI",
            "Rollback procedures",
            "Deployment automation"
          ],
          examTips: [
            "Know when to use each deployment pattern",
            "Understand risk mitigation in each approach"
          ]
        },
        {
          id: "3.5.2",
          title: "Model Serving",
          description: "Serving models in production",
          keyPoints: [
            "Batch vs real-time inference",
            "Model serving infrastructure",
            "Containerization and orchestration",
            "Scaling considerations",
            "Latency optimization",
            "Cost optimization",
            "Edge deployment"
          ]
        },
        {
          id: "3.5.3",
          title: "Integration Security",
          description: "Secure integration of AI",
          keyPoints: [
            "API security for AI endpoints",
            "Authentication and authorization",
            "Input validation at serving",
            "Output sanitization",
            "Secure communication",
            "Logging and audit trails",
            "Integration testing"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q3.5.1",
          domain: 3,
          chapter: "3.5",
          question: "Which deployment strategy runs a new model alongside production without serving predictions to users?",
          options: [
            "A) Canary deployment",
            "B) Blue-green deployment",
            "C) Shadow deployment",
            "D) A/B testing"
          ],
          correctAnswer: 2,
          explanation: "Shadow deployment runs the new model in parallel, comparing outputs without affecting users. Canary serves to a subset, blue-green switches traffic, A/B splits users for comparison.",
          difficulty: "medium",
          topic: "Deployment Patterns"
        }
      ]
    }
  ]
};

// ============================================
// DOMAIN 4: AI OPERATIONS & MONITORING (25%)
// ============================================
// Domain 4 content is kept for backwards compatibility and merged into Domain 3 for exam alignment
// The real AAISM exam has 3 domains (31%/31%/38%), with D3 covering technologies, controls, and operations
export const DOMAIN_4: Domain = {
  id: 4,
  name: "AI Operations & Monitoring (Part of D3)",
  weight: "(included in D3's 38%)",
  description: "Managing, monitoring, and maintaining AI systems in production. NOTE: In the real AAISM exam, this content falls under Domain 3: AI Technologies and Controls.",
  keyFrameworks: [
    "MLOps",
    "ITIL for AI",
    "SRE Principles",
    "ISO/IEC 27001 (adapted for AI)"
  ],
  learningObjectives: [
    "Manage AI systems in production",
    "Monitor model performance and drift",
    "Handle AI incidents",
    "Maintain and update AI systems",
    "Decommission AI systems responsibly"
  ],
  chapters: [
    {
      id: "4.1",
      number: 1,
      title: "AI Operations Management",
      description: "Day-to-day AI system operations",
      topics: [
        {
          id: "4.1.1",
          title: "MLOps in Production",
          description: "Operationalizing ML at scale",
          keyPoints: [
            "MLOps team structure and roles",
            "SLAs and SLOs for AI systems",
            "On-call and support processes",
            "Runbooks for AI operations",
            "Capacity planning for AI",
            "Cost management and optimization",
            "Documentation and knowledge management"
          ]
        },
        {
          id: "4.1.2",
          title: "Change Management for AI",
          description: "Managing changes to AI systems",
          keyPoints: [
            "Model update procedures",
            "Data update procedures",
            "Configuration management",
            "Change approval workflows",
            "Impact assessment",
            "Rollback procedures",
            "Communication of changes"
          ]
        },
        {
          id: "4.1.3",
          title: "Access Management",
          description: "Controlling access to AI systems",
          keyPoints: [
            "Role-based access for AI systems",
            "Least privilege principle",
            "API key management",
            "Service account security",
            "Access reviews and audits",
            "Privileged access management",
            "Logging access activities"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q4.1.1",
          domain: 4,
          chapter: "4.1",
          question: "What is the PRIMARY purpose of an SLO (Service Level Objective) for an AI system?",
          options: [
            "A) To define the maximum cost of the AI system",
            "B) To set measurable reliability targets",
            "C) To document the training process",
            "D) To specify hardware requirements"
          ],
          correctAnswer: 1,
          explanation: "SLOs define measurable targets for reliability (e.g., 99.9% uptime, < 100ms latency). They help balance reliability with development velocity. Cost and hardware are separate concerns.",
          difficulty: "medium",
          topic: "MLOps"
        }
      ]
    },
    {
      id: "4.2",
      number: 2,
      title: "Performance Monitoring",
      description: "Monitoring AI system performance",
      topics: [
        {
          id: "4.2.1",
          title: "Model Performance Monitoring",
          description: "Tracking model effectiveness",
          keyPoints: [
            "Production vs training performance",
            "Real-time performance dashboards",
            "Ground truth collection",
            "Delayed feedback handling",
            "A/B test analysis",
            "Performance degradation alerts",
            "Business metric correlation"
          ]
        },
        {
          id: "4.2.2",
          title: "Data Drift Detection",
          description: "Detecting changes in data distributions",
          keyPoints: [
            "Types of drift: data, concept, label",
            "Statistical tests for drift (KS, PSI, chi-square)",
            "Feature drift monitoring",
            "Prediction drift monitoring",
            "Drift visualization",
            "Drift alerting thresholds",
            "Drift root cause analysis"
          ],
          examTips: [
            "Know the difference between data drift and concept drift",
            "Understand common statistical tests"
          ]
        },
        {
          id: "4.2.3",
          title: "System Health Monitoring",
          description: "Monitoring infrastructure and operations",
          keyPoints: [
            "Latency monitoring",
            "Throughput monitoring",
            "Error rate tracking",
            "Resource utilization",
            "Queue depths and backlogs",
            "Dependency health",
            "Cost monitoring"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q4.2.1",
          domain: 4,
          chapter: "4.2",
          question: "A model's input feature distributions have changed significantly from training, but the relationship between features and target remains the same. This is:",
          options: [
            "A) Concept drift",
            "B) Data drift (covariate shift)",
            "C) Label drift",
            "D) Model decay"
          ],
          correctAnswer: 1,
          explanation: "Data drift (covariate shift) is when input distributions change. Concept drift is when the relationship between inputs and outputs changes. Here, only input distributions changed.",
          difficulty: "hard",
          topic: "Drift Detection"
        },
        {
          id: "q4.2.2",
          domain: 4,
          chapter: "4.2",
          question: "Which statistical test is commonly used to detect distribution shift between two samples?",
          options: [
            "A) t-test",
            "B) Kolmogorov-Smirnov (KS) test",
            "C) ANOVA",
            "D) Correlation coefficient"
          ],
          correctAnswer: 1,
          explanation: "The KS test compares two distributions and is widely used for drift detection. t-test compares means, ANOVA compares multiple groups, correlation measures relationships.",
          difficulty: "medium",
          topic: "Drift Detection"
        }
      ]
    },
    {
      id: "4.3",
      number: 3,
      title: "AI Incident Management",
      description: "Handling AI-related incidents",
      topics: [
        {
          id: "4.3.1",
          title: "Incident Detection and Classification",
          description: "Identifying AI incidents",
          keyPoints: [
            "AI-specific incident types",
            "Severity classification for AI",
            "Detection mechanisms",
            "Automated alerting",
            "User-reported issues",
            "Incident triage",
            "Escalation procedures"
          ]
        },
        {
          id: "4.3.2",
          title: "Incident Response",
          description: "Responding to AI incidents",
          keyPoints: [
            "AI incident response playbooks",
            "Containment strategies (rollback, disable, human takeover)",
            "Root cause analysis for AI",
            "Communication protocols",
            "Stakeholder notification",
            "Regulatory notification requirements",
            "Evidence preservation"
          ]
        },
        {
          id: "4.3.3",
          title: "Post-Incident Activities",
          description: "Learning from incidents",
          keyPoints: [
            "Blameless post-mortems",
            "Root cause documentation",
            "Corrective actions",
            "Preventive measures",
            "Knowledge base updates",
            "Process improvements",
            "Metrics and trending"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q4.3.1",
          domain: 4,
          chapter: "4.3",
          question: "An AI model starts producing significantly biased outputs in production. What should be the FIRST response action?",
          options: [
            "A) Retrain the model with new data",
            "B) Contain the issue by rolling back or disabling the model",
            "C) Conduct a root cause analysis",
            "D) Notify regulators"
          ],
          correctAnswer: 1,
          explanation: "Containment should be the first priority to prevent further harm. After containing, then investigate root cause, retrain if needed, and notify stakeholders as appropriate.",
          difficulty: "medium",
          topic: "Incident Response"
        }
      ]
    },
    {
      id: "4.4",
      number: 4,
      title: "Model Maintenance",
      description: "Maintaining AI models over time",
      topics: [
        {
          id: "4.4.1",
          title: "Model Retraining",
          description: "Updating models with new data",
          keyPoints: [
            "Retraining triggers (scheduled, drift-based, event-based)",
            "Continuous training pipelines",
            "Incremental vs full retraining",
            "Training data refresh strategies",
            "Validation gates",
            "Champion-challenger testing",
            "Automated retraining workflows"
          ]
        },
        {
          id: "4.4.2",
          title: "Model Versioning",
          description: "Managing model versions",
          keyPoints: [
            "Model version control",
            "Model registry best practices",
            "Version metadata and lineage",
            "Reproducibility requirements",
            "Version comparison and analysis",
            "Archival policies",
            "Version rollback procedures"
          ]
        },
        {
          id: "4.4.3",
          title: "Documentation and Audit",
          description: "Maintaining documentation",
          keyPoints: [
            "Model cards and documentation",
            "Datasheets for datasets",
            "Audit trail requirements",
            "Compliance documentation",
            "Performance history",
            "Decision logs",
            "Regulatory examination preparation"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q4.4.1",
          domain: 4,
          chapter: "4.4",
          question: "What is the PRIMARY purpose of a model card?",
          options: [
            "A) To store model weights",
            "B) To document model details, intended use, and limitations",
            "C) To track model predictions",
            "D) To manage access controls"
          ],
          correctAnswer: 1,
          explanation: "Model cards document model details, training data, intended use cases, limitations, and evaluation results for transparency and responsible use. They don't store weights or predictions.",
          difficulty: "easy",
          topic: "Documentation"
        }
      ]
    },
    {
      id: "4.5",
      number: 5,
      title: "AI System Decommissioning",
      description: "Responsibly retiring AI systems",
      topics: [
        {
          id: "4.5.1",
          title: "Decommissioning Planning",
          description: "Planning AI retirement",
          keyPoints: [
            "Decommissioning criteria and triggers",
            "Impact assessment",
            "Stakeholder communication",
            "Transition planning",
            "Alternative solutions",
            "Timeline and milestones",
            "Risk mitigation"
          ]
        },
        {
          id: "4.5.2",
          title: "Secure Decommissioning",
          description: "Securely retiring AI assets",
          keyPoints: [
            "Data retention requirements",
            "Secure data deletion",
            "Model artifact disposal",
            "Access revocation",
            "Infrastructure teardown",
            "Documentation archival",
            "Audit trail preservation"
          ]
        },
        {
          id: "4.5.3",
          title: "Post-Decommissioning",
          description: "Activities after decommissioning",
          keyPoints: [
            "Verification of removal",
            "Lessons learned documentation",
            "Stakeholder confirmation",
            "Compliance verification",
            "Cost reconciliation",
            "Knowledge preservation",
            "Future reference documentation"
          ]
        }
      ],
      practiceQuestions: [
        {
          id: "q4.5.1",
          domain: 4,
          chapter: "4.5",
          question: "When decommissioning an AI model, which consideration is MOST important for regulatory compliance?",
          options: [
            "A) Minimizing infrastructure costs",
            "B) Preserving audit trails and documentation",
            "C) Reusing the model for other projects",
            "D) Transferring the model to a vendor"
          ],
          correctAnswer: 1,
          explanation: "Regulatory compliance requires preserving audit trails, decision logs, and documentation even after decommissioning for potential future examination or litigation.",
          difficulty: "medium",
          topic: "Decommissioning"
        }
      ]
    }
  ]
};

// Export all domains
export const ALL_DOMAINS: Domain[] = [DOMAIN_1, DOMAIN_2, DOMAIN_3, DOMAIN_4];

// Load agent-discovered approved questions from localStorage
function getAgentApprovedQuestions(): ExamQuestion[] {
  try {
    const saved = localStorage.getItem('aaism_agent_pipeline');
    if (saved) {
      const state = JSON.parse(saved);
      return state.approvedQuestions || [];
    }
  } catch { /* ignore */ }
  return [];
}

function collectAaismQuestions(): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  ALL_DOMAINS.forEach(domain => {
    domain.chapters.forEach(chapter => {
      questions.push(...chapter.practiceQuestions);
    });
  });
  questions.push(...ADDITIONAL_QUESTIONS);
  questions.push(...SCENARIO_QUESTIONS);
  questions.push(...BULK_QUESTIONS);
  questions.push(...getAgentApprovedQuestions());
  return questions;
}

const CERT_QUESTION_BANKS: Record<string, ExamQuestion[]> = {
  cissp: CISSP_QUESTIONS,
  'security-plus': SECURITY_PLUS_QUESTIONS,
  ceh: CEH_QUESTIONS,
  cais: CAIS_QUESTIONS,
  cbsp: CBSP_QUESTIONS,
  qist: QIST_QUESTIONS,
};

function getCertQuestionBank(certId: string): ExamQuestion[] {
  return CERT_QUESTION_BANKS[certId] ?? [];
}

export function getCertQuestionCounts(): Record<string, number> {
  const counts: Record<string, number> = { [DEFAULT_CERT_ID]: collectAaismQuestions().length };
  for (const [certId, bank] of Object.entries(CERT_QUESTION_BANKS)) {
    counts[certId] = bank.length;
  }
  return counts;
}

// Get all practice questions for active (or specified) cert
export function getAllQuestions(certId?: string): ExamQuestion[] {
  const id = certId ?? getActiveCertId();
  if (id === DEFAULT_CERT_ID) {
    return collectAaismQuestions();
  }
  return getCertQuestionBank(id);
}

// Get questions by domain for active (or specified) cert
export function getQuestionsByDomain(domainId: number, certId?: string): ExamQuestion[] {
  const id = certId ?? getActiveCertId();
  if (id === DEFAULT_CERT_ID) {
    const domain = ALL_DOMAINS.find(d => d.id === domainId);
    if (!domain) return [];

    const questions: ExamQuestion[] = [];
    domain.chapters.forEach(chapter => {
      questions.push(...chapter.practiceQuestions);
    });
    questions.push(...ADDITIONAL_QUESTIONS.filter(q => q.domain === domainId));
    questions.push(...SCENARIO_QUESTIONS.filter(q => q.domain === domainId));
    questions.push(...BULK_QUESTIONS.filter(q => q.domain === domainId));
    return questions;
  }
  return getCertQuestionBank(id).filter(q => q.domain === domainId);
}

// Get questions by difficulty for active cert
export function getQuestionsByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard',
  certId?: string,
): ExamQuestion[] {
  return getAllQuestions(certId).filter(q => q.difficulty === difficulty);
}

// Get random exam simulation sized to active cert exam format
export function getExamSimulation(questionCount?: number, certId?: string): ExamQuestion[] {
  const id = certId ?? getActiveCertId();
  const cert = getCertification(id);
  const count = questionCount ?? cert?.examFormat?.questions ?? 90;
  const allQuestions = getAllQuestions(id);
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get domain by ID
export function getDomainById(id: number): Domain | undefined {
  return ALL_DOMAINS.find(d => d.id === id);
}

// Get chapter by ID
export function getChapterById(domainId: number, chapterId: string): Chapter | undefined {
  const domain = getDomainById(domainId);
  if (!domain) return undefined;
  return domain.chapters.find(c => c.id === chapterId);
}

// Statistics for active cert — all counts derived from loaded content
export function getContentStats(certId?: string) {
  const id = certId ?? getActiveCertId();
  const cert = getCertification(id);
  const domains = getDomainsForCert(id);
  const domainIds = new Set(domains.map(d => d.id));
  const allQuestions = getAllQuestions(id);

  let totalChapters = 0;
  let totalTopics = 0;

  if (id === DEFAULT_CERT_ID) {
    totalChapters = ALL_DOMAINS.reduce((acc, d) => acc + d.chapters.length, 0);
    totalTopics = ALL_DOMAINS.reduce(
      (acc, d) => acc + d.chapters.reduce((acc2, c) => acc2 + c.topics.length, 0),
      0,
    );
  } else if (cert?.domainGuides?.length) {
    totalChapters = cert.domainGuides.length;
    totalTopics = cert.domainGuides.reduce((acc, g) => acc + g.coreConcepts.length, 0);
  }

  const kbTopicCount = kbTopics.filter(t => domainIds.has(t.domain)).length;
  totalTopics = Math.max(totalTopics, kbTopicCount);

  return {
    totalDomains: domains.length,
    totalChapters,
    totalTopics,
    totalQuestions: allQuestions.length,
    questionsByDomain: domains.map(d => ({
      domain: d.id,
      name: d.name,
      count: getQuestionsByDomain(d.id, id).length,
    })),
    questionsByDifficulty: {
      easy: getQuestionsByDifficulty('easy', id).length,
      medium: getQuestionsByDifficulty('medium', id).length,
      hard: getQuestionsByDifficulty('hard', id).length,
    },
  };
}
