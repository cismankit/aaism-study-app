// Expanded AAISM Question Bank - ISACA-Style Scenario Questions
// Focus: "MOST/BEST/FIRST/PRIMARY" qualifiers, business perspective, governance-first thinking
// Aligned to the CORRECT 3-domain structure (31%/31%/38%)

import { ExamQuestion } from './examContent';

export const SCENARIO_QUESTIONS: ExamQuestion[] = [
  // =====================================================
  // DOMAIN 1: AI GOVERNANCE & PROGRAM MANAGEMENT (31%)
  // =====================================================

  // --- Stakeholder Considerations & Frameworks ---
  {
    id: "sq1.01", domain: 1,
    question: "An organization is deploying its first AI system. What should the AI Security Manager recommend as the FIRST step?",
    options: [
      "Implement AI security monitoring tools",
      "Collaborate with stakeholders to establish an AI governance charter aligned with business objectives",
      "Conduct a technical vulnerability assessment of the AI platform",
      "Purchase an AI risk management software solution"
    ],
    correctAnswer: 1,
    explanation: "ISACA always prioritizes governance before technical implementation. A governance charter establishes the foundation — roles, authority, scope — before any tools or assessments.",
    difficulty: "medium", topic: "Governance Charter"
  },
  {
    id: "sq1.02", domain: 1,
    question: "The board of directors asks the AI Security Manager to justify the AI governance program budget. What is the MOST effective approach?",
    options: [
      "Present a technical demonstration of AI security tools",
      "Show alignment between AI governance investments and enterprise risk reduction objectives",
      "Compare spending with industry peers",
      "Provide a list of AI incidents at other organizations"
    ],
    correctAnswer: 1,
    explanation: "Board-level communication must connect to business value and risk reduction. Technical demos are too operational, peer comparisons and incident lists are supplementary evidence.",
    difficulty: "hard", topic: "Stakeholder Management"
  },
  {
    id: "sq1.03", domain: 1,
    question: "Which international standard provides a CERTIFIABLE framework for establishing an AI Management System?",
    options: [
      "NIST AI RMF 1.0",
      "ISO/IEC 42001:2023",
      "OECD AI Principles",
      "EU AI Act"
    ],
    correctAnswer: 1,
    explanation: "ISO/IEC 42001 is the world's first certifiable AI management system standard (AIMS). NIST AI RMF is voluntary guidance, OECD provides principles, and the EU AI Act is regulation.",
    difficulty: "easy", topic: "Standards & Frameworks"
  },
  {
    id: "sq1.04", domain: 1,
    question: "An organization operates in both the EU and the US. When developing an AI governance framework, what should be the PRIMARY consideration?",
    options: [
      "Adopting only EU AI Act requirements since they are stricter",
      "Applying a risk-based approach that addresses the most stringent requirements across all applicable jurisdictions",
      "Following NIST AI RMF exclusively since it is more flexible",
      "Waiting until all regulations are finalized before acting"
    ],
    correctAnswer: 1,
    explanation: "Multi-jurisdictional organizations should take a risk-based approach meeting the strictest requirements. This ensures compliance everywhere while being proportionate.",
    difficulty: "hard", topic: "Regulatory Compliance"
  },
  {
    id: "sq1.05", domain: 1,
    question: "The NIST AI Risk Management Framework's GOVERN function is described as 'cross-cutting.' This PRIMARILY means:",
    options: [
      "It only applies to government organizations",
      "It informs and is informed by the other three functions (Map, Measure, Manage)",
      "It should be implemented last after the other functions",
      "It requires separate governance for each AI system"
    ],
    correctAnswer: 1,
    explanation: "GOVERN is cross-cutting because it establishes the culture, policies, and processes that enable Map, Measure, and Manage to function effectively. It connects to all other functions.",
    difficulty: "medium", topic: "NIST AI RMF"
  },

  // --- AI Policies & Procedures ---
  {
    id: "sq1.06", domain: 1,
    question: "An employee uses a public ChatGPT-like tool to analyze confidential customer data. The MOST important action is to:",
    options: [
      "Immediately block all AI tools company-wide",
      "Terminate the employee",
      "Assess the data exposure, enforce the AI acceptable use policy, and implement technical controls",
      "Report the incident to regulators"
    ],
    correctAnswer: 2,
    explanation: "A measured response includes incident assessment, policy enforcement, and preventive controls. Blocking all tools is excessive, termination without policy is premature, and regulatory notification may not be required.",
    difficulty: "medium", topic: "AI Acceptable Use"
  },
  {
    id: "sq1.07", domain: 1,
    question: "When developing AI security awareness training, which group should receive SPECIALIZED training FIRST?",
    options: [
      "All employees simultaneously",
      "External contractors and vendors",
      "Data scientists and AI developers who build AI systems",
      "The marketing department"
    ],
    correctAnswer: 2,
    explanation: "Data scientists and AI developers interact directly with AI systems and make decisions affecting security. They need specialized training first, followed by role-appropriate training for others.",
    difficulty: "medium", topic: "Security Awareness"
  },
  {
    id: "sq1.08", domain: 1,
    question: "What is the PRIMARY difference between an AI policy and an AI standard?",
    options: [
      "Policies are mandatory; standards are optional",
      "Policies state what must be done (intent); standards specify how it must be done (requirements)",
      "Standards are created by external bodies; policies are internal",
      "Policies apply to vendors; standards apply to employees"
    ],
    correctAnswer: 1,
    explanation: "Policies express management intent and direction (what), while standards provide specific mandatory requirements (how). Both are mandatory, but they serve different levels of guidance.",
    difficulty: "easy", topic: "Policy vs Standard"
  },

  // --- Data Lifecycle & Asset Management ---
  {
    id: "sq1.09", domain: 1,
    question: "An organization has no inventory of its AI systems. What is the GREATEST risk this creates?",
    options: [
      "Increased hardware costs",
      "Inability to assess and manage AI-specific security risks across the enterprise",
      "Slower AI model development",
      "Reduced model accuracy"
    ],
    correctAnswer: 1,
    explanation: "Without an AI asset inventory, the organization cannot identify, classify, and manage risks. You can't protect what you don't know exists. This is the foundational risk.",
    difficulty: "medium", topic: "AI Asset Management"
  },
  {
    id: "sq1.10", domain: 1,
    question: "A model card should PRIMARILY contain:",
    options: [
      "The model's source code and training scripts",
      "Model purpose, performance metrics, intended use, limitations, and ethical considerations",
      "The vendor's financial statements",
      "User interface design specifications"
    ],
    correctAnswer: 1,
    explanation: "Model cards document a model's intended use, performance, limitations, and ethical considerations for transparency. Source code belongs in repositories, not model cards.",
    difficulty: "easy", topic: "Documentation"
  },

  // --- Incident Response & BCM ---
  {
    id: "sq1.11", domain: 1,
    question: "An AI system used for medical diagnosis begins giving incorrect recommendations. What is the FIRST action?",
    options: [
      "Retrain the model with updated data",
      "Contain the incident by switching to human-only diagnosis and disabling the AI system",
      "Investigate the root cause of the errors",
      "Notify the media about the malfunction"
    ],
    correctAnswer: 1,
    explanation: "For safety-critical AI systems, containment is ALWAYS first — prevent further harm. In healthcare, this means reverting to human processes. Investigation and retraining follow containment.",
    difficulty: "medium", topic: "AI Incident Response"
  },
  {
    id: "sq1.12", domain: 1,
    question: "AI-specific business continuity planning should PRIMARILY address:",
    options: [
      "How to develop AI models faster",
      "Procedures for maintaining business operations when AI systems fail, including human fallback processes",
      "How to reduce AI infrastructure costs",
      "Marketing strategies for AI products"
    ],
    correctAnswer: 1,
    explanation: "AI BCP ensures business continuity when AI fails, including human fallback procedures, model rollback, and alternative processing methods.",
    difficulty: "easy", topic: "Business Continuity"
  },

  // =====================================================
  // DOMAIN 2: AI RISK MANAGEMENT (31%)
  // =====================================================

  // --- Risk Assessment & Treatment ---
  {
    id: "sq2.01", domain: 2,
    question: "An AI risk assessment reveals that a customer-facing chatbot could expose PII. The risk score exceeds the organization's risk appetite. What is the BEST course of action?",
    options: [
      "Accept the risk since chatbots are low-impact",
      "Implement data loss prevention controls and output filtering to reduce risk to an acceptable level",
      "Discontinue the chatbot entirely",
      "Transfer the risk by purchasing cyber insurance"
    ],
    correctAnswer: 1,
    explanation: "Risk treatment through specific controls (DLP, output filtering) addresses the identified risk proportionately. Acceptance violates risk appetite, full discontinuation is excessive, insurance alone doesn't reduce the risk.",
    difficulty: "medium", topic: "Risk Treatment"
  },
  {
    id: "sq2.02", domain: 2,
    question: "Who should PRIMARILY be responsible for defining the organization's AI risk appetite?",
    options: [
      "The AI development team",
      "The IT security department",
      "The Board of Directors or Executive Management",
      "External auditors"
    ],
    correctAnswer: 2,
    explanation: "Risk appetite is a strategic decision that belongs to the Board/Executive Management. Technical teams implement controls within the defined appetite but do not set it.",
    difficulty: "easy", topic: "Risk Governance"
  },
  {
    id: "sq2.03", domain: 2,
    question: "During an AI risk assessment, the team identifies that the training data contains biases that could cause discriminatory outcomes. This risk is BEST categorized as:",
    options: [
      "A technical risk only",
      "An ethical and compliance risk with potential legal, reputational, and financial impacts",
      "An operational risk only",
      "A vendor management risk"
    ],
    correctAnswer: 1,
    explanation: "AI bias is multi-dimensional — it's ethical (fairness), legal (discrimination laws), reputational (public trust), and financial (lawsuits). Treating it as purely technical misses the broader impact.",
    difficulty: "medium", topic: "Risk Classification"
  },
  {
    id: "sq2.04", domain: 2,
    question: "An AI model shows degrading performance over time but no security incidents are detected. The MOST likely cause is:",
    options: [
      "An active adversarial attack",
      "Data drift — the real-world data distribution has shifted from training data",
      "A configuration error in the server",
      "Model theft by a competitor"
    ],
    correctAnswer: 1,
    explanation: "Gradual performance degradation without security indicators typically indicates data drift. Adversarial attacks are deliberate, config errors cause sudden changes, model theft doesn't affect performance.",
    difficulty: "medium", topic: "Data Drift"
  },
  {
    id: "sq2.05", domain: 2,
    question: "An attacker queries an AI model API thousands of times with carefully crafted inputs to recreate a copy of the model. This attack is called:",
    options: [
      "Adversarial example attack",
      "Model extraction (model stealing) attack",
      "Data poisoning",
      "Prompt injection"
    ],
    correctAnswer: 1,
    explanation: "Model extraction involves systematically querying a model to learn its decision boundaries and replicate it. Rate limiting and query monitoring are primary defenses.",
    difficulty: "easy", topic: "Model Extraction"
  },

  // --- Threat & Vulnerability Management ---
  {
    id: "sq2.06", domain: 2,
    question: "Which is the MOST effective defense against indirect prompt injection in an LLM-powered application?",
    options: [
      "Using a larger language model",
      "Implementing input/output validation, sandboxing external data, and separating instruction from data channels",
      "Encrypting all API communications",
      "Adding more training data"
    ],
    correctAnswer: 1,
    explanation: "Indirect prompt injection requires multi-layered defense: input validation, output filtering, sandboxing external data retrieval, and architectural separation of instructions from user data.",
    difficulty: "hard", topic: "Prompt Injection Defense"
  },
  {
    id: "sq2.07", domain: 2,
    question: "A security team discovers that a pre-trained open-source AI model they downloaded contains a backdoor. This is an example of:",
    options: [
      "Adversarial robustness failure",
      "AI supply chain vulnerability",
      "Feature drift",
      "Overfitting"
    ],
    correctAnswer: 1,
    explanation: "Compromised pre-trained models from external sources are a supply chain attack. This highlights the need for model provenance verification, integrity checks, and SBOM for AI components.",
    difficulty: "medium", topic: "Supply Chain Risk"
  },
  {
    id: "sq2.08", domain: 2,
    question: "The MITRE ATLAS framework is BEST described as:",
    options: [
      "A general cybersecurity attack framework",
      "A knowledge base of adversarial tactics, techniques, and procedures specific to AI/ML systems",
      "An AI governance standard",
      "A data privacy regulation"
    ],
    correctAnswer: 1,
    explanation: "MITRE ATLAS (Adversarial Threat Landscape for AI Systems) specifically catalogs AI/ML attack tactics and techniques, modeled after the ATT&CK framework for general cyber threats.",
    difficulty: "easy", topic: "MITRE ATLAS"
  },
  {
    id: "sq2.09", domain: 2,
    question: "A membership inference attack against an AI model would PRIMARILY threaten:",
    options: [
      "Model availability",
      "Data privacy — determining whether specific data was used in training",
      "Model accuracy",
      "System performance"
    ],
    correctAnswer: 1,
    explanation: "Membership inference determines if specific data points were in the training set, threatening privacy. It can reveal sensitive information about individuals in the training data.",
    difficulty: "hard", topic: "Privacy Attacks"
  },
  {
    id: "sq2.10", domain: 2,
    question: "Red teaming of AI systems PRIMARILY involves:",
    options: [
      "Testing the AI system's user interface",
      "Simulating adversarial attacks to identify vulnerabilities, failure modes, and safety issues before deployment",
      "Reviewing the AI system's documentation",
      "Training the AI model on red-colored data"
    ],
    correctAnswer: 1,
    explanation: "AI red teaming simulates real-world attacks and adversarial scenarios to find vulnerabilities and failure modes. It tests safety, security, and alignment before production deployment.",
    difficulty: "easy", topic: "Red Teaming"
  },

  // --- Vendor & Supply Chain ---
  {
    id: "sq2.11", domain: 2,
    question: "When evaluating an AI vendor's solution, which document provides the MOST relevant information about the model's intended use and limitations?",
    options: [
      "The vendor's annual financial report",
      "The model card or AI system documentation",
      "The vendor's marketing brochure",
      "The software license agreement"
    ],
    correctAnswer: 1,
    explanation: "Model cards document a model's purpose, training data, performance metrics, intended use cases, and known limitations — essential for vendor AI risk assessment.",
    difficulty: "easy", topic: "Vendor Assessment"
  },
  {
    id: "sq2.12", domain: 2,
    question: "An AI vendor refuses to provide details about their model's training data or methodology. What should the AI Security Manager recommend?",
    options: [
      "Accept the vendor since their product performs well in testing",
      "Escalate the risk, document the opacity as a risk factor, and consider contractual requirements for transparency",
      "Immediately terminate the vendor relationship",
      "Ask the IT department to reverse-engineer the model"
    ],
    correctAnswer: 1,
    explanation: "Vendor opacity is a significant risk that should be documented, escalated, and addressed through contractual requirements. Good performance alone doesn't mitigate governance risks.",
    difficulty: "hard", topic: "Vendor Risk"
  },
  {
    id: "sq2.13", domain: 2,
    question: "A Software Bill of Materials (SBOM) for AI systems should PRIMARILY include:",
    options: [
      "Employee names who worked on the project",
      "An inventory of all components including models, libraries, datasets, and dependencies with their origins",
      "The project budget breakdown",
      "Customer satisfaction survey results"
    ],
    correctAnswer: 1,
    explanation: "An AI SBOM catalogs all components (models, libraries, data sources, dependencies) for supply chain visibility, vulnerability tracking, and compliance verification.",
    difficulty: "medium", topic: "SBOM"
  },

  // =====================================================
  // DOMAIN 3: AI TECHNOLOGIES AND CONTROLS (38%)
  // =====================================================

  // --- Security Architecture & Design ---
  {
    id: "sq3.01", domain: 3,
    question: "When integrating AI security architecture into enterprise architecture, the MOST important principle is:",
    options: [
      "Using the most advanced AI technology available",
      "Ensuring AI security controls are consistent with and complement the enterprise security framework",
      "Keeping AI security completely separate from enterprise security",
      "Minimizing the number of security controls to reduce complexity"
    ],
    correctAnswer: 1,
    explanation: "AI security architecture should integrate with and complement existing enterprise security, ensuring consistent controls, shared monitoring, and aligned risk management.",
    difficulty: "medium", topic: "Enterprise Architecture"
  },
  {
    id: "sq3.02", domain: 3,
    question: "Zero-trust principles applied to AI systems PRIMARILY require:",
    options: [
      "Trusting all internal AI systems by default",
      "Verifying every access request, enforcing least privilege, and assuming no implicit trust for any AI component",
      "Disconnecting AI systems from the network",
      "Using only on-premises AI infrastructure"
    ],
    correctAnswer: 1,
    explanation: "Zero-trust for AI means no component is trusted by default — verify every access, enforce least privilege, segment AI infrastructure, and monitor all interactions.",
    difficulty: "medium", topic: "Zero Trust for AI"
  },
  {
    id: "sq3.03", domain: 3,
    question: "An MLOps pipeline should include security gates that PRIMARILY:",
    options: [
      "Slow down the deployment process",
      "Automatically validate models against security, fairness, and performance criteria before promotion",
      "Require manual approval for every code change",
      "Encrypt all source code"
    ],
    correctAnswer: 1,
    explanation: "Security gates in MLOps automate validation of models against predefined security, bias, and performance thresholds. This enables both speed and security in the ML pipeline.",
    difficulty: "medium", topic: "MLOps Security"
  },

  // --- Data Management Controls ---
  {
    id: "sq3.04", domain: 3,
    question: "Which privacy-enhancing technology allows training an AI model across multiple organizations WITHOUT sharing raw data?",
    options: [
      "Data masking",
      "Federated learning",
      "Tokenization",
      "Database encryption"
    ],
    correctAnswer: 1,
    explanation: "Federated learning trains models on distributed datasets where data remains local. Only model updates (gradients) are shared, not raw data. This preserves data privacy across organizations.",
    difficulty: "easy", topic: "Federated Learning"
  },
  {
    id: "sq3.05", domain: 3,
    question: "Differential privacy in AI training PRIMARILY works by:",
    options: [
      "Encrypting the training data",
      "Adding calibrated mathematical noise to data or queries to prevent identification of individuals while preserving statistical patterns",
      "Deleting all personally identifiable information",
      "Limiting database access to authorized users"
    ],
    correctAnswer: 1,
    explanation: "Differential privacy adds carefully calibrated noise that prevents inference about specific individuals while maintaining aggregate statistical utility. It has a mathematical privacy guarantee (epsilon).",
    difficulty: "medium", topic: "Differential Privacy"
  },
  {
    id: "sq3.06", domain: 3,
    question: "An organization discovers PII in their AI model's training data that was not properly anonymized. The BEST remediation approach is:",
    options: [
      "Ignore it since the model is already trained",
      "Retrain the model after properly anonymizing the data, and assess whether the model memorized the PII",
      "Delete the entire AI system",
      "Add encryption to the model weights"
    ],
    correctAnswer: 1,
    explanation: "PII in training data requires retraining with properly anonymized data AND checking if the model memorized PII (via extraction testing). Ignoring it creates compliance and privacy risks.",
    difficulty: "hard", topic: "PII Remediation"
  },
  {
    id: "sq3.07", domain: 3,
    question: "Data lineage tracking for AI systems is PRIMARILY important because it:",
    options: [
      "Improves model training speed",
      "Enables traceability of data from source through transformations to model outputs for audit and compliance",
      "Reduces storage costs",
      "Simplifies the user interface"
    ],
    correctAnswer: 1,
    explanation: "Data lineage enables traceability essential for auditing, debugging, compliance, and understanding how data quality issues affect model outputs. It's a governance requirement.",
    difficulty: "medium", topic: "Data Lineage"
  },

  // --- Privacy, Ethics, Trust & Safety Controls ---
  {
    id: "sq3.08", domain: 3,
    question: "Under GDPR Article 22, when an AI system makes a fully automated decision that significantly affects an individual, the individual has the right to:",
    options: [
      "Demand the AI system be shut down",
      "Obtain meaningful information about the logic involved and request human intervention",
      "Access the AI model's source code",
      "Sue the AI system directly"
    ],
    correctAnswer: 1,
    explanation: "GDPR Article 22 gives individuals the right to not be subject to solely automated decisions with significant effects, and to obtain meaningful information about the decision logic and human review.",
    difficulty: "hard", topic: "GDPR & AI"
  },
  {
    id: "sq3.09", domain: 3,
    question: "LIME (Local Interpretable Model-agnostic Explanations) provides explainability by:",
    options: [
      "Making the entire model architecture transparent",
      "Creating simple local approximations of complex model behavior around specific predictions by perturbing inputs",
      "Using game theory to calculate feature contributions",
      "Visualizing attention weights in neural networks"
    ],
    correctAnswer: 1,
    explanation: "LIME explains individual predictions by perturbing inputs and building a simple interpretable model (e.g., linear) around the specific prediction. It's local and model-agnostic.",
    difficulty: "hard", topic: "LIME Explainability"
  },
  {
    id: "sq3.10", domain: 3,
    question: "SHAP (SHapley Additive exPlanations) is based on which mathematical concept?",
    options: [
      "Linear regression",
      "Shapley values from cooperative game theory",
      "Bayesian probability",
      "Principal component analysis"
    ],
    correctAnswer: 1,
    explanation: "SHAP uses Shapley values from game theory to fairly distribute feature contributions to predictions. It provides both local and global explanations with theoretical guarantees.",
    difficulty: "medium", topic: "SHAP Explainability"
  },
  {
    id: "sq3.11", domain: 3,
    question: "Demographic parity as a fairness metric requires that:",
    options: [
      "Model accuracy is equal across groups",
      "Positive prediction rates are equal across protected groups regardless of actual rates",
      "False positive rates are equal across groups",
      "The model treats each individual uniquely"
    ],
    correctAnswer: 1,
    explanation: "Demographic parity (statistical parity) requires equal positive prediction rates across protected groups. It can conflict with other fairness metrics like equalized odds.",
    difficulty: "hard", topic: "Fairness Metrics"
  },
  {
    id: "sq3.12", domain: 3,
    question: "Human-in-the-loop controls for AI systems are MOST important when:",
    options: [
      "The AI system is used for spam filtering",
      "The AI system makes high-stakes decisions affecting individuals' rights, safety, or livelihood",
      "The AI system runs on expensive hardware",
      "The AI system uses open-source models"
    ],
    correctAnswer: 1,
    explanation: "Human oversight is critical for high-stakes decisions (healthcare, criminal justice, employment) where AI errors can have significant consequences on human lives and rights.",
    difficulty: "easy", topic: "Human Oversight"
  },

  // --- Security Controls & Monitoring ---
  {
    id: "sq3.13", domain: 3,
    question: "To protect an AI model's intellectual property while still allowing external use, the BEST approach is:",
    options: [
      "Publishing the model weights publicly",
      "Serving the model through an API with access controls, rate limiting, and model watermarking",
      "Using only open-source models",
      "Disabling all logging"
    ],
    correctAnswer: 1,
    explanation: "API-based serving with access controls protects the model from extraction, rate limiting prevents abuse, and watermarking enables detection if the model is stolen.",
    difficulty: "medium", topic: "Model IP Protection"
  },
  {
    id: "sq3.14", domain: 3,
    question: "The Kolmogorov-Smirnov (KS) test is used in AI monitoring PRIMARILY to:",
    options: [
      "Measure model accuracy",
      "Detect distribution shifts (data drift) by comparing two data distributions",
      "Test network latency",
      "Validate user credentials"
    ],
    correctAnswer: 1,
    explanation: "The KS test is a non-parametric statistical test that measures the maximum distance between two cumulative distribution functions — widely used for data drift detection.",
    difficulty: "hard", topic: "Drift Detection"
  },
  {
    id: "sq3.15", domain: 3,
    question: "The difference between data drift and concept drift is:",
    options: [
      "They are the same thing",
      "Data drift is when input distributions change; concept drift is when the input-output relationship changes",
      "Data drift is faster than concept drift",
      "Concept drift only affects classification models"
    ],
    correctAnswer: 1,
    explanation: "Data drift (covariate shift) = input data distributions change. Concept drift = the underlying relationship between inputs and outputs changes. Both degrade model performance but require different responses.",
    difficulty: "medium", topic: "Drift Types"
  },
  {
    id: "sq3.16", domain: 3,
    question: "A shadow deployment for a new AI model PRIMARILY means:",
    options: [
      "Deploying the model in a hidden manner",
      "Running the new model in parallel with production, comparing outputs without serving the new model's predictions to users",
      "Deploying the model only during nighttime",
      "Using the model only for internal testing"
    ],
    correctAnswer: 1,
    explanation: "Shadow deployment runs the new model alongside production to compare outputs without impacting users. It's the safest deployment pattern for validating model behavior in real conditions.",
    difficulty: "easy", topic: "Deployment Patterns"
  },
  {
    id: "sq3.17", domain: 3,
    question: "When decommissioning an AI model that processed sensitive healthcare data, the MOST critical consideration is:",
    options: [
      "Recovering the hardware for reuse",
      "Ensuring secure deletion of training data, model artifacts, and preserving audit trails as required by regulations",
      "Notifying the model vendor",
      "Backing up the model for future retraining"
    ],
    correctAnswer: 1,
    explanation: "Healthcare data requires strict handling during decommission: secure data deletion, model artifact disposal, and preserving audit trails for regulatory compliance (HIPAA, GDPR).",
    difficulty: "medium", topic: "Decommissioning"
  },
  {
    id: "sq3.18", domain: 3,
    question: "An AI system's SLO (Service Level Objective) for 99.9% availability means the system can be down for approximately:",
    options: [
      "8.76 hours per year",
      "52.6 minutes per year",
      "5.26 minutes per year",
      "365 minutes per year"
    ],
    correctAnswer: 0,
    explanation: "99.9% availability = 0.1% downtime = 8.76 hours per year (365.25 × 24 × 0.001). 99.99% would be 52.6 minutes. Understanding SLO math is important for AI operations.",
    difficulty: "hard", topic: "SLOs"
  },

  // --- More Scenario-Based Governance Questions ---
  {
    id: "sq3.19", domain: 3,
    question: "A canary deployment for an AI model involves:",
    options: [
      "Testing the model in a sandbox environment",
      "Gradually routing a small percentage of production traffic to the new model before full rollout",
      "Deploying the model to a single geographic region",
      "Running the model only for premium users"
    ],
    correctAnswer: 1,
    explanation: "Canary deployment routes a small percentage of traffic to the new model, monitoring for issues before increasing the percentage. It limits blast radius if problems occur.",
    difficulty: "medium", topic: "Deployment Patterns"
  },
  {
    id: "sq3.20", domain: 3,
    question: "A champion-challenger model testing approach PRIMARILY involves:",
    options: [
      "Testing models in a competition environment",
      "Running the current production model (champion) alongside a new candidate (challenger) to compare performance",
      "Having data scientists compete to build the best model",
      "Testing the model against adversarial attacks"
    ],
    correctAnswer: 1,
    explanation: "Champion-challenger compares the existing production model against a new candidate using real data. The challenger must demonstrate better performance to replace the champion.",
    difficulty: "medium", topic: "Model Testing"
  },

  // --- More Mixed Domain Questions ---
  {
    id: "sq1.13", domain: 1,
    question: "During an AI governance maturity assessment, the organization finds that AI security policies exist but are not consistently enforced. This indicates:",
    options: [
      "A defined but not managed maturity level",
      "Full maturity since policies exist",
      "No governance framework in place",
      "An optimized governance level"
    ],
    correctAnswer: 0,
    explanation: "Having policies without consistent enforcement indicates a defined (documented) but not managed (measured and enforced) maturity level. The gap between policy and practice needs to be closed.",
    difficulty: "medium", topic: "Governance Maturity"
  },
  {
    id: "sq2.14", domain: 2,
    question: "When conducting an AI impact assessment, which stakeholder perspective is MOST often overlooked but critically important?",
    options: [
      "The development team's perspective",
      "The communities and individuals who will be affected by the AI system's decisions",
      "The vendor's perspective",
      "The IT infrastructure team's perspective"
    ],
    correctAnswer: 1,
    explanation: "Affected communities and individuals (end users, subjects of AI decisions) are often overlooked in impact assessments but are the most important stakeholders for identifying potential harms.",
    difficulty: "hard", topic: "Impact Assessment"
  },
  {
    id: "sq3.21", domain: 3,
    question: "Which technique would BEST protect against model inversion attacks that try to reconstruct training data?",
    options: [
      "Using larger models",
      "Training with differential privacy and limiting API output information (e.g., confidence scores)",
      "Using ensemble models",
      "Increasing training data volume"
    ],
    correctAnswer: 1,
    explanation: "Differential privacy during training prevents memorization of individual records, and limiting API outputs (especially confidence scores) reduces information available for inversion attacks.",
    difficulty: "hard", topic: "Model Inversion Defense"
  },
  {
    id: "sq1.14", domain: 1,
    question: "The ISACA AAISM exam focuses on which three domains?",
    options: [
      "AI Development, AI Testing, AI Deployment",
      "AI Governance and Program Management, AI Risk Management, AI Technologies and Controls",
      "AI Ethics, AI Compliance, AI Security",
      "AI Strategy, AI Operations, AI Monitoring"
    ],
    correctAnswer: 1,
    explanation: "The AAISM exam covers three domains: D1 AI Governance & Program Management (31%), D2 AI Risk Management (31%), D3 AI Technologies & Controls (38%).",
    difficulty: "easy", topic: "Exam Structure"
  },
  {
    id: "sq2.15", domain: 2,
    question: "Which risk treatment option involves a third party assuming responsibility for the financial consequences of an AI risk?",
    options: [
      "Risk avoidance",
      "Risk mitigation",
      "Risk transfer",
      "Risk acceptance"
    ],
    correctAnswer: 2,
    explanation: "Risk transfer shifts financial responsibility to a third party, typically through insurance or contractual agreements. The original risk still exists; only the financial burden is shared.",
    difficulty: "easy", topic: "Risk Treatment"
  },
  {
    id: "sq3.22", domain: 3,
    question: "In a CI/CD pipeline for ML models, which validation should occur BEFORE a model is promoted to production?",
    options: [
      "Only accuracy testing",
      "Comprehensive validation including performance, fairness, security, drift, and documentation checks",
      "Only code review",
      "Only latency testing"
    ],
    correctAnswer: 1,
    explanation: "ML pipelines need comprehensive automated validation gates covering performance metrics, fairness testing, security checks, drift assessment, and documentation completeness.",
    difficulty: "medium", topic: "MLOps Pipeline"
  },
  {
    id: "sq2.16", domain: 2,
    question: "An AI system monitoring dashboard shows a sudden spike in prediction confidence scores above 99%. This MOST likely indicates:",
    options: [
      "The model has improved significantly",
      "A potential issue such as overfitting, data leakage, or adversarial manipulation that should be investigated",
      "The system is working perfectly",
      "Users are providing better inputs"
    ],
    correctAnswer: 1,
    explanation: "Sudden spikes in confidence are anomalous and may indicate data issues (leakage), adversarial manipulation, or model problems. High confidence doesn't always mean high quality.",
    difficulty: "hard", topic: "Anomaly Detection"
  },
  {
    id: "sq1.15", domain: 1,
    question: "According to the OECD AI Principles, AI systems should be:",
    options: [
      "As complex as possible to maximize accuracy",
      "Transparent, explainable, and designed with respect for human rights and democratic values",
      "Deployed as quickly as possible to gain competitive advantage",
      "Operated without human oversight to maximize efficiency"
    ],
    correctAnswer: 1,
    explanation: "OECD AI Principles emphasize human-centred values, fairness, transparency, explainability, robustness, and accountability. Speed and complexity are not principles.",
    difficulty: "easy", topic: "OECD Principles"
  },
  {
    id: "sq3.23", domain: 3,
    question: "A feature store in MLOps PRIMARILY ensures:",
    options: [
      "Models are stored securely",
      "Features are consistently computed, versioned, and shared across training and serving to prevent training-serving skew",
      "Feature films about AI are cataloged",
      "Database features are optimized"
    ],
    correctAnswer: 1,
    explanation: "Feature stores provide centralized, versioned feature computation ensuring consistency between training and serving environments, preventing training-serving skew and enabling feature reuse.",
    difficulty: "medium", topic: "Feature Store"
  },
  {
    id: "sq2.17", domain: 2,
    question: "When assessing AI vendor risk, a 'right to audit' clause in the contract is important PRIMARILY because it:",
    options: [
      "Reduces the vendor's prices",
      "Enables the organization to independently verify the vendor's AI security controls and practices",
      "Gives the organization ownership of the vendor's AI models",
      "Eliminates the need for ongoing monitoring"
    ],
    correctAnswer: 1,
    explanation: "Right to audit enables independent verification of vendor security controls, data practices, and compliance. It doesn't transfer ownership or eliminate monitoring needs.",
    difficulty: "medium", topic: "Vendor Contracts"
  },
  {
    id: "sq3.24", domain: 3,
    question: "Homomorphic encryption in AI PRIMARILY allows:",
    options: [
      "Faster model training",
      "Performing computations on encrypted data without decrypting it",
      "Better model accuracy",
      "Simpler model architecture"
    ],
    correctAnswer: 1,
    explanation: "Homomorphic encryption enables computation on encrypted data, producing encrypted results that when decrypted match operations on plaintext. It enables private AI inference.",
    difficulty: "hard", topic: "Privacy Technology"
  },
  {
    id: "sq1.16", domain: 1,
    question: "An organization wants to measure the effectiveness of its AI governance program. The BEST approach is to:",
    options: [
      "Count the number of AI models deployed",
      "Define and track Key Performance Indicators (KPIs) aligned with governance objectives, such as compliance rates and risk reduction",
      "Survey employees about their satisfaction with AI tools",
      "Compare the number of AI projects to competitors"
    ],
    correctAnswer: 1,
    explanation: "Governance effectiveness is measured through KPIs tied to objectives: policy compliance rates, risk incidents, regulatory findings, stakeholder satisfaction, and maturity improvements.",
    difficulty: "medium", topic: "Governance Metrics"
  },
  {
    id: "sq3.25", domain: 3,
    question: "When an AI model is given excessive permissions to take actions (e.g., execute code, send emails, modify databases), this vulnerability is described as:",
    options: [
      "Prompt injection",
      "Excessive agency (OWASP LLM06)",
      "Model theft",
      "Data poisoning"
    ],
    correctAnswer: 1,
    explanation: "Excessive Agency (OWASP LLM06) occurs when an LLM is given too many capabilities, permissions, or autonomy. Defense: apply least privilege, require human approval for sensitive actions.",
    difficulty: "medium", topic: "OWASP LLM06"
  },

  // --- Additional Critical Questions ---
  {
    id: "sq2.18", domain: 2,
    question: "The PRIMARY purpose of maintaining an AI risk register is to:",
    options: [
      "Document all AI projects in the organization",
      "Provide a centralized record of identified AI risks, their assessment, treatment plans, and ownership",
      "Track AI model performance metrics",
      "List all AI vendors"
    ],
    correctAnswer: 1,
    explanation: "An AI risk register centralizes all identified risks with assessments, owners, treatment plans, status, and review dates. It's the foundation of ongoing AI risk management.",
    difficulty: "easy", topic: "Risk Register"
  },
  {
    id: "sq3.26", domain: 3,
    question: "Adversarial robustness testing of an AI model should include:",
    options: [
      "Only testing with clean, well-formatted data",
      "Systematically testing with perturbed, out-of-distribution, and adversarially crafted inputs to evaluate model behavior under attack",
      "Only testing model accuracy on the validation set",
      "Testing only the API response times"
    ],
    correctAnswer: 1,
    explanation: "Adversarial robustness testing systematically evaluates how a model behaves when exposed to adversarial inputs, edge cases, and out-of-distribution data — not just clean test data.",
    difficulty: "medium", topic: "Adversarial Testing"
  },
  {
    id: "sq1.17", domain: 1,
    question: "Under the EU AI Act, a company that deploys an AI chatbot for customer service MUST:",
    options: [
      "Register the chatbot as a high-risk AI system",
      "Inform users that they are interacting with an AI system (transparency obligation for limited-risk AI)",
      "Submit the chatbot for government approval",
      "Publish the chatbot's source code"
    ],
    correctAnswer: 1,
    explanation: "Chatbots fall under 'limited risk' in the EU AI Act, requiring transparency — users must be informed they're interacting with AI. No registration, approval, or source code disclosure is required.",
    difficulty: "medium", topic: "EU AI Act Compliance"
  },
  {
    id: "sq3.27", domain: 3,
    question: "Synthetic data generation for AI training is beneficial PRIMARILY because it:",
    options: [
      "Eliminates the need for real data entirely",
      "Can augment training data while reducing privacy risks, though it requires validation against real-world distributions",
      "Always produces better models than real data",
      "Is required by all AI regulations"
    ],
    correctAnswer: 1,
    explanation: "Synthetic data augments training sets while reducing privacy exposure. However, it must be validated against real distributions to avoid introducing artifacts or biases.",
    difficulty: "medium", topic: "Synthetic Data"
  },
  {
    id: "sq2.19", domain: 2,
    question: "An organization's AI model makes a lending decision that disproportionately denies loans to a minority group. Under US law, this could constitute:",
    options: [
      "An acceptable business practice",
      "Disparate impact discrimination, even if the model wasn't intentionally designed to discriminate",
      "A technical performance issue only",
      "A vendor management problem"
    ],
    correctAnswer: 1,
    explanation: "Disparate impact (adverse impact) occurs when a neutral practice disproportionately affects a protected group, even without discriminatory intent. This is legally actionable under fair lending laws.",
    difficulty: "hard", topic: "Disparate Impact"
  },
  {
    id: "sq3.28", domain: 3,
    question: "The BEST time to perform a security review of an AI model is:",
    options: [
      "Only after a security incident occurs",
      "At multiple stages: design, development, pre-deployment, and continuously in production",
      "Only before initial deployment",
      "Once per year during the annual audit"
    ],
    correctAnswer: 1,
    explanation: "Security reviews should occur throughout the AI lifecycle — during design (threat modeling), development (code review), pre-deployment (testing), and continuously in production (monitoring).",
    difficulty: "easy", topic: "Security Review Timing"
  },
];
