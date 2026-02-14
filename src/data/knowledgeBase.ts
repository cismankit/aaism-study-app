// Comprehensive AAISM Knowledge Base
// This provides context for AI and can be used for local search

export interface Topic {
  id: string;
  domain: number;
  title: string;
  description: string;
  keyPoints: string[];
  relatedTerms: string[];
  examTips: string[];
}

export interface Term {
  term: string;
  definition: string;
  domain: number;
  category: string;
}

export const domains = [
  {
    id: 1,
    name: 'AI Governance & Program Management',
    description: 'Advise stakeholders on implementing AI security solutions through policy, data governance, program management, and incident response.',
    weight: '31%',
    topics: [
      'AI Governance Frameworks',
      'AI Strategy and Alignment',
      'AI Policies and Standards',
      'AI Ethics and Responsible AI',
      'Regulatory Compliance',
      'Stakeholder Management',
      'AI Literacy Programs',
    ],
  },
  {
    id: 2,
    name: 'AI Risk Management',
    description: 'Assess and manage risks, threats, vulnerabilities and supply chain issues related to enterprise AI adoption.',
    weight: '31%',
    topics: [
      'AI Risk Identification',
      'AI Risk Assessment',
      'Adversarial Attacks',
      'Data Poisoning',
      'Model Security',
      'Privacy Risks',
      'Bias and Fairness',
      'Supply Chain Risks',
    ],
  },
  {
    id: 3,
    name: 'AI Technologies & Controls',
    description: 'Security technologies, techniques and controls tailored to AI systems including architecture, data controls, privacy, and monitoring.',
    weight: '38%',
    topics: [
      'AI Development Lifecycle',
      'Data Management',
      'Model Training',
      'Testing and Validation',
      'Explainability',
      'Secure Development',
      'Deployment Strategies',
    ],
  },
  {
    id: 4,
    name: 'AI Operations & Monitoring (Part of D3)',
    description: 'Managing AI systems in production including monitoring, maintenance, and continuous improvement. In the real AAISM exam, this falls under Domain 3.',
    weight: '(in D3 38%)',
    topics: [
      'MLOps',
      'Performance Monitoring',
      'Drift Detection',
      'Incident Management',
      'Model Maintenance',
      'Continuous Improvement',
      'Decommissioning',
    ],
  },
];

