import type { DomainGuide } from '../../../aaismDomainGuide';

export const CEH_DOMAIN_GUIDES: DomainGuide[] = [
  {
    id: 1,
    shortName: 'Recon',
    name: 'Reconnaissance & Footprinting',
    weight: '20%',
    overview:
      'Domain 1 covers passive and active information gathering — OSINT, DNS, email harvesting, and social footprinting. CEH tests methodology and ethics: authorized scope, minimal footprint, and actionable reporting.',
    learningObjectives: [
      'Differentiate passive vs. active reconnaissance techniques',
      'Use OSINT sources: WHOIS, DNS, search engines, social media, breach data',
      'Document footprint findings for targeted scanning phases',
      'Apply countermeasures awareness: data minimization and awareness training',
    ],
    coreConcepts: [
      {
        title: 'Passive vs. Active Recon',
        summary: 'Passive avoids direct target interaction; active probes systems and may be logged.',
        detail: 'Job postings, WHOIS, and cached pages are passive. Port scans and banner grabs are active — require explicit ROE authorization.',
      },
      {
        title: 'DNS & WHOIS Footprinting',
        summary: 'Map infrastructure via records, zone transfers, and registration history.',
        detail: 'A successful zone transfer (AXFR) is a critical misconfiguration. Subdomain enumeration expands attack surface mapping.',
      },
    ],
    frameworks: [
      { name: 'EC-Council CEH Methodology', relevance: 'Recon phase before scanning', examWeight: 'high' },
      { name: 'OSSTMM', relevance: 'Operational security metrics for testing', examWeight: 'medium' },
    ],
    examPatterns: [
      { keyword: 'FIRST', prompt: 'Authorized assessment begins — no scanning yet.', answerLogic: 'FIRST = passive footprinting and OSINT within scope.' },
      { keyword: 'LEAST', prompt: 'Which action violates passive ethics?', answerLogic: 'LEAST invasive = public sources; avoid exploitation or malware.' },
    ],
    trapAlerts: [
      { title: 'Skip Authorization', trap: 'Scanning before written approval.', correctApproach: 'Rules of engagement and scope are mandatory before active steps.' },
    ],
    applyIt: {
      scenario: 'Client wants external attack surface mapped before pen test.',
      orgAction: 'Passive OSINT, DNS/WHOIS review, employee oversharing audit, then scoped active scans with client approval.',
    },
    relatedFeatures: [
      { label: 'OSINT Arsenal', route: '/osint', description: 'Recon tools and sources' },
      { label: 'Study Ops', route: '/study', description: 'Domain 1 practice questions' },
    ],
  },
  {
    id: 2,
    shortName: 'Scanning',
    name: 'Scanning & Enumeration',
    weight: '20%',
    overview:
      'Domain 2 maps live systems — port scanning, service/version detection, and protocol enumeration (SMB, SNMP, LDAP). Know Nmap scan types and interpret open, closed, filtered states.',
    learningObjectives: [
      'Select appropriate scan types: SYN, connect, UDP, stealth considerations',
      'Enumerate services, shares, users, and SNMP/LDAP when misconfigured',
      'Correlate scan results to vulnerability research and next-phase testing',
    ],
    coreConcepts: [
      {
        title: 'Nmap Scan Types',
        summary: 'SYN (-sS), connect (-sT), UDP (-sU) — trade speed, stealth, and privileges.',
        detail: 'Filtered ports indicate firewalls. Open|filtered is common on UDP. Service version detection (-sV) maps banners to CVE research.',
      },
    ],
    frameworks: [
      { name: 'Nmap', relevance: 'Primary scanning tool taxonomy', examWeight: 'high' },
    ],
    examPatterns: [
      { keyword: 'MOST', prompt: 'Filtered ports on SYN scan.', answerLogic: 'MOST likely = firewall/ACL interference.' },
    ],
    trapAlerts: [
      { title: 'UDP Ambiguity', trap: 'Treating all open|filtered UDP as confirmed open.', correctApproach: 'Validate with protocol-specific probes or app tests.' },
    ],
    applyIt: {
      scenario: 'Scan shows SMB open on dozens of hosts.',
      orgAction: 'Enumerate versions/shares within scope, map to hardening baseline, report anonymous access and legacy SMB.',
    },
    relatedFeatures: [
      { label: 'Scenario Lab', route: '/scenarios', description: 'Scanning decision drills' },
      { label: 'Study Ops', route: '/study', description: 'Domain 2 questions' },
    ],
  },
  {
    id: 3,
    shortName: 'Hacking',
    name: 'System Hacking',
    weight: '20%',
    overview:
      'Domain 3 covers gaining and escalating access — password attacks, exploits, pivoting, and covering tracks (ethically). Distinguish online vs. offline cracking and lateral movement techniques.',
    learningObjectives: [
      'Execute password attacks: dictionary, brute force, rainbow tables, pass-the-hash',
      'Identify privilege escalation paths on Windows and Linux',
      'Document lateral movement and persistence risks for remediation',
    ],
    coreConcepts: [
      {
        title: 'Offline Hash Cracking',
        summary: 'Extracted hashes cracked with GPU/rules without account lockout.',
        detail: 'NTLM, bcrypt, and salted hashes require appropriate cracking strategy. Pass-the-hash avoids cracking entirely on NTLM-enabled systems.',
      },
    ],
    frameworks: [
      { name: 'MITRE ATT&CK', relevance: 'Credential access and lateral movement tactics', examWeight: 'medium' },
    ],
    examPatterns: [
      { keyword: 'MOST', prompt: 'Weak passwords, hashes obtained from dump.', answerLogic: 'MOST effective = offline GPU/rule-based cracking.' },
    ],
    trapAlerts: [
      { title: 'Unethical Persistence', trap: 'Leaving backdoors after demo without client consent.', correctApproach: 'Restore systems; document technique only within ROE.' },
    ],
    applyIt: {
      scenario: 'Initial foothold on workstation; domain admin is goal.',
      orgAction: 'Document privilege escalation paths, pass-the-hash risk, LAPS usage, tiered admin model recommendations.',
    },
    relatedFeatures: [
      { label: 'Playbooks', route: '/playbooks', description: 'Incident and hardening workflows' },
      { label: 'Study Ops', route: '/study', description: 'Domain 3 questions' },
    ],
  },
  {
    id: 4,
    shortName: 'Malware',
    name: 'Malware & Social Engineering',
    weight: '20%',
    overview:
      'Domain 4 spans malware types (virus, worm, trojan, ransomware, rootkit) and human manipulation (phishing, pretexting, tailgating). Controls combine technical and awareness layers.',
    learningObjectives: [
      'Classify malware by propagation and payload behavior',
      'Recognize social engineering pretexts and MFA bypass attempts',
      'Recommend layered controls: EDR, email filtering, physical access, training',
    ],
    coreConcepts: [
      {
        title: 'Malware Taxonomy',
        summary: 'Viruses need hosts; worms self-propagate; trojans disguise; ransomware encrypts.',
        detail: 'Rootkits hide at user or kernel level. RATs enable remote control. Map type to detection and response strategy.',
      },
    ],
    frameworks: [
      { name: 'NIST CSF Detect/Respond', relevance: 'Malware incident handling', examWeight: 'medium' },
    ],
    examPatterns: [
      { keyword: 'BEST', prompt: 'Tailgating into secure facility.', answerLogic: 'BEST control = mantrap, anti-passback, staffed reception.' },
    ],
    trapAlerts: [
      { title: 'MFA Code Sharing', trap: 'Treating IT cold-call OTP requests as legitimate.', correctApproach: 'Never share MFA codes; verify via known channel.' },
    ],
    applyIt: {
      scenario: 'Macro malware outbreak via email.',
      orgAction: 'Contain endpoints, block macros at gateway, user notification, EDR hunt, phishing report workflow reinforcement.',
    },
    relatedFeatures: [
      { label: 'Intel Hub', route: '/intel', description: 'Threat trends and patterns' },
      { label: 'Study Ops', route: '/study', description: 'Domain 4 questions' },
    ],
  },
  {
    id: 5,
    shortName: 'Web/Net',
    name: 'Web & Network Attacks',
    weight: '20%',
    overview:
      'Domain 5 covers application and network attacks — SQLi, XSS, CSRF, IDOR, MITM, DDoS, wireless evil twin. Emphasize secure coding plus compensating controls (WAF, CSP, 802.1X).',
    learningObjectives: [
      'Identify and remediate OWASP Top 10 class vulnerabilities',
      'Explain network attacks: ARP spoofing, DNS poisoning, DDoS',
      'Secure wireless with WPA3-Enterprise and rogue AP detection',
    ],
    coreConcepts: [
      {
        title: 'SQL Injection vs. XSS',
        summary: 'SQLi targets databases via input; XSS targets browsers via script injection.',
        detail: 'SQLi fix: parameterized queries. XSS fix: output encoding + CSP. CSRF fix: anti-CSRF tokens + SameSite cookies.',
      },
    ],
    frameworks: [
      { name: 'OWASP Top 10', relevance: 'Web application vulnerability classes', examWeight: 'high' },
    ],
    examPatterns: [
      { keyword: 'BEST', prompt: 'Verbose DB errors shown to users.', answerLogic: 'BEST = parameterized queries + generic errors.' },
    ],
    trapAlerts: [
      { title: 'WAF as Sole Fix', trap: 'Deploy WAF instead of fixing code.', correctApproach: 'Secure development primary; WAF is defense-in-depth.' },
    ],
    applyIt: {
      scenario: 'Public web app shows SQL errors and allows IDOR on account IDs.',
      orgAction: 'Emergency parameterization/sanitization, object-level authz, WAF tuning, pen test regression suite.',
    },
    relatedFeatures: [
      { label: 'Knowledge Base', route: '/knowledge', description: 'OWASP reference' },
      { label: 'Study Ops', route: '/study', description: 'Domain 5 questions' },
    ],
  },
];
