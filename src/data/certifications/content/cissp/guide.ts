import type {
  DomainGuide,
  TrapAlert,
} from '../../../aaismDomainGuide';

export interface CertDomainGuide extends DomainGuide {
  keyTopics: string[];
  examTraps: TrapAlert[];
  studyPath: string[];
}

const D1: CertDomainGuide = {
  id: 1,
  shortName: 'Risk Mgmt',
  name: 'Security and Risk Management',
  weight: '16%',
  overview:
    'Domain 1 establishes the managerial foundation of CISSP — confidentiality, integrity, availability, governance, risk frameworks, legal/regulatory compliance, and security ethics. Exam scenarios pit policy vs. technology: the CISO mindset wins when stems ask about program direction, risk appetite, or stakeholder alignment.',
  learningObjectives: [
    'Apply the CIA triad and DAD triad in control selection scenarios',
    'Execute risk management: identify, assess, treat, monitor residual risk',
    'Align security strategy with business objectives and governance structures',
    'Interpret laws, regulations, and contractual obligations (GDPR, HIPAA, PCI-DSS)',
    'Design security awareness and training programs with measurable outcomes',
    'Evaluate business continuity, disaster recovery, and crisis management integration',
    'Apply professional ethics and (ISC)² Code of Ethics in decision scenarios',
  ],
  keyTopics: [
    'CIA triad, DAD triad, and non-repudiation',
    'Risk assessment methodologies (qualitative, quantitative, FAIR basics)',
    'Risk treatment: avoid, mitigate, transfer, accept',
    'Governance frameworks: ISO 27001, NIST CSF, COBIT alignment',
    'Policies, standards, procedures, and guidelines hierarchy',
    'Regulatory mapping: GDPR, SOX, HIPAA, PCI-DSS scope',
    'BCP/DRP: RTO, RPO, MTD, WRT, cold/warm/hot sites',
    'Security awareness, phishing simulations, and culture metrics',
    'Third-party risk and vendor management lifecycle',
    'Ethics: (ISC)² Code, due care vs. due diligence',
  ],
  coreConcepts: [
    {
      title: 'Due Care vs. Due Diligence',
      summary: 'Due care is doing the right thing; due diligence is proving you did it with documentation.',
      detail:
        'Due care = implementing reasonable safeguards (patching, policies). Due diligence = ongoing verification (audits, assessments, metrics). Exam trap: picking a one-time audit when ongoing monitoring is required for diligence.',
    },
    {
      title: 'Risk Appetite and Residual Risk',
      summary: 'Treatment leaves residual risk — it must be within appetite and documented.',
      detail:
        'After controls, residual risk may still exist. Accept only with executive sign-off when within appetite. Transfer via insurance does not eliminate operational risk. Avoid = discontinue the activity.',
    },
    {
      title: 'Governance vs. Management',
      summary: 'Governance sets direction; management plans and executes within policy.',
      detail:
        'Board/executive governance defines risk appetite and approves strategy. Management implements ISMS, projects, and operations. Technical controls answer implementation questions — not strategy questions.',
    },
    {
      title: 'BCP/DR Metrics',
      summary: 'RPO = max acceptable data loss; RTO = max acceptable downtime; MTD = max tolerable outage.',
      detail:
        'RPO drives backup frequency. RTO drives recovery architecture. MTD is business-facing maximum outage before severe harm. WRT = time to restore after infrastructure is available.',
    },
    {
      title: 'Legal and Regulatory Overlap',
      summary: 'Multiple regimes may apply — map obligations to data types and jurisdictions.',
      detail:
        'GDPR focuses on personal data and cross-border transfer. HIPAA on PHI in healthcare. PCI-DSS on cardholder data environment. Contractual SLAs add private obligations beyond statute.',
    },
  ],
  frameworks: [
    { name: 'ISO 27001/27002', relevance: 'ISMS and control catalog for enterprise security', examWeight: 'high' },
    { name: 'NIST CSF / RMF', relevance: 'Identify, Protect, Detect, Respond, Recover', examWeight: 'high' },
    { name: 'COBIT 2019', relevance: 'IT governance and GRC alignment', examWeight: 'medium' },
    { name: 'FAIR', relevance: 'Quantitative risk analysis for cyber loss scenarios', examWeight: 'medium' },
    { name: 'OCTAVE', relevance: 'Operational risk assessment workshops', examWeight: 'low' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'A new CISO is hired at a regulated financial firm with no documented security program.',
      answerLogic: 'FIRST = governance baseline: risk assessment, policy framework, and stakeholder charter — not buying tools.',
    },
    {
      keyword: 'BEST',
      prompt: 'Which approach BEST reduces regulatory fine exposure after a data breach?',
      answerLogic: 'BEST = documented compliance program, breach notification procedures, and evidence of due diligence — not hiding the breach.',
    },
    {
      keyword: 'MOST',
      prompt: 'What is the MOST important factor in security awareness program success?',
      answerLogic: 'MOST = relevance to roles, executive support, and measurable behavior change — not annual generic videos alone.',
    },
  ],
  trapAlerts: [
    {
      title: 'Technology Before Governance',
      trap: 'Selecting firewall deployment when asked to establish a security program.',
      correctApproach: 'Start with governance, risk assessment, and policy before technical controls.',
    },
    {
      title: 'Eliminate vs. Manage Risk',
      trap: 'Choosing answers that claim to eliminate all risk.',
      correctApproach: 'Security manages risk to acceptable levels — residual risk remains documented.',
    },
  ],
  examTraps: [
    {
      title: 'Insurance as Full Transfer',
      trap: 'Assuming cyber insurance removes the need for technical controls.',
      correctApproach: 'Transfer supplements mitigation — operational and reputational risk remain; controls are still required.',
    },
    {
      title: 'RTO vs. RPO Swap',
      trap: 'Picking backup frequency for downtime tolerance questions.',
      correctApproach: 'RPO = data loss window (backup cadence); RTO = service restoration time.',
    },
    {
      title: 'Policy vs. Standard',
      trap: 'Selecting a technical standard when an executive policy decision is needed.',
      correctApproach: 'Policies are management mandates; standards define specific controls — match the stem\'s authority level.',
    },
  ],
  studyPath: [
    'Memorize CIA/DAD and how exam scenarios map controls to each pillar',
    'Practice risk treatment scenarios — identify avoid/mitigate/transfer/accept',
    'Drill BCP metrics: RTO, RPO, MTD with sample business scenarios',
    'Review major regulations and what data each protects',
    'Read (ISC)² Code of Ethics — canon scenarios appear on the exam',
    'Complete timed drills on FIRST/BEST governance vs. technical answers',
  ],
  applyIt: {
    scenario:
      'Board asks whether to accept vendor SOC 2 Type I only for a critical payments processor handling EU customer data.',
    orgAction:
      'Perform third-party risk assessment: map GDPR obligations, require Type II or bridge letter, define residual risk acceptance with DPO and legal sign-off, and contract breach notification SLAs.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Domain 1 CISSP practice questions' },
    { label: 'Scenario Lab', route: '/scenarios', description: 'Risk and governance decision drills' },
  ],
};

