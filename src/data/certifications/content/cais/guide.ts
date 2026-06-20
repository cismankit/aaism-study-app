import type { DomainGuide } from '../../../aaismDomainGuide';

export const CAIS_DOMAIN_GUIDES: DomainGuide[] = [
  {
    id: 1,
    shortName: 'Threats',
    name: 'AI Threat Landscape',
    weight: '25%',
    overview:
      'Domain 1 maps adversarial ML and LLM-specific attack surfaces across the AI lifecycle. CAIS tests whether you can classify threats, identify attack phases, and prioritize defenses — not just name OWASP categories.',
    learningObjectives: [
      'Classify AI attacks by lifecycle phase: training, inference, deployment, supply chain',
      'Apply MITRE ATLAS and OWASP LLM Top 10 taxonomies to threat models',
      'Differentiate poisoning, evasion, extraction, inversion, and prompt injection',
      'Evaluate LLM agent risks: tool abuse, indirect injection, excessive agency',
      'Assess API exposure risks: model extraction, membership inference, rate abuse',
      'Recognize emerging threats: deepfakes, synthetic identity, model collusion',
      'Prioritize threats by business impact and exploitability in enterprise contexts',
    ],
    coreConcepts: [
      {
        title: 'MITRE ATLAS Taxonomy',
        summary: 'Adversarial Threat Landscape for AI Systems — structured tactics from recon to impact.',
        detail:
          'ATLAS organizes ML attacks: AML.T0020 poison training data, AML.T0043 craft adversarial examples, AML.T0051 LLM prompt injection, AML.T0054 model extraction. Use ATLAS to build threat models analogous to ATT&CK for traditional security.',
      },
      {
        title: 'OWASP LLM Top 10',
        summary: 'Primary LLM risk taxonomy — LLM01 prompt injection leads the list.',
        detail:
          'LLM01 Prompt Injection, LLM02 Insecure Output Handling, LLM03 Training Data Poisoning, LLM04 Model DoS, LLM05 Supply Chain, LLM06 Sensitive Info Disclosure, LLM07 Insecure Plugin Design, LLM08 Excessive Agency, LLM09 Overreliance, LLM10 Model Theft. Exam scenarios often combine multiple risks.',
      },
      {
        title: 'Poisoning vs. Evasion',
        summary: 'Training-phase corruption vs. inference-phase input manipulation.',
        detail:
          'Poisoning: availability (degrade accuracy), integrity (targeted misclassification), backdoor (trigger-activated). Evasion: adversarial examples at inference. Poisoning defenses: provenance, anomaly detection, curated datasets. Evasion defenses: adversarial training, input validation, ensemble methods.',
      },
      {
        title: 'Prompt Injection (Direct & Indirect)',
        summary: 'Manipulating LLM behavior via crafted natural language inputs.',
        detail:
          'Direct: user overrides system instructions. Indirect: malicious instructions embedded in RAG documents, emails, web pages, or tool outputs. No single filter suffices — defense-in-depth: privilege separation, output validation, human approval for sensitive actions.',
      },
      {
        title: 'Model Extraction & API Abuse',
        summary: 'Reconstructing model behavior through systematic API queries.',
        detail:
          'Attackers query prediction APIs to clone model functionality or steal intellectual property. High query limits, verbose outputs, and lack of monitoring enable extraction. Defenses: rate limiting, query logging, output perturbation, watermarking, legal terms.',
      },
      {
        title: 'Privacy Attacks on Models',
        summary: 'Membership inference, model inversion, and attribute inference leak training data.',
        detail:
          'Membership inference determines if a record was in training data. Model inversion reconstructs training samples. Attribute inference reveals sensitive attributes. Defenses: differential privacy, output rate limiting, minimum necessary data, query monitoring.',
      },
      {
        title: 'LLM Agent & Tool Risks',
        summary: 'Agents with tool access multiply attack surface via excessive agency.',
        detail:
          'OWASP LLM08: agents can execute code, call APIs, modify data. Indirect injection via untrusted content can trigger unauthorized actions. Mitigation: least-privilege tool scopes, human-in-the-loop for destructive ops, sandboxed execution, action allowlists.',
      },
      {
        title: 'AI Supply Chain Threats',
        summary: 'Pre-trained models, datasets, and MLOps dependencies introduce inherited risk.',
        detail:
          'Risks: poisoned weights on model hubs, typosquatted packages, compromised training pipelines, deprecated models with known flaws. Verify model cards, scan SBOMs, pin versions, maintain provenance records.',
      },
    ],
    frameworks: [
      { name: 'MITRE ATLAS', relevance: 'Adversarial ML attack matrix and techniques', examWeight: 'high' },
      { name: 'OWASP Top 10 for LLMs', relevance: 'LLM-specific threat taxonomy', examWeight: 'high' },
      { name: 'NIST AI RMF — Map', relevance: 'Context and risk identification', examWeight: 'medium' },
      { name: 'ENISA AI Threat Landscape', relevance: 'EU-focused AI threat catalog', examWeight: 'medium' },
      { name: 'Google SAIF', relevance: 'Secure AI framework threat categories', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A red team embeds instructions in a PDF that cause an LLM agent to exfiltrate data.',
        answerLogic: 'FIRST = classify as indirect prompt injection (LLM01) with excessive agency (LLM08) — contain tool access before retraining.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which threat is MOST likely when an ML API allows unlimited queries with full logits?',
        answerLogic: 'BEST = model extraction — systematic querying reconstructs model behavior.',
      },
      {
        keyword: 'MOST',
        prompt: 'What presents the MOST significant inference-time risk for a computer vision fraud detector?',
        answerLogic: 'MOST = adversarial evasion examples crafted to bypass detection at inference.',
      },
    ],
    trapAlerts: [
      {
        title: 'Poisoning vs. Evasion Swap',
        trap: 'Selecting adversarial examples for a corrupted training dataset scenario.',
        correctApproach: 'Training-phase attacks = poisoning; inference-phase = evasion.',
      },
      {
        title: 'Single-Control Silver Bullet',
        trap: 'Picking input filtering alone for prompt injection.',
        correctApproach: 'Defense-in-depth: input validation + output filtering + least privilege + human oversight.',
      },
      {
        title: 'Traditional Attack Misclassification',
        trap: 'Choosing SQL injection or XSS for an LLM-specific scenario.',
        correctApproach: 'LLM threats use natural language manipulation — prompt injection, not web injection.',
      },
    ],
    applyIt: {
      scenario:
        'Your enterprise copilot reads Slack, email, and Confluence via RAG. Red team hides instructions in a Slack message that trigger unauthorized Jira ticket creation.',
      orgAction:
        'Threat model with ATLAS/OWASP, classify indirect injection + excessive agency, restrict tool permissions, sanitize retrieved content, add human approval for external actions, log and alert on anomalous tool invocations.',
    },
    relatedFeatures: [
      { label: 'Intel Hub', route: '/intel', description: 'OWASP LLM risks and emerging AI threats' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'MITRE ATLAS, adversarial ML research' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Attack identification drills' },
      { label: 'Study Ops', route: '/study', description: 'Domain 1 threat landscape questions' },
      { label: 'Agent Discovery', route: '/agent', description: 'AI threat intelligence feeds' },
    ],
  },
  {
    id: 2,
    shortName: 'DevSecAI',
    name: 'Secure AI Development',
    weight: '25%',
    overview:
      'Domain 2 covers secure AI SDLC — data curation, model training isolation, validation gates, and deployment hardening. CAIS emphasizes shift-left security for ML pipelines, not post-hoc monitoring alone.',
    learningObjectives: [
      'Apply secure AI development lifecycle from data acquisition through deployment',
      'Implement data provenance, labeling integrity, and PII scrubbing controls',
      'Design model validation: robustness, fairness, adversarial, and security testing',
      'Secure ML pipelines, artifact stores, feature stores, and model registries',
      'Apply privacy-enhancing technologies appropriately to training workflows',
      'Implement model cards, SBOMs, and documentation for audit traceability',
      'Select deployment strategies that reduce rollout risk: canary, shadow, blue-green',
    ],
    coreConcepts: [
      {
        title: 'Secure AI SDLC',
        summary: 'Extend DevSecOps with ML-specific security gates at each lifecycle phase.',
        detail:
          'Requirements: threat model. Data: provenance, PII scan, license check. Training: environment isolation, secrets management. Validation: adversarial testing, fairness, robustness. Deployment: access controls, monitoring hooks. Retirement: model deletion, data purge.',
      },
      {
        title: 'Data Provenance & Curation',
        summary: 'Know where training data came from and who transformed it.',
        detail:
          'Scraped web data risks: toxic content, copyright violations, poisoned samples, PII leakage. Curated datasets with lineage tracking enable incident response and audit. Label quality directly affects model security and accuracy.',
      },
      {
        title: 'MLOps Pipeline Security',
        summary: 'CI/CD for ML with signed artifacts and integrity verification.',
        detail:
          'Secure feature stores, model registries, and orchestration (Kubeflow, MLflow). Pipeline configs are attack vectors — poisoned configs can inject malicious training. Sign model artifacts; verify before deployment. Immutable build environments.',
      },
      {
        title: 'Model Validation & Red Teaming',
        summary: 'Beyond accuracy: adversarial robustness, fairness, and security testing.',
        detail:
          'Validation suite: holdout sets, cross-validation, adversarial robustness tests, fairness metrics, stress under distribution shift. Red teaming LLMs: jailbreak attempts, indirect injection via RAG, tool abuse scenarios. Model cards document limitations.',
      },
      {
        title: 'Privacy-Enhancing Technologies',
        summary: 'Federated learning, differential privacy, homomorphic encryption, secure MPC.',
        detail:
          'Federated learning keeps data local; updates aggregated centrally. Differential privacy adds mathematical noise guarantees. Homomorphic encryption enables compute on encrypted data. Choose PET based on threat model — federated learning does not prevent inference on updates.',
      },
      {
        title: 'Deployment Hardening',
        summary: 'Canary, shadow, A/B, and blue-green reduce model rollout risk.',
        detail:
          'Shadow deployment runs new model alongside production without affecting users. Canary routes small traffic percentage with automatic rollback on SLO breach. Never promote models without validation gates and rollback plan.',
      },
      {
        title: 'Model Cards & ML SBOM',
        summary: 'Documentation artifacts for governance, compliance, and supply chain traceability.',
        detail:
          'Model cards: intended use, training data summary, limitations, evaluation results, ethical considerations. ML SBOM lists dependencies, datasets, and pipeline components. Required for EU AI Act high-risk documentation and enterprise audit.',
      },
      {
        title: 'Secrets & Environment Isolation',
        summary: 'Training environments must not leak credentials or cross-contaminate data.',
        detail:
          'Isolate training from production networks. Use vaults for API keys and cloud credentials. Prevent training logs from capturing secrets. GPU clusters need network segmentation — compromised training nodes can poison downstream models.',
      },
    ],
    frameworks: [
      { name: 'NIST SSDF (adapted for ML)', relevance: 'Secure software development practices for AI pipelines', examWeight: 'high' },
      { name: 'ISO/IEC 42001 Clause 8', relevance: 'Operational controls for AI development', examWeight: 'high' },
      { name: 'OWASP ML Security Top 10', relevance: 'ML-specific development vulnerabilities', examWeight: 'high' },
      { name: 'Google SAIF — Secure by Default', relevance: 'Development-time AI security controls', examWeight: 'medium' },
      { name: 'MLflow / Kubeflow Security', relevance: 'Pipeline and registry hardening', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A team wants to fine-tune an LLM on internal documents for a customer bot.',
        answerLogic: 'FIRST = PII scrub, data classification, provenance documentation, and threat model — not GPU procurement.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which practice BEST secures the model training pipeline against supply chain attacks?',
        answerLogic: 'BEST = signed artifacts, immutable builds, dependency scanning, and registry access controls.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST critical validation step before promoting a retrained fraud model?',
        answerLogic: 'MOST = adversarial robustness and fairness testing on holdout data with rollback plan.',
      },
    ],
    trapAlerts: [
      {
        title: 'Accuracy-Only Validation',
        trap: 'Selecting highest accuracy on test set as sufficient for production promotion.',
        correctApproach: 'Include robustness, fairness, security red teaming, and drift baseline.',
      },
      {
        title: 'Skip Data Review',
        trap: 'Choosing larger model or more GPUs when data quality is the root issue.',
        correctApproach: 'Data provenance and curation are foundational — bad data cannot be fixed by scale.',
      },
      {
        title: 'Production-First Deployment',
        trap: 'Full production rollout without canary or shadow testing.',
        correctApproach: 'Gradual rollout with monitoring and automatic rollback on SLO breach.',
      },
    ],
    applyIt: {
      scenario:
        'Engineering downloads a pre-trained model from HuggingFace and fine-tunes on scraped forum data for sentiment analysis without review.',
      orgAction:
        'Block promotion: require provenance audit, toxic content screening, PII scan, model card, adversarial prompt testing, SBOM scan, and canary deployment with rollback before production traffic.',
    },
    relatedFeatures: [
      { label: 'Playbooks', route: '/playbooks', description: 'Secure ML pipeline implementation guides' },
      { label: 'Study Ops', route: '/study', description: 'Domain 2 development security questions' },
      { label: 'Knowledge Visuals', route: '/knowledge/visual', description: 'SDLC and PET diagrams' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'Adversarial ML tools and research' },
      { label: 'Cram Mode', route: '/cram', description: 'Technical development review' },
    ],
  },
  {
    id: 3,
    shortName: 'Governance',
    name: 'AI Governance & Compliance',
    weight: '25%',
    overview:
      'Domain 3 tests regulatory alignment, policy frameworks, ethics oversight, and third-party AI governance. CAIS bridges technical AI security with enterprise GRC — you must map controls to EU AI Act, NIST AI RMF, and ISO 42001.',
    learningObjectives: [
      'Map EU AI Act risk tiers to organizational control requirements',
      'Design AI governance structures: policies, RACI, ethics review, system inventory',
      'Integrate AI governance with existing GRC (ISO 27001, SOC 2, privacy programs)',
      'Evaluate third-party AI services against governance and security criteria',
      'Establish human oversight requirements for high-risk AI systems',
      'Define incident escalation paths for AI-specific failure modes',
      'Document conformity assessments and technical files for regulated deployments',
    ],
    coreConcepts: [
      {
        title: 'EU AI Act Risk Tiers',
        summary: 'Unacceptable → High → Limited → Minimal risk with scaling obligations.',
        detail:
          'Prohibited: social scoring, manipulative AI, real-time biometric ID in public (exceptions apply). High-risk: employment, credit, critical infrastructure — conformity assessment, documentation, human oversight. Limited risk: transparency (chatbot disclosure). Minimal: no mandatory requirements.',
      },
      {
        title: 'NIST AI RMF Functions',
        summary: 'Govern, Map, Measure, Manage — voluntary US framework spanning AI lifecycle.',
        detail:
          'Govern establishes culture and policies. Map identifies context and risks. Measure analyzes and tracks risks. Manage prioritizes and acts. Exam questions ask which function applies — stakeholder context mapping is Map, not Govern.',
      },
      {
        title: 'ISO/IEC 42001 AIMS',
        summary: 'Certifiable AI Management System standard — Plan-Do-Check-Act structure.',
        detail:
          'Clauses 4–10 mirror ISO 27001: context, leadership, planning, support, operation, performance evaluation, improvement. Clause 6 covers risk treatment; clause 8 operational controls. For formal certification questions, ISO 42001 beats NIST AI RMF.',
      },
      {
        title: 'Human Oversight Models',
        summary: 'HITL, HOTL, and human-in-command for high-stakes AI decisions.',
        detail:
          'Human-in-the-loop: approval before action. Human-on-the-loop: monitor and intervene. Human-in-command: ultimate authority. EU AI Act high-risk systems mandate appropriate oversight — not optional for regulated use cases.',
      },
      {
        title: 'Third-Party AI Governance',
        summary: 'Vendor AI inherits your governance obligations — "not our model" is not a defense.',
        detail:
          'Due diligence: training data provenance, model update policies, subprocessor chains, data residency, incident SLAs. Contract clauses: audit rights, deletion on termination, prohibited use cases, output ownership.',
      },
      {
        title: 'AI System Inventory & Classification',
        summary: 'Central registry of AI systems with risk tier, owner, and control mapping.',
        detail:
          'Inventory fields: system name, owner, risk classification, data sources, deployment environment, model version, regulatory scope. Enables gap analysis, incident response, and audit evidence. Required for mature AI governance programs.',
      },
      {
        title: 'Policy Hierarchy & Exceptions',
        summary: 'AI policies integrate with enterprise policy stack — principles → policy → standards → procedures.',
        detail:
          'Exceptions require risk assessment, time limits, and executive approval. Permanent exceptions undermine governance. Exam answers favor documented, time-bound exceptions with compensating controls.',
      },
      {
        title: 'Conformity Assessment & Documentation',
        summary: 'High-risk EU AI Act systems require technical files and conformity procedures.',
        detail:
          'Technical documentation: system description, development process, monitoring measures, human oversight design, accuracy/robustness results. Conformity assessment by notified body or self-assessment depending on system type.',
      },
    ],
    frameworks: [
      { name: 'EU AI Act', relevance: 'Risk-tiered regulation; high-risk requirements', examWeight: 'high' },
      { name: 'ISO/IEC 42001:2023', relevance: 'Certifiable AIMS standard', examWeight: 'high' },
      { name: 'NIST AI RMF 1.0', relevance: 'Voluntary US framework; four core functions', examWeight: 'high' },
      { name: 'ISO/IEC 23894', relevance: 'AI risk management guidance', examWeight: 'medium' },
      { name: 'OECD AI Principles', relevance: 'International policy baseline', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A bank launches its first enterprise LLM for customer service in the EU.',
        answerLogic: 'FIRST = risk classification, use policy, and governance approval — not deploy guardrails or buy GPUs.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST ensures compliance for a high-risk AI hiring tool in the EU?',
        answerLogic: 'BEST = conformity assessment, technical documentation, risk management, and human oversight per EU AI Act.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is MOST important when onboarding a third-party foundation model API?',
        answerLogic: 'MOST = third-party risk assessment covering data handling, subprocessors, and model update practices.',
      },
    ],
    trapAlerts: [
      {
        title: 'Technical Fix for Governance Problem',
        trap: 'Choosing prompt filtering when asked about program establishment.',
        correctApproach: 'Select governance structures, policies, or stakeholder alignment first.',
      },
      {
        title: 'NIST vs ISO Confusion',
        trap: 'Picking NIST AI RMF when asked about formal certification.',
        correctApproach: 'ISO 42001 is certifiable; NIST AI RMF is voluntary guidance.',
      },
      {
        title: 'Ethics as Afterthought',
        trap: 'Conduct ethics review after deployment for a new high-impact system.',
        correctApproach: 'Ethics and risk assessment belong in design phase — shift-left governance.',
      },
    ],
    applyIt: {
      scenario:
        'HR deploys an AI resume screening tool across EU offices without legal review. Compliance flags potential high-risk classification under EU AI Act.',
      orgAction:
        'Pause deployment, classify risk tier, initiate conformity assessment if high-risk, document technical file, establish human oversight for adverse decisions, map to ISO 42001 controls, and update AI system inventory.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Governance and compliance questions' },
      { label: 'Playbooks', route: '/playbooks', description: 'AI governance implementation guides' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Regulatory decision scenarios' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'EU AI Act, NIST AI RMF, ISO 42001' },
      { label: 'Intel Hub', route: '/intel', description: 'Governance trap patterns' },
    ],
  },
  {
    id: 4,
    shortName: 'Ops',
    name: 'Operational AI Security',
    weight: '25%',
    overview:
      'Domain 4 covers production AI security: MLOps monitoring, drift detection, incident response, access control, and safe decommissioning. CAIS tests operational maturity — keeping AI systems trustworthy after deployment.',
    learningObjectives: [
      'Implement monitoring for model performance, drift, fairness, and security anomalies',
      'Distinguish data drift from concept drift and define response playbooks',
      'Execute AI incident response: detect, contain, investigate, recover',
      'Manage model updates, retraining triggers, and version rollback',
      'Secure production inference endpoints: authentication, rate limiting, logging',
      'Plan safe decommissioning with data retention and endpoint retirement',
      'Define SLIs/SLOs for AI services including accuracy and policy compliance',
    ],
    coreConcepts: [
      {
        title: 'Production Monitoring Stack',
        summary: 'Monitor inputs, outputs, performance, and security — not just uptime.',
        detail:
          'Layers: data quality (schema, distribution), model performance (accuracy, latency), business KPIs, security (anomalous queries, policy violations). Alert on degradation trends, not just hard failures. Model version in every log entry.',
      },
      {
        title: 'Data Drift vs. Concept Drift',
        summary: 'Input distribution changes vs. relationship between features and labels changing.',
        detail:
          'Data drift: demographics shift post-acquisition. Concept drift: fraud patterns evolve. Detection: PSI, KS test, performance monitoring. Response: investigate cause → retrain, adjust thresholds, or retire model.',
      },
      {
        title: 'AI Incident Response',
        summary: 'Specialized playbooks for AI failures that can cause harm at scale.',
        detail:
          'Detect → Triage (severity, blast radius) → Contain (disable, rollback, rate limit) → Investigate (root cause) → Recover (patch, retrain) → Learn (post-mortem). Faster rollback beats debugging in production during active incidents.',
      },
      {
        title: 'Inference Endpoint Security',
        summary: 'API authentication, rate limiting, input validation, and output filtering.',
        detail:
          'Production endpoints need: API keys/OAuth, per-tenant rate limits, input size caps, output policy filters, TLS, WAF rules. Unauthenticated or unlimited APIs enable extraction and DoS (OWASP LLM04).',
      },
      {
        title: 'Retraining & Champion/Challenger',
        summary: 'Event-driven retraining with validation gates before promotion.',
        detail:
          'Triggers: drift detection, SLO breach, new labeled data, regulatory change. Champion/challenger compares candidate vs. production. Never auto-promote without holdout validation and fairness checks.',
      },
      {
        title: 'Observability & Audit Logging',
        summary: 'Structured logs for forensics, compliance, and incident investigation.',
        detail:
          'Log: model version, input metadata (not full PII), output classification, confidence, policy flags, user/tenant ID. Balance logging with privacy. Enables tracing which model version made a harmful decision.',
      },
      {
        title: 'Decommissioning & Data Retention',
        summary: 'End-of-life models still hold risks — retire cleanly.',
        detail:
          'Steps: notify stakeholders, migrate dependents, archive artifacts, delete endpoints, purge training data per policy, update inventory. GDPR/CCPA may require proof of deletion.',
      },
      {
        title: 'Human Oversight in Operations',
        summary: 'Production review queues for high-stakes and anomalous decisions.',
        detail:
          'Escalation thresholds: low confidence, protected class flag, user complaint, policy violation. HITL queues for manual review. Over-automation creates OWASP LLM08/09 risks in production.',
      },
    ],
    frameworks: [
      { name: 'NIST AI RMF — Manage', relevance: 'Ongoing risk treatment and monitoring', examWeight: 'high' },
      { name: 'ISO/IEC 42001 Clause 9–10', relevance: 'Performance evaluation and improvement', examWeight: 'high' },
      { name: 'ITIL Incident Management', relevance: 'Adapted for AI failure modes', examWeight: 'medium' },
      { name: 'SRE Practices', relevance: 'SLIs/SLOs and error budgets for ML', examWeight: 'medium' },
      { name: 'EU AI Act Post-Market Monitoring', relevance: 'High-risk ongoing obligations', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'Production LLM starts leaking internal API keys in customer responses.',
        answerLogic: 'FIRST = contain: disable affected capability or rollback — then investigate root cause.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST handles concept drift in a production fraud model?',
        answerLogic: 'BEST = detect → analyze root cause → shadow/canary validate retrained candidate → promote with rollback.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST important operational control for an exposed ML prediction API?',
        answerLogic: 'MOST = authentication + rate limiting + query monitoring to prevent extraction and abuse.',
      },
    ],
    trapAlerts: [
      {
        title: 'Drift Type Confusion',
        trap: 'Retrain immediately for data drift without investigating cause.',
        correctApproach: 'Investigate first — drift may indicate upstream pipeline failure.',
      },
      {
        title: 'Rollback Neglect',
        trap: 'Debug in production during an active AI incident.',
        correctApproach: 'Contain first: rollback, disable, or failover — then root cause analysis.',
      },
      {
        title: 'Monitoring = Uptime Only',
        trap: 'Infrastructure health checks as sufficient AI monitoring.',
        correctApproach: 'Include model performance, drift, fairness, and security anomaly detection.',
      },
    ],
    applyIt: {
      scenario:
        'Your recommendation model accuracy drops 20% after a marketing campaign changes user demographics. No code was deployed.',
      orgAction:
        'Check PSI on input features, confirm data drift, run shadow test on retrained model, canary at 5% traffic, define rollback if KPIs drop >10%, document in incident log, update monitoring baselines.',
    },
    relatedFeatures: [
      { label: 'Playbooks', route: '/playbooks', description: 'AI incident response playbooks' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Operational decision scenarios' },
      { label: 'Study Ops', route: '/study', description: 'Operations and monitoring questions' },
      { label: 'Intel Hub', route: '/intel', description: 'Production risk trends' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'MLOps security resources' },
    ],
  },
];
