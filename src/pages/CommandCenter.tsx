import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Theater, Bot, Briefcase, Crosshair,
  Flame, TrendingUp, Target, ChevronRight, ChevronDown,
  Shield, BarChart3, Play, Lightbulb, Sparkles, X, Radar, Globe, PenLine,
  Radio, Zap,
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
  releaseFeed,
} from '../data/releaseFeed';
import { PLATFORM_ROADMAP, ROADMAP_STATUS_LABEL } from '../data/platformRoadmap';
import { OSINT_SOURCES } from '../data/osintSources';
import { getReadinessScore, getDomainProgress } from '../services/progressService';
import {
  buildWeeklyIntelDigest,
  cacheDigest,
  loadCachedDigest,
  getDigestMissionLogEntry,
  getDigestStudioUrl,
} from '../services/intelDigestService';

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

  const domainReadiness = useMemo(() => {
    const progress = getDomainProgress();
    const withData = progress.filter(d => d.count > 0);
    return withData.length > 0
      ? Math.round(withData.reduce((a, d) => a + d.avg, 0) / withData.length)
      : 0;
  }, [state.quizAttempts, gameState.domainScores]);

  const examCountdown = useMemo(() => {
    if (!state.examDate) return null;
    const days = Math.ceil((new Date(state.examDate).getTime() - Date.now()) / 86_400_000);
    return days > 0 ? days : 0;
  }, [state.examDate]);

  const missionLog = useMemo(() => {
    const entries: Array<{ id: string; time: string; tag: string; message: string }> = [];

    state.quizAttempts.slice(-3).reverse().forEach(q => {
      entries.push({
        id: `quiz-${q.id}`,
        time: new Date(q.date).toLocaleDateString(),
        tag: 'STUDY',
        message: `Quiz D${q.domain}: ${q.score}% (${q.correctAnswers}/${q.totalQuestions})`,
      });
    });

    if (stats.lastRunAt) {
      entries.push({
        id: 'agent-run',
        time: new Date(stats.lastRunAt).toLocaleDateString(),
        tag: 'AGENT',
        message: `Discovery run — ${stats.pendingCount} leads pending, ${stats.approvedCount} approved`,
      });
    }

    releaseFeed.slice(0, 2).forEach(rel => {
      entries.push({
        id: rel.id,
        time: rel.shippedAt,
        tag: 'RELEASE',
        message: `v${rel.version}: ${rel.title}`,
      });
    });

    risingTopics.slice(0, 2).forEach((t, i) => {
      entries.push({
        id: `intel-${i}`,
        time: 'LIVE',
        tag: 'INTEL',
        message: `${t.topic} — heat ${t.heat} (D${t.domain})`,
      });
    });

    const cachedDigest = loadCachedDigest();
    if (cachedDigest) {
      const d = getDigestMissionLogEntry(cachedDigest);
      entries.push({ id: d.id, time: d.time, tag: d.tag, message: d.message });
    }

    return entries.slice(0, 8);
  }, [state.quizAttempts, stats, risingTopics]);

  const digestStudioUrl = loadCachedDigest() ? getDigestStudioUrl(loadCachedDigest()!) : getDigestStudioUrl();

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
    void buildWeeklyIntelDigest().then(d => cacheDigest(d));
  }, []);

  function dismissWhatsNew() {
    const latest = getLatestRelease();
    if (latest) localStorage.setItem(LAST_SEEN_RELEASE_KEY, latest.id);
    setShowWhatsNew(false);
  }

  const hudValue = getReadinessScore();
  const ringCircumference = 2 * Math.PI * 88;
  const ringOffset = ringCircumference - (hudValue / 100) * ringCircumference;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 relative">
      {/* HUD scan overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute inset-x-0 h-px bg-emerald-400 animate-scan-line" />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/80 tracking-[0.25em] uppercase">
            <Radio className="w-3 h-3 animate-pulse-dot" />
            Mission Control · AAISM-OPS
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            Command Center
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Pilot seat — readiness, intel, and quick throttle to all ops
          </p>
        </div>
        <Link
          to="/studio"
          className="text-xs px-3 py-2 rounded-lg cockpit-throttle text-emerald-300 flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          Content Studio
        </Link>
      </div>

      {showWhatsNew && newReleases.length > 0 && (
        <div className="relative cockpit-glass rounded-xl p-4 animate-fade-in">
          <button
            onClick={dismissWhatsNew}
            className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-100">What&apos;s New</p>
              <ul className="mt-2 space-y-1">
                {newReleases.map(rel => (
                  <li key={rel.id} className="text-xs text-gray-400">
                    <strong className="text-amber-400">v{rel.version}</strong> — {rel.title}
                  </li>
                ))}
              </ul>
              <Link
                to="/my-updates"
                onClick={dismissWhatsNew}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:underline"
              >
                See all updates
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cockpit layout */}
      <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        {/* Left instrument panel — throttles */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <InstrumentPanel title="Throttle Controls" icon={Zap} accent="emerald">
            <div className="grid grid-cols-2 gap-2">
              <ThrottleButton icon={Crosshair} label="Study" sub="Practice ops" onClick={() => navigate('/study')} />
              <ThrottleButton icon={Target} label="Exam" sub="90Q · 150min" onClick={() => navigate('/exam')} pulse />
              <ThrottleButton icon={Bot} label="Agent" sub={`${stats.pendingCount} leads`} onClick={() => navigate('/agent')} pulse />
              <ThrottleButton icon={PenLine} label="Studio" sub="Create posts" onClick={() => navigate('/studio')} />
              <ThrottleButton icon={Radar} label="Intel" sub="Deep dive" onClick={() => navigate('/intel')} pulse />
            </div>
          </InstrumentPanel>

          <InstrumentPanel title="Intel Snapshot" icon={TrendingUp} accent="cyan"
            action={
              <button onClick={() => navigate('/intel')} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                Hub <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="space-y-2">
              {risingTopics.slice(0, 3).map((topic, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/intel')}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-left group"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-200 truncate">{topic.topic}</div>
                    <div className="text-[9px] text-gray-500">D{topic.domain} · Heat {topic.heat}</div>
                  </div>
                  <div className="w-10 h-1 rounded-full bg-gray-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${topic.heat}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </InstrumentPanel>
        </div>

        {/* Center HUD */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="cockpit-glass rounded-2xl p-6 relative overflow-hidden min-h-[320px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]" />

            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="hudGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="88" className="hud-ring-track" strokeWidth="6" />
                <circle
                  cx="100" cy="100" r="88"
                  className="hud-ring-fill animate-pulse-ring"
                  strokeWidth="6"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
                {/* Tick marks */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x1 = 100 + 78 * Math.cos(angle);
                  const y1 = 100 + 78 * Math.sin(angle);
                  const x2 = 100 + 84 * Math.cos(angle);
                  const y2 = 100 + 84 * Math.sin(angle);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(16,185,129,0.4)" strokeWidth="1" className="animate-hud-tick" style={{ animationDelay: `${i * 0.15}s` }} />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-mono text-emerald-500/70 tracking-widest uppercase">Readiness</div>
                <div className="text-5xl font-bold text-white tabular-nums">{hudValue}%</div>
                <div className="text-xs text-gray-400 mt-1">{currentLevel.title}</div>
                {examCountdown !== null && (
                  <div className="mt-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-mono">
                    T-{examCountdown}d EXAM
                  </div>
                )}
              </div>
            </div>

            {/* HUD readouts */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-md mt-4 relative z-10">
              <HudReadout icon={Flame} label="Streak" value={`${gameState.currentStreak}d`} color="text-orange-400" />
              <HudReadout icon={Crosshair} label="Avg Quiz" value={`${avgScore}%`} color="text-blue-400" />
              <HudReadout icon={Target} label="Domains" value={`${domainReadiness}%`} color="text-violet-400" />
              <HudReadout icon={Bot} label="Leads" value={`${stats.pendingCount}`} color="text-cyan-400" />
              <HudReadout icon={Shield} label="XP" value={gameState.xp >= 1000 ? `${(gameState.xp / 1000).toFixed(1)}k` : `${gameState.xp}`} color="text-emerald-400" />
            </div>

            <div className="w-full max-w-md mt-3 relative z-10">
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mb-1">
                <span>LVL {currentLevel.level}</span>
                <span>{xpProgress.current}/{xpProgress.required} XP</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all" style={{ width: `${xpProgress.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Secondary quick actions row */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => navigate('/scenarios')} className="cockpit-throttle rounded-xl p-3 text-left">
              <Theater className="w-4 h-4 text-indigo-400 mb-1" />
              <div className="text-xs font-bold text-gray-100">Scenario Lab</div>
              <div className="text-[10px] text-gray-500">Pattern drills</div>
            </button>
            <button onClick={() => navigate('/playbooks')} className="cockpit-throttle rounded-xl p-3 text-left">
              <Briefcase className="w-4 h-4 text-blue-400 mb-1" />
              <div className="text-xs font-bold text-gray-100">Playbooks</div>
              <div className="text-[10px] text-gray-500">{PLAYBOOKS.length} guides</div>
            </button>
          </div>
        </div>

        {/* Right instrument panel */}
        <div className="lg:col-span-3 space-y-3 order-3">
          <InstrumentPanel title="Domain Readiness" icon={Target} accent="emerald">
            {state.domains.map(domain => {
              const scores = gameState.domainScores[domain.id] || [];
              const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              return (
                <button
                  key={domain.id}
                  onClick={() => navigate('/study', { state: { startQuiz: true, domainId: domain.id } })}
                  className="w-full mb-2 group last:mb-0"
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="truncate text-gray-400">D{domain.id}: {domain.name}</span>
                    <span className={`font-bold font-mono ${avg >= 80 ? 'text-emerald-400' : avg >= 60 ? 'text-amber-400' : avg > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                      {avg > 0 ? `${avg}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-amber-500' : avg > 0 ? 'bg-red-500' : 'bg-gray-700'}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </InstrumentPanel>

          <InstrumentPanel title="OSINT Arsenal" icon={Globe} accent="cyan"
            action={
              <button onClick={() => navigate('/osint')} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                Browse <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <p className="text-[10px] text-gray-500 mb-2">
              {OSINT_SOURCES.length} curated sources — MITRE ATLAS, OWASP LLM, NIST AI RMF
            </p>
            <button
              onClick={() => navigate('/osint')}
              className="w-full text-left p-2 rounded-lg hover:bg-cyan-500/10 transition-colors text-[11px] text-cyan-400"
            >
              Open OSINT Arsenal →
            </button>
          </InstrumentPanel>

          <InstrumentPanel title="What's Next" icon={Sparkles} accent="violet" compact
            action={
              <button onClick={() => setShowRoadmap(!showRoadmap)} className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5">
                {showRoadmap ? 'Less' : 'All'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showRoadmap ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <div className="space-y-1.5">
              {(showRoadmap ? PLATFORM_ROADMAP : PLATFORM_ROADMAP.slice(0, 3)).map(item => (
                <div key={item.id} className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/40">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-gray-200">{item.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      item.status === 'shipped'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {ROADMAP_STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-snug">{item.summary}</p>
                </div>
              ))}
            </div>
          </InstrumentPanel>
        </div>
      </div>

      {/* Mission log strip */}
      <div className="cockpit-glass-cyan rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse-dot" />
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">Mission Log</span>
          </div>
          <Link
            to={digestStudioUrl}
            className="text-[10px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            <PenLine className="w-3 h-3" /> Weekly Intel Digest
          </Link>
        </div>
        <div className="overflow-hidden py-2">
          <div className="flex gap-8 animate-mission-scroll whitespace-nowrap px-4" style={{ width: 'max-content' }}>
            {[...missionLog, ...missionLog].map((entry, i) => (
              <div key={`${entry.id}-${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-gray-600">{entry.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  entry.tag === 'INTEL' ? 'bg-red-500/20 text-red-400' :
                  entry.tag === 'DIGEST' ? 'bg-violet-500/20 text-violet-400' :
                  entry.tag === 'AGENT' ? 'bg-cyan-500/20 text-cyan-400' :
                  entry.tag === 'RELEASE' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>{entry.tag}</span>
                <span className="text-gray-400">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsed secondary widgets */}
      <div className="border-t border-gray-800 pt-4">
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          {showMore ? 'Hide secondary instruments' : 'Expand — scenarios, playbooks, patterns'}
        </button>

        {showMore && (
          <div className="grid gap-4 mt-4 lg:grid-cols-3">
            <SecondaryCard title="Quick Scenarios" icon={Theater} iconColor="text-indigo-400">
              <div className="space-y-2">
                {QUESTION_PATTERNS.filter(p => ['best', 'most', 'first'].includes(p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/scenarios?mode=drill&pattern=${p.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-500/10 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {p.keyword}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-gray-200">{p.name} Drill</div>
                    </div>
                    <Play className="w-3 h-3 text-gray-600 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title={LEARNING_PATH_WIDGET.title} icon={Lightbulb} iconColor="text-yellow-400"
              action={
                <button onClick={() => navigate(LEARNING_PATH_WIDGET.ctaRoute)} className="text-xs text-emerald-400 hover:text-emerald-300">
                  {LEARNING_PATH_WIDGET.ctaLabel} →
                </button>
              }
            >
              <div className="space-y-2">
                {AAISM_DOMAIN_GUIDES.slice(0, 3).map(guide => (
                  <button
                    key={guide.id}
                    onClick={() => navigate(`/knowledge?domain=${guide.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-400">
                      D{guide.id}
                    </div>
                    <span className="text-xs font-medium truncate text-gray-300">{guide.shortName}</span>
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title="Playbooks" icon={Briefcase} iconColor="text-blue-400"
              action={
                <button onClick={() => navigate('/playbooks')} className="text-xs text-emerald-400 hover:text-emerald-300">
                  View all →
                </button>
              }
            >
              <div className="space-y-2">
                {PLAYBOOKS.slice(0, 3).map(pb => (
                  <button
                    key={pb.id}
                    onClick={() => navigate('/playbooks')}
                    className="w-full text-left p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="text-xs font-medium truncate text-gray-200">{pb.title}</div>
                    <div className="text-[10px] text-gray-500">{pb.phases.length} phases</div>
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title="Question Pattern Analysis" icon={BarChart3} iconColor="text-purple-400" className="lg:col-span-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
                {Object.entries(patternAnalysis.patternDistribution).map(([pattern, count]) => (
                  <div key={pattern} className="text-center p-2 bg-gray-800/50 rounded-lg border border-gray-700/40">
                    <div className="text-lg font-bold text-purple-400">{count}</div>
                    <div className="text-[10px] text-gray-500">{pattern}</div>
                  </div>
                ))}
              </div>
              {patternAnalysis.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="text-xs text-gray-400 flex items-start gap-2 mb-1">
                  <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  {rec}
                </div>
              ))}
              <button
                onClick={() => navigate('/intel')}
                className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Full pattern intel in Intel Hub <Radar className="w-3 h-3" />
              </button>
            </SecondaryCard>
          </div>
        )}
      </div>
    </div>
  );
}

function InstrumentPanel({ title, icon: Icon, accent, action, children, compact }: {
  title: string; icon: typeof Shield; accent: 'emerald' | 'cyan' | 'violet';
  action?: ReactNode; children: ReactNode; compact?: boolean;
}) {
  const borderClass = accent === 'cyan' ? 'cockpit-glass-cyan' : 'cockpit-glass';
  return (
    <div className={`${borderClass} rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent === 'cyan' ? 'text-cyan-400' : accent === 'violet' ? 'text-violet-400' : 'text-emerald-400'}`} />
          <span className="text-xs font-semibold text-gray-200">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ThrottleButton({ icon: Icon, label, sub, onClick, pulse }: {
  icon: typeof Shield; label: string; sub: string; onClick: () => void; pulse?: boolean;
}) {
  return (
    <button onClick={onClick} className="cockpit-throttle rounded-xl p-3 text-left group">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-emerald-400" />
        {pulse && (
          <span className="relative flex h-1.5 w-1.5 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="text-xs font-bold text-gray-100">{label}</div>
      <div className="text-[9px] text-gray-500">{sub}</div>
    </button>
  );
}

function HudReadout({ icon: Icon, label, value, color }: {
  icon: typeof Shield; label: string; value: string; color: string;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-gray-900/50 border border-gray-800">
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color}`} />
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[8px] text-gray-600 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function SecondaryCard({ title, icon: Icon, iconColor, action, children, className }: {
  title: string; icon: typeof Shield; iconColor: string;   action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`cockpit-glass rounded-xl p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-gray-200">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