const D2: CertDomainGuide = {
  id: 2,
  shortName: 'Assets',
  name: 'Asset Security',
  weight: '10%',
  overview:
    'Asset Security covers data lifecycle — classification, ownership, handling, retention, destruction, and privacy. Scenarios involve mislabeled data, improper disposal, DLP gaps, and cloud storage sprawl. Classification drives controls; without it, encryption and access rules lack context.',
  learningObjectives: [
    'Design data classification schemes aligned to business impact',
    'Apply ownership, stewardship, and custodian responsibilities',
    'Implement secure data handling, transmission, and storage controls',
    'Define retention, archiving, and legal hold requirements',
    'Execute secure destruction and decommissioning procedures',
    'Address privacy principles: notice, consent, minimization, purpose limitation',
    'Protect assets across cloud, mobile, and outsourced environments',
  ],
  keyTopics: [
    'Classification levels and labeling (public, internal, confidential, restricted)',
    'Data roles: owner, steward, custodian, user',
    'Data lifecycle: create, store, use, share, archive, destroy',
    'DLP strategies: network, endpoint, cloud, discovery',
    'Encryption for data at rest, in transit, and in use (basics)',
    'Tokenization vs. encryption vs. hashing for PCI contexts',
    'Secure wiping, crypto-shredding, and physical destruction',
    'Privacy: PII, PHI, data subject rights, cross-border transfer',
    'Asset inventory and CMDB integration for security',
    'Cloud shared responsibility for customer data',
  ],
  coreConcepts: [
    {
      title: 'Classification-Driven Controls',
      summary: 'Controls scale with sensitivity — not all data needs the same protection.',
      detail:
        'Over-classification wastes resources; under-classification creates breach impact. Labels must be enforceable via DLP, ACLs, and encryption policies. Metadata tagging enables automated policy.',
    },
    {
      title: 'Data Owner Authority',
      summary: 'Owners approve classification, access, and sharing — not IT alone.',
      detail:
        'Business data owners define acceptable use and retention. Custodians (IT) implement controls. Stewards maintain quality and policy adherence. Exam favors owner approval for external sharing.',
    },
    {
      title: 'Secure Disposal',
      summary: 'Deletion must be verifiable — decommissioning storage and media matters.',
      detail:
        'Crypto-shredding destroys keys for encrypted data. Degaussing/pulverizing for magnetic media. Cloud requires provider certificate of destruction. SSD secure erase vs. simple delete.',
    },
  ],
  frameworks: [
    { name: 'ISO 27001 A.5–A.8', relevance: 'Organizational and asset management controls', examWeight: 'high' },
    { name: 'NIST SP 800-60', relevance: 'Information type categorization', examWeight: 'medium' },
    { name: 'GDPR', relevance: 'Personal data handling and subject rights', examWeight: 'high' },
    { name: 'PCI-DSS', relevance: 'Cardholder data environment scope', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'Employees store customer contracts on personal cloud drives.',
      answerLogic: 'FIRST = classify data, enforce approved storage, and DLP — not blanket termination.',
    },
    {
      keyword: 'BEST',
      prompt: 'Which method BEST protects archived backups containing PII?',
      answerLogic: 'BEST = encryption at rest, access controls, retention policy, and verified destruction at end of life.',
    },
  ],
  trapAlerts: [
    {
      title: 'Encryption Without Classification',
      trap: 'Encrypting everything without classification and key management strategy.',
      correctApproach: 'Classification determines encryption scope, key custody, and retention requirements.',
    },
  ],
  examTraps: [
    {
      title: 'Custodian Makes Business Decision',
      trap: 'IT approving external data sharing without owner sign-off.',
      correctApproach: 'Data owners authorize sharing; custodians implement technical controls.',
    },
    {
      title: 'Delete vs. Destroy',
      trap: 'Selecting file delete for decommissioned SAN containing sensitive data.',
      correctApproach: 'Secure wipe or physical destruction per policy — logical delete is insufficient.',
    },
  ],
  studyPath: [
    'Map classification levels to example data types in your industry',
    'Practice owner/steward/custodian responsibility questions',
    'Review DLP placement: network vs. endpoint vs. CASB',
    'Study retention schedules and legal hold interactions',
    'Drill privacy principles with GDPR-style scenario questions',
  ],
  applyIt: {
    scenario: 'M&A team needs due diligence data room with financial and HR records.',
    orgAction:
      'Classify all artifacts, watermark documents, time-bound access, MFA, DLP on download, owner-approved sharing list, and audit logging with auto-revocation post-deal.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Asset security practice questions' },
  ],
};

