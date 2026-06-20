export interface FrameworkCrosswalk {
  name: string;
  relevance: string;
  examWeight: 'high' | 'medium' | 'low';
}

export interface ExamPattern {
  keyword: 'BEST' | 'MOST' | 'FIRST' | 'LEAST';
  prompt: string;
  answerLogic: string;
}

export interface TrapAlert {
  title: string;
  trap: string;
  correctApproach: string;
}

export interface RelatedFeature {
  label: string;
  route: string;
  description: string;
}

export interface CoreConcept {
  title: string;
  summary: string;
  detail: string;
}

export interface DomainGuide {
  id: number;
  shortName: string;
  name: string;
  weight: string;
  overview: string;
  learningObjectives: string[];
  coreConcepts: CoreConcept[];
  frameworks: FrameworkCrosswalk[];
  examPatterns: ExamPattern[];
  trapAlerts: TrapAlert[];
  applyIt: {
    scenario: string;
    orgAction: string;
  };
  relatedFeatures: RelatedFeature[];
}

export const AAISM_DOMAIN_GUIDES: DomainGuide[] = [
  {
    id: 1,
    shortName: 'AI Governance',
    name: 'AI Governance & Program Management',
    weight: '31%',
    overview:
      'Domain 1 tests whether you can advise stakeholders on building an AI security program — policies, roles, ethics, regulatory alignment, and incident governance. ISACA frames this as enabling responsible AI adoption, not blocking it.',
    learningObjectives: [
      'Design governance structures (boards, committees, RACI) for AI initiatives',
      'Align AI strategy with enterprise risk appetite and business objectives',
      'Map regulatory requirements (EU AI Act, sector rules) to control objectives',
      'Establish AI literacy and stakeholder communication programs',
      'Define incident escalation paths that include AI-specific failure modes',
      'Integrate AI governance with existing GRC (ISO 27001, SOC 2, privacy programs)',
      'Evaluate third-party AI services against governance criteria before procurement',
    ],
    coreConcepts: [
      {
        title: 'Governance vs. Management vs. Technical Controls',
        summary: 'ISACA hierarchy: governance sets direction, management plans execution, technical controls implement safeguards.',
        detail:
          'On the exam, when two answers are both "correct," the governance-level answer usually wins for policy/strategy questions. Technical controls win only when the stem explicitly asks about implementation. "Establish an AI ethics board" beats "deploy input filtering" for a program-start question.',
      },
      {
        title: 'NIST AI RMF (Govern, Map, Measure, Manage)',
        summary: 'The de facto US framework — Govern is the umbrella function spanning all others.',
        detail:
          'Govern establishes culture and policies. Map identifies context and risks. Measure analyzes and tracks risks. Manage prioritizes and acts. Exam questions often ask which function applies to a scenario — mapping stakeholder context is "Map," not "Govern."',
      },
      {
        title: 'ISO/IEC 42001 — Certifiable AI Management System',
        summary: 'The only international certifiable standard dedicated to AI management systems (AIMS).',
        detail:
          'Structured as Plan-Do-Check-Act: clauses 4–10 mirror ISO 27001 structure. Clause 6 (Planning) covers risk treatment; clause 8 covers operational controls. If asked about formal certification, ISO 42001 is the answer — NIST AI RMF is voluntary guidance.',
      },
      {
        title: 'EU AI Act Risk Tiers',
        summary: 'Unacceptable → High → Limited → Minimal risk, with obligations scaling by tier.',
        detail:
          'Prohibited: social scoring, manipulative AI, real-time biometric ID in public (with exceptions). High-risk: employment, credit, critical infrastructure — requires conformity assessment, documentation, human oversight. Limited risk: transparency obligations (e.g., chatbot disclosure). Minimal: no mandatory requirements.',
      },
      {
        title: 'AI Ethics Board & Human Oversight',
        summary: 'Cross-functional oversight body for ethical review of high-impact AI systems.',
        detail:
          'Human-in-the-loop (HITL) requires human approval before action. Human-on-the-loop monitors and can intervene. Human-in-command has ultimate authority. High-risk EU AI Act systems mandate appropriate human oversight — not optional for regulated use cases.',
      },
      {
        title: 'AI Literacy Programs',
        summary: 'Organization-wide capability building so stakeholders can evaluate AI risks and benefits.',
        detail:
          'Target audiences: executives (strategy/risk), developers (secure SDLC), users (appropriate reliance), legal/compliance (regulatory mapping). Literacy is a governance control, not HR training — it reduces "overreliance" (OWASP LLM09) at the organizational level.',
      },
      {
        title: 'Third-Party AI Governance',
        summary: 'Vendor AI services inherit your governance obligations — "not our model" is not a defense.',
        detail:
          'Due diligence covers: training data provenance, model update policies, subprocessor chains, data residency, and incident notification SLAs. Contract clauses should address audit rights, deletion on termination, and prohibited use cases.',
      },
      {
        title: 'Policy Hierarchy & Exception Handling',
        summary: 'AI policies must integrate with enterprise policy stack, not exist in isolation.',
        detail:
          'Typical stack: AI principles → AI acceptable use policy → technical standards → procedures. Exceptions require risk assessment, time limits, and executive approval. Permanent exceptions undermine governance — exam answers favor documented, time-bound exceptions.',
      },
    ],
    frameworks: [
      { name: 'NIST AI RMF 1.0', relevance: 'Voluntary US framework; Govern/Map/Measure/Manage functions', examWeight: 'high' },
      { name: 'ISO/IEC 42001:2023', relevance: 'Certifiable AIMS; aligns with ISO 27001', examWeight: 'high' },
      { name: 'EU AI Act', relevance: 'Risk-tiered regulation; high-risk requirements', examWeight: 'high' },
      { name: 'OECD AI Principles', relevance: 'International policy baseline; stakeholder values', examWeight: 'medium' },
      { name: 'NIST GenAI Profile', relevance: 'Extension of AI RMF for generative AI risks', examWeight: 'medium' },
      { name: 'COBIT 2019', relevance: 'Enterprise governance alignment for AI programs', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A bank is launching its first enterprise LLM chatbot for customer service.',
        answerLogic: 'FIRST step is governance: define use policy, risk classification, and approval workflow — not deploy guardrails or buy more GPUs.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST ensures regulatory compliance for a high-risk AI hiring tool?',
        answerLogic: 'BEST = comprehensive conformity assessment + documentation + human oversight per EU AI Act high-risk requirements, not just "bias testing."',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST important factor when establishing an AI governance program?',
        answerLogic: 'MOST = executive sponsorship and alignment with business strategy — without it, governance becomes shelfware.',
      },
    ],
    trapAlerts: [
      {
        title: 'Technical Fix for Governance Problem',
        trap: 'Choosing "implement prompt filtering" when the question asks about program establishment.',
        correctApproach: 'Select governance structures, policies, or stakeholder alignment first.',
      },
      {
        title: 'NIST vs ISO Confusion',
        trap: 'Picking NIST AI RMF when asked about formal certification.',
        correctApproach: 'ISO 42001 is certifiable; NIST AI RMF is voluntary guidance.',
      },
      {
        title: 'Ethics as Afterthought',
        trap: 'Selecting "conduct ethics review after deployment" for a new high-impact system.',
        correctApproach: 'Ethics and risk assessment belong in design phase — shift-left governance.',
      },
    ],
    applyIt: {
      scenario:
        'Your org wants to deploy an internal copilot on proprietary documents. Legal is concerned about data leakage; engineering wants to ship in two weeks.',
      orgAction:
        'Charter a lightweight AI governance review: classify risk tier, define approved data sources, establish human review for external outputs, and document in an AI system inventory before pilot.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Domain 1 practice questions and timed drills' },
      { label: 'Playbooks', route: '/playbooks', description: 'Org-level AI governance implementation guides' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Governance decision scenarios (FIRST/BEST)' },
      { label: 'Intel Hub', route: '/intel', description: 'Trap patterns for governance vs. technical answers' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'NIST AI RMF, ISO 42001, EU AI Act, governance frameworks' },
    ],
  },
  {
    id: 2,
    shortName: 'AI Risk Management',
    name: 'AI Risk Management',
    weight: '31%',
    overview:
      'Domain 2 covers identifying, assessing, and treating AI-specific risks — adversarial attacks, data poisoning, privacy harms, bias, and supply chain vulnerabilities. You must think like a risk manager, not just a security engineer.',
    learningObjectives: [
      'Execute AI risk assessments across the model lifecycle (design → deploy → retire)',
      'Classify threats using MITRE ATLAS and OWASP LLM Top 10 taxonomies',
      'Differentiate attack types by lifecycle phase (training vs inference)',
      'Apply risk treatment: accept, mitigate, transfer, avoid',
      'Evaluate privacy risks: membership inference, model inversion, re-identification',
      'Assess bias and fairness risks with appropriate metrics and stakeholder impact',
      'Manage third-party model and dataset supply chain risks',
    ],
    coreConcepts: [
      {
        title: 'AI Risk Lifecycle',
        summary: 'Identify → Assess → Treat → Monitor — continuous, not one-time at procurement.',
        detail:
          'Risks evolve as models drift, data changes, and threat landscapes shift. Re-assessment triggers: new training data, architecture changes, regulatory updates, incident discoveries. Risk register should link to specific AI systems, not generic "AI risk."',
      },
      {
        title: 'Threat Modeling for AI (MITRE ATLAS)',
        summary: 'Adversarial Threat Landscape for AI Systems — tactics from reconnaissance to impact.',
        detail:
          'ATLAS maps ML attack techniques: AML.T0043 craft adversarial examples, AML.T0020 poison training data, AML.T0051 LLM prompt injection. Use ATLAS to structure threat models the way ATT&CK structures traditional security.',
      },
      {
        title: 'Data Poisoning vs. Evasion Attacks',
        summary: 'Poisoning corrupts training; evasion manipulates inference inputs.',
        detail:
          'Poisoning types: availability (degrade accuracy), integrity (targeted misclassification), backdoor (trigger-activated behavior). Evasion: adversarial examples at inference. Defense for poisoning: data provenance, anomaly detection, curated datasets. Defense for evasion: adversarial training, input validation.',
      },
      {
        title: 'Prompt Injection (OWASP LLM01)',
        summary: 'The #1 LLM risk — manipulating model behavior via crafted inputs.',
        detail:
          'Direct injection: user overrides system prompt. Indirect injection: malicious content in retrieved documents, emails, or web pages. Mitigation is defense-in-depth: privilege separation, output validation, human approval for sensitive actions — no single filter is sufficient.',
      },
      {
        title: 'Privacy Attacks on Models',
        summary: 'Models can leak training data through inference queries.',
        detail:
          'Membership inference determines if a record was in training data. Model inversion reconstructs training samples. Model extraction clones model behavior via API queries. Defenses: differential privacy, output rate limiting, query monitoring, minimum necessary training data.',
      },
      {
        title: 'Bias, Fairness & Discrimination Risk',
        summary: 'Statistical bias becomes legal and reputational risk in regulated decisions.',
        detail:
          'Distinguish data bias (unrepresentative training), algorithmic bias (model amplifies disparities), and deployment bias (used in inappropriate context). Fairness metrics depend on context — demographic parity vs. equalized odds. Document limitations and monitor disparate impact in production.',
      },
      {
        title: 'Risk Appetite & Treatment',
        summary: 'Not all AI risks should be mitigated — some are accepted with controls.',
        detail:
          'Treatment options: Avoid (don\'t deploy), Mitigate (controls), Transfer (insurance, vendor SLA), Accept (documented with monitoring). Residual risk must be within appetite. Over-mitigation wastes resources; under-mitigation creates liability.',
      },
      {
        title: 'Supply Chain & Third-Party Model Risk',
        summary: 'Pre-trained models, APIs, and datasets introduce inherited vulnerabilities.',
        detail:
          'Risks: poisoned pre-trained weights, deprecated models with known flaws, API dependency outages, license restrictions. Verify model cards, SBOM for ML pipelines, and maintain fallback models. OWASP LLM05 covers supply chain explicitly.',
      },
    ],
    frameworks: [
      { name: 'OWASP Top 10 for LLMs', relevance: 'Primary LLM threat taxonomy; LLM01 prompt injection', examWeight: 'high' },
      { name: 'MITRE ATLAS', relevance: 'Adversarial ML attack matrix', examWeight: 'high' },
      { name: 'NIST AI RMF — Map & Measure', relevance: 'Risk identification and analysis functions', examWeight: 'high' },
      { name: 'ISO/IEC 23894', relevance: 'AI risk management guidance (companion to 42001)', examWeight: 'medium' },
      { name: 'NIST SP 800-53 (AI overlays)', relevance: 'Security controls mapped to AI systems', examWeight: 'medium' },
      { name: 'FAIR (adapted)', relevance: 'Quantitative risk analysis for AI incidents', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'An LLM customer bot starts revealing internal API keys in responses.',
        answerLogic: 'FIRST = contain and disable affected capability (incident response), then investigate root cause — not retrain the model immediately.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which control BEST mitigates indirect prompt injection from RAG documents?',
        answerLogic: 'BEST = treat retrieved content as untrusted input + output validation + privilege separation — not just "better embeddings."',
      },
      {
        keyword: 'MOST',
        prompt: 'What presents the MOST significant risk when using a third-party foundation model?',
        answerLogic: 'MOST = inherited training data risks and lack of visibility into model provenance — supply chain opacity.',
      },
    ],
    trapAlerts: [
      {
        title: 'Poisoning vs. Evasion Swap',
        trap: 'Selecting "adversarial examples" for a training data corruption scenario.',
        correctApproach: 'Training-phase attacks = poisoning; inference-phase = evasion.',
      },
      {
        title: 'Single-Control Silver Bullet',
        trap: 'Picking one technical control for prompt injection (e.g., "blocklist").',
        correctApproach: 'Defense-in-depth: input validation + output filtering + least privilege + human oversight.',
      },
      {
        title: 'Ignoring Business Impact',
        trap: 'Choosing the most technical mitigation without considering risk appetite.',
        correctApproach: 'Match treatment to impact and likelihood — sometimes accept with monitoring.',
      },
    ],
    applyIt: {
      scenario:
        'Your team deployed a RAG-based internal assistant that pulls from Confluence, Slack, and email. A red team found it executes instructions hidden in Slack messages.',
      orgAction:
        'Run an AI-specific threat model using ATLAS, classify as indirect prompt injection, implement content sanitization for retrieved docs, restrict tool privileges, and add output review for actions affecting external systems.',
    },
    relatedFeatures: [
      { label: 'Intel Hub', route: '/intel', description: 'OWASP LLM risks, trap patterns, rising threats' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'MITRE ATLAS, OWASP LLM Top 10, AI incident databases' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Attack identification and response drills' },
      { label: 'Study Ops', route: '/study', description: 'Domain 2 risk and threat questions' },
      { label: 'Agent Discovery', route: '/agent', description: 'Curated threat intelligence and question leads' },
    ],
  },
  {
    id: 3,
    shortName: 'AI Development',
    name: 'AI Development & Implementation',
    weight: '38%',
    overview:
      'Domain 3 is the largest exam weight — secure SDLC for AI, data controls, model validation, deployment strategies, and technical safeguards. It merges traditional AppSec with ML-specific concerns across the development lifecycle.',
    learningObjectives: [
      'Apply secure AI development lifecycle (data → train → validate → deploy)',
      'Implement data governance: quality, lineage, labeling, and access controls',
      'Design model validation including performance, robustness, and fairness testing',
      'Select deployment strategies: A/B, canary, shadow, blue-green',
      'Apply privacy-enhancing technologies (PETs) appropriately',
      'Secure ML pipelines, artifact stores, and model registries',
      'Manage explainability requirements for high-stakes decisions',
    ],
    coreConcepts: [
      {
        title: 'Secure AI SDLC',
        summary: 'Extend DevSecOps with ML-specific gates: data review, model card, bias testing, red teaming.',
        detail:
          'Security activities per phase: Requirements (threat model), Data (provenance, PII scan), Training (environment isolation, secrets management), Validation (adversarial testing, fairness), Deployment (access controls, monitoring hooks), Retirement (model deletion, data purge).',
      },
      {
        title: 'MLOps & Pipeline Security',
        summary: 'CI/CD for ML — automate training, testing, deployment with security checkpoints.',
        detail:
          'Key components: feature store (consistent, audited features), model registry (versioned artifacts with metadata), pipeline orchestration (Kubeflow, MLflow). Secure the pipeline itself — poisoned pipeline configs are an attack vector. Sign model artifacts; verify integrity before deployment.',
      },
      {
        title: 'Data Management & Lineage',
        summary: 'Know where data came from, who touched it, and what transformations applied.',
        detail:
          'Data lineage tracks provenance for audit and incident response. Label quality directly affects model behavior — inconsistent labels are a security and accuracy risk. PII detection before training prevents downstream disclosure risks.',
      },
      {
        title: 'Model Validation & Testing',
        summary: 'Beyond accuracy: robustness, fairness, explainability, and security testing.',
        detail:
          'Validation suite: holdout test sets, cross-validation, adversarial robustness tests, fairness metrics across protected groups, stress testing under distribution shift. Model cards document intended use, limitations, and evaluation results — required for governance traceability.',
      },
      {
        title: 'Privacy-Enhancing Technologies (PETs)',
        summary: 'Federated learning, differential privacy, homomorphic encryption, secure MPC.',
        detail:
          'Federated learning: data stays local, model updates aggregated. Differential privacy: mathematical noise guarantees. Homomorphic encryption: compute on encrypted data. Choose PET based on threat model — federated learning does not automatically prevent inference attacks on updates.',
      },
      {
        title: 'Explainability (LIME, SHAP)',
        summary: 'Local explanations for individual decisions; global for model behavior patterns.',
        detail:
          'Required for high-risk EU AI Act systems and many enterprise policies. LIME: local surrogate model. SHAP: Shapley values for feature attribution. Explainability supports debugging, compliance, and user trust — but can be gamed (explanation manipulation attacks).',
      },
      {
        title: 'Deployment Strategies',
        summary: 'Canary, shadow, A/B, and blue-green reduce deployment risk for models.',
        detail:
          'Shadow: new model runs parallel, no user impact — safest for validation. Canary: small traffic percentage, gradual rollout. A/B: compare metrics between versions. Blue-green: instant switch with rollback capability. Always define rollback triggers before deployment.',
      },
      {
        title: 'Supply Chain Security for ML',
        summary: 'Dependencies include datasets, pre-trained models, libraries, and infrastructure.',
        detail:
          'Verify hashes of model weights, scan dependencies (TensorFlow, PyTorch, HuggingFace), maintain SBOM. Third-party models may contain backdoors — evaluate in isolated sandbox before integration. OWASP LLM05 applies to development supply chain.',
      },
    ],
    frameworks: [
      { name: 'NIST SSDF + AI overlays', relevance: 'Secure software development for AI components', examWeight: 'high' },
      { name: 'ISO/IEC 42001 Clause 8', relevance: 'Operational controls for AI development', examWeight: 'high' },
      { name: 'OWASP ML Security Top 10', relevance: 'ML-specific development vulnerabilities', examWeight: 'medium' },
      { name: 'CRISP-DM', relevance: 'Data mining lifecycle methodology', examWeight: 'medium' },
      { name: 'Google Model Cards', relevance: 'Documentation standard for model transparency', examWeight: 'medium' },
      { name: 'BSI ML Security Guidelines', relevance: 'European ML security best practices', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST validates a credit scoring model before production?',
        answerLogic: 'BEST = comprehensive validation: performance + fairness across groups + adversarial robustness + documented limitations — not accuracy alone.',
      },
      {
        keyword: 'FIRST',
        prompt: 'A team wants to fine-tune an LLM on customer support tickets containing PII.',
        answerLogic: 'FIRST = data classification and PII remediation before training — not "start fine-tuning with encryption."',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST effective control for ensuring model integrity in the pipeline?',
        answerLogic: 'MOST = signed artifacts in a secured model registry with access controls and audit logging.',
      },
    ],
    trapAlerts: [
      {
        title: 'Accuracy-Only Validation',
        trap: 'Selecting "achieve 95% accuracy" as sufficient validation for a hiring model.',
        correctApproach: 'Include fairness, robustness, explainability, and intended-use validation.',
      },
      {
        title: 'PET Misapplication',
        trap: 'Choosing federated learning to prevent all privacy risks.',
        correctApproach: 'PETs address specific threats — federated learning still risks gradient leakage without differential privacy.',
      },
      {
        title: 'Deploy Before Validate',
        trap: 'Shadow deployment answer when question asks about pre-production testing.',
        correctApproach: 'Shadow is post-development validation in production-like env; pre-prod = holdout testing and red teaming.',
      },
    ],
    applyIt: {
      scenario:
        'Engineering wants to deploy a fine-tuned LLM for code review. The base model is from HuggingFace; training data includes internal repos.',
      orgAction:
        'Require model card, SBOM scan, PII scrub on training data, adversarial prompt testing, canary deployment with rollback plan, and registry entry before production traffic.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Domain 3 technical and lifecycle questions' },
      { label: 'Playbooks', route: '/playbooks', description: 'Secure ML pipeline implementation guides' },
      { label: 'Knowledge Visuals', route: '/knowledge/visual', description: 'Diagrams for SDLC, PETs, deployment' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'Practitioner tools, research papers, adversarial ML resources' },
      { label: 'Cram Mode', route: '/cram', description: 'Last-minute D3 technical review' },
    ],
  },
  {
    id: 4,
    shortName: 'AI Operations',
    name: 'AI Operations & Monitoring',
    weight: '(within D3 38%)',
    overview:
      'Domain 4 (operationally part of the 38% D3 weight) covers production AI: monitoring drift, incident response, performance management, and safe decommissioning. The exam tests whether you can keep AI systems trustworthy after deployment.',
    learningObjectives: [
      'Implement monitoring for model performance, drift, and security anomalies',
      'Distinguish data drift from concept drift and define response playbooks',
      'Execute AI incident response: detect, contain, investigate, recover',
      'Manage model updates, retraining triggers, and version rollback',
      'Plan safe decommissioning: data retention, model archival, user notification',
      'Maintain audit logs and evidence for compliance and post-incident review',
      'Define SLIs/SLOs for AI services (latency, accuracy, fairness over time)',
    ],
    coreConcepts: [
      {
        title: 'Production Monitoring Stack',
        summary: 'Monitor inputs, outputs, performance metrics, and infrastructure — not just uptime.',
        detail:
          'Layers: data quality monitors (schema, distribution), model performance (accuracy, F1, latency), business KPIs (conversion, false positive rate), security (anomalous query patterns, output policy violations). Alert on degradation trends, not just hard failures.',
      },
      {
        title: 'Data Drift vs. Concept Drift',
        summary: 'Data drift = input distribution changes; concept drift = relationship between X and Y changes.',
        detail:
          'Data drift example: customer demographics shift post-acquisition. Concept drift example: fraud patterns evolve, making old labels unreliable. Detection: statistical tests (KS test, PSI), performance monitoring. Response: investigate cause → retrain, adjust thresholds, or retire model.',
      },
      {
        title: 'AI Incident Response',
        summary: 'AI failures need specialized playbooks — wrong predictions can cause harm at scale.',
        detail:
          'Phases: Detect (monitoring, user reports) → Triage (severity, blast radius) → Contain (disable model, rollback, rate limit) → Investigate (root cause: data, model, infra) → Recover (patch, retrain, redeploy) → Learn (post-mortem, control updates). Faster rollback beats debugging in production.',
      },
      {
        title: 'Retraining & Model Updates',
        summary: 'Scheduled and event-driven retraining with validation gates before promotion.',
        detail:
          'Triggers: drift detection, performance below SLO, new labeled data, regulatory change. Never auto-promote retrained models without validation against holdout sets and fairness checks. Champion/challenger framework compares candidate vs. production model.',
      },
      {
        title: 'Decommissioning & Data Retention',
        summary: 'End-of-life models still hold risks — data, weights, and API endpoints must be retired cleanly.',
        detail:
          'Steps: notify stakeholders, migrate dependents, archive model artifacts with retention policy, delete production endpoints, purge training data per policy, update AI system inventory. GDPR/CCPA may require proof of deletion.',
      },
      {
        title: 'Observability & Audit Logging',
        summary: 'Log inputs, outputs, model version, and decision metadata for forensics.',
        detail:
          'Balance logging needs with privacy — avoid logging full PII in production. Structured logs enable incident investigation and regulatory evidence. Model version in every log entry is critical for tracing which model made a bad decision.',
      },
      {
        title: 'Human Oversight in Operations',
        summary: 'Production human review for high-stakes decisions and anomaly escalation.',
        detail:
          'Define escalation thresholds: confidence below X%, protected class flag, user complaint. HITL queues for manual review. Over-automation in operations creates OWASP LLM08 (Excessive Agency) and LLM09 (Overreliance) risks.',
      },
    ],
    frameworks: [
      { name: 'NIST AI RMF — Manage', relevance: 'Ongoing risk treatment and monitoring', examWeight: 'high' },
      { name: 'ISO/IEC 42001 Clause 9–10', relevance: 'Performance evaluation and improvement', examWeight: 'high' },
      { name: 'ITIL Incident Management', relevance: 'Adapted for AI-specific failure modes', examWeight: 'medium' },
      { name: 'SRE Practices (Google)', relevance: 'SLIs/SLOs, error budgets for ML services', examWeight: 'medium' },
      { name: 'EU AI Act Post-Market Monitoring', relevance: 'High-risk system ongoing monitoring obligations', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'Production fraud model accuracy drops 15% over two weeks with no code changes.',
        answerLogic: 'FIRST = investigate data/concept drift and recent input distribution changes — not immediately retrain.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST handles a model exhibiting concept drift in production?',
        answerLogic: 'BEST = detect → analyze root cause → validate retrained candidate in shadow/canary → promote with rollback plan.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST important monitoring metric for an LLM customer service bot?',
        answerLogic: 'MOST = policy violation rate + user escalation rate + output quality — not just token latency.',
      },
    ],
    trapAlerts: [
      {
        title: 'Drift Type Confusion',
        trap: 'Selecting "retrain immediately" for data drift without investigating cause.',
        correctApproach: 'Investigate first — drift may indicate upstream data pipeline failure, not model staleness.',
      },
      {
        title: 'Rollback Neglect',
        trap: 'Choosing "debug in production" during an active AI incident.',
        correctApproach: 'Contain first: rollback, disable, or failover — then root cause analysis.',
      },
      {
        title: 'Monitoring = Uptime Only',
        trap: 'Picking infrastructure health checks as sufficient AI monitoring.',
        correctApproach: 'Include model performance, drift, fairness, and security anomaly detection.',
      },
    ],
    applyIt: {
      scenario:
        'Your recommendation engine started suggesting inappropriate products after a marketing campaign changed user demographics.',
      orgAction:
        'Check PSI on input features, confirm data drift, run shadow test on retrained model, canary at 5% traffic, define rollback if click-through drops >10%, document in incident log.',
    },
    relatedFeatures: [
      { label: 'Playbooks', route: '/playbooks', description: 'Incident response and monitoring playbooks' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Operational decision scenarios' },
      { label: 'Study Ops', route: '/study', description: 'Operations and monitoring questions' },
      { label: 'Intel Hub', route: '/intel', description: 'Production risk trends and trap alerts' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'Threat feeds, CISA KEV, cloud AI security crosswalks' },
    ],
  },
];

export function getDomainGuide(domainId: number): DomainGuide | undefined {
  return AAISM_DOMAIN_GUIDES.find(d => d.id === domainId);
}

export function searchDomainGuides(query: string, guides: DomainGuide[] = AAISM_DOMAIN_GUIDES): DomainGuide[] {
  const q = query.toLowerCase();
  return guides.filter(
    guide =>
      guide.name.toLowerCase().includes(q) ||
      guide.shortName.toLowerCase().includes(q) ||
      guide.overview.toLowerCase().includes(q) ||
      guide.coreConcepts.some(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.detail.toLowerCase().includes(q)
      ) ||
      guide.frameworks.some(f => f.name.toLowerCase().includes(q)) ||
      guide.trapAlerts.some(t => t.title.toLowerCase().includes(q) || t.trap.toLowerCase().includes(q))
  );
}