export const topics: Topic[] = [
  // Domain 1: AI Governance
  {
    id: 'gov-framework',
    domain: 1,
    title: 'AI Governance Framework',
    description: 'A structured approach to managing AI systems that defines roles, responsibilities, policies, and processes for AI development and deployment.',
    keyPoints: [
      'Establishes accountability and oversight for AI initiatives',
      'Defines roles: AI Ethics Board, AI Security Officer, Data Stewards',
      'Integrates with existing enterprise governance structures',
      'Includes decision-making processes for AI adoption',
      'Should be risk-based and proportionate to AI system impact',
    ],
    relatedTerms: ['AI Ethics Board', 'AI Policy', 'Accountability', 'Oversight'],
    examTips: [
      'Governance frameworks should align with business objectives',
      'Remember: governance enables, not just restricts, AI adoption',
      'Questions may ask about reporting structures and escalation paths',
    ],
  },
  {
    id: 'ai-ethics',
    domain: 1,
    title: 'AI Ethics and Responsible AI',
    description: 'Principles and practices ensuring AI systems are developed and used in ways that are fair, transparent, and beneficial to society.',
    keyPoints: [
      'Core principles: Fairness, Transparency, Accountability, Privacy, Safety',
      'Human oversight and control requirements',
      'Avoiding harm and ensuring beneficence',
      'Inclusive design and diverse perspectives',
      'Environmental sustainability considerations',
    ],
    relatedTerms: ['Fairness', 'Transparency', 'Accountability', 'Human-in-the-loop'],
    examTips: [
      'Ethics questions often involve balancing competing values',
      'Remember stakeholder impact assessment importance',
      'Ethical AI is about process, not just outcomes',
    ],
  },
  {
    id: 'eu-ai-act',
    domain: 1,
    title: 'EU AI Act',
    description: 'The European Union regulation establishing harmonized rules for artificial intelligence systems based on risk classification.',
    keyPoints: [
      'Risk-based approach: Unacceptable, High, Limited, Minimal risk categories',
      'Unacceptable: Social scoring, real-time biometric surveillance',
      'High-risk: Critical infrastructure, employment, law enforcement',
      'Requirements: Risk management, data governance, transparency, human oversight',
      'Penalties up to €35M or 7% of global turnover',
    ],
    relatedTerms: ['Risk Classification', 'High-Risk AI', 'Conformity Assessment', 'CE Marking'],
    examTips: [
      'Know the four risk categories and examples of each',
      'Understand high-risk system requirements',
      'Questions may test prohibited AI practices',
    ],
  },
  // Domain 2: AI Risk Management
  {
    id: 'adversarial-attacks',
    domain: 2,
    title: 'Adversarial Attacks',
    description: 'Attacks that manipulate AI model inputs to cause incorrect predictions or behaviors, often through imperceptible perturbations.',
    keyPoints: [
      'Evasion attacks: Modify inputs at inference time',
      'Perturbations often imperceptible to humans',
      'White-box vs black-box attacks',
      'Transferability: attacks can work across models',
      'Defenses: adversarial training, input preprocessing, model ensembles',
    ],
    relatedTerms: ['Evasion Attack', 'Perturbation', 'Robustness', 'Adversarial Examples'],
    examTips: [
      'Understand difference between evasion and poisoning attacks',
      'Know basic defense strategies',
      'Questions may describe attack scenarios for identification',
    ],
  },
  {
    id: 'prompt-injection',
    domain: 2,
    title: 'Prompt Injection',
    description: 'An attack where malicious instructions are embedded in user input to manipulate LLM behavior and bypass intended constraints.',
    keyPoints: [
      'Direct injection: User directly inputs malicious prompts',
      'Indirect injection: Malicious content in external data sources',
      'Can override system instructions',
      'May lead to data exfiltration, unauthorized actions',
      'Mitigations: Input validation, output filtering, privilege separation',
    ],
    relatedTerms: ['Jailbreaking', 'LLM Security', 'Input Validation', 'Guardrails'],
    examTips: [
      'OWASP Top 1 for LLMs - very exam relevant',
      'Know difference between direct and indirect injection',
      'Understand defense-in-depth approach to mitigation',
    ],
  },
  {
    id: 'data-poisoning',
    domain: 2,
    title: 'Data Poisoning',
    description: 'An attack that corrupts training data to compromise model behavior, either degrading performance or introducing backdoors.',
    keyPoints: [
      'Targets training phase, not inference',
      'Availability attacks: Degrade overall model performance',
      'Integrity attacks: Cause specific misclassifications',
      'Backdoor attacks: Hidden triggers for malicious behavior',
      'Defenses: Data validation, provenance tracking, anomaly detection',
    ],
    relatedTerms: ['Training Data', 'Backdoor', 'Data Integrity', 'Data Provenance'],
    examTips: [
      'Differentiate from adversarial attacks (training vs inference)',
      'Know the types: availability, integrity, backdoor',
      'Data provenance is key defense',
    ],
  },
  {
    id: 'model-theft',
    domain: 2,
    title: 'Model Theft and Extraction',
    description: 'Attacks aimed at stealing proprietary AI models through direct access, API queries, or side-channel attacks.',
    keyPoints: [
      'Model extraction through API queries',
      'Side-channel attacks (timing, power analysis)',
      'Insider threats and unauthorized access',
      'Intellectual property and competitive concerns',
      'Defenses: Rate limiting, query monitoring, watermarking',
    ],
    relatedTerms: ['Model Extraction', 'API Abuse', 'Intellectual Property', 'Watermarking'],
    examTips: [
      'OWASP Top 10 for LLMs includes this',
      'Understand business impact beyond technical risk',
      'Know monitoring and detection strategies',
    ],
  },
  // Domain 3: AI Development
  {
    id: 'ml-lifecycle',
    domain: 3,
    title: 'AI/ML Development Lifecycle',
    description: 'The structured process for developing machine learning systems from problem definition through deployment and maintenance.',
    keyPoints: [
      'Phases: Problem definition, Data collection, Feature engineering, Model training, Evaluation, Deployment, Monitoring',
      'CRISP-DM: Cross-Industry Standard Process for Data Mining',
      'Iterative and experimental nature',
      'Version control for code, data, and models',
      'Documentation requirements throughout',
    ],
    relatedTerms: ['CRISP-DM', 'MLOps', 'Model Registry', 'Feature Store'],
    examTips: [
      'Know the phases and their sequence',
      'Understand security considerations at each phase',
      'Questions may ask about artifacts and documentation',
    ],
  },
  {
    id: 'data-quality',
    domain: 3,
    title: 'Data Quality for AI',
    description: 'Ensuring training and operational data meets quality standards for accuracy, completeness, consistency, and representativeness.',
    keyPoints: [
      'Dimensions: Accuracy, Completeness, Consistency, Timeliness, Relevance',
      'Representative data for target population',
      'Data labeling quality and consistency',
      'Handling missing values and outliers',
      'Data documentation and lineage tracking',
    ],
    relatedTerms: ['Data Quality', 'Data Lineage', 'Ground Truth', 'Label Quality'],
    examTips: [
      'Poor data quality is top cause of AI failures',
      'Know the quality dimensions',
      'Understand bias can originate from data',
    ],
  },
  {
    id: 'explainability',
    domain: 3,
    title: 'AI Explainability and Interpretability',
    description: 'The ability to understand and communicate how AI models make decisions, crucial for trust, debugging, and compliance.',
    keyPoints: [
      'Interpretability: Understanding model internals',
      'Explainability: Communicating decisions to stakeholders',
      'Local vs global explanations',
      'Techniques: LIME, SHAP, attention visualization',
      'Trade-off between accuracy and interpretability',
    ],
    relatedTerms: ['LIME', 'SHAP', 'Black Box', 'Interpretable ML'],
    examTips: [
      'Know why explainability matters (compliance, trust, debugging)',
      'Understand local vs global explanation difference',
      'High-risk systems often require explainability',
    ],
  },
  // Domain 4: AI Operations
  {
    id: 'mlops',
    domain: 4,
    title: 'MLOps',
    description: 'Practices combining machine learning, DevOps, and data engineering to deploy and maintain ML models in production reliably.',
    keyPoints: [
      'CI/CD for machine learning pipelines',
      'Automated training, testing, and deployment',
      'Model versioning and registry',
      'Feature stores for consistent features',
      'Monitoring and observability',
    ],
    relatedTerms: ['CI/CD', 'Model Registry', 'Feature Store', 'Pipeline Automation'],
    examTips: [
      'MLOps extends DevOps for ML-specific needs',
      'Know components: registry, feature store, monitoring',
      'Automation reduces risk and increases reliability',
    ],
  },
  {
    id: 'model-drift',
    domain: 4,
    title: 'Model Drift',
    description: 'Degradation in model performance over time due to changes in data distributions or relationships between variables.',
    keyPoints: [
      'Data drift: Input data distribution changes',
      'Concept drift: Relationship between inputs and outputs changes',
      'Causes: Seasonality, market changes, user behavior shifts',
      'Detection: Statistical tests, performance monitoring',
      'Response: Retraining, model updates, alerts',
    ],
    relatedTerms: ['Data Drift', 'Concept Drift', 'Covariate Shift', 'Model Decay'],
    examTips: [
      'Distinguish data drift from concept drift',
      'Know detection methods',
      'Understand retraining triggers and strategies',
    ],
  },
  {
    id: 'ai-incident',
    domain: 4,
    title: 'AI Incident Management',
    description: 'Processes for detecting, responding to, and learning from AI system failures, errors, or security incidents.',
    keyPoints: [
      'Detection: Monitoring, alerts, user reports',
      'Triage: Assess impact and urgency',
      'Response: Rollback, disable, patch',
      'Root cause analysis',
      'Post-incident review and improvement',
    ],
    relatedTerms: ['Incident Response', 'Rollback', 'Post-Mortem', 'MTTR'],
    examTips: [
      'AI incidents may differ from traditional IT incidents',
      'Know rollback and failsafe strategies',
      'Continuous improvement from incidents',
    ],
  },
];