const D3: CertDomainGuide = {
  id: 3,
  shortName: 'Architecture',
  name: 'Security Architecture and Engineering',
  weight: '13%',
  overview:
    'This domain tests secure design principles — defense in depth, least privilege, zero trust, cryptography, physical security, and secure facility design. You must select architecturally sound answers: fail-safe defaults, separation of duties, and crypto appropriate to the threat model.',
  learningObjectives: [
    'Apply security design principles to system and network architecture',
    'Evaluate cryptographic systems: symmetric, asymmetric, hashing, PKI',
    'Design physical and environmental controls for facilities',
    'Implement secure protocols and harden systems against common weaknesses',
    'Apply zero trust and micro-segmentation concepts',
    'Assess cloud and virtualization security architecture',
    'Select controls for embedded, IoT, and industrial systems',
  ],
  keyTopics: [
    'Security models: Bell-LaPadula, Biba, Clark-Wilson, Brewer-Nash',
    'Design principles: least privilege, separation of duties, defense in depth',
    'Zero trust architecture pillars and implementation patterns',
    'Cryptography: AES, RSA, ECC, SHA-2, digital signatures',
    'PKI: CA hierarchy, certificate lifecycle, CRL/OCSP',
    'Physical security: CPTED, mantrap, FAR/UAR, HVAC, fire suppression',
    'Hardening baselines and secure configuration management',
    'Virtualization and container isolation boundaries',
    'Side-channel and covert channel awareness',
    'Secure SDLC integration at architecture phase',
  ],
  coreConcepts: [
    {
      title: 'Zero Trust',
      summary: 'Never trust, always verify — identity-centric, not perimeter-centric.',
      detail:
        'Every request authenticated and authorized regardless of network location. Micro-segmentation limits lateral movement. Continuous monitoring replaces implicit LAN trust.',
    },
    {
      title: 'Cryptographic Selection',
      summary: 'Match algorithm to use case — confidentiality, integrity, authentication, non-repudiation.',
      detail:
        'Symmetric for bulk encryption (AES). Asymmetric for key exchange and signatures (RSA/ECC). Hashing for integrity (SHA-256) — not reversible. Salting hashes for passwords.',
    },
    {
      title: 'Defense in Depth',
      summary: 'Layered heterogeneous controls so single failure does not compromise the asset.',
      detail:
        'Combine preventive, detective, and corrective controls across physical, technical, and administrative domains.',
    },
  ],
  frameworks: [
    { name: 'NIST SP 800-57', relevance: 'Key management and crypto algorithm guidance', examWeight: 'high' },
    { name: 'NIST SP 800-207', relevance: 'Zero trust architecture', examWeight: 'high' },
    { name: 'Common Criteria', relevance: 'Product evaluation and EAL levels', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Design remote workforce access without VPN trust in the corporate LAN.',
      answerLogic: 'BEST = zero trust with identity-aware proxy, device health checks, and micro-segmentation.',
    },
  ],
  trapAlerts: [
    {
      title: 'Perimeter-Only Design',
      trap: 'Single firewall as sole control for internal apps.',
      correctApproach: 'Layer controls inside the perimeter — segmentation, IAM, monitoring.',
    },
  ],
  examTraps: [
    {
      title: 'MD5/SHA-1 for Security',
      trap: 'Selecting deprecated hashes for integrity in new designs.',
      correctApproach: 'Use SHA-256 or stronger; legacy algorithms are exam traps for weak crypto.',
    },
    {
      title: 'Security Through Obscurity',
      trap: 'Hiding algorithms or ports as primary defense.',
      correctApproach: 'Obscurity supplements real controls — not a substitute for encryption and auth.',
    },
  ],
  studyPath: [
    'Build a crypto cheat sheet: use case → algorithm → key size',
    'Diagram zero trust vs. traditional perimeter architecture',
    'Review physical security zones and CPTED principles',
    'Practice secure design scenario questions (BEST architecture)',
    'Study virtualization escape and container namespace boundaries',
  ],
  applyIt: {
    scenario: 'New SaaS admin portal requires high assurance for privileged actions.',
    orgAction:
      'Implement zero trust access, hardware-backed MFA, JIT privileged access, encrypted sessions (TLS 1.3), HSM for signing keys, and admin session recording.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Architecture and engineering drills' },
  ],
};

