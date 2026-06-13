import { useState } from 'react';
import {
  Briefcase, ChevronRight, ChevronDown, ChevronUp, Clock,
  CheckCircle, Users, AlertTriangle, BarChart3, Shield,
  BookOpen, Target, ArrowLeft, Lightbulb, Layers,
} from 'lucide-react';
import { PLAYBOOKS, PLAYBOOK_CATEGORIES, type Playbook } from '../data/playbooks';

type ViewMode = 'list' | 'detail';

export default function Playbooks() {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  function openPlaybook(pb: Playbook) {
    setSelectedPlaybook(pb);
    setView('detail');
    setExpandedPhase(0);
  }

  if (view === 'detail' && selectedPlaybook) {
    return (
      <PlaybookDetail
        playbook={selectedPlaybook}
        expandedPhase={expandedPhase}
        setExpandedPhase={setExpandedPhase}
        onBack={() => setView('list')}
      />
    );
  }

  const filtered = categoryFilter
    ? PLAYBOOKS.filter(p => p.category === categoryFilter)
    : PLAYBOOKS;

  const difficultyColors: Record<string, string> = {
    starter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-blue-500" />
          Implementation Playbooks
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Real-world org-level AI security guidance — POC templates, activity workflows, maturity models
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !categoryFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {PLAYBOOK_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              categoryFilter === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Playbook cards */}
      <div className="grid gap-4">
        {filtered.map(pb => (
          <button
            key={pb.id}
            onClick={() => openPlaybook(pb)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group osint-widget"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColors[pb.difficulty]}`}>
                    {pb.difficulty}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    D{pb.domain}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {pb.estimatedDuration}
                  </span>
                </div>
                <h3 className="font-semibold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {pb.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pb.overview}</p>

                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {pb.phases.length} phases
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> {pb.keyMetrics.length} KPIs
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> {pb.maturityLevels.length} maturity levels
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 mt-1 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ PLAYBOOK DETAIL ============

function PlaybookDetail({
  playbook: pb,
  expandedPhase,
  setExpandedPhase,
  onBack,
}: {
  playbook: Playbook;
  expandedPhase: number | null;
  setExpandedPhase: (n: number | null) => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Playbooks
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{pb.title}</h1>
        <p className="text-blue-100 text-sm mb-4">{pb.overview}</p>
        <div className="flex items-center gap-4 text-xs text-blue-200">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pb.estimatedDuration}</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {pb.phases.length} phases</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20">{pb.difficulty}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20">Domain {pb.domain}</span>
        </div>
      </div>

      {/* Business Case */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4" /> Business Case
        </h3>
        <p className="text-sm">{pb.businessCase}</p>
      </div>

      {/* Phases */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" /> Implementation Phases
        </h3>
        <div className="space-y-3">
          {pb.phases.map((phase, idx) => {
            const isExpanded = expandedPhase === idx;
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{phase.name}</h4>
                      <span className="text-xs text-gray-400">{phase.duration}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activities</h5>
                      <ul className="space-y-1.5">
                        {phase.activities.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deliverables</h5>
                        <ul className="space-y-1">
                          {phase.deliverables.map((d, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <BookOpen className="w-3 h-3 text-blue-500 flex-shrink-0" /> {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stakeholders</h5>
                        <ul className="space-y-1">
                          {phase.stakeholders.map((s, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <Users className="w-3 h-3 text-purple-500 flex-shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {phase.riskFlags.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Risk Flags
                        </h5>
                        <ul className="space-y-1">
                          {phase.riskFlags.map((r, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-300">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-500" /> Key Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pb.keyMetrics.map((m, i) => (
            <div key={i} className="text-sm flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Target className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" /> {m}
            </div>
          ))}
        </div>
      </div>

      {/* Maturity Model */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" /> Maturity Model
        </h3>
        <div className="space-y-2">
          {pb.maturityLevels.map(ml => (
            <div key={ml.level} className="flex items-start gap-3 p-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                ml.level <= 2 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                ml.level === 3 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                L{ml.level}
              </div>
              <div>
                <span className="font-medium text-sm">{ml.name}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{ml.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-world example + Exam relevance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2 text-sm">
            <Shield className="w-4 h-4" /> Real-World Example
          </h3>
          <p className="text-sm">{pb.realWorldExample}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2 mb-2 text-sm">
            <BookOpen className="w-4 h-4" /> Exam Relevance
          </h3>
          <p className="text-sm">{pb.examRelevance}</p>
        </div>
      </div>
    </div>
  );
}