export const glossary: Term[] = [
  // Domain 1 Terms
  { term: 'AI Governance', definition: 'The system of rules, practices, and processes by which AI systems are directed and controlled within an organization.', domain: 1, category: 'Governance' },
  { term: 'AI Ethics Board', definition: 'A cross-functional committee responsible for overseeing ethical considerations in AI development and deployment.', domain: 1, category: 'Governance' },
  { term: 'Responsible AI', definition: 'An approach to developing and deploying AI that is ethical, transparent, and accountable.', domain: 1, category: 'Ethics' },
  { term: 'Human-in-the-Loop (HITL)', definition: 'AI system design where human oversight is required for decisions, especially high-stakes ones.', domain: 1, category: 'Ethics' },
  { term: 'AI Literacy', definition: 'The skills and knowledge needed to understand, use, and critically evaluate AI systems.', domain: 1, category: 'Governance' },
  
  // Domain 2 Terms
  { term: 'Adversarial Attack', definition: 'An attack that manipulates AI model inputs to cause incorrect outputs, often through imperceptible changes.', domain: 2, category: 'Threats' },
  { term: 'Prompt Injection', definition: 'An attack where malicious instructions are embedded in user input to manipulate LLM behavior.', domain: 2, category: 'Threats' },
  { term: 'Data Poisoning', definition: 'Corrupting training data to compromise model behavior or introduce backdoors.', domain: 2, category: 'Threats' },
  { term: 'Model Inversion', definition: 'An attack that extracts sensitive training data by querying a model.', domain: 2, category: 'Threats' },
  { term: 'Membership Inference', definition: 'An attack to determine if specific data was used in model training.', domain: 2, category: 'Privacy' },
  { term: 'AI Risk Assessment', definition: 'Systematic process of identifying, analyzing, and evaluating risks specific to AI systems.', domain: 2, category: 'Risk' },
  
  // Domain 3 Terms
  { term: 'CRISP-DM', definition: 'Cross-Industry Standard Process for Data Mining - a widely used methodology for data science projects.', domain: 3, category: 'Methodology' },
  { term: 'Feature Engineering', definition: 'The process of selecting, transforming, and creating input variables for machine learning models.', domain: 3, category: 'Development' },
  { term: 'Overfitting', definition: 'When a model learns training data too well, including noise, reducing generalization to new data.', domain: 3, category: 'Development' },
  { term: 'Underfitting', definition: 'When a model is too simple to capture underlying patterns in the data.', domain: 3, category: 'Development' },
  { term: 'Cross-Validation', definition: 'A technique for evaluating models by training on subsets of data and validating on the remainder.', domain: 3, category: 'Testing' },
  { term: 'LIME', definition: 'Local Interpretable Model-agnostic Explanations - a technique for explaining individual predictions.', domain: 3, category: 'Explainability' },
  { term: 'SHAP', definition: 'SHapley Additive exPlanations - a method for explaining predictions using game theory.', domain: 3, category: 'Explainability' },
  
  // Domain 4 Terms
  { term: 'MLOps', definition: 'Practices combining ML, DevOps, and data engineering for reliable ML in production.', domain: 4, category: 'Operations' },
  { term: 'Data Drift', definition: 'When the statistical properties of input data change over time.', domain: 4, category: 'Monitoring' },
  { term: 'Concept Drift', definition: 'When the relationship between inputs and outputs changes over time.', domain: 4, category: 'Monitoring' },
  { term: 'Model Registry', definition: 'A centralized repository for storing, versioning, and managing ML models.', domain: 4, category: 'Operations' },
  { term: 'Feature Store', definition: 'A centralized repository for storing and serving features for ML models.', domain: 4, category: 'Operations' },
  { term: 'A/B Testing', definition: 'Comparing two model versions by serving them to different user groups.', domain: 4, category: 'Deployment' },
  { term: 'Canary Deployment', definition: 'Gradually rolling out a new model version to a small subset of users first.', domain: 4, category: 'Deployment' },
  { term: 'Shadow Deployment', definition: 'Running a new model in parallel with production without serving results to users.', domain: 4, category: 'Deployment' },
];