const D4: CertDomainGuide = {
  id: 4,
  shortName: 'Network',
  name: 'Communication and Network Security',
  weight: '13%',
  overview:
    'Network security spans secure protocol design, segmentation, VPNs, wireless, DNS security, and cloud networking. CISSP emphasizes secure communications architecture — TLS pitfalls, IPSec modes, SD-WAN, and detecting man-in-the-middle — not just naming ports.',
  learningObjectives: [
    'Design secure network topologies with segmentation and monitoring',
    'Implement secure protocols: TLS, IPSec, SSH, DNSSEC',
    'Evaluate wireless security: WPA3, enterprise authentication',
    'Apply secure remote access and VPN architectures',
    'Detect and mitigate network attacks: MITM, DNS poisoning, DDoS',
    'Integrate cloud network security: VPC, security groups, WAF',
  ],
  keyTopics: [
    'OSI and TCP/IP model security implications',
    'Network segmentation: VLANs, ACLs, firewalls, NAC',
    'TLS 1.3 handshake, certificate validation, HSTS',
    'IPSec: transport vs. tunnel, AH vs. ESP',
    'VPN types: site-to-site, remote access, split tunneling risks',
    'Wireless: WPA2-Enterprise, WPA3, rogue AP detection',
    'DNS security: DNSSEC, sinkholes, DNS over HTTPS tradeoffs',
    'DDoS mitigation: scrubbing, anycast, rate limiting',
    'SDN and SD-WAN security considerations',
    'Cloud: security groups, NACLs, private endpoints',
  ],
  coreConcepts: [
    {
      title: 'TLS Certificate Validation',
      summary: 'Chain trust, hostname match, revocation checking — failures enable MITM.',
      detail:
        'Post-migration issues often involve incomplete chains or wrong SAN. Pinning has operational risks. HSTS prevents downgrade attacks on browsers.',
    },
    {
      title: 'Split Tunneling Risk',
      summary: 'Simultaneous corporate and internet access can bypass corporate inspection.',
      detail:
        'Full tunnel forces traffic through corporate controls. Split tunnel improves performance but may leak sensitive traffic outside DLP/IPS scope.',
    },
  ],
  frameworks: [
    { name: 'NIST SP 800-41', relevance: 'Firewall and router security guidelines', examWeight: 'medium' },
    { name: 'CIS Controls v8', relevance: 'Network monitoring and boundary defense', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'Users see certificate warnings after migrating a public web app.',
      answerLogic: 'FIRST = verify cert chain, hostname/SAN, and intermediate CA configuration.',
    },
  ],
  trapAlerts: [
    {
      title: 'Encryption Without Auth',
      trap: 'TLS without validating server identity.',
      correctApproach: 'Mutual authentication or proper CA validation prevents MITM.',
    },
  ],
  examTraps: [
    {
      title: 'Port Blocking as Sole Defense',
      trap: 'Closing ports instead of application-layer controls for web threats.',
      correctApproach: 'Use WAF, TLS, auth, and monitoring — port filtering is insufficient alone.',
    },
    {
      title: 'WEP/WPA Confusion',
      trap: 'Selecting WPA-Personal for large enterprise wireless.',
      correctApproach: 'Enterprise 802.1X with RADIUS — WPA3-Enterprise where supported.',
    },
  ],
  studyPath: [
    'Trace TLS handshake and list what breaks after server migration',
    'Compare IPSec transport vs. tunnel mode use cases',
    'Map segmentation designs to lateral movement scenarios',
    'Review wireless attack types and enterprise mitigations',
    'Practice cloud VPC security group vs. NACL questions',
  ],
  applyIt: {
    scenario: 'Global offices need encrypted site-to-site with voice/video QoS.',
    orgAction:
      'Design IPSec tunnel mode with SD-WAN, segment voice VLANs, implement NAC for wireless, and centralize DNS filtering with logging.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Network security practice' },
  ],
};

