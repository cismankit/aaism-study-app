import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, Star, Zap, Target, FileText,
  ExternalLink, AlertTriangle, CheckCircle, Scale,
} from 'lucide-react';
import type { Certification } from '../data/certifications/types';
import {
  getDomainGuide,
  getAllFrameworks,
  getExamTips,
  getCertQuickRefResources,
  type QuickRefMeta,
  type QuickRefTab,
} from '../data/certifications/quickRef';
import ConfidenceBadge from './ConfidenceBadge';
import { getFrameworkDoc } from '../data/frameworkDocs';
import { buildFrameworkConfidence } from '../services/confidenceService';

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
    <div className={`rounded-xl border ${highlight ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-theme bg-theme-elevated'} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left font-semibold hover:bg-cockpit-track/50 transition-colors"
      >
        {icon}
        <span className="flex-1">{title}</span>
        {highlight && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">HIGH YIELD</span>}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-theme">{children}</div>}
    </div>
  );
}

function BulletList({ items, color = 'blue' }: { items: string[]; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500', orange: 'bg-orange-500',
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

function FrameworksPanel({ cert }: { cert: Certification }) {
  const frameworks = getAllFrameworks(cert);
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
        <h3 className="font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
          <Star size={18} /> Frameworks across {cert.shortName} domains
        </h3>
      </div>
      {frameworks.map((fw, i) => {
        const doc = getFrameworkDoc(fw.name);
        const { linked, summary } = buildFrameworkConfidence({
          name: fw.name,
          docUrl: doc?.url,
          publisher: doc?.publisher,
        });
        return (
        <Collapsible
          key={fw.name}
          title={fw.name}
          icon={<BookOpen size={18} className="text-blue-500" />}
          defaultOpen={i < 2}
          highlight={fw.examWeight === 'high'}
        >
          <div className="mt-3 space-y-2">
            <p className="text-sm text-cockpit-muted">{fw.relevance}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                fw.examWeight === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                fw.examWeight === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                Exam weight: {fw.examWeight}
              </span>
              <ConfidenceBadge confidence={summary} compact />
              <ConfidenceBadge confidence={linked} compact />
            </div>
            {doc?.url ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <ExternalLink size={14} />
                {doc.publisher} official documentation
              </a>
            ) : (
              <p className="text-[11px] text-theme-muted">No official doc URL mapped — see Knowledge Base for context.</p>
            )}
          </div>
        </Collapsible>
        );
      })}
      {frameworks.length === 0 && (
        <p className="text-sm text-theme-muted">No framework crosswalk in domain guides yet — check Knowledge Base for deep dives.</p>
      )}
    </div>
  );
}

function DomainPanel({ cert, domainId }: { cert: Certification; domainId: number }) {
  const guide = getDomainGuide(cert, domainId);
  if (!guide) {
    return <p className="text-sm text-theme-muted">Domain guide not available for this track — explore Knowledge Base for deep dives.</p>;
  }

  const color = domainId % 3 === 1 ? 'blue' : domainId % 3 === 2 ? 'red' : 'purple';
  const keyTopics = 'keyTopics' in guide && Array.isArray((guide as { keyTopics?: string[] }).keyTopics)
    ? (guide as { keyTopics: string[] }).keyTopics
    : null;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 border ${
        color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
        color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
        'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      }`}>
        <h2 className={`font-bold text-lg flex items-center gap-2 ${
          color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
          color === 'red' ? 'text-red-700 dark:text-red-300' :
          'text-purple-700 dark:text-purple-300'
        }`}>
          <Scale size={20} /> Domain {domainId}: {guide.name} {guide.weight ? `(${guide.weight})` : ''}
        </h2>
        <p className="text-sm text-cockpit-muted mt-1">{guide.overview}</p>
      </div>

      <Collapsible title="Learning Objectives" icon={<Target size={18} />} defaultOpen highlight>
        <BulletList items={guide.learningObjectives} color={color} />
      </Collapsible>

      {guide.coreConcepts.map((concept, i) => (
        <Collapsible key={concept.title} title={concept.title} icon={<BookOpen size={18} />} defaultOpen={i === 0} highlight={i < 2}>
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">{concept.summary}</p>
            <p className="text-sm text-cockpit-muted">{concept.detail}</p>
          </div>
        </Collapsible>
      ))}

      {guide.trapAlerts.length > 0 && (
        <Collapsible title="Exam Traps" icon={<AlertTriangle size={18} className="text-amber-500" />} highlight>
          <div className="space-y-2 mt-2">
            {guide.trapAlerts.map((trap, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
                <span className="font-semibold text-amber-700 dark:text-amber-300">{trap.title}</span>
                <p className="text-theme-muted mt-1"><strong>Trap:</strong> {trap.trap}</p>
                <p className="text-theme-muted"><strong>Correct:</strong> {trap.correctApproach}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {keyTopics && (
        <Collapsible title="Key Topics Checklist" icon={<CheckCircle size={18} className="text-green-500" />}>
          <BulletList items={keyTopics} color="green" />
        </Collapsible>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-300 dark:border-yellow-700">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2"><Zap size={16} /> Apply It</h3>
        <p className="text-sm mt-2"><strong>Scenario:</strong> {guide.applyIt.scenario}</p>
        <p className="text-sm mt-1 text-cockpit-muted"><strong>Action:</strong> {guide.applyIt.orgAction}</p>
      </div>
    </div>
  );
}

function ExamTipsPanel({ cert }: { cert: Certification }) {
  const { patterns, traps } = getExamTips(cert);
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <h2 className="font-bold text-orange-700 dark:text-orange-300 text-lg flex items-center gap-2">
          <Target size={20} /> {cert.vendor} Exam Technique
        </h2>
        <p className="text-sm text-cockpit-muted mt-1">
          {cert.shortName} tests judgment — use qualifier keywords (BEST, MOST, FIRST) and governance-first thinking.
        </p>
      </div>

      {patterns.length > 0 && (
        <Collapsible title="Exam Pattern Library" icon={<Star size={18} className="text-yellow-500" />} defaultOpen highlight>
          <div className="space-y-2 mt-3">
            {patterns.map((p, i) => (
              <div key={i} className="p-3 bg-theme-muted dark:bg-gray-700/30 rounded-lg text-sm">
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">"{p.keyword}"</span>
                <p className="mt-1 text-theme-muted">{p.prompt}</p>
                <p className="mt-1"><strong>Logic:</strong> {p.answerLogic}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {traps.length > 0 && (
        <Collapsible title="Common Traps" icon={<AlertTriangle size={18} className="text-red-500" />} highlight>
          <div className="space-y-2 mt-2">
            {traps.slice(0, 8).map((trap, i) => (
              <div key={i} className="p-2 rounded-lg border border-theme text-sm">
                <span className="font-semibold">{trap.title}</span>
                <p className="text-theme-muted text-xs mt-0.5">Trap: {trap.trap} → {trap.correctApproach}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {cert.examFormat && (
        <Collapsible title="Time Management" icon={<Zap size={18} className="text-blue-500" />}>
          <div className="space-y-1 mt-2 text-sm">
            <p><strong>Questions:</strong> {cert.examFormat.questions}</p>
            <p><strong>Time:</strong> {cert.examFormat.minutes} minutes</p>
            <p><strong>Per question:</strong> ~{Math.round(cert.examFormat.minutes / cert.examFormat.questions * 60)} seconds</p>
            {cert.examFormat.passingScore && <p><strong>Pass target:</strong> ~{cert.examFormat.passingScore}%</p>}
            <BulletList items={[
              'First pass: answer what you know, mark uncertain items',
              'Second pass: tackle marked questions',
              'Never leave blanks — no penalty for guessing on most vendor exams',
              'When stuck between two: pick the more strategic/governance answer',
            ]} color="blue" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}

function ResourcesPanel({ cert }: { cert: Certification }) {
  const resources = getCertQuickRefResources(cert.id);
  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <h2 className="font-bold text-green-700 dark:text-green-300 text-lg flex items-center gap-2">
          <FileText size={20} /> {cert.shortName} Study Resources
        </h2>
      </div>
      {resources.map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-lg border border-theme hover:bg-cockpit-track/50 transition-colors"
        >
          <ExternalLink size={18} className="text-emerald-500 flex-shrink-0" />
          <div>
            <span className="font-semibold text-sm block">{r.title}</span>
            {r.note && <span className="text-xs text-theme-muted">{r.note}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

interface CertQuickRefProps {
  cert: Certification;
  meta: QuickRefMeta;
  tabs: QuickRefTab[];
}

export default function CertQuickRef({ cert, meta, tabs }: CertQuickRefProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'frameworks');
  const active = tabs.find(t => t.id === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          {meta.title}
        </h1>
        <p className="text-theme-muted mt-1">{meta.subtitle}</p>
        <div className="flex justify-center flex-wrap gap-2 mt-3">
          {meta.domainBadges.map(badge => (
            <span
              key={badge.label}
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                badge.heaviest
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              }`}
            >
              {badge.label}{badge.heaviest ? ' (HEAVIEST)' : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto bg-theme-elevated/80 p-1.5 rounded-xl border border-theme scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'text-cockpit-muted hover:bg-cockpit-track'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active?.type === 'frameworks' && <FrameworksPanel cert={cert} />}
      {active?.type === 'domain' && active.domainId && <DomainPanel cert={cert} domainId={active.domainId} />}
      {active?.type === 'exam-tips' && <ExamTipsPanel cert={cert} />}
      {active?.type === 'resources' && <ResourcesPanel cert={cert} />}
    </div>
  );
}
