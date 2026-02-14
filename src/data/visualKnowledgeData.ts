// Visual Knowledge Hub - Curated diagrams, images, and resource links
// for every major AAISM exam topic

export interface VisualResource {
  id: string;
  title: string;
  description: string;
  category: VisualCategory;
  domain: 'D1' | 'D2' | 'D3' | 'ALL';
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  tags: string[];
  highYield: boolean;
  examTip?: string;
}

export interface ReferenceLink {
  title: string;
  url: string;
  type: 'github' | 'official' | 'guide' | 'tool' | 'video' | 'paper' | 'cheatsheet';
  description: string;
  stars?: string;
}

export type VisualCategory = 
  | 'frameworks'
  | 'attacks'
  | 'privacy'
  | 'mlops'
  | 'deployment'
  | 'explainability'
  | 'bias-fairness'
  | 'metrics'
  | 'architecture'
  | 'governance';

export const CATEGORY_META: Record<VisualCategory, { label: string; color: string; emoji: string; description: string }> = {
  frameworks: { label: 'Frameworks & Standards', color: 'blue', emoji: '📋', description: 'NIST AI RMF, ISO 42001, EU AI Act, OECD Principles' },
  attacks: { label: 'AI Attacks & Threats', color: 'red', emoji: '⚔️', description: 'MITRE ATLAS, Prompt Injection, Data Poisoning, Evasion' },
  privacy: { label: 'Privacy Technologies', color: 'green', emoji: '🔒', description: 'Federated Learning, Differential Privacy, Homomorphic Encryption' },
  mlops: { label: 'MLOps & Lifecycle', color: 'purple', emoji: '🔄', description: 'ML Pipeline, Model Training, Feature Stores, Drift' },
  deployment: { label: 'Deployment Strategies', color: 'orange', emoji: '🚀', description: 'Blue-Green, Canary, Shadow, A/B Testing' },
  explainability: { label: 'Explainability & XAI', color: 'cyan', emoji: '🔍', description: 'LIME, SHAP, Grad-CAM, Model Cards' },
  'bias-fairness': { label: 'Bias & Fairness', color: 'pink', emoji: '⚖️', description: 'Types of Bias, Fairness Metrics, Mitigation Strategies' },
  metrics: { label: 'ML Metrics & Evaluation', color: 'yellow', emoji: '📊', description: 'Confusion Matrix, Precision, Recall, F1, ROC/AUC' },
  architecture: { label: 'AI Security Architecture', color: 'indigo', emoji: '🏗️', description: 'Zero Trust for AI, Defense in Depth, Supply Chain' },
  governance: { label: 'AI Governance', color: 'teal', emoji: '🏛️', description: 'Responsible AI, Ethics Boards, Impact Assessments' },
};

// =========================================================================
// VISUAL DIAGRAMS — Using publicly accessible image URLs from official sources
// =========================================================================