const D5: CertDomainGuide = {
  id: 5,
  shortName: 'IAM',
  name: 'Identity and Access Management',
  weight: '13%',
  overview:
    'IAM is the control plane of modern security — authentication, authorization, federation, privileged access, and identity governance. Scenarios cover SSO failures, excessive permissions, PAM gaps, and federated trust between IdP and SaaS apps.',
  learningObjectives: [
    'Design authentication factors and MFA strategies',
    'Implement authorization models: RBAC, ABAC, MAC, DAC',
    'Deploy federation with SAML, OIDC, and OAuth 2.0 patterns',
    'Manage privileged access: PAM, JIT, break-glass accounts',
    'Execute identity lifecycle: provisioning, review, deprovisioning',
    'Apply IAM in cloud and hybrid directory environments',
  ],
  keyTopics: [
    'Authentication factors: knowledge, possession, inherence, location',
    'MFA, adaptive auth, and risk-based step-up',
    'RBAC vs. ABAC vs. ACL implementation tradeoffs',
    'Federation: SAML assertions, OIDC tokens, OAuth scopes',
    'Directory services: AD, LDAP, cloud IdP (Entra, Okta)',
    'PAM: vaulting, session recording, just-in-time elevation',
    'Kerberos, NTLM legacy risks, pass-the-hash mitigations',
    'Account lifecycle and access recertification',
    'BCP for identity: break-glass procedures',
    'IAM in zero trust and cloud IAM policies',
  ],
  coreConcepts: [
    {
      title: 'Federation Trust',
      summary: 'IdP authenticates; SP trusts signed assertions — passwords stay at IdP.',
      detail:
        'SAML for enterprise SSO; OIDC for modern apps. Misconfigured trust (weak signing, no MFA at IdP) compromises all federated apps.',
    },
    {
      title: 'Least Privilege and SoD',
      summary: 'Minimum necessary access; conflicting duties separated.',
      detail:
        'Regular access reviews and role mining reduce privilege creep. SoD prevents fraud — e.g., requester cannot approve own purchases.',
    },
  ],
  frameworks: [
    { name: 'NIST SP 800-63', relevance: 'Digital identity guidelines (AAL levels)', examWeight: 'high' },
    { name: 'OAuth 2.0 / OIDC', relevance: 'Modern authorization and identity layers', examWeight: 'high' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Multinational firm wants one identity across SaaS without per-app passwords.',
      answerLogic: 'BEST = SAML/OIDC federation with centralized IdP and MFA.',
    },
  ],
  trapAlerts: [
    {
      title: 'Shared Admin Accounts',
      trap: 'One admin password for speed.',
      correctApproach: 'Individual privileged accounts with PAM vaulting and audit trails.',
    },
  ],
  examTraps: [
    {
      title: 'OAuth as Authentication',
      trap: 'Using OAuth alone where OIDC/SAML identity is required.',
      correctApproach: 'OAuth delegates authorization; pair with OIDC or SAML for authentication context.',
    },
    {
      title: 'RBAC Without Reviews',
      trap: 'Static roles never recertified.',
      correctApproach: 'Periodic access reviews and automated deprovisioning on termination.',
    },
  ],
  studyPath: [
    'Draw SAML vs. OIDC flows for enterprise SSO',
    'Practice PAM and break-glass scenario questions',
    'Review Kerberos/NTLM attack mitigations',
    'Study ABAC use cases vs. pure RBAC',
    'Drill lifecycle: hire, transfer, terminate access timing',
  ],
  applyIt: {
    scenario: 'Contractors need time-limited admin on production Kubernetes.',
    orgAction:
      'Federated SSO with MFA, JIT privileged roles, namespace-scoped RBAC, session recording, and automatic revocation at contract end.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'IAM practice questions' },
  ],
};

