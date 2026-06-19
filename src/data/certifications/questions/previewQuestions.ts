import type { ExamQuestion } from '../../examContent';

type Seed = Omit<ExamQuestion, 'id'> & { idSuffix: string };

function q(seed: Seed): ExamQuestion {
  return { ...seed, id: `pv${seed.certId}.${seed.domain}.${seed.idSuffix}` };
}

const SEEDS: Seed[] = [
  // ===== CISSP (8 domains, 6 questions) =====
  {
    idSuffix: '01', certId: 'cissp', domain: 1, topic: 'Risk Treatment', difficulty: 'medium',
    question: 'A CISO must reduce residual risk for a critical SaaS platform after a third-party assessment. Which action BEST aligns with risk treatment?',
    options: ['Accept all findings without documentation', 'Implement compensating controls and transfer remaining risk via cyber insurance', 'Ignore vendor findings until contract renewal', 'Disable the SaaS platform permanently'],
    correctAnswer: 1, explanation: 'Risk treatment combines mitigation (controls) with transfer (insurance) when residual risk remains acceptable per policy.',
  },
  {
    idSuffix: '02', certId: 'cissp', domain: 2, topic: 'Data Classification', difficulty: 'easy',
    question: 'An employee stores customer PII on an unencrypted USB drive. What is the FIRST governance response?',
    options: ['Terminate the employee immediately', 'Classify the data, enforce handling rules, and remediate the exposure', 'Ban all USB devices company-wide without analysis', 'Publish the incident on social media'],
    correctAnswer: 1, explanation: 'Asset security starts with classification and policy enforcement, then targeted remediation — not blanket bans without assessment.',
  },
  {
    idSuffix: '03', certId: 'cissp', domain: 3, topic: 'Zero Trust', difficulty: 'medium',
    question: 'Which principle is MOST central to a zero-trust architecture?',
    options: ['Implicit trust inside the corporate LAN', 'Continuous verification regardless of network location', 'Single perimeter firewall as primary control', 'Shared admin credentials for speed'],
    correctAnswer: 1, explanation: 'Zero trust assumes no implicit trust zone — every access request is authenticated, authorized, and encrypted continuously.',
  },
  {
    idSuffix: '04', certId: 'cissp', domain: 4, topic: 'TLS', difficulty: 'medium',
    question: 'A web app shows certificate warnings after a server migration. What should be verified FIRST?',
    options: ['DNS TTL settings only', 'Certificate chain, hostname match, and intermediate CA configuration', 'Employee password complexity', 'Physical rack labeling'],
    correctAnswer: 1, explanation: 'TLS failures after migration usually involve incomplete chains, wrong hostname (SAN), or misconfigured intermediates.',
  },
  {
    idSuffix: '05', certId: 'cissp', domain: 5, topic: 'Federation', difficulty: 'hard',
    question: 'A multinational firm wants employees to use one identity across SaaS apps without storing passwords in each app. Which approach is BEST?',
    options: ['SAML/OIDC federation with centralized IdP', 'Duplicate LDAP accounts per application', 'Email password resets weekly', 'Shared service account for all users'],
    correctAnswer: 0, explanation: 'Federated identity (SAML/OIDC) centralizes authentication at an IdP while apps trust assertions — standard enterprise IAM pattern.',
  },
  {
    idSuffix: '06', certId: 'cissp', domain: 6, topic: 'Pen Test Scope', difficulty: 'medium',
    question: 'Before a penetration test on production, what is the MOST important prerequisite?',
    options: ['Posting scope on public bug bounty site', 'Signed rules of engagement defining scope, timing, and emergency contacts', 'Running exploits without notifying ops', 'Testing only after a breach occurs'],
    correctAnswer: 1, explanation: 'Rules of engagement legally and operationally define boundaries, authorization, and stop procedures — mandatory before testing.',
  },

  // ===== Security+ (5 questions) =====
  {
    idSuffix: '01', certId: 'security-plus', domain: 2, topic: 'Phishing', difficulty: 'easy',
    question: 'Users report emails impersonating IT asking for MFA codes. What is the BEST immediate response?',
    options: ['Disable MFA for all users', 'Block sender domains, alert users, and enforce reported-message workflow', 'Ignore reports until volume increases', 'Publish internal passwords for verification'],
    correctAnswer: 1, explanation: 'Phishing response combines technical blocks, user awareness, and a reporting channel — MFA stays enabled.',
  },
  {
    idSuffix: '02', certId: 'security-plus', domain: 1, topic: 'Defense in Depth', difficulty: 'easy',
    question: 'Which scenario BEST demonstrates defense in depth?',
    options: ['Single antivirus on endpoints only', 'Firewall + patching + EDR + user training for the same asset', 'Security policy document without technical controls', 'Disabling unused ports only'],
    correctAnswer: 1, explanation: 'Defense in depth layers heterogeneous controls so one failure does not compromise the entire asset.',
  },
  {
    idSuffix: '03', certId: 'security-plus', domain: 3, topic: 'Segmentation', difficulty: 'medium',
    question: 'A flat network allows lateral movement after one workstation compromise. What control MOST reduces blast radius?',
    options: ['Network segmentation with VLANs and ACLs', 'Longer password expiration', 'Brighter monitor settings', 'Removing all logging'],
    correctAnswer: 0, explanation: 'Segmentation limits lateral movement by restricting traffic between zones — core architecture control.',
  },
  {
    idSuffix: '04', certId: 'security-plus', domain: 4, topic: 'SIEM', difficulty: 'medium',
    question: 'SOC analysts see thousands of alerts daily with few true positives. What should be improved FIRST?',
    options: ['Turn off the SIEM', 'Tune correlation rules and integrate threat intel feeds', 'Delete historical logs', 'Add more alerts without tuning'],
    correctAnswer: 1, explanation: 'Alert fatigue is addressed through rule tuning, context enrichment, and prioritization — not disabling monitoring.',
  },
  {
    idSuffix: '05', certId: 'security-plus', domain: 5, topic: 'Incident Response', difficulty: 'medium',
    question: 'During containment of a ransomware event, what is the MOST appropriate FIRST step?',
    options: ['Pay ransom immediately', 'Isolate affected systems and preserve evidence', 'Reimage all servers without documentation', 'Announce breach details publicly before analysis'],
    correctAnswer: 1, explanation: 'Containment isolates spread while preserving forensic evidence for investigation and legal requirements.',
  },

  // ===== CEH (5 questions) =====
  {
    idSuffix: '01', certId: 'ceh', domain: 1, topic: 'OSINT', difficulty: 'easy',
    question: 'During authorized recon, which source is LEAST likely to violate passive gathering ethics?',
    options: ['Scanning target IPs with SYN flood', 'Reviewing public job postings for tech stack hints', 'Exploiting a production login page', 'Installing malware on employee devices'],
    correctAnswer: 1, explanation: 'Passive OSINT uses publicly available information without directly interacting aggressively with target systems.',
  },
  {
    idSuffix: '02', certId: 'ceh', domain: 2, topic: 'Port Scanning', difficulty: 'medium',
    question: 'A stealth scan shows filtered ports on a target. What does "filtered" typically indicate?',
    options: ['Port is open and accepting connections', 'Firewall or ACL is dropping or rejecting probes', 'Target has no network interface', 'DNS misconfiguration'],
    correctAnswer: 1, explanation: 'Filtered means a filtering device is interfering with probe packets — common firewall behavior.',
  },
  {
    idSuffix: '03', certId: 'ceh', domain: 3, topic: 'Password Attacks', difficulty: 'medium',
    question: 'After obtaining hashed passwords from a lab dump, which attack is MOST effective against weak user passwords?',
    options: ['Rainbow tables or GPU-accelerated brute force with rules', 'Sending more phishing emails', 'Changing MAC addresses', 'ARP spoofing the gateway'],
    correctAnswer: 0, explanation: 'Offline hash cracking with dictionaries, rules, and GPUs defeats weak passwords — standard credential attack.',
  },
  {
    idSuffix: '04', certId: 'ceh', domain: 4, topic: 'Social Engineering', difficulty: 'easy',
    question: 'An attacker tailgates into a secure area wearing a fake vendor badge. Which control BEST prevents this?',
    options: ['Mantrap with badge reader and anti-passback', 'Larger warning signs only', 'Open doors for convenience', 'Removing cameras'],
    correctAnswer: 0, explanation: 'Physical controls like mantraps and anti-passback enforce single authorized entry — defeats tailgating.',
  },
  {
    idSuffix: '05', certId: 'ceh', domain: 5, topic: 'SQL Injection', difficulty: 'hard',
    question: 'A web form returns database errors in responses. What is the BEST remediation?',
    options: ['Display verbose errors to users', 'Parameterized queries and input validation with generic error messages', 'Block all SQL keywords in URLs only', 'Disable HTTPS'],
    correctAnswer: 1, explanation: 'Parameterized queries prevent injection; generic errors avoid leaking schema details to attackers.',
  },

  // ===== CAIS (5 questions) =====
  {
    idSuffix: '01', certId: 'cais', domain: 1, topic: 'Model Extraction', difficulty: 'medium',
    question: 'An API exposes model predictions with high query limits. Which AI threat is MOST concerning?',
    options: ['Model extraction via systematic querying', 'Slow page load times', 'Expired TLS certificates only', 'Missing favicon'],
    correctAnswer: 0, explanation: 'Unlimited or high-volume API access enables attackers to reconstruct model behavior — model extraction risk.',
  },
  {
    idSuffix: '02', certId: 'cais', domain: 2, topic: 'Training Data', difficulty: 'medium',
    question: 'A team trains on scraped web data without review. What secure-development practice was skipped FIRST?',
    options: ['GPU driver updates', 'Data provenance review and toxic/bias screening', 'Choosing a larger model', 'Adding more layers'],
    correctAnswer: 1, explanation: 'Secure AI development requires curated datasets with provenance, licensing, and harmful content screening.',
  },
  {
    idSuffix: '03', certId: 'cais', domain: 3, topic: 'EU AI Act', difficulty: 'medium',
    question: 'A high-risk AI hiring system is deployed in the EU. Which governance action is MANDATORY?',
    options: ['Optional blog post about AI ethics', 'Conformity documentation, risk management, and human oversight measures', 'Deleting all training logs', 'Using only open-source models without assessment'],
    correctAnswer: 1, explanation: 'High-risk AI under EU AI Act requires documented risk management, transparency, and oversight — not optional ethics posts.',
  },
  {
    idSuffix: '04', certId: 'cais', domain: 4, topic: 'MLOps Monitoring', difficulty: 'hard',
    question: 'Production model accuracy drifts after a data pipeline change. What operational control should have caught this FIRST?',
    options: ['Annual pen test only', 'Continuous model performance and data drift monitoring with alerts', 'Disabling all logging', 'Manual spot checks once per year'],
    correctAnswer: 1, explanation: 'MLOps monitoring tracks drift, performance degradation, and data quality — catches pipeline-induced drift early.',
  },
  {
    idSuffix: '05', certId: 'cais', domain: 1, topic: 'Prompt Injection', difficulty: 'medium',
    question: 'A support chatbot reads user emails and executes suggested actions. Which attack vector is PRIMARY?',
    options: ['Prompt injection causing unauthorized tool invocation', 'CSS injection in marketing site', 'BGP hijacking', 'Bluetooth pairing attacks'],
    correctAnswer: 0, explanation: 'Agents with tool access are vulnerable to indirect prompt injection via untrusted content in emails or documents.',
  },

  // ===== CBSP (5 questions) =====
  {
    idSuffix: '01', certId: 'cbsp', domain: 1, topic: 'Immutability', difficulty: 'easy',
    question: 'What property of blockchain MOST supports audit integrity for transaction history?',
    options: ['Mutable centralized database', 'Cryptographic chaining making tampering detectable', 'Anonymous founders', 'Unlimited token supply'],
    correctAnswer: 1, explanation: 'Hash-linked blocks make altering history computationally evident — core integrity property.',
  },
  {
    idSuffix: '02', certId: 'cbsp', domain: 2, topic: 'Reentrancy', difficulty: 'hard',
    question: 'A DeFi contract loses funds when an external call re-enters before state updates. Which vulnerability class applies?',
    options: ['Reentrancy attack', 'DNS cache poisoning', 'Cross-site scripting', 'Rowhammer'],
    correctAnswer: 0, explanation: 'Reentrancy exploits recursive external calls before balance/state updates — famous smart contract flaw.',
  },
  {
    idSuffix: '03', certId: 'cbsp', domain: 3, topic: '51% Attack', difficulty: 'medium',
    question: 'An attacker controls majority hash power on a PoW network. What can they MOST likely do?',
    options: ['Rewrite recent history and double-spend', 'Decrypt all wallet private keys instantly', 'Shut down the internet', 'Bypass TLS on web2 sites'],
    correctAnswer: 0, explanation: 'Majority hash power enables block reordering and double-spend attacks on PoW chains.',
  },
  {
    idSuffix: '04', certId: 'cbsp', domain: 4, topic: 'Key Custody', difficulty: 'medium',
    question: 'A startup stores hot wallet keys in a shared Slack channel. What is the BEST remediation?',
    options: ['Move keys to HSM or MPC custody with role-based access', 'Post keys in email instead', 'Use the same key for all chains forever', 'Print keys on office posters'],
    correctAnswer: 0, explanation: 'Enterprise key custody uses HSMs, MPC, or hardware wallets — never shared chat channels.',
  },
  {
    idSuffix: '05', certId: 'cbsp', domain: 2, topic: 'Oracle Manipulation', difficulty: 'medium',
    question: 'A lending protocol relies on a single price oracle. Which risk is MOST acute?',
    options: ['Oracle manipulation causing wrongful liquidations', 'Slow block times only', 'High gas fees on Sundays', 'Missing whitepaper diagrams'],
    correctAnswer: 0, explanation: 'Single-oracle dependence enables flash-loan price manipulation attacks against DeFi protocols.',
  },

  // ===== QIST Quantum (3 preview questions) =====
  {
    idSuffix: '01', certId: 'qist', domain: 1, topic: 'PQC Migration', difficulty: 'medium',
    question: 'An enterprise must plan for harvest-now-decrypt-later threats. What is the FIRST cryptographic action?',
    options: ['Disable all encryption temporarily', 'Inventory crypto assets and prioritize hybrid/PQC migration for long-lived data', 'Wait until quantum computers are commercially sold', 'Switch to MD5 for speed'],
    correctAnswer: 1, explanation: 'PQC migration starts with crypto inventory and protecting long-lived secrets against future quantum decryption.',
  },
  {
    idSuffix: '02', certId: 'qist', domain: 1, topic: 'QKD Basics', difficulty: 'easy',
    question: 'Quantum Key Distribution (QKD) primarily provides:',
    options: ['Detection of eavesdropping on key exchange', 'Unlimited bandwidth', 'Replacement of all blockchains', 'Automatic malware removal'],
    correctAnswer: 0, explanation: 'QKD uses quantum properties to detect interception during key establishment — not general malware defense.',
  },
  {
    idSuffix: '03', certId: 'qist', domain: 1, topic: 'NIST PQC', difficulty: 'medium',
    question: 'NIST selected lattice-based algorithms for general encryption standards primarily because they:',
    options: ['Are vulnerable to classical attacks only', 'Show resistance to known quantum attacks with practical performance', 'Require no key management', 'Eliminate need for TLS'],
    correctAnswer: 1, explanation: 'NIST PQC winners balance quantum resistance with deployable performance — lattice schemes lead general encryption.',
  },
];

export const PREVIEW_CERT_QUESTIONS: ExamQuestion[] = SEEDS.map(q);
