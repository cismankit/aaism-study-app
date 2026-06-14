import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Theater, Bot, Briefcase, Crosshair,
  Flame, TrendingUp, Target, ChevronRight, ChevronDown,
  Shield, BarChart3, Play, Lightbulb, Sparkles, X, Radar, Globe, PenLine,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { getLevelFromXP, getXPProgress } from '../data/gamificationData';
import { TOPIC_HEAT_MAP, QUESTION_PATTERNS } from '../data/communityIntelligence';
import { getPipelineStats } from '../services/agentService';
import { analyzeQuestionPatterns } from '../services/intelligenceAgent';
import { PLAYBOOKS } from '../data/playbooks';
import { LEARNING_PATH_WIDGET } from '../data/platformMeta';
import { AAISM_DOMAIN_GUIDES } from '../data/aaismDomainGuide';
import {
  getLatestRelease,
  getNewReleasesSince,
  LAST_SEEN_RELEASE_KEY,
} from '../data/releaseFeed';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { PLATFORM_ROADMAP, ROADMAP_STATUS_LABEL } from '../data/platformRoadmap';
import { OSINT_SOURCES } from '../data/osintSources';

export default function CommandCenter() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { state: gameState } = useGamification();
  const currentLevel = getLevelFromXP(gameState.xp);
  const xpProgress = getXPProgress(gameState.xp);

  const stats = getPipelineStats();
  const patternAnalysis = analyzeQuestionPatterns();
  const risingTopics = TOPIC_HEAT_MAP.filter(t => t.trend === 'rising' && t.heat >= 85);

  const recentQuizzes = state.quizAttempts.slice(-10);
  const avgScore = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
    : 0;

  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [newReleases, setNewReleases] = useState<ReturnType<typeof getNewReleasesSince>>([]);
  const [showMore, setShowMore] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_RELEASE_KEY);
    const unseen = getNewReleasesSince(lastSeen);
    if (unseen.length > 0) {
      setNewReleases(unseen);
      setShowWhatsNew(true);
    }
  }, []);

  function dismissWhatsNew() {
    const latest = getLatestRelease();
    if (latest) localStorage.setItem(LAST_SEEN_RELEASE_KEY, latest.id);
    setShowWhatsNew(false);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        iconClassName="text-emerald-500"
        title="Command Center"
        subtitle="Quick actions, progress, and intel summaries — open Intel Hub for deep dives."
        action={
          <Link
            to="/studio"
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 flex items-center gap-1.5"
          >
            <PenLine className="w-3.5 h-3.5" />
            Content Studio — turn study intel into posts
          </Link>
        }
      />

      {showWhatsNew && newReleases.length > 0 && (
        <div className="relative rounded-xl bg-gradient-to-r from-amber-500/15 to-cyan-500/10 border border-amber-500/25 p-4 animate-fade-in">
          <button
            onClick={dismissWhatsNew}
            className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">What&apos;s New</p>
              <ul className="mt-2 space-y-1">
                {newReleases.map(rel => (
                  <li key={rel.id} className="text-xs text-gray-600 dark:text-gray-400">
                    <strong className="text-amber-600 dark:text-amber-400">v{rel.version}</strong> — {rel.title}
                  </li>
                ))}
              </ul>
              <Link
                to="/my-updates"
                onClick={dismissWhatsNew}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                See all updates
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Compact mission status — no duplicate agent/intel counts elsewhere on page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard icon={Shield} label="Level" value={currentLevel.title} color="text-emerald-500" sub={`${gameState.xp} XP`} />
        <StatusCard icon={Flame} label="Streak" value={`${gameState.currentStreak}`} color="text-orange-500" sub="days" />
        <StatusCard icon={Crosshair} label="Quizzes" value={`${gameState.totalQuizzesTaken}`} color="text-blue-500" sub={`${avgScore}% avg`} />
        <StatusCard icon={Bot} label="Pending Leads" value={`${stats.pendingCount}`} color="text-cyan-500" sub={`${stats.totalLeads} total`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionCard
              icon={Crosshair}
              title="Study Operations"
              description="Practice questions across all domains"
              gradient="from-emerald-500 to-cyan-600"
              onClick={() => navigate('/study')}
            />
            <ActionCard
              icon={Theater}
              title="Scenario Lab"
              description="Interactive case studies and pattern drills"
              gradient="from-indigo-500 to-purple-600"
              onClick={() => navigate('/scenarios')}
            />
            <ActionCard
              icon={Bot}
              title="Agent Discovery"
              description={`${stats.pendingCount} leads pending review`}
              gradient="from-cyan-500 to-blue-600"
              onClick={() => navigate('/agent')}
            />
            <ActionCard
              icon={Briefcase}
              title="Implementation Playbooks"
              description={`${PLAYBOOKS.length} org-level guides`}
              gradient="from-blue-500 to-indigo-600"
              onClick={() => navigate('/playbooks')}
            />
          </div>

          <SectionCard
            title="Intel Snapshot"
            icon={TrendingUp}
            iconClassName="text-red-500"
            action={
              <button
                onClick={() => navigate('/intel')}
                className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                Intel Hub <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-3">
              Top rising exam topics — full heat map, traps, and research live in Intel Hub.
            </p>
            <div className="space-y-2">
              {risingTopics.slice(0, 3).map((topic, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/intel')}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{topic.topic}</div>
                    <div className="text-[10px] text-gray-400">D{topic.domain} · Heat {topic.heat}</div>
                  </div>
                  <div className="w-12 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${topic.heat}%`,
                        background: `hsl(${120 - (topic.heat / 100) * 120}, 70%, 50%)`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30"
                style={{ backgroundColor: currentLevel.color }}
              >
                {currentLevel.level}
              </div>
              <div>
                <div className="font-bold">{currentLevel.title}</div>
                <div className="text-xs text-emerald-100">{gameState.xp.toLocaleString()} XP</div>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${xpProgress.percentage}%` }} />
            </div>
            <div className="text-[10px] text-emerald-100 mt-1 text-right">
              {xpProgress.current}/{xpProgress.required} to next level
            </div>
          </div>

          <SectionCard title="Domain Readiness" icon={Target} iconClassName="text-blue-500">
            {state.domains.map(domain => {
              const scores = gameState.domainScores[domain.id] || [];
              const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              return (
                <button
                  key={domain.id}
                  onClick={() => navigate('/study', { state: { startQuiz: true, domainId: domain.id } })}
                  className="w-full mb-2 group last:mb-0"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="truncate text-gray-400">D{domain.id}: {domain.name}</span>
                    <span className={`font-bold ${avg >= 80 ? 'text-green-500' : avg >= 60 ? 'text-yellow-500' : avg > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {avg > 0 ? `${avg}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        avg >= 80 ? 'bg-green-500' : avg >= 60 ? 'bg-yellow-500' : avg > 0 ? 'bg-red-400' : 'bg-gray-300'
                      }`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </SectionCard>

          <SectionCard title="OSINT Arsenal" icon={Globe} iconClassName="text-cyan-500"
            action={
              <button
                onClick={() => navigate('/osint')}
                className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                Browse <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-2">
              {OSINT_SOURCES.length} curated practitioner sources — MITRE ATLAS, OWASP LLM, NIST AI RMF, and more.
            </p>
            <button
              onClick={() => navigate('/osint')}
              className="w-full text-left p-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors text-xs text-emerald-500"
            >
              Open OSINT Arsenal →
            </button>
          </SectionCard>

          <SectionCard
            title="What's Next"
            icon={Sparkles}
            iconClassName="text-violet-500"
            compact
            action={
              <button
                onClick={() => setShowRoadmap(!showRoadmap)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5"
              >
                {showRoadmap ? 'Less' : 'All'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showRoadmap ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-2">Platform roadmap — upcoming capabilities.</p>
            <div className="space-y-2">
              {(showRoadmap ? PLATFORM_ROADMAP : PLATFORM_ROADMAP.slice(0, 3)).map(item => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      item.status === 'shipped'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    }`}>
                      {ROADMAP_STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">{item.summary}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Collapsed secondary widgets */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          {showMore ? 'Hide secondary widgets' : 'Show more — scenarios, playbooks, patterns'}
        </button>

        {showMore && (
          <div className="grid gap-6 mt-6 lg:grid-cols-3">
            <SectionCard title="Quick Scenarios" icon={Theater} iconClassName="text-indigo-500" className="lg:col-span-1">
              <div className="space-y-2">
                {QUESTION_PATTERNS.filter(p => ['best', 'most', 'first'].includes(p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/scenarios?mode=drill&pattern=${p.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {p.keyword}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.name} Drill</div>
                    </div>
                    <Play className="w-3 h-3 text-gray-300 group-hover:text-indigo-500" />
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title={LEARNING_PATH_WIDGET.title}
              icon={Lightbulb}
              iconClassName="text-yellow-500"
              className="lg:col-span-1"
              action={
                <button
                  onClick={() => navigate(LEARNING_PATH_WIDGET.ctaRoute)}
                  className="text-xs text-emerald-500 hover:text-emerald-400"
                >
                  {LEARNING_PATH_WIDGET.ctaLabel} →
                </button>
              }
            >
              <div className="space-y-2">
                {AAISM_DOMAIN_GUIDES.slice(0, 3).map(guide => (
                  <button
                    key={guide.id}
                    onClick={() => navigate(`/knowledge?domain=${guide.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      D{guide.id}
                    </div>
                    <span className="text-xs font-medium truncate">{guide.shortName}</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Playbooks"
              icon={Briefcase}
              iconClassName="text-blue-500"
              className="lg:col-span-1"
              action={
                <button onClick={() => navigate('/playbooks')} className="text-xs text-emerald-500 hover:text-emerald-400">
                  View all →
                </button>
              }
            >
              <div className="space-y-2">
                {PLAYBOOKS.slice(0, 3).map(pb => (
                  <button
                    key={pb.id}
                    onClick={() => navigate('/playbooks')}
                    className="w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="text-xs font-medium truncate">{pb.title}</div>
                    <div className="text-[10px] text-gray-400">{pb.phases.length} phases</div>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Question Pattern Analysis" icon={BarChart3} iconClassName="text-purple-500" className="lg:col-span-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
                {Object.entries(patternAnalysis.patternDistribution).map(([pattern, count]) => (
                  <div key={pattern} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{count}</div>
                    <div className="text-[10px] text-gray-400">{pattern}</div>
                  </div>
                ))}
              </div>
              {patternAnalysis.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="text-xs text-gray-400 flex items-start gap-2 mb-1">
                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  {rec}
                </div>
              ))}
              <button
                onClick={() => navigate('/intel')}
                className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                Full pattern intel in Intel Hub <Radar className="w-3 h-3" />
              </button>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof Shield; label: string; value: string; color: string; sub: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 osint-widget">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-gray-400">{sub}</div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, gradient, onClick }: {
  icon: typeof Shield; title: string; description: string; gradient: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white text-left hover:shadow-lg transition-all group osint-widget`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">{title}</div>
            <div className="text-xs opacity-80">{description}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
