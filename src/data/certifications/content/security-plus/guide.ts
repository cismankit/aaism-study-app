import type { DomainGuide, TrapAlert } from '../../../aaismDomainGuide';

export interface CertDomainGuide extends DomainGuide {
  keyTopics: string[];
  examTraps: TrapAlert[];
  studyPath: string[];
}

const D1: CertDomainGuide = {
  id: 1,
  shortName: 'Concepts',
  name: 'General Security Concepts',
  weight: '12%',
  overview:
    'Domain 1 establishes vocabulary and mental models — CIA triad, zero trust, change management, cryptography basics, and security controls taxonomy. CompTIA Security+ scenarios often test whether you can map a situation to the correct control type or principle before naming a product.',
  learningObjectives: [
    'Explain confidentiality, integrity, availability and their supporting concepts',
    'Compare security control categories: technical, managerial, operational, physical',
    'Describe zero trust, deception, and automation in modern security architecture',
    'Apply change management and configuration management fundamentals',
    'Explain fundamental cryptographic concepts and use cases',
    'Understand virtualization, containerization, and cloud shared responsibility',
  ],
  keyTopics: [
    'CIA triad and DAD / extended pillars (authenticity, non-repudiation)',
    'Control types: preventive, detective, corrective, deterrent, compensating',
    'Control categories: technical, managerial, operational, physical',
    'Zero trust principles and architecture pillars',
    'Change management: request, approve, test, implement, review',
    'Cryptography: symmetric vs asymmetric, hashing, salting, PKI basics',
    'Digital signatures and certificate use cases',
    'Virtualization, containers, and hypervisor types',
    'Cloud models: IaaS, PaaS, SaaS and shared responsibility',
    'Deception technology: honeypots, honeynets, honeyfiles',
  ],
  coreConcepts: [
    {
      title: 'Control Taxonomy',
      summary: 'Type describes function; category describes who/what implements it.',
      detail:
        'A firewall is technical + preventive. Security policy is managerial + preventive. Guard patrol is physical + detective. Exam stems ask for BEST control type — match function to scenario.',
    },
    {
      title: 'Zero Trust',
      summary: 'Verify explicitly, least privilege access, assume breach.',
      detail:
        'Replaces implicit LAN trust with identity-centric continuous verification — micro-segmentation and policy enforcement at every hop.',
    },
    {
      title: 'Shared Responsibility',
      summary: 'Cloud provider secures the cloud; customer secures what they put in it.',
      detail:
        'IaaS: customer patches OS. SaaS: provider patches app; customer configures identity and data classification. Misunderstanding scope causes breaches.',
    },
  ],
  frameworks: [
    { name: 'NIST CSF', relevance: 'Identify, Protect, Detect, Respond, Recover functions', examWeight: 'medium' },
    { name: 'CompTIA SSCP overlap', relevance: 'Baseline security vocabulary', examWeight: 'low' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Which scenario demonstrates defense in depth?',
      answerLogic: 'BEST = multiple heterogeneous control layers for the same asset — not single antivirus.',
    },
    {
      keyword: 'MOST',
      prompt: 'What is the MOST important step in change management?',
      answerLogic: 'MOST = documented approval and testing before production — not speed of deployment.',
    },
  ],
  trapAlerts: [
    {
      title: 'Product vs. Principle',
      trap: 'Naming a vendor when asked for control type or principle.',
      correctApproach: 'Answer with control category/type or security concept — product names are often distractors.',
    },
  ],
  examTraps: [
    {
      title: 'Confidentiality vs. Integrity',
      trap: 'Selecting encryption when data was altered not exposed.',
      correctApproach: 'Tampering is integrity — hashing/signatures detect alteration; encryption protects confidentiality.',
    },
    {
      title: 'SaaS Responsibility',
      trap: 'Assuming provider handles all security including IAM configuration.',
      correctApproach: 'Customer configures identity, access, and data handling in SaaS — not provider-only.',
    },
  ],
  studyPath: [
    'Build flashcards for control type vs. category with examples',
    'Practice mapping scenarios to CIA violations',
    'Review zero trust pillars and compare to traditional perimeter',
    'Study crypto use cases: which algorithm for which goal',
    'Memorize cloud service model responsibility splits',
  ],
  applyIt: {
    scenario: 'Startup moves email to SaaS and assumes vendor handles all security.',
    orgAction:
      'Configure MFA, DLP, retention, and admin roles; classify data; enable audit logging — customer responsibilities in SaaS model.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Security+ concepts drills' },
  ],
};