// OWASP Top 10 for LLMs
export const owaspLLM = [
  {
    id: 'LLM01',
    name: 'Prompt Injection',
    description: 'Manipulating LLMs through crafted inputs to cause unintended actions.',
    mitigation: 'Input validation, privilege separation, human approval for sensitive actions.',
  },
  {
    id: 'LLM02',
    name: 'Insecure Output Handling',
    description: 'Failing to validate or sanitize LLM outputs before use.',
    mitigation: 'Output encoding, input validation on downstream systems, sandboxing.',
  },
  {
    id: 'LLM03',
    name: 'Training Data Poisoning',
    description: 'Manipulating training data to introduce vulnerabilities or biases.',
    mitigation: 'Data validation, provenance tracking, adversarial testing.',
  },
  {
    id: 'LLM04',
    name: 'Model Denial of Service',
    description: 'Exhausting resources through expensive queries or inputs.',
    mitigation: 'Rate limiting, resource caps, input size limits.',
  },
  {
    id: 'LLM05',
    name: 'Supply Chain Vulnerabilities',
    description: 'Risks from third-party components, models, or training data.',
    mitigation: 'Vendor assessment, model verification, integrity checks.',
  },
  {
    id: 'LLM06',
    name: 'Sensitive Information Disclosure',
    description: 'LLMs revealing confidential data through outputs.',
    mitigation: 'Data sanitization, output filtering, access controls.',
  },
  {
    id: 'LLM07',
    name: 'Insecure Plugin Design',
    description: 'Vulnerable extensions that expand LLM attack surface.',
    mitigation: 'Plugin sandboxing, least privilege, input validation.',
  },
  {
    id: 'LLM08',
    name: 'Excessive Agency',
    description: 'LLMs with too much autonomy performing harmful actions.',
    mitigation: 'Least privilege, human-in-the-loop, action logging.',
  },
  {
    id: 'LLM09',
    name: 'Overreliance',
    description: 'Trusting LLM outputs without verification.',
    mitigation: 'Human oversight, output verification, user training.',
  },
  {
    id: 'LLM10',
    name: 'Model Theft',
    description: 'Unauthorized access or extraction of proprietary models.',
    mitigation: 'Access controls, rate limiting, watermarking.',
  },
];

// Search function for knowledge base
export function searchKnowledgeBase(query: string): { topics: Topic[]; terms: Term[] } {
  const lowerQuery = query.toLowerCase();
  
  const matchingTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(lowerQuery) ||
    topic.description.toLowerCase().includes(lowerQuery) ||
    topic.keyPoints.some(kp => kp.toLowerCase().includes(lowerQuery)) ||
    topic.relatedTerms.some(rt => rt.toLowerCase().includes(lowerQuery))
  );

  const matchingTerms = glossary.filter(term =>
    term.term.toLowerCase().includes(lowerQuery) ||
    term.definition.toLowerCase().includes(lowerQuery)
  );

  return { topics: matchingTopics, terms: matchingTerms };
}
