import { AppState, QuizQuestion } from '../types';

export const initialState: AppState = {
  resources: [
    {
      id: 'review-manual',
      name: 'ISACA Review Manual',
      totalPasses: 2,
      currentPass: 1,
      chapters: [
        { id: 'ch1', name: 'Domain 1: AI Governance', completed: [false, false] },
        { id: 'ch2', name: 'Domain 2: AI Risk Management', completed: [false, false] },
        { id: 'ch3', name: 'Domain 3: AI Development', completed: [false, false] },
        { id: 'ch4', name: 'Domain 4: AI Operations', completed: [false, false] },
      ],
    },
    {
      id: 'qae-database',
      name: 'QAE Database',
      totalPasses: 3,
      currentPass: 1,
      chapters: [
        { id: 'qae-d1', name: 'Domain 1 Questions', completed: [false, false, false] },
        { id: 'qae-d2', name: 'Domain 2 Questions', completed: [false, false, false] },
        { id: 'qae-d3', name: 'Domain 3 Questions', completed: [false, false, false] },
        { id: 'qae-d4', name: 'Domain 4 Questions', completed: [false, false, false] },
      ],
    },
    {
      id: 'online-course',
      name: 'Online Review Course',
      totalPasses: 1,
      currentPass: 1,
      chapters: [
        { id: 'oc-d1', name: 'Domain 1: AI Governance', completed: [false] },
        { id: 'oc-d2', name: 'Domain 2: AI Risk Management', completed: [false] },
        { id: 'oc-d3', name: 'Domain 3: AI Development', completed: [false] },
        { id: 'oc-d4', name: 'Domain 4: AI Operations', completed: [false] },
      ],
    },
    {
      id: 'ml-specialization',
      name: 'ML Specialization (DeepLearning.AI)',
      totalPasses: 1,
      currentPass: 1,
      chapters: [
        { id: 'ml-c1', name: 'Course 1: Supervised ML', completed: [false] },
        { id: 'ml-c2', name: 'Course 2: Advanced Algorithms', completed: [false] },
        { id: 'ml-c3', name: 'Course 3: Unsupervised Learning', completed: [false] },
      ],
    },
    {
      id: 'owasp-top10',
      name: 'OWASP Top 10 for LLMs',
      totalPasses: 1,
      currentPass: 1,
      chapters: [
        { id: 'owasp-1', name: 'LLM01: Prompt Injection', completed: [false] },
        { id: 'owasp-2', name: 'LLM02: Insecure Output Handling', completed: [false] },
        { id: 'owasp-3', name: 'LLM03: Training Data Poisoning', completed: [false] },
        { id: 'owasp-4', name: 'LLM04: Model Denial of Service', completed: [false] },
        { id: 'owasp-5', name: 'LLM05: Supply Chain Vulnerabilities', completed: [false] },
        { id: 'owasp-6', name: 'LLM06: Sensitive Info Disclosure', completed: [false] },
        { id: 'owasp-7', name: 'LLM07: Insecure Plugin Design', completed: [false] },
        { id: 'owasp-8', name: 'LLM08: Excessive Agency', completed: [false] },
        { id: 'owasp-9', name: 'LLM09: Overreliance', completed: [false] },
        { id: 'owasp-10', name: 'LLM10: Model Theft', completed: [false] },
      ],
    },
  ],
  domains: [
    { id: 1, name: 'AI Governance & Program Mgmt (31%)', icon: '🏛️', notes: [] },
    { id: 2, name: 'AI Risk Management (31%)', icon: '⚠️', notes: [] },
    { id: 3, name: 'AI Technologies & Controls (38%)', icon: '🔧', notes: [] },
    { id: 4, name: 'AI Operations (Part of D3)', icon: '⚙️', notes: [] },
  ],
  quizAttempts: [],
  studySessions: [],
  examDate: null,
};