const D2: CertDomainGuide = {
  id: 2,
  shortName: 'Threats',
  name: 'Threats, Vulnerabilities, and Mitigations',
  weight: '22%',
  overview:
    'The largest Security+ domain — threat actors, attack types, vulnerabilities, indicators of compromise, and mitigations. Scenarios cover phishing, malware families, wireless attacks, application flaws, and social engineering. Know attack → mitigation pairs cold.',
  learningObjectives: [
    'Compare threat actors: script kiddies, insiders, nation-states, hacktivists',
    'Identify common attack types across network, wireless, application, and social vectors',
    'Explain vulnerability types and scanning concepts',
    'Apply mitigations: segmentation, hardening, patching, training',
    'Recognize indicators of compromise and attack frameworks',
    'Explain cryptography attacks and password attacks mitigations',
  ],
  keyTopics: [
    'Malware: virus, worm, trojan, ransomware, rootkit, logic bomb',
    'Social engineering: phishing, vishing, smishing, pretexting, baiting',
    'Network attacks: MITM, DNS poisoning, ARP spoofing, DDoS types',
    'Wireless: evil twin, deauth, WPA weaknesses, rogue AP',
    'Application: injection, XSS, CSRF, overflow, SSRF',
    'Password attacks: brute force, dictionary, rainbow tables, spraying',
    'Vulnerability scanning vs. penetration testing',
    'Hardening: baselines, patching, disable unnecessary services',
    'Indicators of compromise: hashes, IPs, behavioral anomalies',
    'MITRE ATT&CK tactics overview for SOC context',
  ],
  coreConcepts: [
    {
      title: 'Phishing Variants',
      summary: 'Delivery channel differs; mitigation combines tech and training.',
      detail:
        'Email phishing, vishing (voice), smishing (SMS). Spear phishing targets individuals; whaling targets executives. MFA and email filtering reduce impact; reporting workflows speed response.',
    },
    {
      title: 'Malware Behavior',
      summary: 'Propagation and persistence distinguish families — response differs.',
      detail:
        'Worms self-propagate; viruses need host. Ransomware encrypts for extortion. Rootkits hide at kernel level. Response: isolate, identify family, block C2, restore from clean backup.',
    },
    {
      title: 'Injection and XSS',
      summary: 'Untrusted input processed unsafely — server-side validation required.',
      detail:
        'SQLi manipulates queries; XSS executes script in victim browser. Mitigate with parameterized queries, output encoding, CSP, and input validation.',
    },
  ],
  frameworks: [
    { name: 'OWASP Top 10', relevance: 'Web application vulnerability categories', examWeight: 'high' },
    { name: 'MITRE ATT&CK', relevance: 'Adversary tactics and techniques taxonomy', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'Users report MFA fatigue push spam.',
      answerLogic: 'FIRST = block/report campaign, enforce number matching, educate users — not disable MFA.',
    },
  ],
  trapAlerts: [
    {
      title: 'Disable vs. Mitigate',
      trap: 'Turning off MFA or internet when phishing occurs.',
      correctApproach: 'Mitigate attack vector while preserving security controls — tune and train.',
    },
  ],
  examTraps: [
    {
      title: 'Worm vs. Virus',
      trap: 'Calling self-propagating network malware a virus.',
      correctApproach: 'Worms spread autonomously across networks; viruses attach to hosts/files.',
    },
    {
      title: 'Vuln Scan vs. Pentest',
      trap: 'Using scanner output as full security assurance.',
      correctApproach: 'Scans find known issues; pentests validate exploit chains and logic flaws.',
    },
  ],
  studyPath: [
    'Create attack-mitigation matrix for top 20 attack types',
    'Practice malware scenario identification from symptoms',
    'Drill wireless attack names and specific countermeasures',
    'Review OWASP Top 10 with one fix per category',
    'Study IoC types and basic SOC triage workflow',
  ],
  applyIt: {
    scenario: 'Help desk flooded with MFA approval prompts after credential phishing.',
    orgAction:
      'Revoke active sessions, reset creds, block phishing domains, deploy MFA number matching, and run targeted awareness on push fatigue.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Threats and mitigations drills' },
  ],
};