const D6: CertDomainGuide = {
  id: 6,
  shortName: 'Assessment',
  name: 'Security Assessment and Testing',
  weight: '12%',
  overview:
    'Assessment validates control effectiveness — vulnerability management, pentesting, code review, audits, and metrics. CISSP focuses on scoping, rules of engagement, test types, and interpreting results for risk decisions — not running exploits without authorization.',
  learningObjectives: [
    'Plan vulnerability assessments and penetration tests with proper scope',
    'Differentiate assessment types: vulnerability scan, pentest, code review, audit',
    'Interpret CVSS and prioritize remediation by business risk',
    'Design security metrics and KPIs for leadership reporting',
    'Apply static, dynamic, and interactive application security testing',
    'Coordinate third-party assessment and audit activities',
  ],
  keyTopics: [
    'Vulnerability scanning: authenticated vs. unauthenticated',
    'Pen test types: black, white, gray box',
    'Rules of engagement and legal authorization',
    'CVSS scoring and contextual risk prioritization',
    'SAST, DAST, IAST, and software composition analysis',
    'Audit types: internal, external, regulatory',
    'Control testing: design vs. operating effectiveness',
    'Bug bounty programs and coordinated disclosure',
    'Red team vs. blue team exercises',
    'Reporting findings to management in risk terms',
  ],
  coreConcepts: [
    {
      title: 'Rules of Engagement',
      summary: 'Signed authorization defining scope, timing, contacts, and stop conditions.',
      detail:
        'Without ROE, testing may be illegal and destabilize production. Emergency contacts and data handling rules are mandatory.',
    },
    {
      title: 'CVSS vs. Business Risk',
      summary: 'CVSS is technical severity — prioritize by asset criticality and exposure.',
      detail:
        'Critical CVSS on internal lab system may rank below medium on internet-facing payment API.',
    },
  ],
  frameworks: [
    { name: 'PTES', relevance: 'Penetration testing execution standard phases', examWeight: 'medium' },
    { name: 'OWASP Testing Guide', relevance: 'Web application security testing', examWeight: 'high' },
    { name: 'ISO 27001 internal audit', relevance: 'ISMS control verification', examWeight: 'medium' },
  ],
  examPatterns: [
    {
      keyword: 'MOST',
      prompt: 'Before production penetration test, what is MOST important?',
      answerLogic: 'MOST = signed ROE with scope, timing, and emergency procedures.',
    },
  ],
  trapAlerts: [
    {
      title: 'Scan Equals Pentest',
      trap: 'Vulnerability scan as full security validation.',
      correctApproach: 'Scans find known issues; pentests validate exploit chains and logic flaws.',
    },
  ],
  examTraps: [
    {
      title: 'Fix All Criticals Immediately',
      trap: 'Patching without change management on fragile legacy system.',
      correctApproach: 'Risk-based prioritization with compensating controls and scheduled remediation.',
    },
  ],
  studyPath: [
    'Memorize assessment type differences and when each applies',
    'Practice ROE and scope scenario questions',
    'Learn to translate CVSS into business-prioritized remediation',
    'Review SAST/DAST placement in SDLC',
    'Study audit evidence types for compliance exams',
  ],
  applyIt: {
    scenario: 'Annual pentest requested on PCI environment during peak season.',
    orgAction:
      'Negotiate ROE limiting scope to staging mirrors where possible, schedule off-peak production tests with rollback plan, notify SOC, and define evidence retention for QSA.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'Assessment and testing drills' },
  ],
};

