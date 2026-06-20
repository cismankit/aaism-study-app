import type { LabDefinition } from './types';

export const AAISM_LABS: LabDefinition[] = [
  {
    id: 'aaism-d1-governance-policy',
    certId: 'aaism',
    domainId: 1,
    title: 'AI Governance Policy Gap Analysis',
    description: 'Review a draft AI policy and identify missing governance controls using grep-style document analysis.',
    type: 'command',
    difficulty: 'easy',
    estimatedMinutes: 15,
    tags: ['governance', 'policy'],
    mitreTechniques: ['AML.T0048'],
    steps: [
      {
        id: 's1',
        title: 'Locate policy sections',
        instruction: 'Search the sample policy text for sections covering data retention, model versioning, and human oversight.',
        command: 'grep -iE "retention|version|oversight|human" ai_policy_draft.txt',
        expectedOutcome: 'Lines matching governance keywords appear',
        validationHint: 'You should find at least 2 of the 3 topic areas mentioned or explicitly missing.',
      },
      {
        id: 's2',
        title: 'Check for RACI matrix',
        instruction: 'Verify whether roles and accountability are defined. Search for RACI or role assignment patterns.',
        command: 'grep -iE "RACI|accountable|responsible|owner" ai_policy_draft.txt',
        expectedOutcome: 'RACI or role definitions found — or confirm absence as a gap',
        validationHint: 'Missing RACI is a valid finding to document.',
      },
      {
        id: 's3',
        title: 'Document gaps',
        instruction: 'List 3 governance gaps you identified. Mark complete when documented.',
        expectedOutcome: 'Written gap list with remediation recommendations',
      },
    ],
    sampleData: `# AI Policy Draft v0.3
## Scope
This policy applies to all ML models in production.

## Data Handling
Training data must be encrypted at rest.

## Model Lifecycle
Models are deployed after QA sign-off.

## Missing sections: RACI, human oversight, incident response for AI failures`,
  },
  {
    id: 'aaism-d2-risk-register',
    certId: 'aaism',
    domainId: 2,
    title: 'AI Risk Register Triage',
    description: 'Analyze a risk register export and prioritize risks by likelihood × impact.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 20,
    tags: ['risk', 'triage'],
    sampleData: `[
  {"id":"R-001","risk":"Prompt injection in customer chatbot","likelihood":4,"impact":5,"owner":"AI Team"},
  {"id":"R-002","risk":"Training data PII leakage","likelihood":3,"impact":5,"owner":"Data Gov"},
  {"id":"R-003","risk":"Model drift undetected >30 days","likelihood":3,"impact":3,"owner":"MLOps"},
  {"id":"R-004","risk":"Shadow AI tool usage","likelihood":5,"impact":4,"owner":"Security"}
]`,
    analysisQuestions: [
      { id: 'q1', question: 'Which risk has the highest risk score (likelihood × impact)?', expectedKeywords: ['R-001', 'prompt', '20'], sampleAnswer: 'R-001 Prompt injection (score 20)' },
      { id: 'q2', question: 'What immediate control would you recommend for R-004 Shadow AI?', expectedKeywords: ['inventory', 'policy', 'DLP', 'approval'], sampleAnswer: 'AI tool inventory + approval workflow + DLP' },
      { id: 'q3', question: 'Which owner should escalate R-002 to executive level?', expectedKeywords: ['Data Gov', 'DPO', 'privacy'], sampleAnswer: 'Data Gov / DPO due to PII impact' },
    ],
  },
  {
    id: 'aaism-d3-jwt-inspect',
    certId: 'aaism',
    domainId: 3,
    title: 'ML API JWT Header Inspection',
    description: 'Decode and inspect JWT tokens from an ML inference API to identify security misconfigurations.',
    type: 'command',
    difficulty: 'medium',
    estimatedMinutes: 15,
    tags: ['jwt', 'api-security'],
    steps: [
      {
        id: 's1',
        title: 'Extract JWT payload',
        instruction: 'Copy the sample JWT and decode the payload (middle segment, base64).',
        command: 'echo "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoic3lzdGVtIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ." | cut -d. -f2 | base64 -d 2>/dev/null || echo "decode manually"',
        expectedOutcome: '{"user":"system","role":"admin","exp":9999999999}',
        validationHint: 'alg:none and admin role are red flags.',
      },
      {
        id: 's2',
        title: 'Check algorithm header',
        instruction: 'Inspect the JWT header for algorithm. Document if alg:none or weak signing is used.',
        command: 'echo "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0" | base64 -d',
        expectedOutcome: '{"alg":"none","typ":"JWT"}',
        validationHint: 'alg:none allows unsigned token forgery.',
      },
      {
        id: 's3',
        title: 'Recommend fixes',
        instruction: 'List 3 remediation steps for this JWT configuration.',
        expectedOutcome: 'RS256/ES256, short expiry, role-based claims validation',
      },
    ],
  },
  {
    id: 'aaism-d3-log-grep',
    certId: 'aaism',
    domainId: 3,
    title: 'Model Inference Log Anomaly Hunt',
    description: 'Grep ML inference logs for anomalous request patterns indicating abuse or data exfiltration.',
    type: 'command',
    difficulty: 'hard',
    estimatedMinutes: 20,
    tags: ['logs', 'monitoring'],
    steps: [
      {
        id: 's1',
        title: 'Find high-volume callers',
        instruction: 'Count requests per client IP in the sample log.',
        command: 'grep "inference" ml_api.log | awk \'{print $4}\' | sort | uniq -c | sort -rn | head -5',
        expectedOutcome: 'IP 10.0.0.99 appears with unusually high count',
      },
      {
        id: 's2',
        title: 'Detect prompt injection attempts',
        instruction: 'Search logs for injection patterns in user prompts.',
        command: 'grep -iE "ignore previous|system prompt|jailbreak|<script>" ml_api.log',
        expectedOutcome: 'At least one injection attempt logged',
      },
      {
        id: 's3',
        title: 'Identify error spike',
        instruction: 'Find timestamps with HTTP 500 errors clustered together.',
        command: 'grep " 500 " ml_api.log | cut -d" " -f1-2 | uniq -c | sort -rn | head -3',
        expectedOutcome: 'Error cluster around model version v2.1 deploy',
      },
    ],
    sampleData: `2026-06-18 14:02:11 inference 10.0.0.99 POST /v1/chat 200 45ms
2026-06-18 14:02:12 inference 10.0.0.99 POST /v1/chat 200 42ms
2026-06-18 14:02:13 inference 10.0.0.12 POST /v1/chat 200 120ms prompt="ignore previous instructions"
2026-06-18 14:05:00 inference 10.0.0.99 POST /v1/chat 500 890ms model=v2.1
2026-06-18 14:05:01 inference 10.0.0.99 POST /v1/chat 500 901ms model=v2.1`,
  },
  {
    id: 'aaism-d4-incident-response',
    certId: 'aaism',
    domainId: 4,
    title: 'AI Model Poisoning Incident Response',
    description: 'Walk through an AI ops incident: suspected training data poisoning detected in production drift alerts.',
    type: 'decision',
    difficulty: 'hard',
    estimatedMinutes: 25,
    tags: ['incident-response', 'operations'],
    mitreTechniques: ['AML.T0020', 'AML.T0018'],
    decisions: [
      {
        id: 'd1',
        situation: 'Drift monitor shows 40% accuracy drop on fraud detection model. SOC ticket opened.',
        question: 'What is your FIRST action?',
        options: [
          'Immediately retrain the model on latest data',
          'Isolate the model endpoint and preserve logs/artifacts',
          'Notify marketing about service degradation',
          'Run a full penetration test on the ML pipeline',
        ],
        correctIndex: 1,
        explanation: 'Preserve evidence and stop potential poisoned inference before retraining or testing.',
      },
      {
        id: 'd2',
        situation: 'Forensics shows an unauthorized commit to the training data bucket 72 hours ago.',
        question: 'Who do you escalate to NEXT?',
        options: [
          'Legal and AI governance board only',
          'MLOps lead + CISO + data owner for joint investigation',
          'External PR firm',
          'End users via public blog post',
        ],
        correctIndex: 1,
        explanation: 'Cross-functional escalation: technical (MLOps), security (CISO), and data accountability.',
      },
      {
        id: 'd3',
        situation: 'Clean backup model available from 7 days ago. Business wants fast restore.',
        question: 'Best recovery approach?',
        options: [
          'Rollback to backup model after integrity verification',
          'Deploy latest retrain without validation to save time',
          'Disable fraud detection entirely until audit completes',
          'Switch to rule-based system permanently',
        ],
        correctIndex: 0,
        explanation: 'Verified rollback balances recovery speed with assurance the backup is uncompromised.',
      },
    ],
  },
];
