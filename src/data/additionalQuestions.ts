// Additional AAISM Exam Questions
// Based on ISACA AI Security Manager certification exam objectives
// These supplement the main examContent.ts questions

import { ExamQuestion } from './examContent';

export const ADDITIONAL_QUESTIONS: ExamQuestion[] = [
  // ============================================
  // DOMAIN 1: AI GOVERNANCE (25%)
  // ============================================
  
  // Governance Framework Questions
  {
    id: "aq1.01",
    domain: 1,
    question: "Which of the following BEST describes the role of an AI Center of Excellence (CoE)?",
    options: [
      "A central team responsible for all AI development in the organization",
      "A support function that provides guidance, standards, and best practices for AI initiatives",
      "An external consulting group hired for AI projects",
      "A regulatory body that approves all AI systems"
    ],
    correctAnswer: 1,
    explanation: "An AI CoE is a support function that establishes standards, provides guidance, shares best practices, and builds organizational AI capabilities. It typically doesn't do all development itself.",
    difficulty: "medium",
    topic: "AI Governance Structure"
  },
  {
    id: "aq1.02",
    domain: 1,
    question: "When implementing AI governance, what should be the FIRST consideration?",
    options: [
      "Selecting the right AI technologies",
      "Hiring data scientists",
      "Aligning AI strategy with business objectives",
      "Purchasing AI tools from vendors"
    ],
    correctAnswer: 2,
    explanation: "AI governance must start with business alignment. Technology, hiring, and procurement decisions should follow and support the strategic objectives, not precede them.",
    difficulty: "easy",
    topic: "AI Strategy"
  },
  {
    id: "aq1.03",
    domain: 1,
    question: "According to the EU AI Act, which AI systems are classified as 'High-Risk'?",
    options: [
      "All AI systems using machine learning",
      "AI systems in critical infrastructure, employment, education, and essential services",
      "Only AI systems that process personal data",
      "AI systems developed by large technology companies"
    ],
    correctAnswer: 1,
    explanation: "The EU AI Act classifies high-risk AI based on their application domain, including critical infrastructure, employment decisions, education, essential services, and law enforcement.",
    difficulty: "medium",
    topic: "AI Regulation"
  },
  {
    id: "aq1.04",
    domain: 1,
    question: "What is the PRIMARY benefit of establishing AI ethics principles within an organization?",
    options: [
      "Reducing AI development costs",
      "Ensuring AI systems are developed and used responsibly and fairly",
      "Accelerating time-to-market for AI products",
      "Eliminating the need for regulatory compliance"
    ],
    correctAnswer: 1,
    explanation: "AI ethics principles guide responsible development and use of AI, addressing issues like fairness, transparency, and accountability. They don't reduce costs or replace compliance requirements.",
    difficulty: "easy",
    topic: "AI Ethics"
  },
  {
    id: "aq1.05",
    domain: 1,
    question: "In the context of AI governance, what does 'algorithmic accountability' refer to?",
    options: [
      "The speed at which algorithms process data",
      "The responsibility for decisions made by AI systems and their outcomes",
      "The accuracy of machine learning predictions",
      "The cost of developing algorithms"
    ],
    correctAnswer: 1,
    explanation: "Algorithmic accountability means organizations and individuals are responsible for the decisions and outcomes of AI systems they develop or deploy, including potential harms.",
    difficulty: "medium",
    topic: "Accountability"
  },
  {
    id: "aq1.06",
    domain: 1,
    question: "Which stakeholder group should be PRIMARILY responsible for approving the organization's AI risk appetite?",
    options: [
      "Data scientists",
      "IT department",
      "Board of Directors or Executive Management",
      "External auditors"
    ],
    correctAnswer: 2,
    explanation: "Risk appetite is a strategic decision that should be set by the Board or Executive Management. Technical teams implement within these boundaries but don't set them.",
    difficulty: "easy",
    topic: "Risk Governance"
  },
  {
    id: "aq1.07",
    domain: 1,
    question: "What is the MOST important consideration when developing an AI acceptable use policy?",
    options: [
      "Technical specifications of AI models",
      "Clear definition of permitted and prohibited uses of AI",
      "Vendor pricing models",
      "AI system performance metrics"
    ],
    correctAnswer: 1,
    explanation: "An acceptable use policy must clearly define what is permitted and prohibited to guide employees and ensure consistent, appropriate use of AI across the organization.",
    difficulty: "medium",
    topic: "AI Policy"
  },
  {
    id: "aq1.08",
    domain: 1,
    question: "ISO/IEC 42001 is BEST described as:",
    options: [
      "A technical standard for AI model development",
      "A management system standard for AI governance",
      "A data protection regulation",
      "A cybersecurity framework"
    ],
    correctAnswer: 1,
    explanation: "ISO/IEC 42001 establishes requirements for an AI Management System (AIMS), providing a framework for responsible AI development and use within organizations.",
    difficulty: "easy",
    topic: "Standards"
  },
  {
    id: "aq1.09",
    domain: 1,
    question: "When should AI impact assessments be conducted?",
    options: [
      "Only when required by regulators",
      "Before deploying AI systems and periodically throughout their lifecycle",
      "Only after an AI incident occurs",
      "Only for AI systems that cost over $1 million"
    ],
    correctAnswer: 1,
    explanation: "AI impact assessments should be proactive and ongoing - conducted before deployment to identify risks and periodically during operation to catch emerging issues.",
    difficulty: "medium",
    topic: "AI Assessment"
  },
  {
    id: "aq1.10",
    domain: 1,
    question: "Which of the following is a KEY characteristic of 'Responsible AI'?",
    options: [
      "Maximizing AI accuracy above all other considerations",
      "Transparency, fairness, accountability, and respect for human rights",
      "Using the most advanced algorithms available",
      "Deploying AI as quickly as possible"
    ],
    correctAnswer: 1,
    explanation: "Responsible AI encompasses transparency, fairness, accountability, privacy protection, and respect for human rights - balancing innovation with ethical considerations.",
    difficulty: "easy",
    topic: "Responsible AI"
  },

  // ============================================
  // DOMAIN 2: AI RISK MANAGEMENT (30%)
  // ============================================
  
  {
    id: "aq2.01",
    domain: 2,
    question: "What type of attack involves adding imperceptible perturbations to input data to cause AI model misclassification?",
    options: [
      "SQL injection",
      "Adversarial attack",
      "Phishing",
      "Brute force attack"
    ],
    correctAnswer: 1,
    explanation: "Adversarial attacks involve crafting inputs with small, often imperceptible modifications that cause AI models to make incorrect predictions while appearing normal to humans.",
    difficulty: "easy",
    topic: "Adversarial Attacks"
  },
  {
    id: "aq2.02",
    domain: 2,
    question: "Model poisoning attacks primarily target which phase of the AI lifecycle?",
    options: [
      "Deployment",
      "Training",
      "Monitoring",
      "Decommissioning"
    ],
    correctAnswer: 1,
    explanation: "Model poisoning attacks target the training phase by injecting malicious data into the training set, causing the model to learn incorrect patterns or behaviors.",
    difficulty: "medium",
    topic: "Model Poisoning"
  },
  {
    id: "aq2.03",
    domain: 2,
    question: "What is 'prompt injection' in the context of Large Language Models (LLMs)?",
    options: [
      "Optimizing prompts for better performance",
      "Malicious input designed to manipulate the model's behavior or bypass controls",
      "A technique for faster model training",
      "Encrypting prompts for security"
    ],
    correctAnswer: 1,
    explanation: "Prompt injection involves crafting inputs that manipulate LLM behavior, potentially bypassing safety controls, extracting sensitive information, or causing unintended actions.",
    difficulty: "medium",
    topic: "LLM Security"
  },
  {
    id: "aq2.04",
    domain: 2,
    question: "Which of the following is the BEST defense against data poisoning attacks?",
    options: [
      "Using larger training datasets",
      "Data validation, provenance tracking, and anomaly detection",
      "Increasing model complexity",
      "Using cloud-based infrastructure"
    ],
    correctAnswer: 1,
    explanation: "Defending against data poisoning requires validating data integrity, tracking data provenance (origin), and detecting anomalies in training data that might indicate tampering.",
    difficulty: "medium",
    topic: "Data Security"
  },
  {
    id: "aq2.05",
    domain: 2,
    question: "What does 'model inversion attack' attempt to accomplish?",
    options: [
      "Reverse the model to extract training data or sensitive information",
      "Improve model accuracy",
      "Speed up model inference",
      "Reduce model size"
    ],
    correctAnswer: 0,
    explanation: "Model inversion attacks attempt to reconstruct training data or extract sensitive information by querying the model and analyzing its outputs.",
    difficulty: "hard",
    topic: "Privacy Attacks"
  },
  {
    id: "aq2.06",
    domain: 2,
    question: "In AI risk assessment, 'inherent risk' refers to:",
    options: [
      "Risk after controls are applied",
      "Risk before any controls are implemented",
      "Risk that cannot be mitigated",
      "Risk from third-party vendors"
    ],
    correctAnswer: 1,
    explanation: "Inherent risk is the level of risk present before controls are applied. Residual risk is what remains after controls. Both concepts are important in risk assessment.",
    difficulty: "easy",
    topic: "Risk Assessment"
  },
  {
    id: "aq2.07",
    domain: 2,
    question: "What is the PRIMARY concern with 'model extraction' attacks?",
    options: [
      "Deletion of AI models",
      "Theft of intellectual property and competitive advantage",
      "Increased training costs",
      "Reduced model accuracy"
    ],
    correctAnswer: 1,
    explanation: "Model extraction attacks steal the functionality of proprietary AI models, threatening intellectual property, competitive advantage, and potentially enabling further attacks.",
    difficulty: "medium",
    topic: "IP Protection"
  },
  {
    id: "aq2.08",
    domain: 2,
    question: "Which privacy-enhancing technology allows AI training on decentralized data without sharing raw data?",
    options: [
      "Homomorphic encryption",
      "Federated learning",
      "Tokenization",
      "Data masking"
    ],
    correctAnswer: 1,
    explanation: "Federated learning trains models across decentralized devices/servers without sharing raw data - only model updates are shared, protecting data privacy.",
    difficulty: "medium",
    topic: "Privacy Technologies"
  },
  {
    id: "aq2.09",
    domain: 2,
    question: "What is 'membership inference attack' in machine learning?",
    options: [
      "Determining who is a member of the AI development team",
      "Determining if a specific data point was used in training the model",
      "Adding new members to a training dataset",
      "Removing outliers from training data"
    ],
    correctAnswer: 1,
    explanation: "Membership inference attacks attempt to determine whether a specific data record was part of the model's training data, which can reveal sensitive information about individuals.",
    difficulty: "hard",
    topic: "Privacy Attacks"
  },
  {
    id: "aq2.10",
    domain: 2,
    question: "Differential privacy provides protection by:",
    options: [
      "Encrypting all training data",
      "Adding calibrated noise to data or outputs to prevent individual identification",
      "Removing all personal identifiers",
      "Storing data in secure locations"
    ],
    correctAnswer: 1,
    explanation: "Differential privacy adds mathematically calibrated noise to data or query outputs, ensuring that the presence or absence of any individual's data cannot be determined.",
    difficulty: "hard",
    topic: "Privacy Technologies"
  },
  {
    id: "aq2.11",
    domain: 2,
    question: "Which risk is MOST associated with using biased training data?",
    options: [
      "Model overfitting",
      "Discriminatory or unfair AI outcomes",
      "Slow inference speed",
      "High computational costs"
    ],
    correctAnswer: 1,
    explanation: "Biased training data leads to AI systems that produce discriminatory or unfair outcomes, potentially harming individuals or groups and creating legal and reputational risks.",
    difficulty: "easy",
    topic: "Bias and Fairness"
  },
  {
    id: "aq2.12",
    domain: 2,
    question: "What is 'jailbreaking' in the context of LLMs?",
    options: [
      "Installing LLMs on mobile devices",
      "Techniques to bypass safety filters and content policies",
      "Open-sourcing proprietary LLMs",
      "Improving LLM response speed"
    ],
    correctAnswer: 1,
    explanation: "Jailbreaking refers to techniques used to bypass an LLM's safety guardrails, content policies, or ethical guidelines to generate prohibited or harmful content.",
    difficulty: "medium",
    topic: "LLM Security"
  },
  {
    id: "aq2.13",
    domain: 2,
    question: "Third-party AI risk assessment should include evaluation of:",
    options: [
      "Only the vendor's financial stability",
      "Vendor's security practices, data handling, model transparency, and compliance",
      "Only the accuracy of the AI model",
      "Only the contract terms"
    ],
    correctAnswer: 1,
    explanation: "Third-party AI risk requires comprehensive evaluation including security practices, data handling, model transparency, regulatory compliance, and service level commitments.",
    difficulty: "medium",
    topic: "Third-Party Risk"
  },
  {
    id: "aq2.14",
    domain: 2,
    question: "What is the PRIMARY purpose of AI red teaming?",
    options: [
      "Marketing AI products",
      "Proactively identifying vulnerabilities through adversarial testing",
      "Training AI models faster",
      "Reducing AI development costs"
    ],
    correctAnswer: 1,
    explanation: "AI red teaming involves adversarial testing to proactively identify vulnerabilities, biases, safety issues, and potential misuse scenarios before they can be exploited.",
    difficulty: "medium",
    topic: "Security Testing"
  },
  {
    id: "aq2.15",
    domain: 2,
    question: "Supply chain risk in AI primarily concerns:",
    options: [
      "Shipping and logistics",
      "Security of data, models, libraries, and infrastructure components",
      "Manufacturing hardware",
      "Employee transportation"
    ],
    correctAnswer: 1,
    explanation: "AI supply chain risk encompasses the security and integrity of all components: training data sources, pre-trained models, ML libraries, and infrastructure dependencies.",
    difficulty: "medium",
    topic: "Supply Chain Risk"
  },

  // ============================================
  // DOMAIN 3: AI DEVELOPMENT (25%)
  // ============================================
  
  {
    id: "aq3.01",
    domain: 3,
    question: "In CRISP-DM, which phase involves understanding the business problem before data analysis?",
    options: [
      "Data Preparation",
      "Business Understanding",
      "Modeling",
      "Deployment"
    ],
    correctAnswer: 1,
    explanation: "CRISP-DM starts with Business Understanding - defining objectives, requirements, and success criteria before any technical work begins.",
    difficulty: "easy",
    topic: "CRISP-DM"
  },
  {
    id: "aq3.02",
    domain: 3,
    question: "What is the PRIMARY security concern with using pre-trained models from public repositories?",
    options: [
      "They are too accurate",
      "Potential backdoors, vulnerabilities, or malicious modifications",
      "They are too expensive",
      "They require too much compute"
    ],
    correctAnswer: 1,
    explanation: "Pre-trained models may contain backdoors, hidden vulnerabilities, or have been maliciously modified. Provenance verification and security scanning are essential.",
    difficulty: "medium",
    topic: "Model Security"
  },
  {
    id: "aq3.03",
    domain: 3,
    question: "Model explainability is MOST important for:",
    options: [
      "Reducing computational costs",
      "Understanding and justifying AI decisions, especially for high-stakes applications",
      "Improving model accuracy",
      "Speeding up training time"
    ],
    correctAnswer: 1,
    explanation: "Explainability allows stakeholders to understand how AI reaches decisions - critical for trust, regulatory compliance, debugging, and accountability in high-stakes applications.",
    difficulty: "easy",
    topic: "Explainability"
  },
  {
    id: "aq3.04",
    domain: 3,
    question: "Which technique helps identify which input features most influence a model's predictions?",
    options: [
      "Data encryption",
      "Feature importance analysis (e.g., SHAP, LIME)",
      "Data compression",
      "Batch processing"
    ],
    correctAnswer: 1,
    explanation: "Techniques like SHAP (SHapley Additive exPlanations) and LIME (Local Interpretable Model-agnostic Explanations) identify feature importance for model predictions.",
    difficulty: "medium",
    topic: "Explainability"
  },
  {
    id: "aq3.05",
    domain: 3,
    question: "What is 'data lineage' in the context of AI development?",
    options: [
      "The size of the dataset",
      "The complete history and transformations of data from origin to model",
      "The speed of data processing",
      "The cost of data storage"
    ],
    correctAnswer: 1,
    explanation: "Data lineage tracks the origin, movement, and transformation of data throughout its lifecycle - essential for auditability, debugging, and compliance.",
    difficulty: "medium",
    topic: "Data Governance"
  },
  {
    id: "aq3.06",
    domain: 3,
    question: "MLOps is BEST described as:",
    options: [
      "A machine learning algorithm",
      "Practices combining ML, DevOps, and data engineering for reliable ML systems",
      "A cloud computing platform",
      "A data visualization tool"
    ],
    correctAnswer: 1,
    explanation: "MLOps combines machine learning, DevOps, and data engineering practices to reliably deploy and maintain ML systems in production.",
    difficulty: "easy",
    topic: "MLOps"
  },
  {
    id: "aq3.07",
    domain: 3,
    question: "What is the purpose of model versioning?",
    options: [
      "Making models run faster",
      "Tracking model changes, enabling rollback, and maintaining reproducibility",
      "Reducing storage costs",
      "Improving model accuracy"
    ],
    correctAnswer: 1,
    explanation: "Model versioning tracks changes over time, enables rollback to previous versions if issues arise, and ensures reproducibility of results.",
    difficulty: "easy",
    topic: "MLOps"
  },
  {
    id: "aq3.08",
    domain: 3,
    question: "Before deploying an AI model to production, which review is MOST critical?",
    options: [
      "Marketing review",
      "Security and risk assessment review",
      "Budget review only",
      "User interface review only"
    ],
    correctAnswer: 1,
    explanation: "Security and risk assessment reviews are critical before deployment to identify vulnerabilities, ensure compliance, and verify the model meets safety requirements.",
    difficulty: "medium",
    topic: "Deployment"
  },
  {
    id: "aq3.09",
    domain: 3,
    question: "What is 'model drift'?",
    options: [
      "Physical movement of servers",
      "Degradation of model performance over time due to changing data patterns",
      "Model code becoming outdated",
      "Network latency issues"
    ],
    correctAnswer: 1,
    explanation: "Model drift occurs when the statistical properties of data change over time, causing models trained on historical data to become less accurate on new data.",
    difficulty: "easy",
    topic: "Model Monitoring"
  },
  {
    id: "aq3.10",
    domain: 3,
    question: "What distinguishes 'data drift' from 'concept drift'?",
    options: [
      "They are the same thing",
      "Data drift is changes in input data distribution; concept drift is changes in the relationship between inputs and outputs",
      "Data drift is slower than concept drift",
      "Concept drift only affects classification models"
    ],
    correctAnswer: 1,
    explanation: "Data drift refers to changes in input data distribution over time. Concept drift is when the relationship between inputs and the target variable changes.",
    difficulty: "hard",
    topic: "Model Monitoring"
  },
  {
    id: "aq3.11",
    domain: 3,
    question: "Secure ML pipelines should include:",
    options: [
      "Only fast processing capabilities",
      "Access controls, input validation, audit logging, and encrypted data handling",
      "Only high-accuracy models",
      "Maximum parallelization"
    ],
    correctAnswer: 1,
    explanation: "Secure ML pipelines require comprehensive security controls including access management, input validation, audit trails, and encryption of data at rest and in transit.",
    difficulty: "medium",
    topic: "Secure Development"
  },
  {
    id: "aq3.12",
    domain: 3,
    question: "What is the purpose of A/B testing in AI deployment?",
    options: [
      "Testing model accuracy only",
      "Comparing different model versions with real users to evaluate performance",
      "Alphabetizing data",
      "Backup and recovery testing"
    ],
    correctAnswer: 1,
    explanation: "A/B testing compares different model versions (or a model vs. baseline) with real users to evaluate performance, user experience, and business metrics before full rollout.",
    difficulty: "medium",
    topic: "Deployment"
  },
  {
    id: "aq3.13",
    domain: 3,
    question: "Why is reproducibility important in AI development?",
    options: [
      "To reduce costs",
      "To ensure experiments can be replicated and results verified",
      "To speed up training",
      "To reduce data storage"
    ],
    correctAnswer: 1,
    explanation: "Reproducibility ensures experiments can be replicated with identical results - essential for debugging, auditing, scientific validity, and regulatory compliance.",
    difficulty: "easy",
    topic: "Best Practices"
  },
  {
    id: "aq3.14",
    domain: 3,
    question: "What is a 'feature store' in machine learning?",
    options: [
      "A retail store selling ML products",
      "A centralized repository for storing, sharing, and managing ML features",
      "A backup storage system",
      "A model deployment platform"
    ],
    correctAnswer: 1,
    explanation: "A feature store is a centralized repository that stores, manages, and serves ML features consistently across training and inference, promoting reuse and consistency.",
    difficulty: "medium",
    topic: "MLOps"
  },
  {
    id: "aq3.15",
    domain: 3,
    question: "What is the PRIMARY purpose of model validation before deployment?",
    options: [
      "To make the model faster",
      "To verify the model meets performance, fairness, and safety requirements",
      "To reduce model size",
      "To update documentation"
    ],
    correctAnswer: 1,
    explanation: "Model validation ensures the model meets all requirements for accuracy, fairness, robustness, and safety before being deployed to production environments.",
    difficulty: "easy",
    topic: "Validation"
  },

  // ============================================
  // DOMAIN 4: AI OPERATIONS (20%)
  // ============================================
  
  {
    id: "aq4.01",
    domain: 4,
    question: "What is the FIRST step in responding to an AI incident?",
    options: [
      "Notify the press",
      "Contain the incident to prevent further harm",
      "Delete all evidence",
      "Update the AI model"
    ],
    correctAnswer: 1,
    explanation: "The first step in incident response is containment - preventing further harm or spread. Investigation, notification, and remediation follow after containment.",
    difficulty: "easy",
    topic: "Incident Response"
  },
  {
    id: "aq4.02",
    domain: 4,
    question: "Continuous monitoring of AI systems in production should include:",
    options: [
      "Only model accuracy metrics",
      "Performance, fairness, drift, security, and business outcome metrics",
      "Only system uptime",
      "Only user feedback"
    ],
    correctAnswer: 1,
    explanation: "Comprehensive AI monitoring covers multiple dimensions: model performance, fairness metrics, drift detection, security monitoring, and business impact measurement.",
    difficulty: "medium",
    topic: "Monitoring"
  },
  {
    id: "aq4.03",
    domain: 4,
    question: "When should an AI model be retrained?",
    options: [
      "Only on a fixed annual schedule",
      "When performance degrades, significant drift is detected, or business requirements change",
      "Only when users complain",
      "Only when new technology is available"
    ],
    correctAnswer: 1,
    explanation: "Retraining should be triggered by performance degradation, detected drift, business requirement changes, or new data availability - not just fixed schedules.",
    difficulty: "medium",
    topic: "Maintenance"
  },
  {
    id: "aq4.04",
    domain: 4,
    question: "What is the purpose of an AI model card?",
    options: [
      "A credit card for AI purchases",
      "Documentation describing the model's purpose, performance, limitations, and ethical considerations",
      "A hardware component",
      "An access credential"
    ],
    correctAnswer: 1,
    explanation: "A model card is standardized documentation describing a model's intended use, performance metrics, limitations, ethical considerations, and training data information.",
    difficulty: "easy",
    topic: "Documentation"
  },
  {
    id: "aq4.05",
    domain: 4,
    question: "What factors should be considered when decommissioning an AI system?",
    options: [
      "Only the cost of replacement",
      "Data retention, regulatory requirements, dependent systems, and knowledge preservation",
      "Only technical performance",
      "Only user preferences"
    ],
    correctAnswer: 1,
    explanation: "Decommissioning requires considering data retention requirements, regulatory obligations, impact on dependent systems, and preserving organizational knowledge.",
    difficulty: "medium",
    topic: "Decommissioning"
  },
  {
    id: "aq4.06",
    domain: 4,
    question: "What is 'shadow IT' in the context of AI, and why is it a risk?",
    options: [
      "IT systems in dark rooms",
      "Unauthorized AI tools used without IT/security oversight, creating unknown risks",
      "Backup AI systems",
      "Encrypted AI models"
    ],
    correctAnswer: 1,
    explanation: "Shadow AI refers to AI tools and systems deployed without proper IT and security oversight, creating unknown risks regarding data handling, security, and compliance.",
    difficulty: "medium",
    topic: "Governance"
  },
  {
    id: "aq4.07",
    domain: 4,
    question: "What is a 'canary deployment' for AI models?",
    options: [
      "Deploying models in bird-watching applications",
      "Gradually rolling out a new model to a small subset of users before full deployment",
      "Testing models in isolation",
      "Deploying models only in testing environments"
    ],
    correctAnswer: 1,
    explanation: "Canary deployment releases a new model to a small user subset first, allowing teams to detect issues before full rollout and minimize potential impact.",
    difficulty: "medium",
    topic: "Deployment"
  },
  {
    id: "aq4.08",
    domain: 4,
    question: "What should be included in AI system audit trails?",
    options: [
      "Only user login times",
      "Inputs, outputs, decisions, model versions, and any manual overrides",
      "Only error messages",
      "Only system uptime"
    ],
    correctAnswer: 1,
    explanation: "Comprehensive audit trails capture inputs, outputs, decisions made, model versions used, timestamps, and any human interventions or overrides for accountability.",
    difficulty: "medium",
    topic: "Auditability"
  },
  {
    id: "aq4.09",
    domain: 4,
    question: "What is the PRIMARY purpose of human-in-the-loop (HITL) in AI systems?",
    options: [
      "To replace AI completely",
      "To provide human oversight, validation, and intervention capability for AI decisions",
      "To slow down AI processing",
      "To reduce automation benefits"
    ],
    correctAnswer: 1,
    explanation: "HITL ensures humans can oversee, validate, and intervene in AI decisions - particularly important for high-stakes decisions where accountability and judgment are needed.",
    difficulty: "easy",
    topic: "Human Oversight"
  },
  {
    id: "aq4.10",
    domain: 4,
    question: "What metric is MOST important for detecting bias in production AI systems?",
    options: [
      "System uptime percentage",
      "Fairness metrics across different demographic groups",
      "Model file size",
      "API response time"
    ],
    correctAnswer: 1,
    explanation: "Monitoring fairness metrics (like equalized odds, demographic parity) across different groups in production helps detect and address bias in real-world operation.",
    difficulty: "medium",
    topic: "Fairness Monitoring"
  },
  {
    id: "aq4.11",
    domain: 4,
    question: "What is a 'rollback' in AI operations?",
    options: [
      "A type of machine learning algorithm",
      "Reverting to a previous model version when issues are detected",
      "Rolling training data forward",
      "A networking protocol"
    ],
    correctAnswer: 1,
    explanation: "Rollback is the process of reverting to a previous, known-good model version when the current version exhibits issues - requiring proper version control and testing.",
    difficulty: "easy",
    topic: "Operations"
  },
  {
    id: "aq4.12",
    domain: 4,
    question: "What should trigger an AI model review even if performance metrics are stable?",
    options: [
      "Nothing if metrics are stable",
      "Regulatory changes, ethical concerns, or significant changes in use context",
      "Only annual calendar reminders",
      "Only user complaints"
    ],
    correctAnswer: 1,
    explanation: "Reviews should be triggered by regulatory changes, emerging ethical concerns, changes in how the system is used, or significant context changes - not just performance metrics.",
    difficulty: "medium",
    topic: "Continuous Improvement"
  },
  {
    id: "aq4.13",
    domain: 4,
    question: "What is the role of SLAs (Service Level Agreements) in AI operations?",
    options: [
      "They are not relevant to AI",
      "Defining performance expectations, availability, and response times for AI services",
      "Only for human customer service",
      "Only for hardware components"
    ],
    correctAnswer: 1,
    explanation: "SLAs for AI services define expected performance (accuracy, latency), availability (uptime), support response times, and remedies if these are not met.",
    difficulty: "easy",
    topic: "Service Management"
  },
  {
    id: "aq4.14",
    domain: 4,
    question: "Why is it important to monitor inference latency in production AI systems?",
    options: [
      "It's not important",
      "To ensure the system meets real-time requirements and user experience expectations",
      "Only for billing purposes",
      "Only for compliance"
    ],
    correctAnswer: 1,
    explanation: "Inference latency directly impacts user experience and whether the system meets real-time requirements. High latency can make systems unusable for time-sensitive applications.",
    difficulty: "easy",
    topic: "Performance Monitoring"
  },
  {
    id: "aq4.15",
    domain: 4,
    question: "What is the BEST practice for handling AI model updates in production?",
    options: [
      "Deploy immediately without testing",
      "Use staged rollout with monitoring and rollback capability",
      "Wait until annual maintenance window",
      "Only update when the model completely fails"
    ],
    correctAnswer: 1,
    explanation: "Best practice is staged rollout (canary/blue-green) with comprehensive monitoring and easy rollback capability to minimize risk and enable quick response to issues.",
    difficulty: "medium",
    topic: "Change Management"
  },

  // Additional mixed difficulty questions
  {
    id: "aq5.01",
    domain: 1,
    question: "The OECD AI Principles emphasize that AI should be:",
    options: [
      "Developed as quickly as possible",
      "Transparent, explainable, and respect human rights and democratic values",
      "As complex as possible",
      "Only accessible to large corporations"
    ],
    correctAnswer: 1,
    explanation: "OECD AI Principles promote AI that is inclusive, sustainable, and centered on human values including transparency, explainability, and respect for rights.",
    difficulty: "easy",
    topic: "AI Principles"
  },
  {
    id: "aq5.02",
    domain: 2,
    question: "What is 'model watermarking' used for?",
    options: [
      "Adding water effects to images",
      "Embedding identifiable patterns to prove model ownership and detect theft",
      "Improving model accuracy",
      "Reducing model size"
    ],
    correctAnswer: 1,
    explanation: "Model watermarking embeds imperceptible patterns that can prove ownership of a model and help detect unauthorized copies or model extraction attacks.",
    difficulty: "hard",
    topic: "IP Protection"
  },
  {
    id: "aq5.03",
    domain: 3,
    question: "What is the difference between white-box and black-box model explainability?",
    options: [
      "White-box models are more accurate",
      "White-box allows inspection of internal logic; black-box explains based only on inputs/outputs",
      "Black-box models are faster",
      "There is no difference"
    ],
    correctAnswer: 1,
    explanation: "White-box explainability can examine model internals (weights, logic). Black-box techniques treat the model as opaque, explaining based on input-output relationships only.",
    difficulty: "hard",
    topic: "Explainability"
  },
  {
    id: "aq5.04",
    domain: 4,
    question: "What is 'observability' in the context of AI systems?",
    options: [
      "Physical visibility of servers",
      "The ability to understand system state from external outputs (logs, metrics, traces)",
      "User interface design",
      "Model accuracy"
    ],
    correctAnswer: 1,
    explanation: "Observability is the ability to understand the internal state of a system by examining its external outputs - crucial for debugging, monitoring, and maintaining AI systems.",
    difficulty: "medium",
    topic: "Monitoring"
  },
  {
    id: "aq5.05",
    domain: 1,
    question: "What does 'AI transparency' require organizations to disclose?",
    options: [
      "All proprietary algorithms",
      "When AI is being used, how it makes decisions, and its limitations",
      "Employee salaries",
      "All training data"
    ],
    correctAnswer: 1,
    explanation: "AI transparency typically requires disclosure that AI is being used, general explanations of how decisions are made, and acknowledgment of limitations - not necessarily all technical details.",
    difficulty: "medium",
    topic: "Transparency"
  }
];

// Function to get all additional questions
export function getAdditionalQuestions(): ExamQuestion[] {
  return ADDITIONAL_QUESTIONS;
}

// Function to get additional questions by domain
export function getAdditionalQuestionsByDomain(domainId: number): ExamQuestion[] {
  return ADDITIONAL_QUESTIONS.filter(q => q.domain === domainId);
}