const D3: CertDomainGuide = {
  id: 3,
  shortName: 'Architecture',
  name: 'Security Architecture',
  weight: '18%',
  overview:
    'Secure network design — segmentation, VPNs, firewalls, proxies, load balancers, wireless architecture, cloud connectivity, and resilience. Security+ tests whether designs reduce attack surface and support availability requirements.',
  learningObjectives: [
    'Design secure network topologies with DMZ, segmentation, and ACLs',
    'Implement secure remote access and VPN solutions',
    'Configure firewalls, WAF, and proxy architectures',
    'Apply secure wireless and mobile deployment models',
    'Explain resilience: HA, clustering, load balancing, failover',
    'Integrate cloud and hybrid connectivity securely',
  ],
  keyTopics: [
    'Network zones: LAN, WAN, DMZ, extranet, air gap',
    'Firewall types: stateful, NGFW, WAF placement',
    'VPN: IPSec, SSL/TLS VPN, site-to-site vs remote access',
    'Proxies: forward, reverse, transparent, CASB',
    'NAC and 802.1X port-based access',
    'Load balancers, reverse proxies, and TLS termination',
    'SDN and network automation security implications',
    'Wireless architecture: controller-based, captive portal',
    'Cloud connectivity: VPC, peering, private endpoints',
    'Resilience: RAID, clustering, geographic dispersion',
  ],
  coreConcepts: [
    {
      title: 'DMZ Design',
      summary: 'Public-facing services isolated from internal LAN with controlled rules.',
      detail:
        'Web servers in DMZ; database on internal network; firewall rules allow only necessary paths. Dual-homed bastion or jump hosts for admin access.',
    },
    {
      title: 'Segmentation',
      summary: 'VLANs + ACLs limit lateral movement — flat networks fail this test.',
      detail:
        'Micro-segmentation in data centers; guest wireless isolated from corporate. East-west firewalling catches lateral movement.',
    },
  ],
  frameworks: [
    { name: 'CIS Controls', relevance: 'Network boundary and segmentation guidance', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Flat network allows lateral movement after workstation compromise.',
      answerLogic: 'BEST = segmentation with VLANs/ACLs — not password policy alone.',
    },
  ],
  trapAlerts: [
    {
      title: 'WAF vs. Firewall',
      trap: 'Using stateful firewall alone for OWASP Top 10 protection.',
      correctApproach: 'WAF addresses application-layer attacks; firewalls handle network layer — often both needed.',
    },
  ],
  examTraps: [
    {
      title: 'SSL VPN vs. IPSec',
      trap: 'Selecting IPSec when browser-only access to web apps suffices.',
      correctApproach: 'SSL/TLS VPN suits remote browser access; IPSec common for full tunnel site-to-site.',
    },
  ],
  studyPath: [
    'Draw reference architecture: internet → WAF → DMZ → internal',
    'Compare VPN types and split vs full tunnel tradeoffs',
    'Study NAC deployment and 802.1X flow',
    'Review HA patterns: active-active vs active-passive',
    'Practice cloud VPC security group scenario questions',
  ],
  applyIt: {
    scenario: 'E-commerce site needs public web tier and protected payment backend.',
    orgAction:
      'Place web in DMZ, payment API on internal segment, WAF in front, TLS everywhere, segment DB with no direct internet route.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Architecture practice' },
  ],
};

const D4: CertDomainGuide = {
  id: 4,
  shortName: 'SecOps',
  name: 'Security Operations',
  weight: '28%',
  overview:
    'The heaviest Security+ domain — logging, monitoring, incident response, forensics basics, automation, scripting for security, data sources, and endpoint detection. Operational scenarios test IR order, evidence handling, and SOC tooling.',
  learningObjectives: [
    'Implement logging, monitoring, and SIEM use cases',
    'Execute incident response phases and communication plans',
    'Apply basic digital forensics and evidence handling',
    'Use automation and orchestration (SOAR) concepts',
    'Configure endpoint detection and response workflows',
    'Perform vulnerability response and patch management operations',
  ],
  keyTopics: [
    'Log types: syslog, Windows event, NetFlow, API audit logs',
    'SIEM correlation, dashboards, and alert tuning',
    'IR phases: preparation, detection, analysis, containment, eradication, recovery',
    'Forensics: chain of custody, order of volatility, legal hold',
    'EDR/XDR capabilities vs traditional antivirus',
    'SOAR playbooks and automated enrichment',
    'Backup types and restoration testing',
    'Sandboxing suspicious files safely',
    'Threat intelligence feeds and STIX/TAXII basics',
    'Secure baselines and configuration drift detection',
  ],
  coreConcepts: [
    {
      title: 'IR Containment First',
      summary: 'Stop spread before deep forensics on ransomware and worm outbreaks.',
      detail:
        'Isolate affected hosts, preserve volatile evidence if feasible, block IOCs, then investigate scope. Document timeline for legal and compliance.',
    },
    {
      title: 'EDR vs. AV',
      summary: 'EDR provides behavioral detection, investigation, and response — beyond signatures.',
      detail:
        'Traditional AV matches known malware. EDR records endpoint telemetry, detects anomalies, supports rollback and hunt queries.',
    },
  ],
  frameworks: [
    { name: 'NIST SP 800-61', relevance: 'Incident handling guide', examWeight: 'high' },
    { name: 'SANS PICERL', relevance: 'IR lifecycle model', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'Ransomware on file server during business hours.',
      answerLogic: 'FIRST = isolate and preserve evidence — not pay ransom or mass reimage undocumented.',
    },
  ],
  trapAlerts: [
    {
      title: 'SIEM Off',
      trap: 'Disabling SIEM due to alert volume.',
      correctApproach: 'Tune rules and prioritize — maintain logging for compliance and investigation.',
    },
  ],
  examTraps: [
    {
      title: 'Backup Without Testing',
      trap: 'Assuming backups work because jobs show success.',
      correctApproach: 'Periodic restore tests validate RTO/RPO — silent backup corruption happens.',
    },
  ],
  studyPath: [
    'Memorize IR phases with ransomware example walkthrough',
    'Practice log source → use case mapping for SIEM',
    'Review chain of custody and order of volatility',
    'Study EDR investigation workflow vs antivirus-only',
    'Learn backup types: full, incremental, differential, immutable',
  ],
  applyIt: {
    scenario: 'SOC sees impossible travel login and data exfiltration alerts same hour.',
    orgAction:
      'Disable compromised sessions, force password reset, block exfil IPs, preserve logs, open IR ticket, and notify identity team for MFA review.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'SecOps drills' },
  ],
};