export const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    domain: 1,
    question: 'What is the primary purpose of an AI governance framework?',
    options: [
      'To maximize AI model accuracy',
      'To establish policies, standards, and oversight for AI systems',
      'To reduce AI development costs',
      'To automate business processes',
    ],
    correctAnswer: 1,
    explanation: 'An AI governance framework establishes the policies, standards, and oversight mechanisms needed to ensure AI systems are developed and used responsibly within an organization.',
  },
  {
    id: 'q2',
    domain: 2,
    question: 'Which of the following is an example of an adversarial attack on an AI system?',
    options: [
      'A user providing normal input to get expected output',
      'Adding imperceptible noise to inputs to cause misclassification',
      'Training a model with more data',
      'Updating model weights during training',
    ],
    correctAnswer: 1,
    explanation: 'Adversarial attacks involve crafting inputs (often with imperceptible modifications) designed to cause AI models to make incorrect predictions or classifications.',
  },
  {
    id: 'q3',
    domain: 2,
    question: 'What is "prompt injection" in the context of LLM security?',
    options: [
      'A technique to improve model training',
      'A method to speed up inference',
      'An attack where malicious instructions are hidden in user input',
      'A way to compress prompts for efficiency',
    ],
    correctAnswer: 2,
    explanation: 'Prompt injection is an attack where malicious instructions are embedded in user input to manipulate an LLM into performing unintended actions or revealing sensitive information.',
  },
  {
    id: 'q4',
    domain: 3,
    question: 'What is the purpose of a validation dataset in machine learning?',
    options: [
      'To train the model',
      'To tune hyperparameters and prevent overfitting',
      'To deploy the model',
      'To collect new data',
    ],
    correctAnswer: 1,
    explanation: 'A validation dataset is used to tune hyperparameters and evaluate model performance during training to prevent overfitting, without contaminating the test set.',
  },
  {
    id: 'q5',
    domain: 3,
    question: 'What is "data drift" in AI systems?',
    options: [
      'When data is lost during transmission',
      'When the statistical properties of input data change over time',
      'When data is encrypted',
      'When data is backed up',
    ],
    correctAnswer: 1,
    explanation: 'Data drift occurs when the statistical properties of the input data change over time, potentially degrading model performance as the model was trained on different data distributions.',
  },
  {
    id: 'q6',
    domain: 4,
    question: 'What is the primary goal of AI model monitoring in production?',
    options: [
      'To increase model complexity',
      'To detect performance degradation and drift',
      'To reduce infrastructure costs',
      'To train new models',
    ],
    correctAnswer: 1,
    explanation: 'AI model monitoring in production aims to detect performance degradation, data drift, and other issues that could affect the reliability and accuracy of deployed models.',
  },
  {
    id: 'q7',
    domain: 1,
    question: 'Which regulation specifically addresses AI systems in the European Union?',
    options: [
      'GDPR only',
      'EU AI Act',
      'SOX',
      'HIPAA',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act is a comprehensive regulation specifically designed to govern AI systems in the European Union, establishing risk-based requirements for AI development and deployment.',
  },
  {
    id: 'q8',
    domain: 4,
    question: 'What is MLOps?',
    options: [
      'A programming language for ML',
      'Practices for deploying and maintaining ML models in production',
      'A type of neural network',
      'A data storage format',
    ],
    correctAnswer: 1,
    explanation: 'MLOps (Machine Learning Operations) encompasses practices, tools, and techniques for deploying, monitoring, and maintaining machine learning models in production environments.',
  },
  {
    id: 'q9',
    domain: 2,
    question: 'What is "model poisoning"?',
    options: [
      'Encrypting model weights',
      'Corrupting training data to compromise model behavior',
      'Compressing models for deployment',
      'Testing model accuracy',
    ],
    correctAnswer: 1,
    explanation: 'Model poisoning is an attack where malicious actors corrupt the training data or process to compromise the model\'s behavior, causing it to make incorrect predictions or include backdoors.',
  },
  {
    id: 'q10',
    domain: 1,
    question: 'What is "explainability" in the context of AI?',
    options: [
      'The speed of model inference',
      'The ability to understand and interpret model decisions',
      'The cost of model deployment',
      'The size of training data',
    ],
    correctAnswer: 1,
    explanation: 'AI explainability refers to the ability to understand, interpret, and communicate how an AI model arrives at its decisions, which is crucial for trust, compliance, and debugging.',
  },
];

// Local storage helpers
const STORAGE_KEY = 'aaism-study-app-state';

export function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return initialState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}
