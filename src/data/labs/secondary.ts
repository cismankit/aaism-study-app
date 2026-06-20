import type { LabDefinition } from './types';

/** Two labs per secondary cert track */
export const SECONDARY_CERT_LABS: LabDefinition[] = [
  // Security+
  {
    id: 'secplus-d2-vuln-scan',
    certId: 'security-plus',
    domainId: 2,
    title: 'Vulnerability Scan Interpretation',
    description: 'Review Nessus-style output and prioritize remediation.',
    type: 'analysis',
    difficulty: 'easy',
    estimatedMinutes: 15,
    sampleData: `CVE-2024-1234 | Critical | Apache 2.4.49 | CVSS 9.8
CVE-2024-5678 | High     | OpenSSL 1.1.1  | CVSS 7.5
CVE-2024-9012 | Medium   | SSH banner     | CVSS 5.3`,
    analysisQuestions: [
      { id: 'q1', question: 'Which CVE should be patched first and why?', expectedKeywords: ['CVE-2024-1234', 'Critical', '9.8'], sampleAnswer: 'CVE-2024-1234 — Critical Apache RCE' },
      { id: 'q2', question: 'What compensating control if patch window is 72 hours?', expectedKeywords: ['WAF', 'segment', 'monitor'], sampleAnswer: 'WAF rule + network segmentation + enhanced monitoring' },
    ],
  },
  {
    id: 'secplus-d4-log-review',
    certId: 'security-plus',
    domainId: 4,
    title: 'Firewall Log Review',
    description: 'Grep firewall logs for blocked outbound C2 traffic.',
    type: 'command',
    difficulty: 'medium',
    estimatedMinutes: 15,
    steps: [
      { id: 's1', title: 'Find blocked outbound', instruction: 'Filter DENY outbound on port 443 to unknown IPs.', command: 'grep "DENY.*OUT.*443" fw.log | tail -10', expectedOutcome: 'Repeated blocks to 185.x.x.x' },
      { id: 's2', title: 'Identify source host', instruction: 'Extract internal source IP from blocked entries.', command: 'grep "185." fw.log | awk \'{print $3}\' | sort | uniq -c', expectedOutcome: '10.0.2.55 is primary source' },
    ],
  },
  // CEH
  {
    id: 'ceh-d1-osint-recon',
    certId: 'ceh',
    domainId: 1,
    title: 'Passive OSINT Recon',
    description: 'Use curl and dig for passive domain recon on authorized targets.',
    type: 'command',
    difficulty: 'easy',
    estimatedMinutes: 15,
    steps: [
      { id: 's1', title: 'DNS records', instruction: 'Query MX and TXT records for lab domain.', command: 'dig +short MX lab-target.example.com; dig +short TXT lab-target.example.com', expectedOutcome: 'MX and SPF/DMARC records returned' },
      { id: 's2', title: 'HTTP headers', instruction: 'Fetch server headers without aggressive scanning.', command: 'curl -sI https://lab-target.example.com', expectedOutcome: 'Server, X-Powered-By headers captured' },
    ],
  },
  {
    id: 'ceh-d2-port-analysis',
    certId: 'ceh',
    domainId: 2,
    title: 'Scan Results Analysis',
    description: 'Interpret nmap output and map findings to attack vectors.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 15,
    sampleData: `PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2
80/tcp   open  http    nginx 1.18
3306/tcp open  mysql   MySQL 5.7
8080/tcp open  http-proxy`,
    analysisQuestions: [
      { id: 'q1', question: 'Which open port poses highest risk and why?', expectedKeywords: ['3306', 'MySQL', 'database'], sampleAnswer: '3306/MySQL — exposed database, potential cred brute force' },
      { id: 'q2', question: 'Next enumeration step for port 8080?', expectedKeywords: ['directory', 'proxy', 'banner', 'nikto'], sampleAnswer: 'Directory enumeration and proxy misconfig check' },
    ],
  },
  // CAIS
  {
    id: 'cais-d1-threat-model',
    certId: 'cais',
    domainId: 1,
    title: 'AI Threat Model STRIDE',
    description: 'Apply STRIDE to an LLM chatbot architecture diagram.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 20,
    sampleData: `Components: User → API Gateway → LLM → Vector DB → Training Pipeline`,
    analysisQuestions: [
      { id: 'q1', question: 'Identify one Spoofing threat in this architecture.', expectedKeywords: ['JWT', 'API key', 'identity', 'spoof'], sampleAnswer: 'Stolen API keys spoofing legitimate users' },
      { id: 'q2', question: 'Identify one Tampering threat to the Vector DB.', expectedKeywords: ['poison', 'embed', 'inject', 'RAG'], sampleAnswer: 'Poisoned embeddings in RAG retrieval' },
    ],
  },
  {
    id: 'cais-d2-secure-pipeline',
    certId: 'cais',
    domainId: 2,
    title: 'ML Pipeline Security Checklist',
    description: 'Verify secure ML CI/CD controls via command-line checks.',
    type: 'command',
    difficulty: 'medium',
    estimatedMinutes: 15,
    steps: [
      { id: 's1', title: 'Check model signing', instruction: 'Verify model artifact has signature file.', command: 'ls -la models/production/ | grep -E "\\.sig|\\.sigstore"', expectedOutcome: 'Signature file present or gap documented' },
      { id: 's2', title: 'Scan dependencies', instruction: 'Run pip audit or equivalent on requirements.', command: 'pip audit -r requirements.txt 2>/dev/null | head -5', expectedOutcome: 'Known CVEs listed or clean report' },
    ],
  },
  // CBSP
  {
    id: 'cbsp-d2-contract-audit',
    certId: 'cbsp',
    domainId: 2,
    title: 'Smart Contract Vulnerability Hunt',
    description: 'Review Solidity snippet for common vulnerabilities.',
    type: 'analysis',
    difficulty: 'hard',
    estimatedMinutes: 20,
    sampleData: `function withdraw(uint amount) public {
  require(balances[msg.sender] >= amount);
  (bool ok,) = msg.sender.call{value: amount}("");
  require(ok);
  balances[msg.sender] -= amount;
}`,
    analysisQuestions: [
      { id: 'q1', question: 'What vulnerability pattern is present?', expectedKeywords: ['reentrancy', 'CEI', 'checks-effects'], sampleAnswer: 'Reentrancy — state update after external call' },
      { id: 'q2', question: 'How would you fix it?', expectedKeywords: ['effects', 'interactions', 'ReentrancyGuard'], sampleAnswer: 'Checks-Effects-Interactions: update balance before call' },
    ],
  },
  {
    id: 'cbsp-d4-key-custody',
    certId: 'cbsp',
    domainId: 4,
    title: 'Wallet Key Management Review',
    description: 'Evaluate a key custody policy against best practices.',
    type: 'decision',
    difficulty: 'medium',
    estimatedMinutes: 15,
    decisions: [
      {
        id: 'd1',
        situation: 'Startup stores hot wallet private key in AWS Secrets Manager with single IAM user access.',
        question: 'Primary risk?',
        options: ['Key too short', 'Single point of failure — no MPC/HSM', 'Blockchain immutability', 'Gas fees too high'],
        correctIndex: 1,
        explanation: 'Single IAM user with hot key access lacks multi-party control and HSM protection.',
      },
      {
        id: 'd2',
        situation: 'Enterprise needs to sign 1000 tx/day programmatically.',
        question: 'Best architecture?',
        options: ['Paper wallet in safe', 'HSM-backed MPC with policy engine', 'Share key via Slack', 'Store in .env file'],
        correctIndex: 1,
        explanation: 'HSM + MPC balances automation with key security.',
      },
    ],
  },
  // QIST
  {
    id: 'qist-d1-pqc-assessment',
    certId: 'qist',
    domainId: 1,
    title: 'Post-Quantum Crypto Inventory',
    description: 'Identify algorithms vulnerable to Shor\'s algorithm in a crypto inventory.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 15,
    sampleData: `Asset              | Algorithm
TLS Web Server      | RSA-2048
Internal VPN        | ECDH P-256
Code Signing        | RSA-4096
Database TDE        | AES-256-GCM`,
    analysisQuestions: [
      { id: 'q1', question: 'Which assets are quantum-vulnerable (public-key)?', expectedKeywords: ['RSA', 'ECDH', 'TLS', 'VPN', 'Code Signing'], sampleAnswer: 'RSA-2048, ECDH P-256, RSA-4096 — not AES-256' },
      { id: 'q2', question: 'NIST PQC candidate for TLS replacement?', expectedKeywords: ['ML-KEM', 'Kyber', 'ML-DSA', 'Dilithium'], sampleAnswer: 'ML-KEM (Kyber) for key exchange, ML-DSA for signatures' },
    ],
  },
  {
    id: 'qist-d1-qkd-basics',
    certId: 'qist',
    domainId: 1,
    title: 'QKD Link Budget Analysis',
    description: 'Calculate whether a QKD deployment meets distance requirements.',
    type: 'command',
    difficulty: 'easy',
    estimatedMinutes: 10,
    steps: [
      { id: 's1', title: 'Check fiber loss', instruction: 'Calculate loss at 0.2 dB/km for 50km link.', command: 'echo "50 * 0.2" | bc', expectedOutcome: '10 dB total fiber loss' },
      { id: 's2', title: 'Compare to QKD limit', instruction: 'Document if 10 dB is within typical QKD receiver threshold (~20-25 dB).', expectedOutcome: 'Link feasible with margin', validationHint: 'Most QKD systems work up to ~100km depending on technology.' },
    ],
  },
];
