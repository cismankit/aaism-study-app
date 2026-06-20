import type { LabDefinition } from './types';

export const CISSP_LABS: LabDefinition[] = [
  {
    id: 'cissp-d1-bia',
    certId: 'cissp',
    domainId: 1,
    title: 'Business Impact Analysis Worksheet',
    description: 'Complete a BIA triage exercise using RTO/RPO values from a business unit survey.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 20,
    sampleData: `System          | RTO    | RPO    | Annual Loss
Payment Gateway | 1 hr   | 15 min | $2.4M
Email           | 24 hr  | 4 hr   | $120K
HR Portal       | 8 hr   | 1 hr   | $80K
SIEM            | 4 hr   | 0      | $500K`,
    analysisQuestions: [
      { id: 'q1', question: 'Which system has the strictest RPO requirement?', expectedKeywords: ['SIEM', '0'], sampleAnswer: 'SIEM with RPO=0' },
      { id: 'q2', question: 'Rank systems by business priority for DR budget allocation.', expectedKeywords: ['Payment', 'SIEM', 'HR'], sampleAnswer: 'Payment Gateway > SIEM > HR Portal > Email' },
      { id: 'q3', question: 'What BIA output feeds directly into the BCP?', expectedKeywords: ['criticality', 'RTO', 'RPO', 'MAD'], sampleAnswer: 'Criticality ranking with RTO/RPO and maximum allowable downtime' },
    ],
  },
  {
    id: 'cissp-d4-nmap-recon',
    certId: 'cissp',
    domainId: 4,
    title: 'Network Reconnaissance Baseline',
    description: 'Run safe recon commands against a lab target and interpret open port results.',
    type: 'command',
    difficulty: 'easy',
    estimatedMinutes: 15,
    steps: [
      { id: 's1', title: 'Ping sweep', instruction: 'Verify target host is reachable.', command: 'ping -c 3 192.168.1.10', expectedOutcome: '3 replies received', validationHint: 'Use authorized lab IP only.' },
      { id: 's2', title: 'Port scan common services', instruction: 'Scan top 100 ports on authorized target.', command: 'nmap -sV --top-ports 100 192.168.1.10', expectedOutcome: '22/tcp ssh, 443/tcp https open', validationHint: 'Document service versions.' },
      { id: 's3', title: 'Banner grab HTTPS', instruction: 'Check TLS certificate and server header.', command: 'curl -sI https://192.168.1.10 | head -10', expectedOutcome: 'Server header and cert info captured' },
    ],
  },
  {
    id: 'cissp-d5-iam-review',
    certId: 'cissp',
    domainId: 5,
    title: 'IAM Access Review Audit',
    description: 'Analyze an IAM export for excessive privileges and stale accounts.',
    type: 'analysis',
    difficulty: 'medium',
    estimatedMinutes: 20,
    sampleData: `user@corp.com     | Role: Admin      | LastLogin: 2026-06-17 | MFA: Yes
contractor@ext.com | Role: Admin      | LastLogin: 2025-11-02 | MFA: No
svc-backup        | Role: BackupOps  | LastLogin: Never       | MFA: N/A
dev@corp.com      | Role: Developer  | LastLogin: 2026-06-18 | MFA: Yes`,
    analysisQuestions: [
      { id: 'q1', question: 'Which account violates least privilege most severely?', expectedKeywords: ['contractor', 'Admin', 'MFA'], sampleAnswer: 'contractor@ext.com — external Admin without MFA, stale login' },
      { id: 'q2', question: 'What action for svc-backup with never logged in?', expectedKeywords: ['rotate', 'review', 'disable', 'service account'], sampleAnswer: 'Verify necessity, rotate credentials, enforce scoped permissions' },
      { id: 'q3', question: 'Name two IAM review controls for CISSP Domain 5.', expectedKeywords: ['recertification', 'SoD', 'separation', 'access review'], sampleAnswer: 'Periodic access recertification and separation of duties' },
    ],
  },
  {
    id: 'cissp-d7-siem-triage',
    certId: 'cissp',
    domainId: 7,
    title: 'SIEM Alert Triage Drill',
    description: 'Triage Windows security event logs for lateral movement indicators.',
    type: 'command',
    difficulty: 'hard',
    estimatedMinutes: 25,
    steps: [
      { id: 's1', title: 'Find failed logons', instruction: 'Grep for Event ID 4625 failed logon attempts.', command: 'grep "4625" security.log | tail -20', expectedOutcome: 'Multiple failed logons from 10.0.5.44' },
      { id: 's2', title: 'Detect Pass-the-Hash', instruction: 'Search for Event 4648 explicit credential use.', command: 'grep "4648" security.log', expectedOutcome: 'Explicit credential logon after failed attempts' },
      { id: 's3', title: 'Identify target host', instruction: 'Extract destination workstation from log lines.', command: 'grep "4624" security.log | grep "10.0.5.44" | awk \'{print $NF}\'', expectedOutcome: 'WS-FINANCE-03 identified as target' },
    ],
    sampleData: `Jun 18 09:14:22 WS-DC-01 Microsoft-Windows-Security-Auditing: EventID=4625 Account: admin Source: 10.0.5.44
Jun 18 09:14:45 WS-DC-01 EventID=4648 Process: psexec.exe Account: admin
Jun 18 09:15:01 WS-FINANCE-03 EventID=4624 Logon Type: 3 Source: 10.0.5.44`,
  },
  {
    id: 'cissp-d7-incident-playbook',
    certId: 'cissp',
    domainId: 7,
    title: 'Ransomware Incident Decision Tree',
    description: 'Execute incident response decisions during an active ransomware event.',
    type: 'decision',
    difficulty: 'hard',
    estimatedMinutes: 25,
    mitreTechniques: ['T1486', 'T1490'],
    decisions: [
      {
        id: 'd1',
        situation: 'EDR alerts: mass file encryption on 12 endpoints. Ransom note found.',
        question: 'Immediate FIRST step?',
        options: ['Pay ransom to minimize downtime', 'Network isolate affected segments', 'Reboot all endpoints', 'Delete ransom notes'],
        correctIndex: 1,
        explanation: 'Containment via network isolation stops spread before eradication.',
      },
      {
        id: 'd2',
        situation: 'Backups last verified 3 days ago. CFO demands restore today.',
        question: 'Best restore strategy?',
        options: ['Restore all systems from backup without malware scan', 'Verify backup integrity offline, then staged restore', 'Rebuild from gold images only', 'Wait for attacker decryption key'],
        correctIndex: 1,
        explanation: 'Offline integrity check prevents reintroducing the attacker foothold.',
      },
      {
        id: 'd3',
        situation: 'Forensics confirms initial access via VPN with stolen creds.',
        question: 'Long-term preventive control?',
        options: ['Disable VPN permanently', 'Implement MFA on VPN + privileged access management', 'Block all remote access', 'Increase password length to 32 chars only'],
        correctIndex: 1,
        explanation: 'MFA + PAM addresses stolen credential vector without eliminating remote work.',
      },
    ],
  },
];