export const VISUAL_RESOURCES: VisualResource[] = [
  // ── FRAMEWORKS ──
  {
    id: 'nist-ai-rmf',
    title: 'NIST AI Risk Management Framework',
    description: 'The four core functions — GOVERN (cross-cutting), MAP (context & risk identification), MEASURE (risk analysis & tracking), MANAGE (risk treatment & response) — arranged in a cycle. GOVERN underpins all other functions.',
    category: 'frameworks',
    domain: 'ALL',
    imageUrl: 'https://www.nist.gov/sites/default/files/styles/960_x_960_limit/public/images/2023/01/26/AI%20RMF.png',
    sourceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework',
    sourceName: 'NIST Official',
    tags: ['NIST', 'AI RMF', 'Govern', 'Map', 'Measure', 'Manage', 'Trustworthiness'],
    highYield: true,
    examTip: 'GOVERN is the cross-cutting function that touches all other three. Know all 7 trustworthiness characteristics.',
  },
  {
    id: 'eu-ai-act-risk',
    title: 'EU AI Act — Risk Classification Pyramid',
    description: 'Four-tier risk pyramid: UNACCEPTABLE (banned — social scoring, manipulative AI), HIGH (strict obligations — biometric, critical infrastructure, hiring), LIMITED (transparency rules — chatbots, deepfakes), MINIMAL (no rules — spam filters, games).',
    category: 'frameworks',
    domain: 'D1',
    imageUrl: 'https://www.trail-ml.com/hs-fs/hubfs/Blog/eu-ai-act-risk-classification.png?width=1200&height=675&name=eu-ai-act-risk-classification.png',
    sourceUrl: 'https://www.trail-ml.com/blog/eu-ai-act-how-risk-is-classified',
    sourceName: 'Trail ML',
    tags: ['EU AI Act', 'Risk Classification', 'Regulation', 'Compliance'],
    highYield: true,
    examTip: 'Know specific examples for each risk tier. Social scoring = UNACCEPTABLE. Employment AI = HIGH RISK.',
  },
  {
    id: 'iso-42001-structure',
    title: 'ISO/IEC 42001 — AIMS Structure (PDCA)',
    description: 'Plan-Do-Check-Act cycle for AI Management System. Clauses: 4-Context, 5-Leadership, 6-Planning, 7-Support, 8-Operation, 9-Performance Evaluation, 10-Improvement. The ONLY certifiable AI standard.',
    category: 'frameworks',
    domain: 'D1',
    imageUrl: 'https://iso-docs.com/cdn/shop/articles/ISO_42001_Clause_Structure.png?v=1710288000&width=1100',
    sourceUrl: 'https://iso-docs.com/blogs/iso-42001-artificial-intelligence-management-system-aims/iso-42001-requirements-complete-guide-to-ai-management-system-compliance',
    sourceName: 'ISO Docs',
    tags: ['ISO 42001', 'AIMS', 'PDCA', 'Certification', 'Management System'],
    highYield: true,
    examTip: 'ISO 42001 is the ONLY certifiable AI management system standard. Remember PDCA cycle and clause numbers.',
  },
  {
    id: 'nist-iso-crosswalk',
    title: 'NIST AI RMF ↔ ISO 42001 Crosswalk',
    description: 'Official NIST mapping between AI RMF functions (Govern/Map/Measure/Manage) and ISO 42001 clauses. Shows how frameworks complement each other — a common exam question topic.',
    category: 'frameworks',
    domain: 'D1',
    imageUrl: 'https://compliance.airiskassess.com/og-image.png',
    sourceUrl: 'https://airc.nist.gov/docs/NIST_AI_RMF_to_ISO_IEC_42001_Crosswalk.pdf',
    sourceName: 'NIST AIRC',
    tags: ['NIST', 'ISO 42001', 'Crosswalk', 'Mapping', 'Compliance'],
    highYield: true,
    examTip: 'ISACA loves asking how frameworks map to each other. Know that NIST MAP → ISO Clause 6 (Planning).',
  },
  {
    id: 'oecd-ai-principles',
    title: 'OECD AI Principles (2019)',
    description: '5 value-based principles: 1) Inclusive growth & well-being, 2) Human-centred values & fairness, 3) Transparency & explainability, 4) Robustness & safety, 5) Accountability. Plus 5 policy recommendations.',
    category: 'frameworks',
    domain: 'D1',
    imageUrl: 'https://oecd.ai/assets/images/og-image.png',
    sourceUrl: 'https://oecd.ai/en/ai-principles',
    sourceName: 'OECD.AI',
    tags: ['OECD', 'AI Principles', 'Trustworthiness', 'International Standards'],
    highYield: false,
    examTip: 'OECD Principles were the FIRST intergovernmental AI standard (2019, adopted by 46 countries).',
  },
  {
    id: 'responsible-ai-microsoft',
    title: 'Microsoft Responsible AI Principles',
    description: '6 core principles: Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability. Industry gold standard for responsible AI implementation.',
    category: 'governance',
    domain: 'D1',
    imageUrl: 'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Hero-PrinciplesandApproach-1600x600-2x',
    sourceUrl: 'https://www.microsoft.com/en-us/ai/principles-and-approach',
    sourceName: 'Microsoft',
    tags: ['Responsible AI', 'Microsoft', 'Ethics', 'Principles'],
    highYield: false,
  },
  
  // ── ATTACKS & THREATS ──
  {
    id: 'mitre-atlas-matrix',
    title: 'MITRE ATLAS — AI Threat Matrix',
    description: '12 tactics from Reconnaissance → Impact, modeled after ATT&CK. Key AI-specific tactics: ML Model Access, ML Attack Staging. Covers Data Poisoning, Model Evasion, Model Extraction, Backdoor attacks.',
    category: 'attacks',
    domain: 'D2',
    imageUrl: 'https://www.appsoc.com/hs-fs/hubfs/ATLAS%20Matrix%20Blog.png?width=1200&height=675&name=ATLAS%20Matrix%20Blog.png',
    sourceUrl: 'https://atlas.mitre.org/',
    sourceName: 'MITRE ATLAS',
    tags: ['MITRE', 'ATLAS', 'ATT&CK', 'Threat Matrix', 'Adversarial AI'],
    highYield: true,
    examTip: 'ATLAS extends ATT&CK for AI. Know the ML-specific tactics that ATT&CK doesn\'t have.',
  },
  {
    id: 'owasp-top10-llm',
    title: 'OWASP Top 10 for LLM Applications (2025)',
    description: 'LLM01-Prompt Injection, LLM02-Sensitive Info Disclosure, LLM03-Supply Chain, LLM04-Data/Model Poisoning, LLM05-Improper Output, LLM06-Excessive Agency, LLM07-System Prompt Leakage, LLM08-Vector Weaknesses, LLM09-Misinformation, LLM10-Unbounded Consumption.',
    category: 'attacks',
    domain: 'D3',
    imageUrl: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/images/GOV_LLM_AI_Security_Overview_v3.png',
    sourceUrl: 'https://genai.owasp.org/llm-top-10/',
    sourceName: 'OWASP GenAI',
    tags: ['OWASP', 'LLM', 'Top 10', 'GenAI', 'Prompt Injection'],
    highYield: true,
    examTip: 'LLM01 (Prompt Injection) is #1 for a reason. Know both DIRECT and INDIRECT injection.',
  },
  {
    id: 'prompt-injection-anatomy',
    title: 'Anatomy of Prompt Injection',
    description: 'Direct injection: attacker sends malicious instructions via user input. Indirect injection (XPIA): malicious instructions hidden in external data sources (web pages, emails, PDFs) that the LLM processes as context.',
    category: 'attacks',
    domain: 'D3',
    imageUrl: 'https://www.crowdstrike.com/wp-content/uploads/2024/06/prompt-injection-taxonomy-infographic-thumb.jpg',
    sourceUrl: 'https://www.crowdstrike.com/en-us/resources/infographics/taxonomy-of-prompt-injection-methods/',
    sourceName: 'CrowdStrike',
    tags: ['Prompt Injection', 'Direct', 'Indirect', 'XPIA', 'LLM Security'],
    highYield: true,
    examTip: 'Indirect prompt injection is MORE dangerous because it doesn\'t require user cooperation.',
  },
  {
    id: 'adversarial-attacks-lifecycle',
    title: 'Adversarial ML Attacks Across the Lifecycle',
    description: 'Pre-training: Data Poisoning, Backdoor. Training: Weight manipulation. Post-training: Model modification. Inference: Evasion, Adversarial Examples. Each phase has unique attack vectors and defenses.',
    category: 'attacks',
    domain: 'D2',
    imageUrl: 'https://adversarial-ml.github.io/static/overview.png',
    sourceUrl: 'https://adversarial-ml.github.io/',
    sourceName: 'Adversarial ML Survey',
    tags: ['Adversarial', 'Lifecycle', 'Poisoning', 'Evasion', 'Extraction'],
    highYield: true,
    examTip: 'Know which attack type belongs to which lifecycle phase — ISACA tests lifecycle thinking.',
  },
  {
    id: 'nist-adversarial-taxonomy',
    title: 'NIST Adversarial ML Taxonomy (AI 100-2e)',
    description: 'Official NIST classification of adversarial attacks: by capability (white/black/gray box), by goal (integrity, availability, confidentiality), by knowledge (full, partial, zero). Published January 2024.',
    category: 'attacks',
    domain: 'D2',
    imageUrl: 'https://www.nist.gov/sites/default/files/styles/960_x_960_limit/public/images/2024/01/04/NIST-AI-100-2e2023-cover-image.png',
    sourceUrl: 'https://csrc.nist.gov/pubs/ai/100/2/e2023/final',
    sourceName: 'NIST CSRC',
    tags: ['NIST', 'Taxonomy', 'Adversarial ML', 'Attack Classification'],
    highYield: false,
  },

  // ── PRIVACY ──
  {
    id: 'federated-learning',
    title: 'Federated Learning — How It Works',
    description: 'Distributed training: 1) Local training on devices, 2) Only model updates sent to server (NOT raw data), 3) Server aggregates via Federated Averaging, 4) Updated model distributed back. Data never leaves the device.',
    category: 'privacy',
    domain: 'D3',
    imageUrl: 'https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2021/08/27/Fig1-FL-overview.png',
    sourceUrl: 'https://aws.amazon.com/blogs/architecture/applying-federated-learning-for-ml-at-the-edge',
    sourceName: 'AWS Architecture Blog',
    tags: ['Federated Learning', 'Privacy', 'Distributed', 'PET'],
    highYield: true,
    examTip: 'Federated Learning protects DATA privacy (data stays local). Differential Privacy protects INDIVIDUAL privacy (noise added).',
  },
  {
    id: 'differential-privacy',
    title: 'Differential Privacy — Adding Noise',
    description: 'Mathematical guarantee: Adding calibrated noise to query results makes it impossible to determine if any individual\'s data was included. Epsilon (ε) controls privacy-utility tradeoff. Lower ε = stronger privacy.',
    category: 'privacy',
    domain: 'D3',
    imageUrl: 'https://pair.withgoogle.com/explorables/images/federated-learning/social.png',
    sourceUrl: 'https://pair.withgoogle.com/explorables/federated-learning/',
    sourceName: 'Google PAIR',
    tags: ['Differential Privacy', 'Epsilon', 'Noise', 'PET'],
    highYield: true,
    examTip: 'Smaller epsilon = MORE privacy but LESS accuracy. Know the privacy-utility tradeoff.',
  },
  {
    id: 'homomorphic-encryption',
    title: 'Homomorphic Encryption for AI',
    description: 'Compute on encrypted data without decryption. Fully Homomorphic Encryption (FHE) supports arbitrary operations. Practical for: encrypted model inference, private set intersection, secure aggregation in FL.',
    category: 'privacy',
    domain: 'D3',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Homomorphic_encryption.svg/1200px-Homomorphic_encryption.svg.png',
    sourceUrl: 'https://en.wikipedia.org/wiki/Homomorphic_encryption',
    sourceName: 'Wikipedia',
    tags: ['Homomorphic Encryption', 'FHE', 'PET', 'Encrypted Computation'],
    highYield: false,
    examTip: 'HE = compute on encrypted data. Key limitation: extremely computationally expensive.',
  },

  // ── MLOps ──
  {
    id: 'mlops-pipeline',
    title: 'MLOps Pipeline Architecture',
    description: 'End-to-end ML lifecycle: Data → Feature Engineering → Training → Validation → Deployment → Monitoring → Retrain. CI/CD/CT (Continuous Training) is the third pillar unique to MLOps.',
    category: 'mlops',
    domain: 'D3',
    imageUrl: 'https://cloud.google.com/static/architecture/images/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning-2-manual-ml.svg',
    sourceUrl: 'https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    sourceName: 'Google Cloud Architecture',
    tags: ['MLOps', 'Pipeline', 'CI/CD', 'Continuous Training', 'Lifecycle'],
    highYield: true,
    examTip: 'Know the 3 levels of MLOps maturity: Level 0 (Manual), Level 1 (ML Pipeline Automation), Level 2 (CI/CD Pipeline Automation).',
  },
  {
    id: 'mlops-maturity-levels',
    title: 'MLOps Maturity — Level 0, 1, 2',
    description: 'Level 0: Manual, script-driven. Level 1: ML pipeline automation with orchestration, CT enabled. Level 2: Full CI/CD with automated testing, model validation, and production deployment.',
    category: 'mlops',
    domain: 'D3',
    imageUrl: 'https://cloud.google.com/static/architecture/images/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning-4-ml-automation-ct.svg',
    sourceUrl: 'https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
    sourceName: 'Google Cloud Architecture',
    tags: ['MLOps', 'Maturity', 'Automation', 'CI/CD/CT'],
    highYield: true,
    examTip: 'Continuous Training (CT) is unique to MLOps — doesn\'t exist in traditional DevOps.',
  },
  {
    id: 'data-concept-drift',
    title: 'Data Drift vs. Concept Drift',
    description: 'Data Drift: input feature distributions change (P(X) shifts). Concept Drift: input-output relationship changes (P(Y|X) shifts). Both degrade model performance. Detection: statistical tests, monitoring dashboards.',
    category: 'mlops',
    domain: 'D3',
    imageUrl: 'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*nEQ0zzCH_pISvXnMl0pxhQ.png',
    sourceUrl: 'https://evidentlyai.com/blog/machine-learning-monitoring-data-and-concept-drift',
    sourceName: 'Evidently AI',
    tags: ['Data Drift', 'Concept Drift', 'Monitoring', 'Model Degradation'],
    highYield: true,
    examTip: 'Data drift = features changed. Concept drift = relationship changed. Both need monitoring but different responses.',
  },

  // ── DEPLOYMENT ──
  {
    id: 'deployment-strategies',
    title: 'AI Model Deployment Strategies Comparison',
    description: 'Blue-Green: instant switch, 2x cost. Canary: gradual rollout, low risk. Shadow: silent parallel run, zero user impact. A/B: statistical comparison, needs traffic. Choose based on risk tolerance and budget.',
    category: 'deployment',
    domain: 'D3',
    imageUrl: 'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9TIZ2pZPY0YrNrJN3Y5q2A.png',
    sourceUrl: 'https://theartifact.medium.com/machine-learning-model-deployment-pattern-39c3a87ab304',
    sourceName: 'Medium - The Artifact',
    tags: ['Blue-Green', 'Canary', 'Shadow', 'A/B Testing', 'Deployment'],
    highYield: true,
    examTip: 'Shadow deployment = SAFEST for critical AI systems (no user impact). Canary = gradual exposure.',
  },

  // ── EXPLAINABILITY ──
  {
    id: 'lime-vs-shap',
    title: 'LIME vs. SHAP — Explainability Methods',
    description: 'LIME: local, perturbation-based, model-agnostic, fast but unstable. SHAP: Shapley values, both local & global, theoretically grounded, consistent but expensive. Use LIME for quick debugging, SHAP for compliance.',
    category: 'explainability',
    domain: 'D3',
    imageUrl: 'https://aeri206.github.io/explaining-explainable-ml/fig/fig_comparison.png',
    sourceUrl: 'https://aeri206.github.io/explaining-explainable-ml/',
    sourceName: 'Explaining Explainable ML',
    tags: ['LIME', 'SHAP', 'XAI', 'Explainability', 'Interpretability'],
    highYield: true,
    examTip: 'LIME = Local only. SHAP = Local + Global. For regulatory compliance, SHAP is preferred.',
  },
  {
    id: 'model-cards',
    title: 'Model Cards — Documentation for Transparency',
    description: 'Standardized documentation: Model details, intended use, limitations, training data, evaluation metrics, ethical considerations, bias analysis. Required for responsible AI deployment.',
    category: 'explainability',
    domain: 'D1',
    imageUrl: 'https://modelcards.withgoogle.com/assets/model-card-example.png',
    sourceUrl: 'https://modelcards.withgoogle.com/about',
    sourceName: 'Google Model Cards',
    tags: ['Model Cards', 'Documentation', 'Transparency', 'Responsible AI'],
    highYield: false,
    examTip: 'Model Cards + Data Sheets together provide full AI system transparency.',
  },

  // ── BIAS & FAIRNESS ──
  {
    id: 'bias-ml-pipeline',
    title: 'Bias Injection Points in ML Pipeline',
    description: 'Bias enters at EVERY stage: Collection (selection bias), Labeling (measurement bias), Feature Engineering (representation bias), Training (algorithmic bias), Evaluation (evaluation bias), Deployment (deployment bias).',
    category: 'bias-fairness',
    domain: 'D3',
    imageUrl: 'https://www.nature.com/articles/s42256-021-00373-4/figures/2',
    sourceUrl: 'https://www.nature.com/articles/s42256-021-00373-4',
    sourceName: 'Nature Machine Intelligence',
    tags: ['Bias', 'ML Pipeline', 'Fairness', 'Selection Bias', 'Measurement Bias'],
    highYield: true,
    examTip: 'Bias is NOT just a data problem — it can be introduced at ANY pipeline stage. Know all 6 injection points.',
  },
  {
    id: 'fairness-metrics',
    title: 'Fairness Metrics Comparison',
    description: 'Demographic Parity: equal positive rates across groups. Equal Opportunity: equal TPR. Equalized Odds: equal TPR & FPR. Individual Fairness: similar individuals get similar outcomes. IMPOSSIBLE to satisfy all simultaneously.',
    category: 'bias-fairness',
    domain: 'D3',
    imageUrl: 'https://pair.withgoogle.com/explorables/images/measuring-fairness/social.png',
    sourceUrl: 'https://pair.withgoogle.com/explorables/measuring-fairness/',
    sourceName: 'Google PAIR',
    tags: ['Fairness', 'Metrics', 'Demographic Parity', 'Equal Opportunity'],
    highYield: true,
    examTip: 'Impossibility theorem: you CANNOT satisfy all fairness metrics simultaneously. Know which to prioritize for different contexts.',
  },

  // ── METRICS ──
  {
    id: 'confusion-matrix',
    title: 'Confusion Matrix — TP, TN, FP, FN',
    description: 'The foundation of all classification metrics. TP (correctly predicted positive), TN (correctly predicted negative), FP (false alarm), FN (missed detection). All other metrics derive from these 4 values.',
    category: 'metrics',
    domain: 'D3',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Precisionrecall.svg/700px-Precisionrecall.svg.png',
    sourceUrl: 'https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall',
    sourceName: 'Google ML Crash Course',
    tags: ['Confusion Matrix', 'TP', 'FP', 'TN', 'FN', 'Classification'],
    highYield: true,
    examTip: 'High-stakes AI: Minimize FN (missed fraud, missed disease). Use RECALL. Low tolerance for false alarms: Use PRECISION.',
  },
  {
    id: 'precision-recall-tradeoff',
    title: 'Precision vs. Recall Tradeoff',
    description: 'Precision = TP/(TP+FP) "Of predicted positives, how many are correct?" Recall = TP/(TP+FN) "Of actual positives, how many were found?" F1 = harmonic mean. Threshold adjustment shifts the balance.',
    category: 'metrics',
    domain: 'D3',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Precisionrecall.svg/700px-Precisionrecall.svg.png',
    sourceUrl: 'https://en.wikipedia.org/wiki/Precision_and_recall',
    sourceName: 'Wikipedia',
    tags: ['Precision', 'Recall', 'F1', 'Tradeoff', 'Threshold'],
    highYield: false,
    examTip: 'Medical AI → prioritize Recall. Spam filter → prioritize Precision.',
  },

  // ── AI SECURITY ARCHITECTURE ──
  {
    id: 'zero-trust-ai',
    title: 'Zero Trust Architecture for AI',
    description: '4 trust layers: Data Trust, Model Supply Chain Trust, Pipeline Trust, Inference Trust. Never trust, always verify — applied to ML infrastructure. Microsegmentation between training/inference/storage.',
    category: 'architecture',
    domain: 'D3',
    imageUrl: 'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/images/machine-learning-operations-v2-architecture.png',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/machine-learning-operations-v2',
    sourceName: 'Microsoft Learn',
    tags: ['Zero Trust', 'AI Security', 'Architecture', 'Microsegmentation'],
    highYield: true,
    examTip: 'Zero Trust for AI: Each ML component (data, model, pipeline, inference) needs its own trust boundary.',
  },
  {
    id: 'ai-supply-chain',
    title: 'AI/ML Supply Chain Risks',
    description: 'Pre-trained models, third-party datasets, open-source libraries, model marketplaces — each introduces risk. AI BOM (Bill of Materials) tracks all components. SBOM + MBOM + DBOM = full traceability.',
    category: 'architecture',
    domain: 'D2',
    imageUrl: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/images/GOV_LLM_AI_Security_Overview_v3.png',
    sourceUrl: 'https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/',
    sourceName: 'OWASP',
    tags: ['Supply Chain', 'SBOM', 'AI BOM', 'Third-party Risk', 'Model Provenance'],
    highYield: true,
    examTip: 'AI BOM = SBOM (Software) + MBOM (Model) + DBOM (Data). Full supply chain transparency.',
  },

  // ── GOVERNANCE ──
  {
    id: 'ai-impact-assessment',
    title: 'AI Impact Assessment Framework',
    description: 'Systematic evaluation of AI systems\' potential effects: Rights impact, Safety impact, Ethical impact, Environmental impact. Required before deploying high-risk AI under EU AI Act.',
    category: 'governance',
    domain: 'D1',
    imageUrl: 'https://www.nist.gov/sites/default/files/styles/960_x_960_limit/public/images/2023/01/26/AI%20RMF.png',
    sourceUrl: 'https://airc.nist.gov/airmf-resources/airmf/',
    sourceName: 'NIST AIRC',
    tags: ['Impact Assessment', 'AIA', 'Risk Assessment', 'EU AI Act', 'Governance'],
    highYield: true,
    examTip: 'AI Impact Assessment is REQUIRED for high-risk AI under EU AI Act. It\'s PROACTIVE, not reactive.',
  },
];