const D5: CertDomainGuide = {
  id: 5,
  shortName: 'Program',
  name: 'Security Program Management and Oversight',
  weight: '20%',
  overview:
    'Governance, risk, compliance, policies, third-party risk, awareness, and metrics. Security+ frames management questions for technicians who must understand why programs exist — policy hierarchy, risk registers, audits, and privacy regulations.',
  learningObjectives: [
    'Explain security governance and risk management concepts',
    'Develop and implement security policies and procedures',
    'Understand compliance frameworks: PCI, HIPAA, GDPR, SOX basics',
    'Manage third-party risk and vendor assessments',
    'Design security awareness and training programs',
    'Report security metrics to stakeholders',
  ],
  keyTopics: [
    'Policy hierarchy: policy, standard, procedure, guideline',
    'Risk management: identify, assess, mitigate, accept, transfer',
    'Compliance frameworks and audit types',
    'Privacy regulations: GDPR, CCPA, HIPAA overview',
    'Third-party/vendor risk assessments and SLAs',
    'Data roles and classification in governance',
    'Security awareness: phishing simulations, role-based training',
    'Metrics: KPIs vs KRIs for security programs',
    'Business impact analysis and continuity planning basics',
    'Pen test rules of engagement and scope',
  ],
  coreConcepts: [
    {
      title: 'Policy Stack',
      summary: 'Policies set mandatory rules; procedures document how to execute.',
      detail:
        'Standards define specific controls. Guidelines are recommended. Exam asks which document type fits a scenario — policy for management mandate, procedure for step-by-step.',
    },
    {
      title: 'Risk Register',
      summary: 'Documented risks with likelihood, impact, owner, and treatment.',
      detail:
        'Living artifact — not one-time spreadsheet. Drives prioritization of projects and audits.',
    },
  ],
  frameworks: [
    { name: 'ISO 27001 overview', relevance: 'ISMS and audit context', examWeight: 'medium' },
    { name: 'PCI-DSS', relevance: 'Payment card environment requirements', examWeight: 'medium' },
    { name: 'GDPR', relevance: 'EU personal data protection', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Vendor lacks SOC 2 for critical outsourced service.',
      answerLogic: 'BEST = risk assessment, contractual security requirements, and compensating controls — not blind trust or immediate termination without analysis.',
    },
  ],
  trapAlerts: [
    {
      title: 'Compliance vs. Security',
      trap: 'Assuming compliance checklist equals strong security.',
      correctApproach: 'Compliance is minimum baseline; risk-based security may exceed compliance requirements.',
    },
  ],
  examTraps: [
    {
      title: 'Accept All Risk',
      trap: 'Risk acceptance without documentation or authority.',
      correctApproach: 'Acceptance requires owner sign-off within appetite — documented in risk register.',
    },
  ],
  studyPath: [
    'Differentiate policy, standard, procedure with examples',
    'Review major compliance frameworks and what data they protect',
    'Practice vendor risk scenario questions',
    'Study BIA vs DRP vs IR plan purposes',
    'Learn security metrics appropriate for management reporting',
  ],
  applyIt: {
    scenario: 'Auditor requests evidence of security awareness effectiveness.',
    orgAction:
      'Provide phishing simulation metrics, training completion rates, and behavior change KPIs — not just policy PDFs.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Program management drills' },
  ],
};

export const SECURITY_PLUS_GUIDES: CertDomainGuide[] = [D1, D2, D3, D4, D5];
