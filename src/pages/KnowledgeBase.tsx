import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, BookOpen, ChevronRight, ExternalLink, AlertTriangle,
  Target, Lightbulb, GraduationCap, Route, HelpCircle, Theater,
  Briefcase, Crosshair, Radar, Eye, Zap, Building2, CheckCircle2,
} from 'lucide-react';
import {
  domains, topics, glossary, owaspLLM, searchKnowledgeBase, Topic, Term,
} from '../data/knowledgeBase';
import { AAISM_DOMAIN_GUIDES, searchDomainGuides, type DomainGuide } from '../data/aaismDomainGuide';
import { STUDY_PATHS, PLATFORM_WORKFLOWS, PLATFORM_META_SECTIONS } from '../data/platformMeta';
import { getContentStats } from '../data/examContent';
import { useGamification } from '../context/GamificationContext';

type MainTab = 'domains' | 'topics' | 'glossary' | 'owasp' | 'platform' | 'search';

const DOMAIN_COLORS: Record<number, string> = {
  1: 'from-blue-500 to-cyan-600',
  2: 'from-red-500 to-orange-600',
  3: 'from-purple-500 to-indigo-600',
  4: 'from-emerald-500 to-teal-600',
};

const DOMAIN_BADGE: Record<number, string> = {
  1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  2: 'bg-red-500/20 text-red-400 border-red-500/30',
  3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  4: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function DomainGuidePanel({ guide }: { guide: DomainGuide }) {
  return (
    <div className="space-y-6">
      <div>
        <span className={`text-xs font-bold px-2 py-1 rounded border ${DOMAIN_BADGE[guide.id]}`}>
          Domain {guide.id} · {guide.weight}
        </span>
        <h2 className="text-xl font-bold mt-2 text-gray-900 dark:text-white">{guide.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{guide.overview}</p>
      </div>

      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <GraduationCap className="w-4 h-4 text-emerald-500" />
          Learning Objectives
        </h3>
        <ul className="space-y-2">
          {guide.learningObjectives.map((obj, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              {obj}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Core Concepts</h3>
        <div className="space-y-4">
          {guide.coreConcepts.map((concept, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget"
            >
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{concept.title}</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{concept.summary}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{concept.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Frameworks & Standards Crosswalk</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-500">Framework</th>
                <th className="text-left py-2 px-3 text-gray-500">Relevance</th>
                <th className="text-left py-2 px-3 text-gray-500">Exam Weight</th>
              </tr>
            </thead>
            <tbody>
              {guide.frameworks.map((fw, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{fw.name}</td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{fw.relevance}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      fw.examWeight === 'high' ? 'bg-red-500/20 text-red-400' :
                      fw.examWeight === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {fw.examWeight}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <Target className="w-4 h-4 text-amber-500" />
          Common Exam Patterns
        </h3>
        <div className="space-y-3">
          {guide.examPatterns.map((pattern, i) => (
            <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{pattern.keyword}</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{pattern.prompt}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <strong>Logic:</strong> {pattern.answerLogic}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Trap Alerts
        </h3>
        <div className="space-y-3">
          {guide.trapAlerts.map((trap, i) => (
            <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-sm text-red-600 dark:text-red-400">{trap.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1"><strong>Trap:</strong> {trap.trap}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1"><strong>Correct:</strong> {trap.correctApproach}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Apply It
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Scenario:</strong> {guide.applyIt.scenario}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Org action:</strong> {guide.applyIt.orgAction}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Related Platform Features</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {guide.relatedFeatures.map((feat, i) => (
            <Link
              key={i}
              to={feat.route}
              className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors osint-widget group"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-500">{feat.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{feat.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function KnowledgeBase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state: gameState } = useGamification();
  const contentStats = getContentStats();

  const initialDomain = parseInt(searchParams.get('domain') || '1', 10);
  const [activeDomain, setActiveDomain] = useState(
    initialDomain >= 1 && initialDomain <= 4 ? initialDomain : 1
  );
  const [mainTab, setMainTab] = useState<MainTab>('domains');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    topics: Topic[];
    terms: Term[];
    guides: ReturnType<typeof searchDomainGuides>;
  } | null>(null);

  useEffect(() => {
    const d = parseInt(searchParams.get('domain') || '', 10);
    if (d >= 1 && d <= 4) setActiveDomain(d);
  }, [searchParams]);

  const activeGuide = AAISM_DOMAIN_GUIDES.find(g => g.id === activeDomain)!;

  const domainProgress = useMemo(() => {
    return [1, 2, 3, 4].map(id => {
      const scores = gameState.domainScores[id] || [];
      const avg = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const qCount = contentStats.questionsByDomain.find(d => d.domain === id)?.count ?? 0;
      return { id, avg, qCount, attempts: scores.length };
    });
  }, [gameState.domainScores, contentStats]);

  const filteredTopics = topics.filter(t => t.domain === activeDomain);
  const filteredGlossary = glossary.filter(t => t.domain === activeDomain);

  function handleDomainChange(id: number) {
    setActiveDomain(id);
    setSearchParams({ domain: String(id) });
    setMainTab('domains');
  }

  function handleSearch() {
    if (!searchQuery.trim()) return;
    const kb = searchKnowledgeBase(searchQuery);
    const guides = searchDomainGuides(searchQuery);
    setSearchResults({ ...kb, guides });
    setMainTab('search');
  }

  const mainTabs: Array<{ id: MainTab; label: string }> = [
    { id: 'domains', label: 'Domain Guides' },
    { id: 'topics', label: 'Topics' },
    { id: 'glossary', label: 'Glossary' },
    { id: 'owasp', label: 'OWASP LLM' },
    { id: 'platform', label: 'Platform Meta' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <BookOpen className="w-7 h-7 text-emerald-500" />
          AAISM Knowledge Base
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Domain-first mastery guides, exam patterns, and platform learning paths
        </p>
      </div>

      {/* Meta learning — study paths */}
      <section className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-purple-500/10 border border-emerald-500/20">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-1">
          <Route className="w-5 h-5 text-emerald-500" />
          How to Use This Platform to Master AAISM
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {PLATFORM_META_SECTIONS[0].content}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {STUDY_PATHS.map(path => (
            <div
              key={path.id}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget"
            >
              <div className="flex items-center gap-2 mb-2">
                {path.icon === 'cram' && <Zap className="w-4 h-4 text-yellow-500" />}
                {path.icon === 'deep' && <BookOpen className="w-4 h-4 text-blue-500" />}
                {path.icon === 'org' && <Building2 className="w-4 h-4 text-purple-500" />}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{path.name}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{path.description}</p>
              <ul className="space-y-1">
                {path.steps.slice(0, 3).map((step, i) => (
                  <li key={i}>
                    <Link to={step.route} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                      → {step.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Help Center
          </Link>
          <Link
            to="/playbooks"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            <Briefcase className="w-3.5 h-3.5" /> Playbooks
          </Link>
          <Link
            to="/scenarios"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            <Theater className="w-3.5 h-3.5" /> Scenario Lab
          </Link>
          <Link
            to="/knowledge/visual"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            <Eye className="w-3.5 h-3.5" /> Visual Knowledge Hub
          </Link>
        </div>
      </section>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search domains, concepts, frameworks, traps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Search
        </button>
      </div>

      {/* Domain tabs with progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AAISM_DOMAIN_GUIDES.map(guide => {
          const prog = domainProgress.find(p => p.id === guide.id)!;
          return (
            <button
              key={guide.id}
              onClick={() => handleDomainChange(guide.id)}
              className={`p-3 rounded-xl text-left transition-all border ${
                activeDomain === guide.id
                  ? `bg-gradient-to-br ${DOMAIN_COLORS[guide.id]} text-white border-transparent shadow-lg`
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
              }`}
            >
              <div className="text-xs font-bold opacity-80">D{guide.id} · {guide.weight}</div>
              <div className={`text-sm font-semibold mt-0.5 truncate ${activeDomain === guide.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {guide.shortName}
              </div>
              <div className={`text-[10px] mt-2 ${activeDomain === guide.id ? 'text-white/80' : 'text-gray-500'}`}>
                {prog.qCount} questions · {prog.avg > 0 ? `${prog.avg}% ready` : 'Not started'}
              </div>
              {prog.avg > 0 && (
                <div className={`h-1 rounded-full mt-1.5 overflow-hidden ${activeDomain === guide.id ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div
                    className={`h-full rounded-full ${activeDomain === guide.id ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{ width: `${prog.avg}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 overflow-x-auto">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium whitespace-nowrap transition-colors relative ${
                mainTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {mainTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
          {searchResults && (
            <button
              onClick={() => setMainTab('search')}
              className={`pb-3 px-1 text-sm font-medium whitespace-nowrap relative ${
                mainTab === 'search' ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              Results ({searchResults.topics.length + searchResults.terms.length + searchResults.guides.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {mainTab === 'domains' && <DomainGuidePanel guide={activeGuide} />}

          {mainTab === 'topics' && (
            <div className="space-y-4">
              {filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer transition-all osint-widget ${
                    selectedTopic?.id === topic.id ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-400'
                  }`}
                  onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${DOMAIN_BADGE[topic.domain]}`}>
                    Domain {topic.domain}
                  </span>
                  <h3 className="text-lg font-semibold mt-2 text-gray-900 dark:text-white">{topic.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{topic.description}</p>
                  {selectedTopic?.id === topic.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <ul className="space-y-1">
                        {topic.keyPoints.map((point, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                            <span className="text-emerald-500">•</span>{point}
                          </li>
                        ))}
                      </ul>
                      {topic.examTips.map((tip, i) => (
                        <p key={i} className="text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded">
                          💡 {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mainTab === 'glossary' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden osint-widget">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500">Term</th>
                    <th className="text-left px-4 py-3 text-gray-500">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlossary.map((term, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{term.term}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{term.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mainTab === 'owasp' && (
            <div className="space-y-4">
              {owaspLLM.map((item, i) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 osint-widget">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.id}: {item.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                    <strong>Mitigation:</strong> {item.mitigation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {mainTab === 'platform' && (
            <div className="space-y-6">
              {PLATFORM_META_SECTIONS.map(section => (
                <div key={section.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{section.content}</p>
                </div>
              ))}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform Workflows</h3>
                <div className="space-y-3">
                  {PLATFORM_WORKFLOWS.map(wf => (
                    <div key={wf.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">{wf.title}</h4>
                        <Link to={wf.route} className="text-xs text-emerald-500 hover:underline">Open →</Link>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{wf.summary}</p>
                      <ul className="mt-2 space-y-1">
                        {wf.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-gray-500 dark:text-gray-400">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mainTab === 'search' && searchResults && (
            <div className="space-y-6">
              {searchResults.guides.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Domain Guides ({searchResults.guides.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.guides.map(g => (
                      <button
                        key={g.id}
                        onClick={() => { handleDomainChange(g.id); setMainTab('domains'); }}
                        className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                      >
                        <span className="text-xs text-emerald-500">D{g.id}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white">{g.name}</h4>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.topics.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Topics ({searchResults.topics.length})</h3>
                  {searchResults.topics.map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-white dark:bg-gray-800 border mb-2">
                      <h4 className="font-medium">{t.title}</h4>
                      <p className="text-sm text-gray-500">{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.terms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Terms ({searchResults.terms.length})</h3>
                  {searchResults.terms.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white dark:bg-gray-800 border mb-2">
                      <span className="font-medium">{t.term}</span>
                      <p className="text-sm text-gray-500">{t.definition}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.guides.length === 0 && searchResults.topics.length === 0 && searchResults.terms.length === 0 && (
                <p className="text-center py-12 text-gray-500">No results for "{searchQuery}"</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Domain Progress</h3>
            {domainProgress.map(prog => (
              <div key={prog.id} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">D{prog.id}</span>
                  <span className="font-medium">{prog.avg > 0 ? `${prog.avg}%` : '—'}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.avg}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{prog.qCount} questions in bank</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { to: '/study', icon: Crosshair, label: 'Study Ops' },
                { to: '/scenarios', icon: Theater, label: 'Scenario Lab' },
                { to: '/playbooks', icon: Briefcase, label: 'Playbooks' },
                { to: '/intel', icon: Radar, label: 'Intel Hub' },
                { to: '/help', icon: HelpCircle, label: 'Help Center' },
                { to: '/knowledge/visual', icon: Eye, label: 'Visual Hub' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Exam Domains</h3>
            {domains.map(domain => (
              <button
                key={domain.id}
                onClick={() => handleDomainChange(domain.id)}
                className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                  activeDomain === domain.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-900 dark:text-white">D{domain.id}</span>
                  <span className="text-gray-500">{domain.weight}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{domain.name}</p>
              </button>
            ))}
          </div>

          <a
            href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            OWASP LLM Official <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