// =========================================================================
// REFERENCE LINKS — GitHub repos, tools, official docs, cheat sheets
// =========================================================================

export const REFERENCE_LINKS: ReferenceLink[] = [
  // ── Official Frameworks & Standards ──
  { title: 'NIST AI RMF 1.0 (PDF)', url: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf', type: 'official', description: 'Full 72-page framework document — the gold standard for AI risk management' },
  { title: 'NIST AI RMF Playbook', url: 'https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook', type: 'official', description: 'Interactive playbook with suggested actions for each subcategory of Govern/Map/Measure/Manage' },
  { title: 'NIST Adversarial ML Taxonomy (AI 100-2)', url: 'https://csrc.nist.gov/pubs/ai/100/2/e2023/final', type: 'official', description: 'Classification of adversarial attacks: evasion, poisoning, privacy attacks' },
  { title: 'ISO/IEC 42001 Overview', url: 'https://www.iso.org/standard/81230.html', type: 'official', description: 'The world\'s first certifiable AI management system standard' },
  { title: 'EU AI Act Full Text', url: 'https://artificialintelligenceact.eu/', type: 'official', description: 'Complete EU AI Act with summaries and implementation timeline' },
  { title: 'OECD AI Principles', url: 'https://oecd.ai/en/ai-principles', type: 'official', description: 'First intergovernmental AI standard — adopted by 46+ countries' },
  { title: 'ISACA AAISM Exam Content Outline', url: 'https://isaca.org/credentialing/aaism/aaism-exam-content-outline', type: 'official', description: 'Official 3-domain structure with all supporting tasks — THE exam blueprint' },
  { title: 'ISACA Free AAISM Practice Quiz', url: 'https://isaca.org/credentialing/aaism/practice-quiz', type: 'official', description: 'Free official practice questions from ISACA' },

  // ── GitHub Repositories ──
  { title: 'Azure AI Security Risk Assessment', url: 'https://github.com/Azure/AI-Security-Risk-Assessment', type: 'github', description: 'Microsoft\'s AI risk assessment framework and templates', stars: '★ Popular' },
  { title: 'Azure Security & Responsible AI Guide', url: 'https://github.com/Azure/Security-and-Responsible-AI-Guide', type: 'github', description: 'Centralized guide for secure AI on Azure — design, development, deployment' },
  { title: 'MITRE ATLAS GitHub', url: 'https://github.com/mitre-atlas', type: 'github', description: 'Adversarial Threat Landscape for AI Systems — tools, navigator, case studies' },
  { title: 'OWASP Top 10 for LLM', url: 'https://github.com/OWASP/www-project-top-10-for-large-language-model-applications', type: 'github', description: 'Official OWASP repository with the full LLM Top 10 guide' },
  { title: 'Adversarial Robustness Toolbox (ART)', url: 'https://github.com/Trusted-AI/adversarial-robustness-toolbox', type: 'github', description: 'IBM\'s Python library for ML security — defense against adversarial attacks', stars: '★ 4.8k+' },
  { title: 'AI Fairness 360 (AIF360)', url: 'https://github.com/Trusted-AI/AIF360', type: 'github', description: 'IBM\'s open-source toolkit for detecting and mitigating bias in ML models', stars: '★ 2.4k+' },
  { title: 'AI Explainability 360 (AIX360)', url: 'https://github.com/Trusted-AI/AIX360', type: 'github', description: 'IBM\'s toolkit for interpretability and explainability of ML models', stars: '★ 1.5k+' },
  { title: 'Evidently AI (Monitoring)', url: 'https://github.com/evidentlyai/evidently', type: 'github', description: 'ML monitoring for data drift, model performance, and data quality', stars: '★ 5k+' },
  { title: 'Microsoft Responsible AI Toolbox', url: 'https://github.com/microsoft/responsible-ai-toolbox', type: 'github', description: 'Suite of tools for responsible AI: Error Analysis, Fairness, Interpretability', stars: '★ 1.3k+' },
  { title: 'Google Model Card Toolkit', url: 'https://github.com/tensorflow/model-card-toolkit', type: 'github', description: 'Generate Model Cards for ML transparency and documentation' },
  { title: 'NVIDIA NeMo Guardrails', url: 'https://github.com/NVIDIA/NeMo-Guardrails', type: 'github', description: 'Add programmable guardrails to LLM-based conversational systems', stars: '★ 4k+' },
  { title: 'LangChain', url: 'https://github.com/langchain-ai/langchain', type: 'github', description: 'Framework for developing LLM-powered applications — relevant for understanding LLM supply chain', stars: '★ 95k+' },
  { title: 'CoSAI AI Risk Governance', url: 'https://github.com/cosai-oasis/ws3-ai-risk-governance', type: 'github', description: 'OASIS Coalition for Secure AI — risk governance working documents' },

  // ── Tools & Interactive Resources ──
  { title: 'NIST AI RMF ↔ ISO 42001 Crosswalk Tool', url: 'https://compliance.airiskassess.com/', type: 'tool', description: 'Interactive mapping between NIST AI RMF and ISO 42001 clauses' },
  { title: 'ATLAS Navigator', url: 'https://atlas.mitre.org/navigator', type: 'tool', description: 'Interactive threat matrix navigator — explore AI attack techniques' },
  { title: 'Google PAIR: Measuring Fairness', url: 'https://pair.withgoogle.com/explorables/measuring-fairness/', type: 'tool', description: 'Interactive visualization of different fairness metrics and tradeoffs' },
  { title: 'Google PAIR: Federated Learning', url: 'https://pair.withgoogle.com/explorables/federated-learning/', type: 'tool', description: 'Interactive explainer on how federated learning protects privacy' },
  { title: 'What-If Tool (Google)', url: 'https://pair-code.github.io/what-if-tool/', type: 'tool', description: 'Visual tool for inspecting ML model performance and fairness' },
  { title: 'Know Your Data (Google)', url: 'https://knowyourdata.withgoogle.com/', type: 'tool', description: 'Explore and understand datasets for bias and representation issues' },
  { title: 'F5 OWASP LLM Infographic', url: 'https://www.f5.com/resources/infographic/owasp-llm-top10', type: 'cheatsheet', description: 'Beautiful visual mapping of OWASP LLM Top 10 with mitigations' },

  // ── Academic & Research Papers ──
  { title: 'NIST AI 100-2: Adversarial ML Taxonomy', url: 'https://csrc.nist.gov/pubs/ai/100/2/e2023/final', type: 'paper', description: 'Taxonomy of adversarial attacks and mitigations (NIST official)' },
  { title: 'Adversarial ML: Systematic Survey (2024)', url: 'https://adversarial-ml.github.io/', type: 'paper', description: 'Comprehensive lifecycle-based survey with open-source benchmarks' },
  { title: 'Zero Trust for AI Systems (2025)', url: 'https://www.preprints.org/manuscript/202602.0085', type: 'paper', description: 'Reference architecture and assurance framework for zero-trust AI' },

  // ── Video Resources ──
  { title: 'AAISM YouTube Playlist (Pete Zerger)', url: 'https://www.youtube.com/watch?v=yAF6n9MzdM4&list=PLIxmyWoEAwwPLaKTSy5vaH849BjzI2o88', type: 'video', description: 'Comprehensive AAISM exam prep video series covering all domains' },
  { title: 'OWASP GenAI Learning Videos', url: 'https://genai.owasp.org/learning/', type: 'video', description: 'Official OWASP video resources on LLM security' },
  { title: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'video', description: 'Free ML fundamentals course — great for D3 technical concepts' },
];

// =========================================================================
// VISUAL CONCEPT MAPS — Text-based diagrams for quick reference
// =========================================================================

export interface ConceptMap {
  id: string;
  title: string;
  category: VisualCategory;
  domain: 'D1' | 'D2' | 'D3' | 'ALL';
  diagram: string;
  keyPoints: string[];
  examRelevance: 'critical' | 'high' | 'medium';
}

export const CONCEPT_MAPS: ConceptMap[] = [
  {
    id: 'nist-rmf-flow',
    title: 'NIST AI RMF Function Flow',
    category: 'frameworks',
    domain: 'ALL',
    diagram: `
┌─────────────────────────────────────────┐
│              G O V E R N                │
│   (Cross-cutting: Policies, Culture,    │
│    Roles, Oversight, Risk Tolerance)    │
├──────────┬──────────┬───────────────────┤
│          │          │                   │
│   MAP    │ MEASURE  │    MANAGE         │
│          │          │                   │
│ Context  │ Quantify │ Prioritize &      │
│ Identify │ Analyze  │ Treat Risks       │
│ Document │ Track    │ Monitor Response  │
│          │          │                   │
│  "What   │  "How    │   "What do        │
│  risks?" │  bad?"   │   we do?"         │
│          │          │                   │
└──────────┴──────────┴───────────────────┘
         ↻ Continuous Cycle ↻`,
    keyPoints: [
      'GOVERN spans ALL other functions (cross-cutting)',
      '7 Trustworthiness: Valid, Safe, Secure, Accountable, Transparent, Explainable, Fair',
      'MAP comes BEFORE Measure — you must identify risks before assessing them',
      'Voluntary framework — not a regulation',
    ],
    examRelevance: 'critical',
  },
  {
    id: 'eu-ai-risk-tiers',
    title: 'EU AI Act Risk Tiers',
    category: 'frameworks',
    domain: 'D1',
    diagram: `
         ╱╲
        ╱  ╲        🚫 UNACCEPTABLE
       ╱ ✕✕ ╲       Social Scoring, Subliminal
      ╱──────╲      Manipulation, Predictive Policing
     ╱        ╲
    ╱  HIGH    ╲     ⚠️ HIGH RISK
   ╱   RISK    ╲    Biometrics, Hiring, Credit,
  ╱─────────────╲   Critical Infrastructure, Education
 ╱               ╲
╱   LIMITED       ╲  📋 LIMITED RISK
╱   RISK           ╲ Chatbots, Deepfakes → Transparency
╱───────────────────╲
╱                     ╲
╱   MINIMAL RISK       ╲ ✅ MINIMAL
╱   (Most AI today)     ╲ Spam Filters, Games → No Rules
╱─────────────────────────╲`,
    keyPoints: [
      'UNACCEPTABLE: Banned entirely (social scoring, manipulative subliminal)',
      'HIGH: Strict requirements — conformity assessment, CE marking',
      'LIMITED: Transparency obligations (disclose AI use)',
      'MINIMAL: Self-regulation only',
      'Timeline: Entered force Aug 2024, prohibitions Feb 2025, High-risk Aug 2026',
    ],
    examRelevance: 'critical',
  },
  {
    id: 'mitre-atlas-tactics',
    title: 'MITRE ATLAS Tactics Chain',
    category: 'attacks',
    domain: 'D2',
    diagram: `
MITRE ATLAS: 12 Tactics for AI Attacks

  Recon → Resource Dev → Initial Access → ML Model Access
    ↓
  Execution → Persistence → Defense Evasion → Discovery
    ↓
  Collection → ML Attack Staging → Exfiltration → Impact

AI-SPECIFIC tactics (not in standard ATT&CK):
  ┌──────────────────┐  ┌────────────────────┐
  │ ML MODEL ACCESS  │  │ ML ATTACK STAGING  │
  │ • API access     │  │ • Craft adversarial│
  │ • Physical access│  │   examples         │
  │ • Model reuse    │  │ • Poison data      │
  └──────────────────┘  │ • Backdoor attacks │
                        └────────────────────┘`,
    keyPoints: [
      'ATLAS = ATT&CK extended for AI — same structure, AI-specific tactics',
      'ML Model Access & ML Attack Staging are unique to ATLAS',
      'Covers: Poisoning, Evasion, Extraction, Inversion, Backdoors',
      'Built by MITRE + Microsoft + 12 organizations',
    ],
    examRelevance: 'critical',
  },
  {
    id: 'attack-surface-lifecycle',
    title: 'AI Attack Surface by Lifecycle Phase',
    category: 'attacks',
    domain: 'D2',
    diagram: `
┌─────────────┬───────────────┬───────────────┬─────────────┐
│  DATA       │  TRAINING     │  DEPLOYMENT   │  INFERENCE  │
├─────────────┼───────────────┼───────────────┼─────────────┤
│ • Poisoning │ • Backdoor    │ • Model theft │ • Evasion   │
│ • Label     │   insertion   │ • API abuse   │ • Adversar- │
│   flipping  │ • Weight      │ • Supply      │   ial input │
│ • Data      │   manipulation│   chain       │ • Prompt    │
│   exfilt.   │ • Training    │ • Config      │   injection │
│             │   hijacking   │   exploit     │ • Inversion │
├─────────────┼───────────────┼───────────────┼─────────────┤
│ DEFENSE:    │ DEFENSE:      │ DEFENSE:      │ DEFENSE:    │
│ Validation, │ Robust train, │ Access ctrl,  │ Input valid,│
│ Provenance  │ Differential  │ Monitoring,   │ Rate limit, │
│             │ Privacy       │ Encryption    │ Guardrails  │
└─────────────┴───────────────┴───────────────┴─────────────┘`,
    keyPoints: [
      'Every lifecycle phase has unique attack vectors AND defenses',
      'Poisoning = data phase, Backdoors = training phase, Evasion = inference phase',
      'Defense must be multi-layered (defense in depth)',
      'Supply chain attacks span multiple phases',
    ],
    examRelevance: 'critical',
  },
  {
    id: 'pet-comparison',
    title: 'Privacy-Enhancing Technologies (PETs)',
    category: 'privacy',
    domain: 'D3',
    diagram: `
┌─────────────────────────────────────────────────────────────┐
│            Privacy-Enhancing Technologies (PETs)            │
├────────────────┬────────────────┬────────────────┬──────────┤
│ FEDERATED      │ DIFFERENTIAL   │ HOMOMORPHIC    │ SECURE   │
│ LEARNING       │ PRIVACY        │ ENCRYPTION     │ MULTI-   │
│                │                │                │ PARTY    │
│ Data stays     │ Add noise to   │ Compute on     │ Joint    │
│ on device      │ outputs        │ encrypted data │ compute  │
│                │                │                │ w/o      │
│ Only model     │ ε controls     │ FHE = any      │ sharing  │
│ updates sent   │ privacy level  │ operation      │ inputs   │
│                │                │                │          │
│ PROTECTS:      │ PROTECTS:      │ PROTECTS:      │ PROTECTS:│
│ Data locality  │ Individual     │ Data in use    │ Multi-   │
│                │ privacy        │                │ party    │
│                │                │                │ privacy  │
│ COST:          │ COST:          │ COST:          │ COST:    │
│ Communication  │ Accuracy loss  │ Compute cost   │ Latency  │
│ overhead       │ (utility)      │ (100-10000x)   │          │
└────────────────┴────────────────┴────────────────┴──────────┘`,
    keyPoints: [
      'Federated Learning: data locality. Differential Privacy: individual protection.',
      'Homomorphic Encryption: data-in-use protection. MPC: multi-party computation.',
      'Each PET has a different cost/tradeoff — know which to recommend when.',
      'Combining PETs (FL + DP + HE) provides strongest protection.',
    ],
    examRelevance: 'high',
  },
  {
    id: 'deployment-comparison',
    title: 'Model Deployment Strategy Matrix',
    category: 'deployment',
    domain: 'D3',
    diagram: `
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Strategy    │ Risk     │ Cost     │ Rollback │ Best For │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ BLUE-GREEN  │ Medium   │ HIGH     │ INSTANT  │ Fast     │
│             │          │ (2x env) │          │ switch   │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ CANARY      │ LOW      │ Low      │ Fast     │ Gradual  │
│             │          │          │          │ rollout  │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ SHADOW      │ LOWEST   │ Medium   │ N/A      │ Testing  │
│             │ (no user │          │ (not     │ new AI   │
│             │ impact)  │          │ serving) │ models   │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ A/B TEST    │ Medium   │ Low      │ Fast     │ Compare  │
│             │          │          │          │ versions │
└─────────────┴──────────┴──────────┴──────────┴──────────┘`,
    keyPoints: [
      'Shadow = safest for critical/high-risk AI (zero user impact)',
      'Blue-Green = fastest rollback but most expensive (2x infrastructure)',
      'Canary = best balance of risk and cost for production ML',
      'A/B = for statistical validation of model improvements',
    ],
    examRelevance: 'high',
  },
  {
    id: 'explainability-spectrum',
    title: 'Explainability Methods Spectrum',
    category: 'explainability',
    domain: 'D3',
    diagram: `
  ← More Interpretable ─────────── Less Interpretable →

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ LINEAR   │  │ DECISION │  │ RANDOM   │  │ DEEP     │
  │ MODELS   │  │ TREES    │  │ FOREST   │  │ NEURAL   │
  │          │  │          │  │          │  │ NETWORKS │
  │ White-box│  │ White-box│  │ Gray-box │  │ Black-box│
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

  Post-hoc Explainability Methods:
  ┌─────────────────────────────────────────────────────┐
  │ LIME         │ Local only  │ Perturbation │ Fast   │
  │ SHAP         │ Local+Global│ Game Theory  │ Costly │
  │ Grad-CAM     │ Local only  │ Gradient     │ CNN    │
  │ Counterfact. │ Local only  │ "What if?"   │ Intuit.│
  │ Attention    │ Both        │ Built-in     │ NLP    │
  └─────────────────────────────────────────────────────┘`,
    keyPoints: [
      'Intrinsic interpretability (white-box) vs post-hoc explanation (black-box)',
      'LIME: fast, local, unstable. SHAP: rigorous, both scopes, expensive.',
      'Grad-CAM: specific to CNNs (computer vision). Attention: specific to transformers.',
      'Regulatory trend: more explainability required for high-risk AI.',
    ],
    examRelevance: 'high',
  },
  {
    id: 'isaca-answer-hierarchy',
    title: 'ISACA Answer Hierarchy (Exam Strategy)',
    category: 'governance',
    domain: 'ALL',
    diagram: `
  ISACA Exam Answer Priority (When in doubt):

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  1. GOVERNANCE > MANAGEMENT > TECHNICAL             │
  │     (Policy first, then process, then tools)        │
  │                                                     │
  │  2. RISK-BASED > COMPLIANCE-BASED                   │
  │     (Understand WHY, not just WHAT)                  │
  │                                                     │
  │  3. PROACTIVE > REACTIVE                            │
  │     (Prevent > Detect > Respond)                    │
  │                                                     │
  │  4. BUSINESS CONTEXT > TECHNICAL DETAILS            │
  │     (Impact on business objectives matters most)    │
  │                                                     │
  │  5. QUALIFIER WORDS MATTER:                         │
  │     MOST = best among good options                  │
  │     FIRST = sequence matters                        │
  │     BEST = optimal approach                         │
  │     PRIMARY = main reason/purpose                   │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  When two answers seem right:
  ┌─────────────────────────────────────────────────────┐
  │  • Pick the one closer to GOVERNANCE level          │
  │  • Pick the one that's MORE PROACTIVE               │
  │  • Pick the one with BROADER business impact        │
  │  • Pick the one that addresses ROOT CAUSE           │
  └─────────────────────────────────────────────────────┘`,
    keyPoints: [
      'ISACA thinks in layers: Governance > Management > Technical',
      'Always prefer risk-based thinking over checkbox compliance',
      'Qualifier words (MOST/BEST/FIRST/PRIMARY) are critical exam signals',
      'When stuck: pick the governance/proactive/business-focused answer',
    ],
    examRelevance: 'critical',
  },
];