const D7: CertDomainGuide = {
  id: 7,
  shortName: 'SecOps',
  name: 'Security Operations',
  weight: '13%',
  overview:
    'SecOps is incident response, logging, monitoring, forensics, malware handling, and disaster recovery execution. Scenarios test IR phase order, evidence preservation, SOC tuning, and containment before eradication — the operational muscle of security.',
  learningObjectives: [
    'Execute incident response: preparation, detection, containment, eradication, recovery, lessons learned',
    'Design logging, SIEM, and SOC workflows with alert tuning',
    'Apply digital forensics principles: order of volatility, chain of custody',
    'Handle malware analysis and sandboxing safely',
    'Implement backup, restore, and DR testing procedures',
    'Manage change, configuration, and patch management operations',
  ],
  keyTopics: [
    'IR lifecycle and playbooks per incident type',
    'SIEM: correlation rules, UEBA, threat intel integration',
    'Log sources: OS, network, app, cloud audit trails',
    'Forensics: disk, memory, network capture order of volatility',
    'Chain of custody and legal admissibility basics',
    'Malware triage: sandbox, IOC sharing, C2 blocking',
    'EDR/XDR detection and response workflows',
    'Patch management and emergency patching',
    'Backup types: full, incremental, differential, immutable',
    'Honeypots, tarpits, and deception technology',
  ],
  coreConcepts: [
    {
      title: 'IR Phase Discipline',
      summary: 'Contain before eradicate — preserve evidence, stop spread first.',
      detail:
        'Ransomware: isolate affected systems, snapshot memory if possible, block C2, then investigate scope. Paying ransom is last resort with legal involvement.',
    },
    {
      title: 'Order of Volatility',
      summary: 'Collect most ephemeral evidence first — registers, memory, then disk.',
      detail:
        'CPU registers → cache → memory → network state → disk → archival media → remote logs → physical config.',
    },
  ],
  frameworks: [
    { name: 'NIST SP 800-61', relevance: 'Computer security incident handling guide', examWeight: 'high' },
    { name: 'SANS IR process', relevance: 'Practical IR phase model', examWeight: 'high' },
  ],
  examPatterns: [
    {
      keyword: 'FIRST',
      prompt: 'Ransomware encrypting file servers during business hours.',
      answerLogic: 'FIRST = isolate affected systems and preserve evidence — not pay ransom or mass reimage without documentation.',
    },
  ],
  trapAlerts: [
    {
      title: 'Reimage Without Forensics',
      trap: 'Immediate wipe losing attacker TTP evidence.',
      correctApproach: 'Contain and image systems per playbook before eradication.',
    },
  ],
  examTraps: [
    {
      title: 'SIEM Off Due to Alert Fatigue',
      trap: 'Disabling monitoring instead of tuning.',
      correctApproach: 'Tune correlation, integrate threat intel, prioritize — keep logging on.',
    },
  ],
  studyPath: [
    'Memorize IR phases with ransomware and phishing examples',
    'Practice order of volatility forensics questions',
    'Review backup strategies matching RPO/RTO from Domain 1',
    'Study SOC alert tuning and false positive reduction',
    'Walk through patch management in critical systems',
  ],
  applyIt: {
    scenario: 'SOC detects lateral movement via PsExec on multiple endpoints.',
    orgAction:
      'Activate IR playbook: isolate hosts, preserve logs and memory, block admin paths, reset compromised creds via PAM, hunt for persistence, and brief legal/comms.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'SecOps scenario drills' },
  ],
};

