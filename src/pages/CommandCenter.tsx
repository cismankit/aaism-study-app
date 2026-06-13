import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar, Theater, Bot, Briefcase, Crosshair,
  Flame, TrendingUp, Target, ChevronRight,
  AlertTriangle, Shield, BarChart3, Play, Activity,
  Lightbulb, Radio, Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { getLevelFromXP, getXPProgress } from '../data/gamificationData';
import { TOPIC_HEAT_MAP, TRAP_PATTERNS, QUESTION_PATTERNS } from '../data/communityIntelligence';
import { getPipelineStats } from '../services/agentService';
import { loadInsights, analyzeQuestionPatterns } from '../services/intelligenceAgent';
import { PLAYBOOKS } from '../data/playbooks';
import { LEARNING_PATH_WIDGET } from '../data/platformMeta';
import { AAISM_DOMAIN_GUIDES } from '../data/aaismDomainGuide';
import SlidePanel from '../components/SlidePanel';

export default function CommandCenter() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { state: gameState } = useGamification();
  const currentLevel = getLevelFromXP(gameState.xp);
  const xpProgress = getXPProgress(gameState.xp);

  const [panelContent, setPanelContent] = useState<{ title: string; subtitle?: string; content: React.ReactNode } | null>(null);

  const stats = getPipelineStats();
  const insights = loadInsights();
  const patternAnalysis = analyzeQuestionPatterns();
  const risingTopics = TOPIC_HEAT_MAP.filter(t => t.trend === 'rising' && t.heat >= 85);

  const recentQuizzes = state.quizAttempts.slice(-10);
  const avgScore = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
    : 0;

  function openPanel(title: string, subtitle: string, content: React.ReactNode) {
    setPanelContent({ title, subtitle, content });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Mission Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatusCard icon={Shield} label="Level" value={currentLevel.title} color="text-emerald-500" sub={`${gameState.xp} XP`} />
        <StatusCard icon={Flame} label="Streak" value={`${gameState.currentStreak}`} color="text-orange-500" sub="days" />
        <StatusCard icon={Crosshair} label="Quizzes" value={`${gameState.totalQuizzesTaken}`} color="text-blue-500" sub={`${avgScore}% avg`} />
        <StatusCard icon={Bot} label="Agent Leads" value={`${stats.totalLeads}`} color="text-cyan-500" sub={`${stats.pendingCount} pending`} />
        <StatusCard icon={Radar} label="Intel" value={`${insights.length}`} color="text-purple-500" sub="insights" />
        <StatusCard icon={Activity} label="Questions" value={`${stats.totalQuestions}`} color="text-green-500" sub="in bank" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column — Primary actions + Playbooks */}
        <div className="space-y-5 lg:col-span-2">
          {/* Quick Action Grid */}
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

          {/* Rising Threats + Pattern Intel */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Rising Threats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Rising Threats
                <span className="ml-auto flex items-center gap-1 text-[10px] text-red-400">
                  <Radio className="w-3 h-3 animate-pulse-dot" /> LIVE
                </span>
              </h3>
              <div className="space-y-2">
                {risingTopics.slice(0, 5).map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/intel')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                  >
                    <div className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{topic.topic}</div>
                      <div className="text-[10px] text-gray-400">D{topic.domain} · Heat {topic.heat}</div>
                    </div>
                    <div
                      className="w-12 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700"
                    >
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
              <button
                onClick={() => navigate('/intel')}
                className="w-full mt-2 text-xs text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1"
              >
                View all threats <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Trap Radar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Active Trap Alerts
              </h3>
              <div className="space-y-2">
                {TRAP_PATTERNS.filter(t => t.frequency === 'very_common').slice(0, 4).map(trap => (
                  <button
                    key={trap.id}
                    onClick={() => openPanel('Trap Alert', trap.name, <TrapDetail trap={trap} />)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                  >
                    <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{trap.name}</div>
                      <div className="text-[10px] text-gray-400">{trap.frequency.replace('_', ' ')}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-amber-500" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/intel')}
                className="w-full mt-2 text-xs text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1"
              >
                View all traps <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Pattern Distribution + Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Question Pattern Analysis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
              {Object.entries(patternAnalysis.patternDistribution).map(([pattern, count]) => (
                <div key={pattern} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{count}</div>
                  <div className="text-[10px] text-gray-500">{pattern}</div>
                </div>
              ))}
            </div>
            {patternAnalysis.recommendations.slice(0, 2).map((rec, i) => (
              <div key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2 mb-1">
                <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Progress + Playbooks + Level */}
        <div className="space-y-5">
          {/* Level Progress */}
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

          {/* Domain Readiness */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-500" />
              Domain Readiness
            </h3>
            {state.domains.map(domain => {
              const scores = gameState.domainScores[domain.id] || [];
              const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              return (
                <button
                  key={domain.id}
                  onClick={() => navigate('/study', { state: { startQuiz: true, domainId: domain.id } })}
                  className="w-full mb-2 group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="truncate text-gray-600 dark:text-gray-400">D{domain.id}: {domain.name}</span>
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
          </div>

          {/* Quick Scenario Starters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Theater className="w-4 h-4 text-indigo-500" />
              Quick Scenarios
            </h3>
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
                  <div className="flex-1">
                    <div className="text-xs font-medium">{p.name} Drill</div>
                    <div className="text-[10px] text-gray-400">{p.examFrequency.replace('_', ' ')}</div>
                  </div>
                  <Play className="w-3 h-3 text-gray-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Learning Paths */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              {LEARNING_PATH_WIDGET.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{LEARNING_PATH_WIDGET.description}</p>
            <div className="space-y-2">
              {AAISM_DOMAIN_GUIDES.map(guide => (
                <button
                  key={guide.id}
                  onClick={() => navigate(`/knowledge?domain=${guide.id}`)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    D{guide.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{guide.shortName}</div>
                    <div className="text-[10px] text-gray-400">{guide.weight} · {guide.coreConcepts.length} concepts</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate(LEARNING_PATH_WIDGET.ctaRoute)}
              className="w-full mt-2 text-xs text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1"
            >
              {LEARNING_PATH_WIDGET.ctaLabel} <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Playbook Previews */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Playbooks
            </h3>
            <div className="space-y-2">
              {PLAYBOOKS.slice(0, 3).map(pb => (
                <button
                  key={pb.id}
                  onClick={() => navigate('/playbooks')}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                >
                  <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{pb.title}</div>
                    <div className="text-[10px] text-gray-400">{pb.phases.length} phases · {pb.estimatedDuration}</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/playbooks')}
              className="w-full mt-2 text-xs text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1"
            >
              All playbooks <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Panel */}
      <SlidePanel
        open={!!panelContent}
        onClose={() => setPanelContent(null)}
        title={panelContent?.title || ''}
        subtitle={panelContent?.subtitle}
      >
        {panelContent?.content}
      </SlidePanel>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

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

function TrapDetail({ trap }: { trap: typeof TRAP_PATTERNS[0] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm">{trap.description}</p>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Example</h4>
        <p className="text-sm">{trap.example}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Why Students Fall For It</h4>
        <p className="text-sm">{trap.whyStudentsFail}</p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">How to Avoid</h4>
        <p className="text-sm">{trap.howToAvoid}</p>
      </div>

      <div className="flex gap-1">
        {trap.domains.map(d => (
          <span key={d} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">D{d}</span>
        ))}
        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
          {trap.frequency.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}
