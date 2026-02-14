import { useState } from 'react';
import { 
  BookOpen, Shield, Cpu, AlertTriangle, Scale, Eye, 
  ChevronDown, ChevronUp, Star, Zap, Target, FileText,
  Lock, Globe, Layers, Brain, CheckCircle, ExternalLink
} from 'lucide-react';

type CheatTab = 'frameworks' | 'domain1' | 'domain2' | 'domain3' | 'isaca-tips' | 'supporting-tasks' | 'youtube';

interface CollapsibleProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  highlight?: boolean;
}

function Collapsible({ title, icon, children, defaultOpen = false, highlight = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border ${highlight ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {icon}
        <span className="flex-1">{title}</span>
        {highlight && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">HIGH YIELD</span>}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">{children}</div>}
    </div>
  );
}

function KeyValue({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="text-gray-500 dark:text-gray-400 min-w-[140px] text-sm">{label}:</span>
      <span className={`text-sm ${bold ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}`}>{value}</span>
    </div>
  );
}

function BulletList({ items, color = 'blue' }: { items: string[]; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500', 
    yellow: 'bg-yellow-500', purple: 'bg-purple-500', orange: 'bg-orange-500'
  };
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${colorMap[color] || colorMap.blue} mt-1.5 flex-shrink-0`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CheatSheet() {
  const [activeTab, setActiveTab] = useState<CheatTab>('frameworks');

  const tabs = [
    { id: 'frameworks' as CheatTab, label: 'Key Frameworks', icon: BookOpen },
    { id: 'domain1' as CheatTab, label: 'D1: Governance (31%)', icon: Scale },
    { id: 'domain2' as CheatTab, label: 'D2: Risk (31%)', icon: Shield },
    { id: 'domain3' as CheatTab, label: 'D3: Tech & Controls (38%)', icon: Cpu },
    { id: 'isaca-tips' as CheatTab, label: 'ISACA Exam Tips', icon: Target },
    { id: 'supporting-tasks' as CheatTab, label: '22 Tasks', icon: FileText },
    { id: 'youtube' as CheatTab, label: 'Video Resources', icon: ExternalLink },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          AAISM Exam Cheat Sheet
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Everything you MUST know — 90 questions, 150 minutes, pass = 450/800
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">D1: 31%</span>
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full font-medium">D2: 31%</span>
          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-medium">D3: 38% (HEAVIEST)</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'frameworks' && <FrameworksTab />}
      {activeTab === 'domain1' && <Domain1Tab />}
      {activeTab === 'domain2' && <Domain2Tab />}
      {activeTab === 'domain3' && <Domain3Tab />}
      {activeTab === 'isaca-tips' && <ISACATipsTab />}
      {activeTab === 'supporting-tasks' && <SupportingTasksTab />}
      {activeTab === 'youtube' && <YouTubeTab />}
    </div>
  );
}

// ===== FRAMEWORKS TAB =====
function FrameworksTab() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
        <h3 className="font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
          <Star size={18} /> MEMORIZE THESE — They appear in 60%+ of questions
        </h3>
      </div>

      <Collapsible title="NIST AI Risk Management Framework (AI RMF 1.0)" icon={<Shield size={18} className="text-blue-500" />} defaultOpen highlight>
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Released January 2023. Voluntary framework. 4 core functions with subcategories.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">1. GOVERN</h4>
              <p className="text-xs text-gray-500 mt-1">Cross-cutting function — applies to all others</p>
              <BulletList items={[
                'Policies, processes, procedures for AI risk',
                'Organizational accountability structures',
                'AI risk management integrated into enterprise risk',
                'Diverse & multidisciplinary AI teams',
                'Stakeholder engagement processes',
                'Risk culture & documentation',
              ]} color="blue" />
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <h4 className="font-bold text-green-700 dark:text-green-300 text-sm">2. MAP</h4>
              <p className="text-xs text-gray-500 mt-1">Context establishment — know your AI system</p>
              <BulletList items={[
                'Identify intended purpose & context of use',
                'Map AI system characteristics & capabilities',
                'Identify known/foreseeable risks & benefits',
                'Identify stakeholders & affected populations',
                'Assess likelihood & severity of risks',
                'Understand legal/regulatory requirements',
              ]} color="green" />
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <h4 className="font-bold text-orange-700 dark:text-orange-300 text-sm">3. MEASURE</h4>
              <p className="text-xs text-gray-500 mt-1">Assessment & analysis — quantify the risk</p>
              <BulletList items={[
                'Establish metrics for AI trustworthiness',
                'Track & assess risks over time',
                'Evaluate AI system performance & bias',
                'Conduct testing & red-teaming',
                'Assess human oversight effectiveness',
                'Independent evaluation where appropriate',
              ]} color="orange" />
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <h4 className="font-bold text-red-700 dark:text-red-300 text-sm">4. MANAGE</h4>
              <p className="text-xs text-gray-500 mt-1">Treatment — take action on risks</p>
              <BulletList items={[
                'Prioritize & allocate resources to risks',
                'Plan & implement risk treatment',
                'Document risk decisions & rationale',
                'Monitor risk treatment effectiveness',
                'Manage AI incidents & escalations',
                'Communicate risk decisions to stakeholders',
              ]} color="red" />
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">EXAM TIP: GOVERN is the ONLY cross-cutting function. When asked "what comes FIRST?" — governance always comes first. NIST AI RMF is VOLUNTARY, not mandatory.</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="ISO/IEC 42001:2023 — AI Management System (AIMS)" icon={<Globe size={18} className="text-green-500" />} highlight>
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">World's FIRST certifiable AI management system standard. Uses PDCA cycle.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { phase: 'PLAN', clauses: '4-6', desc: 'Context, Leadership, Planning', color: 'blue' },
              { phase: 'DO', clauses: '7-8', desc: 'Support, Operation', color: 'green' },
              { phase: 'CHECK', clauses: '9', desc: 'Performance Evaluation', color: 'orange' },
              { phase: 'ACT', clauses: '10', desc: 'Improvement', color: 'red' },
            ].map(p => (
              <div key={p.phase} className={`bg-${p.color}-50 dark:bg-${p.color}-900/20 rounded-lg p-2 text-center`}>
                <div className={`font-bold text-${p.color}-700 dark:text-${p.color}-300 text-sm`}>{p.phase}</div>
                <div className="text-xs text-gray-500">Clauses {p.clauses}</div>
                <div className="text-xs mt-1">{p.desc}</div>
              </div>
            ))}
          </div>

          <BulletList items={[
            'Clause 4: Understand org context, scope, interested parties',
            'Clause 5: Leadership commitment, AI policy, roles & responsibilities',
            'Clause 6: Risk-based planning, AI objectives',
            'Clause 7: Resources, competence, awareness, communication',
            'Clause 8: AI risk assessment & treatment, impact assessment, operation control',
            'Clause 9: Monitoring, internal audit, management review',
            'Clause 10: Nonconformity, corrective action, continual improvement',
            'Annex A: Reference control objectives (normative)',
            'Annex B: Implementation guidance (informative)',
          ]} color="green" />
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">EXAM TIP: ISO 42001 is CERTIFIABLE (unlike NIST AI RMF which is voluntary). It defines "what to do" while NIST AI RMF is "how to manage risk." Know the PDCA cycle cold.</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="EU AI Act — Risk-Based Classification" icon={<Scale size={18} className="text-purple-500" />} highlight>
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">World's first comprehensive AI regulation. Risk-based approach with 4 levels.</p>
          
          <div className="space-y-2">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 border-l-4 border-red-500">
              <h4 className="font-bold text-red-700 dark:text-red-300 text-sm">UNACCEPTABLE RISK (BANNED)</h4>
              <BulletList items={[
                'Social scoring by governments',
                'Subliminal manipulation & deceptive techniques',
                'Exploitation of vulnerabilities (age, disability)',
                'Real-time remote biometric ID by law enforcement (with limited exceptions)',
                'Emotion recognition in workplaces & education',
                'Untargeted facial recognition scraping',
                'Predictive policing based solely on profiling',
              ]} color="red" />
            </div>
            
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 border-l-4 border-orange-500">
              <h4 className="font-bold text-orange-700 dark:text-orange-300 text-sm">HIGH RISK — Strict obligations</h4>
              <BulletList items={[
                'Critical infrastructure (energy, transport, water)',
                'Education & vocational training (admissions, grading)',
                'Employment (recruitment, CV screening, performance)',
                'Essential services (credit scoring, insurance, benefits)',
                'Law enforcement (evidence evaluation)',
                'Migration & border control',
                'Administration of justice',
                'Requirements: risk management, data governance, documentation, transparency, human oversight, accuracy, cybersecurity',
              ]} color="orange" />
            </div>
            
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 border-l-4 border-yellow-500">
              <h4 className="font-bold text-yellow-700 dark:text-yellow-300 text-sm">LIMITED RISK — Transparency obligations</h4>
              <BulletList items={[
                'Chatbots — must inform users they interact with AI',
                'Deepfakes — must be labeled',
                'Emotion recognition — must inform subjects',
                'AI-generated content — must be marked',
              ]} color="yellow" />
            </div>
            
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border-l-4 border-green-500">
              <h4 className="font-bold text-green-700 dark:text-green-300 text-sm">MINIMAL RISK — Largely unregulated</h4>
              <BulletList items={[
                'Spam filters, video games, most current AI apps',
                'Voluntary codes of conduct encouraged',
              ]} color="green" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">EXAM TIP: Know the 4 risk levels and examples COLD. Social scoring = BANNED. Recruitment AI = HIGH RISK. Chatbot = LIMITED RISK. Spam filter = MINIMAL RISK.</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="OWASP Top 10 for LLM Applications (2025)" icon={<AlertTriangle size={18} className="text-red-500" />} highlight>
        <div className="space-y-2 mt-3">
          {[
            { num: 'LLM01', name: 'Prompt Injection', desc: 'Direct & indirect manipulation of LLM via crafted prompts. Defense: input filtering, output validation, sandboxing.' },
            { num: 'LLM02', name: 'Sensitive Information Disclosure', desc: 'LLM reveals PII, credentials, or proprietary data. Defense: data sanitization, output filtering, access controls.' },
            { num: 'LLM03', name: 'Supply Chain Vulnerabilities', desc: 'Compromised training data, models, or plugins from 3rd parties. Defense: vetting, integrity checks, SBOM.' },
            { num: 'LLM04', name: 'Data and Model Poisoning', desc: 'Manipulated training/fine-tuning data introduces backdoors. Defense: data validation, provenance tracking.' },
            { num: 'LLM05', name: 'Improper Output Handling', desc: 'Unsanitized LLM output leads to XSS, SSRF, code execution. Defense: output encoding, CSP, sandboxing.' },
            { num: 'LLM06', name: 'Excessive Agency', desc: 'LLM given too many permissions/capabilities. Defense: least privilege, human approval for actions.' },
            { num: 'LLM07', name: 'System Prompt Leakage', desc: 'Attackers extract system prompts revealing sensitive instructions. Defense: prompt hardening, separation.' },
            { num: 'LLM08', name: 'Vector and Embedding Weaknesses', desc: 'Manipulation of RAG/embedding pipelines. Defense: input validation, access controls on vector stores.' },
            { num: 'LLM09', name: 'Misinformation', desc: 'LLM generates false/misleading content (hallucination). Defense: RAG, grounding, human review.' },
            { num: 'LLM10', name: 'Unbounded Consumption', desc: 'Resource exhaustion via excessive queries. Defense: rate limiting, token budgets, monitoring.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <span className="text-xs font-mono font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded h-fit whitespace-nowrap">{item.num}</span>
              <div>
                <span className="font-semibold text-sm">{item.name}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="MITRE ATLAS (Adversarial Threat Landscape for AI Systems)" icon={<Eye size={18} className="text-indigo-500" />}>
        <div className="space-y-2 mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Knowledge base of adversarial ML tactics modeled after ATT&CK framework.</p>
          <BulletList items={[
            'Reconnaissance: Gathering info about target AI system',
            'Resource Development: Creating tools, acquiring data for attacks',
            'Initial Access: Gaining access to AI system or pipeline',
            'ML Attack Staging: Preparing adversarial inputs/poisoned data',
            'ML Model Access: Interacting with model (API, local)',
            'Exfiltration: Extracting model info or training data',
            'Impact: Causing harm (misclassification, denial, manipulation)',
          ]} color="purple" />
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">EXAM TIP: MITRE ATLAS = AI/ML attacks. MITRE ATT&CK = general cyber attacks. Know the difference!</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Additional Key Frameworks" icon={<Layers size={18} className="text-cyan-500" />}>
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border dark:border-gray-700 p-3">
              <h4 className="font-bold text-sm">OECD AI Principles</h4>
              <BulletList items={[
                'Inclusive growth & sustainable development',
                'Human-centred values & fairness',
                'Transparency & explainability',
                'Robustness, security & safety',
                'Accountability',
              ]} color="blue" />
            </div>
            <div className="rounded-lg border dark:border-gray-700 p-3">
              <h4 className="font-bold text-sm">NIST Cybersecurity Framework (CSF)</h4>
              <BulletList items={[
                'Identify — asset management, risk assessment',
                'Protect — access control, data security',
                'Detect — anomaly detection, monitoring',
                'Respond — incident response, mitigation',
                'Recover — recovery planning, improvements',
              ]} color="green" />
            </div>
            <div className="rounded-lg border dark:border-gray-700 p-3">
              <h4 className="font-bold text-sm">CRISP-DM (AI Development Lifecycle)</h4>
              <BulletList items={[
                '1. Business Understanding',
                '2. Data Understanding',
                '3. Data Preparation',
                '4. Modeling',
                '5. Evaluation',
                '6. Deployment',
                'Iterative, not linear!',
              ]} color="orange" />
            </div>
            <div className="rounded-lg border dark:border-gray-700 p-3">
              <h4 className="font-bold text-sm">ISO/IEC 23894 — AI Risk Management</h4>
              <BulletList items={[
                'Guidance on managing risks from AI',
                'Extends ISO 31000 for AI context',
                'Risk identification, analysis, evaluation',
                'Not certifiable (guidance only)',
              ]} color="purple" />
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

// ===== DOMAIN 1 TAB =====
function Domain1Tab() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h2 className="font-bold text-blue-700 dark:text-blue-300 text-lg flex items-center gap-2">
          <Scale size={20} /> Domain 1: AI Governance and Program Management (31%)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Advise stakeholders on implementing AI security solutions through policy, data governance, program management and incident response.
        </p>
      </div>

      <Collapsible title="A — Stakeholder Considerations, Frameworks & Regulations" icon={<Globe size={18} />} defaultOpen highlight>
        <div className="space-y-2 mt-3">
          <BulletList items={[
            'AI Governance Charter: defines scope, roles, decision authority',
            'AI Ethics Board: provides oversight on ethical AI use',
            'AI Center of Excellence (CoE): central support for AI best practices',
            'NIST AI RMF: Govern → Map → Measure → Manage',
            'ISO/IEC 42001: Certifiable AI Management System (PDCA)',
            'EU AI Act: Risk-based classification (Unacceptable/High/Limited/Minimal)',
            'OECD AI Principles: Human-centred, transparent, accountable',
            'Regulatory landscape varies by jurisdiction and industry',
            'Cross-functional governance teams: business + IT + legal + ethics',
          ]} color="blue" />
        </div>
      </Collapsible>

      <Collapsible title="B — AI-Related Strategies, Policies & Procedures" icon={<FileText size={18} />} highlight>
        <BulletList items={[
          'AI Strategy aligned with business objectives (FIRST step always)',
          'Acceptable Use Policy: defines permitted/prohibited AI uses',
          'AI Development Policy: standards for building AI systems',
          'Data Policy: collection, usage, retention, disposal rules',
          'Third-Party AI Policy: vendor assessment and governance',
          'AI Ethics Policy: fairness, transparency, accountability requirements',
          'Security-specific AI policies and procedures',
          'Policy review cycle: regular updates as technology/regulations evolve',
          'AI security awareness training and acceptable use guidelines',
        ]} color="blue" />
      </Collapsible>

      <Collapsible title="C — AI Asset and Data Life Cycle Management" icon={<Layers size={18} />} highlight>
        <BulletList items={[
          'AI Asset Inventory: catalog all AI systems, models, datasets',
          'Classification of AI assets by risk level',
          'Data lineage and provenance tracking',
          'Data quality management (accuracy, completeness, timeliness)',
          'Data governance: ownership, stewardship, access controls',
          'Data retention and disposal policies',
          'Model lifecycle: development → testing → deployment → monitoring → retirement',
          'Model cards: documentation of model details, limitations, intended use',
          'Datasheets for datasets: documentation of data collection and characteristics',
        ]} color="blue" />
      </Collapsible>

      <Collapsible title="D — AI Security Program Development & Management" icon={<Shield size={18} />}>
        <BulletList items={[
          'AI Security Program integrated with enterprise security',
          'KPIs and KRIs for AI security',
          'Resource allocation and budgeting for AI security',
          'AI security roadmap aligned with AI strategy',
          'Skills gap analysis and training programs',
          'AI security metrics and reporting',
          'Continuous improvement of AI security controls',
        ]} color="blue" />
      </Collapsible>

      <Collapsible title="E — Business Continuity and Incident Response" icon={<AlertTriangle size={18} />}>
        <BulletList items={[
          'AI-specific incident response plan',
          'AI incident handling: containment → notification → escalation → eradication → recovery',
          'AI-specific BCP/DRP considerations',
          'Model rollback and failover procedures',
          'Human fallback procedures when AI fails',
          'Post-incident review and lessons learned',
          'Regulatory notification requirements for AI incidents',
          'Evidence preservation for AI incidents',
        ]} color="blue" />
      </Collapsible>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-300 dark:border-yellow-700">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><Zap size={16} /> Domain 1 Quick-Fire Mnemonics</h3>
        <div className="mt-2 space-y-1 text-sm">
          <p><strong>NIST AI RMF:</strong> "Good Maps Measure Management" → Govern, Map, Measure, Manage</p>
          <p><strong>ISO 42001 PDCA:</strong> "Please Do Check Again" → Plan, Do, Check, Act</p>
          <p><strong>EU AI Act levels:</strong> "U-H-L-M" → Unacceptable, High, Limited, Minimal (severity decreasing)</p>
          <p><strong>FIRST priority:</strong> Always align AI with BUSINESS OBJECTIVES before anything technical</p>
          <p><strong>Governance before management:</strong> Set policies BEFORE implementing controls</p>
        </div>
      </div>
    </div>
  );
}

// ===== DOMAIN 2 TAB =====
function Domain2Tab() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <h2 className="font-bold text-red-700 dark:text-red-300 text-lg flex items-center gap-2">
          <Shield size={20} /> Domain 2: AI Risk Management (31%)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Assess and manage risks, threats, vulnerabilities and supply chain issues related to enterprise AI adoption.
        </p>
      </div>

      <Collapsible title="A — AI Risk Assessment, Thresholds & Treatment" icon={<Target size={18} />} defaultOpen highlight>
        <BulletList items={[
          'Risk = Likelihood × Impact (same as traditional risk)',
          'AI-specific risk categories: security, privacy, safety, ethical, operational, reputational, legal, financial',
          'Risk appetite set by Board/Executive Management (NOT technical teams)',
          'Risk assessment methodologies: qualitative, quantitative, hybrid',
          'Threat modeling for AI: STRIDE, PASTA adapted for AI context',
          'AI system inventory and classification by risk level',
          'AI impact assessments: assess societal and individual impacts',
          'Risk treatment: accept, mitigate, transfer, avoid',
          'Risk register maintained and regularly reviewed',
          'Residual risk documented and accepted by appropriate authority',
        ]} color="red" />
      </Collapsible>

      <Collapsible title="B — AI Threat and Vulnerability Management" icon={<AlertTriangle size={18} />} highlight>
        <div className="space-y-3 mt-2">
          <h4 className="font-semibold text-sm">Key AI Attack Types (KNOW THESE):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { attack: 'Adversarial Examples', when: 'Inference time', what: 'Perturbed inputs cause misclassification' },
              { attack: 'Data Poisoning', when: 'Training time', what: 'Corrupted training data = bad model' },
              { attack: 'Model Extraction', when: 'Inference time', what: 'Stealing model via API queries' },
              { attack: 'Model Inversion', when: 'Inference time', what: 'Reconstructing training data from model' },
              { attack: 'Membership Inference', when: 'Inference time', what: 'Determine if data was in training set' },
              { attack: 'Prompt Injection', when: 'Inference time', what: 'Manipulating LLM behavior via input' },
              { attack: 'Backdoor Attack', when: 'Training time', what: 'Hidden trigger causes specific behavior' },
              { attack: 'Supply Chain Attack', when: 'Development', what: 'Compromised models/libraries/data sources' },
            ].map((a, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 text-xs">
                <span className="font-bold">{a.attack}</span>
                <span className="text-gray-500 ml-2">({a.when})</span>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">{a.what}</p>
              </div>
            ))}
          </div>
          
          <h4 className="font-semibold text-sm mt-3">Key Defenses:</h4>
          <BulletList items={[
            'Adversarial training: include adversarial examples in training',
            'Input validation & sanitization for all AI inputs',
            'Output filtering & guardrails for AI outputs',
            'Rate limiting to prevent model extraction',
            'Differential privacy to prevent data inference',
            'Red teaming and adversarial robustness testing',
            'Vulnerability scanning of AI infrastructure & dependencies',
            'Continuous monitoring for anomalous behavior',
          ]} color="red" />
        </div>
      </Collapsible>

      <Collapsible title="C — AI Vendor and Supply Chain Management" icon={<Lock size={18} />} highlight>
        <BulletList items={[
          'Vendor due diligence specific to AI (model cards, data practices)',
          'AI-specific vendor risk questionnaires',
          'Security requirements in AI vendor contracts',
          'Right to audit AI vendor practices',
          'SLAs for model performance, uptime, accuracy',
          'Data handling and privacy requirements',
          'Incident notification requirements from vendors',
          'Model provenance verification (where did this model come from?)',
          'Open-source AI model risk assessment',
          'Software Bill of Materials (SBOM) for AI components',
          'Continuous monitoring of vendor AI solutions',
          'Exit strategies and data portability clauses',
        ]} color="red" />
      </Collapsible>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-300 dark:border-yellow-700">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><Zap size={16} /> Domain 2 Quick-Fire Mnemonics</h3>
        <div className="mt-2 space-y-1 text-sm">
          <p><strong>Attack timing:</strong> Poisoning/Backdoor = TRAINING. Adversarial/Extraction/Injection = INFERENCE.</p>
          <p><strong>MITRE ATLAS</strong> = AI attacks. <strong>MITRE ATT&CK</strong> = cyber attacks.</p>
          <p><strong>Differential Privacy</strong> = adds noise to protect individuals. <strong>Federated Learning</strong> = data stays local.</p>
          <p><strong>Risk appetite</strong> = Board decision. <strong>Risk treatment</strong> = Management decision.</p>
          <p><strong>OWASP LLM01</strong> = Prompt Injection (most common LLM attack)</p>
        </div>
      </div>
    </div>
  );
}

// ===== DOMAIN 3 TAB =====
function Domain3Tab() {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <h2 className="font-bold text-purple-700 dark:text-purple-300 text-lg flex items-center gap-2">
          <Cpu size={20} /> Domain 3: AI Technologies and Controls (38%) — HEAVIEST DOMAIN
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Optimize AI security: security technologies, techniques and controls tailored to AI systems.
        </p>
      </div>

      <Collapsible title="A — AI Security Architecture and Design" icon={<Cpu size={18} />} defaultOpen highlight>
        <BulletList items={[
          'Security-by-design principles for AI systems',
          'AI reference architectures with security controls',
          'Integration of AI architecture into enterprise architecture',
          'Zero-trust principles applied to AI systems',
          'Secure AI development environments (notebooks, pipelines)',
          'MLOps security: CI/CD for ML with security gates',
          'Containerization & orchestration security for AI workloads',
          'API security for AI model endpoints',
          'Edge AI deployment security considerations',
          'Multi-model architectures and security boundaries',
        ]} color="purple" />
      </Collapsible>

      <Collapsible title="B — Data Management Controls" icon={<Layers size={18} />} highlight>
        <BulletList items={[
          'Data encryption at rest and in transit',
          'Role-based access control (RBAC) for data',
          'Data anonymization: k-anonymity, l-diversity, t-closeness',
          'Pseudonymization techniques',
          'Differential privacy for training and inference',
          'Federated learning: collaborative training without sharing data',
          'Secure multi-party computation',
          'Data lineage and provenance tracking',
          'Data quality validation pipelines',
          'Synthetic data generation for privacy',
          'PII detection and handling in AI pipelines',
          'Data retention and secure disposal',
        ]} color="purple" />
      </Collapsible>

      <Collapsible title="C — Privacy, Ethical, Trust and Safety Controls" icon={<Scale size={18} />} highlight>
        <BulletList items={[
          'Privacy-by-design in AI systems (GDPR Article 25)',
          'Right to explanation for automated decisions (GDPR Article 22)',
          'Data subject access requests (DSAR) for AI data',
          'Consent management for AI data processing',
          'Bias detection tools and fairness metrics',
          'Fairness: demographic parity, equalized odds, calibration',
          'Explainability: LIME, SHAP, attention maps, feature importance',
          'Content moderation and safety filters',
          'Human-in-the-loop for high-risk decisions',
          'AI transparency: model cards, datasheets, disclosure',
          'Red teaming for safety and ethics',
          'Responsible AI toolkits and checklists',
        ]} color="purple" />
      </Collapsible>

      <Collapsible title="D — Security Controls and Monitoring" icon={<Eye size={18} />} highlight>
        <BulletList items={[
          'Model access controls and authentication',
          'Model integrity verification (signing, hashing)',
          'Input validation and sanitization at inference',
          'Output filtering, guardrails, and moderation',
          'Rate limiting to prevent extraction attacks',
          'Model watermarking for IP protection',
          'Adversarial robustness testing',
          'Penetration testing adapted for AI systems',
          'Real-time performance monitoring dashboards',
          'Data drift detection: KS test, PSI, chi-square',
          'Concept drift detection and alerting',
          'Anomaly detection for AI system behavior',
          'Security event monitoring and SIEM integration',
          'Incident detection and automated response',
          'SLAs/SLOs for AI system reliability',
        ]} color="purple" />
      </Collapsible>

      <Collapsible title="E — AI Operations (MLOps)" icon={<Brain size={18} />}>
        <BulletList items={[
          'MLOps maturity: manual → automated → CI/CD for ML',
          'Feature stores for consistent feature management',
          'Model registries for version control',
          'Experiment tracking and reproducibility',
          'Automated retraining triggers (scheduled, drift-based, event-based)',
          'Champion-challenger model testing',
          'Deployment patterns: shadow, canary, blue-green, A/B',
          'Model decommissioning: data retention, secure deletion, audit trail',
          'Change management for model updates',
          'Runbooks and on-call procedures for AI systems',
        ]} color="purple" />
      </Collapsible>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-300 dark:border-yellow-700">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><Zap size={16} /> Domain 3 Quick-Fire Mnemonics</h3>
        <div className="mt-2 space-y-1 text-sm">
          <p><strong>Explainability:</strong> LIME = local, perturbation-based. SHAP = global, game theory. Feature importance = global, model-specific.</p>
          <p><strong>Privacy tech:</strong> Differential Privacy = add noise. Federated Learning = data stays local. Homomorphic Encryption = compute on encrypted data.</p>
          <p><strong>Drift types:</strong> Data drift = input distribution changes. Concept drift = input→output relationship changes.</p>
          <p><strong>Deployment:</strong> Shadow = parallel, no user impact. Canary = small % first. Blue-Green = instant switch.</p>
          <p><strong>This domain = 38% of exam.</strong> Spend the MOST time here!</p>
        </div>
      </div>
    </div>
  );
}

// ===== ISACA TIPS TAB =====
function ISACATipsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <h2 className="font-bold text-orange-700 dark:text-orange-300 text-lg flex items-center gap-2">
          <Target size={20} /> ISACA Exam Technique — The Secret Sauce
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          These techniques can gain you 10-15% on your score. ISACA exams test JUDGMENT, not memory.
        </p>
      </div>

      <Collapsible title="The ISACA Question Pattern" icon={<Star size={18} className="text-yellow-500" />} defaultOpen highlight>
        <div className="space-y-3 mt-3">
          <p className="text-sm font-semibold">ISACA questions often have 2-3 "correct" answers. The qualifiers tell you which one they want:</p>
          
          <div className="space-y-2">
            {[
              { keyword: 'MOST important', meaning: 'Highest-level, strategic answer. Think governance first, then management, then technical.' },
              { keyword: 'BEST', meaning: 'Most complete/comprehensive option. Usually the answer that covers multiple aspects.' },
              { keyword: 'FIRST', meaning: 'The prerequisite step. What MUST happen before anything else can work?' },
              { keyword: 'PRIMARY', meaning: 'Main purpose/reason. Not a secondary benefit — the core reason something exists.' },
              { keyword: 'GREATEST', meaning: 'Biggest impact. Which option has the most significant effect?' },
              { keyword: 'LEAST likely', meaning: 'Invert your thinking. Three options are correct — find the one that\'s wrong.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-sm whitespace-nowrap min-w-[120px]">"{item.keyword}"</span>
                <span className="text-sm">{item.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </Collapsible>

      <Collapsible title="The ISACA Answer Hierarchy" icon={<CheckCircle size={18} className="text-green-500" />} highlight>
        <div className="space-y-3 mt-3">
          <p className="text-sm font-semibold">When in doubt, follow this hierarchy (top = preferred answer):</p>
          <div className="space-y-1">
            {[
              { level: '1', text: 'Business alignment / Strategic objectives', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
              { level: '2', text: 'Governance / Policy / Framework', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
              { level: '3', text: 'Risk assessment / Impact analysis', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
              { level: '4', text: 'Management controls / Processes', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
              { level: '5', text: 'Technical controls / Implementation', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
              { level: '6', text: 'Operational / Day-to-day tasks', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
            ].map((item) => (
              <div key={item.level} className={`flex items-center gap-3 p-2.5 rounded-lg ${item.color}`}>
                <span className="font-bold text-lg w-8 text-center">{item.level}</span>
                <span className="font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-300">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Example: "What should be done FIRST when implementing AI in an org?" — Answer: Align with business objectives (Level 1), NOT "install security tools" (Level 5).</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Time Management Strategy" icon={<Zap size={18} className="text-blue-500" />}>
        <div className="space-y-2 mt-3">
          <KeyValue label="Total questions" value="90" bold />
          <KeyValue label="Total time" value="150 minutes (2.5 hours)" bold />
          <KeyValue label="Per question" value="~1 min 40 sec" bold />
          <KeyValue label="Pass score" value="450 / 800" bold />
          <BulletList items={[
            'First pass: answer all questions you know (target 60 min)',
            'Mark difficult ones — don\'t get stuck',
            'Second pass: tackle marked questions (target 45 min)',
            'Third pass: review flagged answers (remaining time)',
            'NEVER leave a question blank — no penalty for guessing',
            'Take 1-minute mental breaks every 30 questions',
            'If stuck between 2 options: pick the more governance/strategic one',
          ]} color="blue" />
        </div>
      </Collapsible>

      <Collapsible title="Common Traps to Avoid" icon={<AlertTriangle size={18} className="text-red-500" />}>
        <BulletList items={[
          'Don\'t pick "implement a technical control" when "establish a policy" is an option',
          'Don\'t pick the most technically advanced answer — pick the most appropriate',
          'Don\'t assume "more security = better" — proportionate controls are the goal',
          'Don\'t confuse "risk assessment" with "risk treatment" — assessment comes FIRST',
          'Don\'t pick answers that bypass governance (even if faster)',
          'Don\'t confuse frameworks: NIST AI RMF ≠ NIST CSF ≠ ISO 42001',
          'Don\'t overthink — ISACA questions test standard best practices, not edge cases',
          'Read ALL four options before selecting — the best answer is often C or D',
        ]} color="red" />
      </Collapsible>
    </div>
  );
}

// ===== SUPPORTING TASKS TAB =====
function SupportingTasksTab() {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <h2 className="font-bold text-green-700 dark:text-green-300 text-lg flex items-center gap-2">
          <FileText size={20} /> 22 Official Supporting Tasks (from ISACA Exam Outline)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          These are the ACTUAL job tasks the exam validates. Each question maps to one or more of these.
        </p>
      </div>

      {[
        { group: 'Governance & Strategy', tasks: [
          { num: 1, text: 'Collaborate on charter, roles, and responsibilities for governance and management of AI to align with business objectives.' },
          { num: 2, text: 'Establish and maintain AI-specific security policies and procedures to inform the development and implementation of AI standards and guidelines.' },
          { num: 3, text: 'Develop and maintain AI-specific security awareness training and acceptable use guidelines.' },
          { num: 20, text: 'Ensure the responsible use of AI by utilizing leading practices, ethical principles, regulatory requirements, and industry frameworks.' },
        ]},
        { group: 'Risk Management', tasks: [
          { num: 15, text: 'Conduct AI impact assessments and ensure conformity with regulatory requirements.' },
          { num: 17, text: 'Monitor for internal and external AI-related factors to identify the need for reassessment of risk.' },
          { num: 18, text: 'Identify and assess the AI threat landscape.' },
          { num: 19, text: 'Participate in or oversee the AI risk management life cycle, including impacts on enterprise risk.' },
        ]},
        { group: 'Data & Asset Management', tasks: [
          { num: 9, text: 'Identify and treat security risk associated with data used in the AI life cycle.' },
          { num: 10, text: 'Establish and maintain processes to identify, inventory, and classify data and assets related to AI.' },
        ]},
        { group: 'Security Architecture & Controls', tasks: [
          { num: 4, text: 'Review and implement AI security tools as part of the information security program.' },
          { num: 5, text: 'Define and monitor security metrics for AI solutions used throughout the organization.' },
          { num: 11, text: 'Design, implement, and regularly review AI security controls to treat risk to an acceptable level.' },
          { num: 12, text: 'Advise on the integration of AI architecture as part of enterprise architecture.' },
          { num: 13, text: 'Design and implement security architecture specifically for AI.' },
        ]},
        { group: 'Vendor & Supply Chain', tasks: [
          { num: 14, text: 'Embed, monitor, and verify AI security requirements when utilizing vendor AI-enabled solutions.' },
        ]},
        { group: 'Testing & Vulnerability Management', tasks: [
          { num: 1, text: 'Advise on security risk and controls related to the AI solution development life cycle within an organization.' },
          { num: 16, text: 'Design and implement testing and vulnerability management of AI solutions.' },
        ]},
        { group: 'Monitoring & Oversight', tasks: [
          { num: 3, text: 'Conduct risk-based human oversight of AI inputs/outputs including trust and safety, quality, explainability, and robustness.' },
        ]},
        { group: 'Incident Response & BCM', tasks: [
          { num: 6, text: 'Address AI security risk as part of business continuity and disaster recovery planning.' },
          { num: 7, text: 'Establish and maintain AI incident handling processes, including containment, notification, escalation, eradication, and recovery.' },
          { num: 8, text: 'Establish and maintain AI-specific processes to investigate, document, and report on AI security incidents in accordance with regulatory and contractual requirements.' },
        ]},
      ].map((group, gi) => (
        <Collapsible key={gi} title={group.group} icon={<CheckCircle size={18} className="text-green-500" />} defaultOpen={gi === 0}>
          <div className="space-y-2 mt-2">
            {group.tasks.map((task, ti) => (
              <div key={ti} className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <span className="text-xs font-mono font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded h-fit">T{task.num}</span>
                <span className="text-sm">{task.text}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      ))}
    </div>
  );
}

// ===== YOUTUBE TAB =====
function YouTubeTab() {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <h2 className="font-bold text-red-700 dark:text-red-300 text-lg flex items-center gap-2">
          <ExternalLink size={20} /> Video Study Resources
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Key YouTube content for AAISM exam preparation. Watch at 1.5x-2x speed to save time.
        </p>
      </div>

      <Collapsible title="AAISM Exam Playlist (AI Security Manager)" icon={<Star size={18} className="text-red-500" />} defaultOpen highlight>
        <div className="space-y-3 mt-3">
          <a 
            href="https://www.youtube.com/watch?v=yAF6n9MzdM4&list=PLIxmyWoEAwwPLaKTSy5vaH849BjzI2o88"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white">
              <ExternalLink size={24} />
            </div>
            <div>
              <span className="font-bold block">AI Security Manager (AAISM) Playlist</span>
              <span className="text-sm text-gray-500">Watch all videos — covers all 3 domains</span>
            </div>
          </a>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-300">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">CRAM TIP: Watch at 2x speed. Focus on Domain 3 videos first (38% of exam). Take notes on any concepts you don't recognize.</p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="AAISM Exam Overview Videos" icon={<ExternalLink size={18} />}>
        <div className="space-y-2 mt-3">
          <a href="https://www.youtube.com/watch?v=xV2vUssgjSs" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <span className="text-red-500"><ExternalLink size={18} /></span>
            <div>
              <span className="font-semibold text-sm">AAISM Exam Explained! Everything You Need to Know</span>
              <span className="block text-xs text-gray-500">Complete domain breakdown with real-world scenarios</span>
            </div>
          </a>
        </div>
      </Collapsible>

      <Collapsible title="Framework Deep Dives" icon={<BookOpen size={18} />}>
        <div className="space-y-2 mt-3">
          <a href="https://www.youtube.com/playlist?list=PLMyllGTEerJMXF-zhfGNhKpQU7tKxmRlh" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <span className="text-blue-500"><ExternalLink size={18} /></span>
            <div>
              <span className="font-semibold text-sm">NIST AI Risk Management Framework 1.0 Playlist</span>
              <span className="block text-xs text-gray-500">Complete walkthrough of Govern, Map, Measure, Manage</span>
            </div>
          </a>
        </div>
      </Collapsible>

      <Collapsible title="Key Topics for Quick Review" icon={<Zap size={18} />}>
        <BulletList items={[
          'Search: "EU AI Act explained" — understand the 4 risk levels',
          'Search: "OWASP Top 10 LLM 2025" — know all 10 categories',
          'Search: "ISO 42001 explained" — PDCA cycle for AI',
          'Search: "Adversarial machine learning attacks" — visual explanations',
          'Search: "MLOps explained" — understand the pipeline',
          'Search: "Federated learning explained" — privacy-preserving AI',
          'Search: "LIME vs SHAP explained" — model explainability',
          'Search: "Data drift vs concept drift" — monitoring concepts',
        ]} color="red" />
      </Collapsible>

      <Collapsible title="ISACA Official Resources" icon={<Globe size={18} />}>
        <div className="space-y-2 mt-3">
          <a href="https://isaca.org/credentialing/aaism/practice-quiz" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <span className="text-blue-500"><Star size={18} /></span>
            <div>
              <span className="font-bold text-sm text-blue-700 dark:text-blue-300">FREE ISACA Practice Quiz (MUST DO)</span>
              <span className="block text-xs text-gray-500">Same difficulty as actual exam — best indicator of readiness</span>
            </div>
          </a>
          <a href="https://isaca.org/credentialing/aaism/aaism-exam-content-outline" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <span className="text-green-500"><FileText size={18} /></span>
            <div>
              <span className="font-semibold text-sm">Official AAISM Exam Content Outline</span>
              <span className="block text-xs text-gray-500">The definitive list of what's tested</span>
            </div>
          </a>
        </div>
      </Collapsible>
    </div>
  );
}
