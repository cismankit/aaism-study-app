// Implementation Playbooks — Real-world org-level AI security guidance
// POC templates, activity workflows, maturity models

export interface PlaybookPhase {
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  stakeholders: string[];
  riskFlags: string[];
}

export interface Playbook {
  id: string;
  title: string;
  category: 'governance' | 'risk' | 'development' | 'operations' | 'compliance';
  domain: number;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  overview: string;
  businessCase: string;
  phases: PlaybookPhase[];
  keyMetrics: string[];
  maturityLevels: Array<{ level: number; name: string; criteria: string }>;
  examRelevance: string;
  realWorldExample: string;
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: 'pb-ai-gov-framework',
    title: 'AI Governance Framework Implementation',
    category: 'governance',
    domain: 1,
    difficulty: 'advanced',
    estimatedDuration: '3-6 months',
    overview: 'End-to-end playbook for establishing an AI governance framework in an organization, from board-level charter to operational policies.',
    businessCase: 'Organizations deploying AI without governance face regulatory risk (EU AI Act fines up to 7% global revenue), reputational damage from AI incidents, and operational inefficiency from uncoordinated AI initiatives.',
    phases: [
      {
        name: 'Discovery & Assessment',
        duration: '2-4 weeks',
        activities: [
          'Inventory all existing AI systems (production, development, shadow AI)',
          'Map current decision-making processes for AI initiatives',
          'Assess regulatory obligations (EU AI Act, sector-specific regulations)',
          'Benchmark against peers using AI governance maturity model',
          'Identify key stakeholders and governance gaps',
        ],
        deliverables: ['AI System Inventory', 'Governance Gap Analysis Report', 'Stakeholder Map', 'Regulatory Obligations Matrix'],
        stakeholders: ['CISO', 'CDO', 'Legal/Compliance', 'Business Unit Leaders', 'Data Science Lead'],
        riskFlags: ['Shadow AI systems discovered that bypass current controls', 'No existing AI inventory or register'],
      },
      {
        name: 'Framework Design',
        duration: '3-4 weeks',
        activities: [
          'Define AI governance charter and mandate',
          'Design governance structure (AI Board, Ethics Committee, Working Groups)',
          'Develop RACI matrix for AI decisions',
          'Create AI policy framework (acceptable use, development standards, procurement)',
          'Define risk classification scheme aligned with EU AI Act risk tiers',
          'Establish model lifecycle governance gates',
        ],
        deliverables: ['AI Governance Charter', 'Governance Structure Document', 'RACI Matrix', 'AI Policy Suite', 'Risk Classification Framework'],
        stakeholders: ['Board/Executive Sponsor', 'AI Governance Board', 'Legal', 'HR', 'IT Security'],
        riskFlags: ['Insufficient executive sponsorship', 'Framework too complex for org maturity level'],
      },
      {
        name: 'Implementation',
        duration: '6-8 weeks',
        activities: [
          'Establish AI Governance Board with regular meeting cadence',
          'Implement AI system registration process',
          'Deploy risk assessment templates and tooling',
          'Create AI ethics review workflow',
          'Develop AI literacy training program',
          'Integrate governance gates into CI/CD and MLOps pipelines',
        ],
        deliverables: ['Operational AI Governance Board', 'AI Registry (live system)', 'Risk Assessment Templates', 'Training Materials', 'Pipeline Integration'],
        stakeholders: ['AI Governance Board', 'All AI teams', 'HR/L&D', 'DevOps/MLOps'],
        riskFlags: ['Teams resistant to new governance processes', 'Tool integration delays'],
      },
      {
        name: 'Operationalize & Measure',
        duration: 'Ongoing',
        activities: [
          'Track governance KPIs (compliance rate, incident count, review velocity)',
          'Conduct quarterly governance reviews',
          'Maintain AI risk register and update risk assessments',
          'Run annual AI governance maturity assessment',
          'Iterate policies based on lessons learned and regulatory changes',
        ],
        deliverables: ['Governance Dashboard', 'Quarterly Reports', 'Updated Policies', 'Maturity Assessment Results'],
        stakeholders: ['AI Governance Board', 'Internal Audit', 'Board of Directors'],
        riskFlags: ['Governance becomes checkbox exercise', 'Metrics not tied to business outcomes'],
      },
    ],
    keyMetrics: [
      '% of AI systems registered in governance framework',
      'Average time from AI project proposal to governance approval',
      'Number of AI incidents per quarter',
      'AI literacy training completion rate',
      'Compliance audit findings related to AI',
    ],
    maturityLevels: [
      { level: 1, name: 'Ad Hoc', criteria: 'No formal AI governance; AI decisions made by individual teams' },
      { level: 2, name: 'Developing', criteria: 'Basic policies exist; AI inventory started; governance body forming' },
      { level: 3, name: 'Defined', criteria: 'Formal governance structure; risk classification in place; regular reviews' },
      { level: 4, name: 'Managed', criteria: 'Metrics-driven governance; automated compliance checks; integrated into CI/CD' },
      { level: 5, name: 'Optimizing', criteria: 'Continuous improvement; predictive risk management; industry-leading practices' },
    ],
    examRelevance: 'Domain 1 questions test understanding of governance structures, RACI matrices, policy frameworks, and the role of the AI Governance Board. This playbook maps directly to AAISM exam objectives.',
    realWorldExample: 'A Fortune 500 bank established an AI Governance Board after discovering 47 unregistered ML models in production. Within 6 months, they achieved 100% AI inventory compliance, reduced model-related incidents by 60%, and passed their first EU AI Act readiness audit.',
  },
  {
    id: 'pb-ai-risk-assessment',
    title: 'AI Risk Assessment Program',
    category: 'risk',
    domain: 2,
    difficulty: 'intermediate',
    estimatedDuration: '4-8 weeks',
    overview: 'Establish a repeatable AI risk assessment methodology covering identification, analysis, evaluation, and treatment of AI-specific risks.',
    businessCase: 'AI systems introduce unique risks (adversarial attacks, bias, drift) that traditional IT risk frameworks don\'t address. Without AI-specific risk assessment, organizations are blind to emerging threats.',
    phases: [
      {
        name: 'Risk Framework Selection',
        duration: '1-2 weeks',
        activities: [
          'Evaluate NIST AI RMF, ISO 23894, and organization-specific requirements',
          'Select or customize risk assessment methodology',
          'Define risk appetite for AI systems (acceptable risk levels by use case)',
          'Create AI threat taxonomy (adversarial, operational, ethical, compliance)',
          'Map risk categories to existing ERM framework',
        ],
        deliverables: ['AI Risk Assessment Methodology', 'AI Threat Taxonomy', 'Risk Appetite Statement for AI'],
        stakeholders: ['Risk Management', 'CISO', 'AI Teams', 'Business Units'],
        riskFlags: ['Risk appetite not defined at board level', 'Existing ERM framework incompatible with AI-specific risks'],
      },
      {
        name: 'Assessment Tooling & Templates',
        duration: '2-3 weeks',
        activities: [
          'Develop AI risk assessment questionnaire (cover all 4 AAISM domains)',
          'Create risk scoring matrix (likelihood × impact with AI-specific factors)',
          'Build AI risk register template with fields for model-specific risks',
          'Define control catalog for AI risks (preventive, detective, corrective)',
          'Create data poisoning / adversarial attack risk scenarios',
        ],
        deliverables: ['Risk Assessment Questionnaire', 'Risk Scoring Matrix', 'AI Risk Register', 'AI Control Catalog'],
        stakeholders: ['Risk Analysts', 'AI/ML Engineers', 'Security Architects'],
        riskFlags: ['Assessment too theoretical without practical examples', 'Control catalog not mapped to real threats'],
      },
      {
        name: 'Pilot Assessment',
        duration: '2-3 weeks',
        activities: [
          'Select 2-3 AI systems for pilot assessment (varying risk levels)',
          'Conduct full risk assessments using new methodology',
          'Test threat scenarios (data poisoning, model evasion, prompt injection)',
          'Generate risk reports with treatment recommendations',
          'Refine methodology based on pilot findings',
        ],
        deliverables: ['Pilot Risk Assessment Reports', 'Refined Methodology', 'Lessons Learned Document'],
        stakeholders: ['AI System Owners', 'Risk Analysts', 'AI Security Team'],
        riskFlags: ['Pilot systems not representative of portfolio', 'Teams lack expertise to assess adversarial risks'],
      },
    ],
    keyMetrics: [
      'Number of AI systems with completed risk assessments',
      'Average risk score by domain and use case',
      'Time to complete a risk assessment',
      'Risk treatment implementation rate',
      'Number of high/critical risks identified and mitigated',
    ],
    maturityLevels: [
      { level: 1, name: 'Initial', criteria: 'No AI-specific risk assessment; using generic IT risk templates' },
      { level: 2, name: 'Repeatable', criteria: 'AI risk methodology exists; assessments done on request' },
      { level: 3, name: 'Defined', criteria: 'Standardized methodology; mandatory for new AI systems; risk register maintained' },
      { level: 4, name: 'Quantitative', criteria: 'Data-driven risk scoring; automated risk monitoring; continuous assessment' },
      { level: 5, name: 'Optimizing', criteria: 'Predictive risk analytics; real-time threat intelligence integration; industry benchmarking' },
    ],
    examRelevance: 'Domain 2 focuses heavily on risk identification, assessment methodologies, AI-specific threats, and risk treatment. This playbook covers the practical application of concepts tested on the exam.',
    realWorldExample: 'A healthcare AI company used this playbook to assess their diagnostic AI system. The assessment revealed a critical data poisoning vulnerability in their training pipeline — a finding that would have been missed by standard IT risk assessment.',
  },
  {
    id: 'pb-secure-mlops',
    title: 'Secure MLOps Pipeline',
    category: 'development',
    domain: 3,
    difficulty: 'advanced',
    estimatedDuration: '8-12 weeks',
    overview: 'Build a security-first MLOps pipeline with integrity controls, access management, automated testing, and deployment safeguards.',
    businessCase: 'ML pipelines are increasingly targeted by supply chain attacks. A compromised model in production can cause massive financial and reputational damage. Secure MLOps is both a competitive advantage and a regulatory requirement.',
    phases: [
      {
        name: 'Pipeline Architecture',
        duration: '2-3 weeks',
        activities: [
          'Map current ML pipeline (data ingestion → training → validation → deployment)',
          'Identify security touchpoints and control gaps',
          'Design target architecture with security gates at each stage',
          'Select tooling: model registry, feature store, experiment tracking',
          'Define access control model (RBAC for data, models, and deployments)',
        ],
        deliverables: ['Pipeline Architecture Diagram', 'Security Control Map', 'Tool Selection Document', 'Access Control Matrix'],
        stakeholders: ['MLOps Team', 'Security Architecture', 'Data Engineering', 'DevOps'],
        riskFlags: ['Legacy pipeline with no security controls', 'Tool sprawl across teams'],
      },
      {
        name: 'Security Controls Implementation',
        duration: '4-6 weeks',
        activities: [
          'Implement model signing and integrity verification (cryptographic hashes)',
          'Deploy data validation gates (schema checks, anomaly detection on training data)',
          'Set up automated model testing (bias tests, adversarial robustness, performance)',
          'Implement separation of duties (training ≠ deployment permissions)',
          'Create rollback procedures and model versioning strategy',
          'Integrate secrets management for API keys and credentials',
        ],
        deliverables: ['Signed Model Registry', 'Data Validation Pipeline', 'Automated Test Suite', 'RBAC Implementation', 'Rollback Procedures'],
        stakeholders: ['ML Engineers', 'Security Engineers', 'DevOps', 'Platform Team'],
        riskFlags: ['Model signing breaks existing CI/CD flows', 'Test suite too slow for development velocity'],
      },
      {
        name: 'Deployment Safeguards',
        duration: '2-3 weeks',
        activities: [
          'Implement canary deployment for ML models',
          'Set up production monitoring with drift detection',
          'Create automated rollback triggers (performance threshold violations)',
          'Build audit trail for all model changes',
          'Conduct red team exercise on the pipeline',
        ],
        deliverables: ['Canary Deployment Config', 'Monitoring Dashboard', 'Audit Trail System', 'Red Team Report'],
        stakeholders: ['MLOps', 'SRE', 'Security Red Team', 'AI Governance'],
        riskFlags: ['Canary percentage too low to catch issues', 'Monitoring gaps in edge cases'],
      },
    ],
    keyMetrics: [
      'Model integrity verification rate (% of deployments with signed models)',
      'Data validation pass rate',
      'Mean time to detect drift',
      'Mean time to rollback',
      'Number of pipeline security incidents',
    ],
    maturityLevels: [
      { level: 1, name: 'Manual', criteria: 'Manual model deployment; no version control; no integrity checks' },
      { level: 2, name: 'Version Controlled', criteria: 'Models versioned; basic CI/CD; manual security checks' },
      { level: 3, name: 'Automated', criteria: 'Automated pipeline; integrity verification; automated testing' },
      { level: 4, name: 'Secured', criteria: 'Signed models; separation of duties; canary deployments; drift detection' },
      { level: 5, name: 'Resilient', criteria: 'Self-healing pipeline; automated rollback; continuous red teaming; supply chain verification' },
    ],
    examRelevance: 'Domain 3 tests CRISP-DM, MLOps, secure development lifecycle, and deployment strategies. This playbook provides the hands-on context for understanding exam questions about pipeline security.',
    realWorldExample: 'A fintech company discovered their ML pipeline had been compromised when a malicious model was deployed through an automated retraining process. After implementing this playbook, they caught a similar attack attempt within 15 minutes through model integrity verification.',
  },
  {
    id: 'pb-ai-monitoring',
    title: 'AI Operations Monitoring Program',
    category: 'operations',
    domain: 4,
    difficulty: 'intermediate',
    estimatedDuration: '4-6 weeks',
    overview: 'Establish comprehensive monitoring for production AI systems covering performance, drift, security, fairness, and operational health.',
    businessCase: 'AI systems degrade silently. Without monitoring, organizations discover problems through customer complaints, not early detection. Proactive monitoring reduces incident impact by 70%.',
    phases: [
      {
        name: 'Monitoring Strategy',
        duration: '1-2 weeks',
        activities: [
          'Define what to monitor: performance metrics, data drift, concept drift, fairness metrics, security events',
          'Set alerting thresholds for each metric type',
          'Design monitoring architecture (data collection → storage → analysis → alerting)',
          'Determine monitoring frequency (real-time vs batch by criticality)',
          'Create RACI for monitoring and incident response',
        ],
        deliverables: ['Monitoring Strategy Document', 'Alerting Threshold Matrix', 'Architecture Design', 'RACI Matrix'],
        stakeholders: ['MLOps', 'SRE', 'Data Science', 'AI Governance'],
        riskFlags: ['Too many metrics causing alert fatigue', 'Thresholds set too loose or too tight'],
      },
      {
        name: 'Implementation',
        duration: '2-3 weeks',
        activities: [
          'Deploy drift detection (Population Stability Index, KL divergence, JS divergence)',
          'Set up model performance tracking (accuracy, precision, recall, F1 over time)',
          'Implement fairness monitoring (demographic parity, equalized odds)',
          'Create security event logging for inference endpoints',
          'Build monitoring dashboard with unified view',
          'Implement automated alerting workflows',
        ],
        deliverables: ['Drift Detection System', 'Performance Monitoring Dashboard', 'Fairness Monitoring Pipeline', 'Alert Automation'],
        stakeholders: ['ML Engineers', 'Platform Engineering', 'Security Operations'],
        riskFlags: ['Ground truth data not available for performance monitoring', 'Fairness metrics undefined for use case'],
      },
      {
        name: 'Response Procedures',
        duration: '1-2 weeks',
        activities: [
          'Define incident classification for AI-specific events (drift, bias, adversarial)',
          'Create response runbooks for each incident type',
          'Establish model rollback and retraining triggers',
          'Define communication plan for stakeholders during AI incidents',
          'Conduct tabletop exercise for AI incident scenario',
        ],
        deliverables: ['AI Incident Classification Scheme', 'Response Runbooks', 'Communication Plan', 'Tabletop Exercise Report'],
        stakeholders: ['Incident Response Team', 'AI Governance', 'Communications', 'Legal'],
        riskFlags: ['Runbooks too generic for AI-specific incidents', 'No clear ownership of AI incident response'],
      },
    ],
    keyMetrics: [
      'Mean time to detect drift',
      'Mean time to resolve AI incidents',
      'False alarm rate (alert accuracy)',
      'Model performance trend (degradation rate)',
      'Number of AI incidents by severity per quarter',
    ],
    maturityLevels: [
      { level: 1, name: 'Reactive', criteria: 'No monitoring; issues found by users' },
      { level: 2, name: 'Basic', criteria: 'Manual performance checks; no drift detection; ad-hoc incident response' },
      { level: 3, name: 'Proactive', criteria: 'Automated drift detection; performance dashboards; defined incident process' },
      { level: 4, name: 'Predictive', criteria: 'Predictive drift alerts; automated retraining triggers; SLA-based monitoring' },
      { level: 5, name: 'Autonomous', criteria: 'Self-healing systems; automated incident response; continuous optimization' },
    ],
    examRelevance: 'Domain 4 tests monitoring, drift detection, incident response, and model maintenance. This playbook directly maps to the operational concepts tested on the AAISM exam.',
    realWorldExample: 'An e-commerce company using AI for product recommendations saw a 15% drop in conversion rate over 2 weeks. Their monitoring system (deployed from this playbook) detected concept drift within 3 days of onset — customer behavior shifted after a viral TikTok trend. Without monitoring, the issue would have persisted for weeks.',
  },
  {
    id: 'pb-eu-ai-act',
    title: 'EU AI Act Compliance Roadmap',
    category: 'compliance',
    domain: 1,
    difficulty: 'starter',
    estimatedDuration: '2-4 weeks (assessment) + ongoing',
    overview: 'Step-by-step guide to assess and achieve EU AI Act compliance, including risk classification, documentation requirements, and ongoing obligations.',
    businessCase: 'The EU AI Act imposes significant penalties (up to 7% global turnover for unacceptable risk violations). Any organization deploying AI in the EU or serving EU citizens must comply.',
    phases: [
      {
        name: 'AI System Classification',
        duration: '1-2 weeks',
        activities: [
          'Inventory all AI systems in scope (deployed in EU or affecting EU citizens)',
          'Classify each system by EU AI Act risk tier (Unacceptable, High, Limited, Minimal)',
          'Identify prohibited practices (social scoring, real-time biometric ID, emotion recognition in workplace)',
          'Determine conformity assessment requirements for High-risk systems',
          'Map existing controls to EU AI Act requirements (Articles 9-15)',
        ],
        deliverables: ['AI System Classification Register', 'Prohibited Practice Audit', 'Gap Analysis per High-risk System'],
        stakeholders: ['Legal/Compliance', 'AI Teams', 'DPO', 'Business Units'],
        riskFlags: ['Systems incorrectly classified as lower risk', 'Prohibited practices in use without awareness'],
      },
      {
        name: 'High-Risk Compliance',
        duration: '4-8 weeks',
        activities: [
          'Establish risk management system (Art. 9)',
          'Implement data governance practices (Art. 10)',
          'Create technical documentation (Art. 11)',
          'Set up automatic logging/record-keeping (Art. 12)',
          'Ensure transparency and user information (Art. 13)',
          'Implement human oversight measures (Art. 14)',
          'Validate accuracy, robustness, and cybersecurity (Art. 15)',
        ],
        deliverables: ['Risk Management Documentation', 'Data Governance Procedures', 'Technical Documentation Package', 'Human Oversight Protocol'],
        stakeholders: ['AI Engineering', 'Legal', 'Quality Assurance', 'Security'],
        riskFlags: ['Technical documentation too sparse', 'Human oversight mechanisms not practical for real-time systems'],
      },
      {
        name: 'Ongoing Compliance',
        duration: 'Ongoing',
        activities: [
          'Monitor regulatory updates and guidance from national authorities',
          'Maintain conformity assessments for High-risk systems',
          'Report serious incidents within required timeframes',
          'Update documentation for model changes and retraining',
          'Train staff on AI Act obligations and reporting duties',
        ],
        deliverables: ['Compliance Monitoring Calendar', 'Incident Reporting Procedures', 'Annual Compliance Report'],
        stakeholders: ['Compliance Officer', 'AI Governance Board', 'All AI Teams'],
        riskFlags: ['Regulatory landscape evolving faster than compliance program', 'Documentation not maintained after initial compliance'],
      },
    ],
    keyMetrics: [
      '% of AI systems classified under EU AI Act',
      'Number of High-risk systems with complete documentation',
      'Conformity assessment completion rate',
      'Time from incident to regulatory report',
      'Staff training completion rate on AI Act',
    ],
    maturityLevels: [
      { level: 1, name: 'Unaware', criteria: 'No awareness of EU AI Act requirements' },
      { level: 2, name: 'Aware', criteria: 'Awareness exists; initial assessment underway' },
      { level: 3, name: 'Compliant', criteria: 'All systems classified; High-risk systems documented; ongoing monitoring' },
      { level: 4, name: 'Embedded', criteria: 'Compliance integrated into development lifecycle; automated documentation' },
      { level: 5, name: 'Leading', criteria: 'Proactive compliance; contributing to industry standards; best-in-class documentation' },
    ],
    examRelevance: 'The EU AI Act is one of the most heavily tested topics on the AAISM exam. This playbook provides the practical understanding of requirements that ISACA questions test.',
    realWorldExample: 'A European SaaS company used this playbook to classify their 8 AI systems. They discovered their customer sentiment analysis tool used emotion recognition in a workplace context — a prohibited practice. Early identification saved them from potential fines and reputational damage.',
  },
];

export const PLAYBOOK_CATEGORIES = [
  { id: 'governance', label: 'Governance', icon: '🏛️', domain: 1 },
  { id: 'risk', label: 'Risk Management', icon: '⚠️', domain: 2 },
  { id: 'development', label: 'Development', icon: '🔧', domain: 3 },
  { id: 'operations', label: 'Operations', icon: '📊', domain: 4 },
  { id: 'compliance', label: 'Compliance', icon: '📋', domain: 1 },
];