const D8: CertDomainGuide = {
  id: 8,
  shortName: 'DevSec',
  name: 'Software Development Security',
  weight: '11%',
  overview:
    'DevSec covers secure SDLC, software vulnerabilities (OWASP Top 10), API security, DevOps pipeline controls, and acquired software risk. CISSP asks you to shift security left — threat modeling, code review, dependency scanning — while managing production deployment safety.',
  learningObjectives: [
    'Integrate security into SDLC phases from requirements to disposal',
    'Apply OWASP Top 10 and common vulnerability mitigations',
    'Design secure CI/CD pipelines with secrets management',
    'Evaluate third-party and open-source component risk',
    'Implement API authentication, rate limiting, and input validation',
    'Apply change management and environment separation (dev/test/prod)',
  ],
  keyTopics: [
    'Secure SDLC and shift-left security activities per phase',
    'Threat modeling: STRIDE, data flow diagrams',
    'OWASP Top 10: injection, broken auth, SSRF, etc.',
    'SAST/DAST in pipeline gates',
    'Software composition analysis and SBOM',
    'Secrets management in CI/CD — no keys in repos',
    'Container image scanning and minimal base images',
    'API security: OAuth scopes, rate limits, input validation',
    'Change control and separation of environments',
    'Acquired code and outsourcing security requirements',
  ],
  coreConcepts: [
    {
      title: 'Shift Left',
      summary: 'Security activities early — requirements, design, coding — reduce production defects.',
      detail:
        'Threat modeling at design beats pen test-only at release. Developer training and secure libraries embed security in velocity.',
    },
    {
      title: 'Supply Chain Security',
      summary: 'Dependencies and build pipelines are attack surfaces.',
      detail:
        'SBOM, signed commits, dependency pinning, and verified package sources mitigate trojanized libraries (SolarWinds-style risks).',
    },
  ],
  frameworks: [
    { name: 'OWASP Top 10', relevance: 'Primary web app vulnerability taxonomy', examWeight: 'high' },
    { name: 'OWASP SAMM', relevance: 'Software assurance maturity model', examWeight: 'medium' },
    { name: 'BSIMM', relevance: 'Measuring software security initiative maturity', examWeight: 'low' },
  ],
  examPatterns: [
    {
      keyword: 'BEST',
      prompt: 'Dev team ships weekly; production SQL injection found in new feature.',
      answerLogic: 'BEST = emergency patch with WAF rule temporary + root cause fix in code + add SAST gate — not only WAF forever.',
    },
  ],
  trapAlerts: [
    {
      title: 'Pen Test Only at End',
      trap: 'No security activities until pre-release test.',
      correctApproach: 'Threat modeling, code review, and SCA throughout SDLC.',
    },
  ],
  examTraps: [
    {
      title: 'Client-Side Auth Only',
      trap: 'JavaScript-only authorization checks.',
      correctApproach: 'Server-side authorization on every sensitive operation.',
    },
    {
      title: 'Secrets in Git',
      trap: 'Embedding API keys in source for CI convenience.',
      correctApproach: 'Vault/secret manager with rotation and pipeline OIDC.',
    },
  ],
  studyPath: [
    'Memorize OWASP Top 10 with one mitigation each',
    'Map SDLC phase to security activity checklist',
    'Practice STRIDE threat modeling on sample architecture',
    'Review CI/CD pipeline hardening controls',
    'Study acquired software and outsourcing security clauses',
  ],
  applyIt: {
    scenario: 'Microservices expose internal APIs to partner integrations.',
    orgAction:
      'OAuth2 client credentials with scoped tokens, mTLS between services, API gateway rate limiting, SAST/DAST in pipeline, and SBOM for all dependencies.',
  },
  relatedFeatures: [
    { label: 'Study', route: '/study', description: 'DevSec practice questions' },
  ],
};

export const CISSP_GUIDES: CertDomainGuide[] = [D1, D2, D3, D4, D5, D6, D7, D8];
