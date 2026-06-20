import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Briefcase, Crosshair,
  Flame, TrendingUp, Target, ChevronRight, ChevronDown,
  Shield, BarChart3, Play, Lightbulb, Sparkles, X, Radar, Globe, PenLine,
  Radio, Zap, Terminal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { getLevelFromXP, getXPProgress } from '../data/gamificationData';
import { TOPIC_HEAT_MAP, QUESTION_PATTERNS } from '../data/communityIntelligence';
import { getPipelineStats } from '../services/agentService';
import { analyzeQuestionPatterns } from '../services/intelligenceAgent';
import { PLAYBOOKS } from '../data/playbooks';
import { LEARNING_PATH_WIDGET } from '../data/platformMeta';
import { useCert } from '../context/CertContext';
import {
  getLatestRelease,
  getNewReleasesSince,
  LAST_SEEN_RELEASE_KEY,
  WHATS_NEW_BANNER_DISMISSED_KEY,
  releaseFeed,
} from '../data/releaseFeed';
import { consumeOnboardingHint, type OnboardingHint } from '../components/OnboardingWizard';
import DomainMicroQuizModal, { WEAK_THRESHOLD } from '../components/DomainMicroQuizModal';
import { ROADMAP_STATUS_LABEL, PHASE_2_ITEMS } from '../data/platformRoadmap';
import { OSINT_SOURCES } from '../data/osintSources';
import { getReadinessScore, getDomainProgress, getMissionLog } from '../services/progressService';
import { getContentStats } from '../data/examContent';
import { getLabsForCert } from '../data/labs';
import {
  shouldDefaultToMission,
  isFeatureUnlocked,
} from '../services/productTierService';
import { isJobSeekerModeEnabled } from '../services/integrationsConfigService';
import {
  buildWeeklyIntelDigest,
  cacheDigest,
  loadCachedDigest,
  getDigestMissionLogEntry,
  getDigestStudioUrl,
} from '../services/intelDigestService';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { buildReadinessConfidence } from '../services/confidenceService';

type NextAction = { label: string; sub: string; route: string; icon: typeof Crosshair; primary: boolean };

const ONBOARDING_ACTIONS: Record<OnboardingHint, NextAction> = {
  mission: { label: 'Start today\'s mission', sub: '25 min · read → quiz → lab', route: '/mission', icon: Target, primary: true },
  study: { label: 'Practice by domain', sub: '5 questions · ~3 min', route: '/study', icon: Crosshair, primary: true },
  intel: { label: 'Check Intel Hub', sub: 'Traps & heat map', route: '/intel', icon: Radar, primary: true },
  agent: { label: 'Run Agent Discovery', sub: 'Gap analysis on your weak domains', route: '/agent', icon: Bot, primary: true },
  command: { label: 'Review readiness', sub: 'Track depth & streak', route: '/', icon: LayoutDashboard, primary: false },
};

export default function CommandCenter() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { activeCert } = useCert();
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
    const progress = getDomainProgress(activeCert.id);
    const withData = progress.filter(d => d.count > 0);
    return withData.length > 0
      ? Math.round(withData.reduce((a, d) => a + d.avg, 0) / withData.length)
      : 0;
  }, [state.quizAttempts, gameState.domainScores, activeCert.id]);

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

    getMissionLog(activeCert.id).slice(-2).reverse().forEach(m => {
      entries.push({
        id: m.id,
        time: new Date(m.completedAt).toLocaleDateString(),
        tag: 'MISSION',
        message: `${m.goalLabel} — +${m.xpEarned} XP`,
      });
    });

    return entries.slice(0, 8);
  }, [state.quizAttempts, stats, risingTopics, activeCert.id]);

  const digestStudioUrl = loadCachedDigest() ? getDigestStudioUrl(loadCachedDigest()!) : getDigestStudioUrl();

  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showWhatsNewChip, setShowWhatsNewChip] = useState(false);
  const [newReleases, setNewReleases] = useState<ReturnType<typeof getNewReleasesSince>>([]);
  const [showMore, setShowMore] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [microQuizDomain, setMicroQuizDomain] = useState<{ id: number; name: string } | null>(null);
  const [onboardingHint] = useState<OnboardingHint | null>(() => consumeOnboardingHint());
  const jobSeekerMode = isJobSeekerModeEnabled();

  useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_RELEASE_KEY);
    const unseen = getNewReleasesSince(lastSeen);
    if (unseen.length > 0) {
      setNewReleases(unseen);
      const latest = getLatestRelease();
      const bannerDismissed = latest && localStorage.getItem(WHATS_NEW_BANNER_DISMISSED_KEY) === latest.id;
      if (bannerDismissed) {
        setShowWhatsNewChip(true);
      } else {
        setShowWhatsNew(true);
      }
    }
    void buildWeeklyIntelDigest().then(d => cacheDigest(d));
  }, []);

  function dismissWhatsNew(markSeen = false) {
    const latest = getLatestRelease();
    if (latest) {
      localStorage.setItem(WHATS_NEW_BANNER_DISMISSED_KEY, latest.id);
      if (markSeen) localStorage.setItem(LAST_SEEN_RELEASE_KEY, latest.id);
    }
    setShowWhatsNew(false);
    if (!markSeen && newReleases.length > 0) setShowWhatsNewChip(true);
  }

  function expandWhatsNew() {
    setShowWhatsNewChip(false);
    setShowWhatsNew(true);
  }

  const hudValue = getReadinessScore(activeCert.id);
  const contentStats = useMemo(() => getContentStats(activeCert.id), [activeCert.id]);
  const labCount = useMemo(() => getLabsForCert(activeCert.id).length, [activeCert.id]);
  const showOsintArsenal = isFeatureUnlocked('osint-arsenal');
  const showStudio = isFeatureUnlocked('content-studio');

  useEffect(() => {
    if (sessionStorage.getItem('aegis-home-redirect-mission') === 'true') return;
    if (shouldDefaultToMission(activeCert.id, hudValue)) {
      sessionStorage.setItem('aegis-home-redirect-mission', 'true');
      navigate('/mission', { replace: true, state: { fromCommand: true } });
    }
  }, [activeCert.id, hudValue, navigate]);
  const quizAttemptCount = gameState.totalQuizzesTaken || state.quizAttempts.length;
  const readinessConfidence = buildReadinessConfidence(quizAttemptCount);
  const ringCircumference = 2 * Math.PI * 88;
  const ringOffset = ringCircumference - (hudValue / 100) * ringCircumference;

  const nextAction = useMemo((): NextAction => {
    if (onboardingHint) return ONBOARDING_ACTIONS[onboardingHint];
    if (hudValue < 30 || recentQuizzes.length === 0) {
      return { label: 'Start today\'s mission', sub: '25 min guided loop', route: '/mission', icon: Target, primary: true };
    }
    if (examCountdown !== null && examCountdown <= 14 && domainReadiness < 70) {
      return { label: 'Focus weak domains', sub: `${examCountdown} days to exam`, route: '/mission', icon: Target, primary: true };
    }
    if (stats.pendingCount > 0) {
      return { label: 'Review agent leads', sub: `${stats.pendingCount} pending`, route: '/agent', icon: Bot, primary: false };
    }
    if (recentQuizzes.length > 0 && avgScore < 70) {
      return { label: 'Retry weak areas', sub: `Avg ${avgScore}% — mission drill`, route: '/mission', icon: Target, primary: true };
    }
    return { label: 'Continue today\'s mission', sub: 'Pick up where you left off', route: '/mission', icon: Target, primary: true };
  }, [onboardingHint, hudValue, recentQuizzes.length, examCountdown, domainReadiness, stats.pendingCount, avgScore]);

  const NextActionIcon = nextAction.icon;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 relative">
      {/* HUD scan overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute inset-x-0 h-px bg-emerald-400 animate-scan-line" />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-accent-emerald tracking-[0.25em] uppercase">
            <Radio className="w-3 h-3" />
            {activeCert.shortName} · Daily ops
          </div>
          <h1 className="text-2xl font-bold text-cockpit mt-1 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            Command Center
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">
            25 minutes a day. Pass faster. · {hudValue}% readiness
          </p>
          <p className="text-[11px] text-theme-faint mt-1">
            Your track: {contentStats.totalQuestions} questions · {labCount} labs · Live intel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(nextAction.route)}
            className={`text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all ${
              nextAction.primary
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                : 'cockpit-throttle text-accent-emerald'
            }`}
          >
            <NextActionIcon className="w-4 h-4" />
            {nextAction.label}
          </button>
        </div>
      </div>

      {/* Prominent mission entry — one click to unified study flow */}
      <button
        type="button"
        onClick={() => navigate('/mission')}
        className="w-full cockpit-glass rounded-xl p-4 text-left border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-cockpit">Today&apos;s Mission</div>
              <div className="text-xs text-cockpit-muted">25 min — weak domain → read → quiz → lab. The loop that moves your score.</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {showWhatsNew && newReleases.length > 0 && (
        <div className="relative cockpit-glass rounded-xl p-4 animate-fade-in border-amber-200/60 dark:border-amber-500/20">
          <button
            onClick={() => dismissWhatsNew(false)}
            className="absolute top-3 right-3 p-1 rounded-md text-cockpit-subtle hover:text-cockpit transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-cockpit">What&apos;s New</p>
              <ul className="mt-2 space-y-1">
                {newReleases.map(rel => (
                  <li key={rel.id} className="text-xs text-cockpit-muted">
                    <strong className="text-amber-700 dark:text-amber-400">v{rel.version}</strong> — {rel.title}
                  </li>
                ))}
              </ul>
              <Link
                to="/my-updates"
                onClick={() => dismissWhatsNew(true)}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                See all updates
              </Link>
            </div>
          </div>
        </div>
      )}

      {showWhatsNewChip && newReleases.length > 0 && !showWhatsNew && (
        <button
          type="button"
          onClick={expandWhatsNew}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200/80 dark:hover:bg-amber-500/25 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          What&apos;s New
          <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold leading-none">
            {newReleases.length}
          </span>
        </button>
      )}

      {/* Cockpit layout */}
      <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        {/* Left instrument panel — throttles */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <InstrumentPanel title="Throttle Controls" icon={Zap} accent="emerald">
            <div className="grid grid-cols-2 gap-2">
              <ThrottleButton icon={Target} label="Mission" sub="25 min loop" onClick={() => navigate('/mission')} primary={nextAction.route === '/mission'} highlight />
              <ThrottleButton icon={Crosshair} label="Practice" sub="By domain" onClick={() => navigate('/study')} primary={nextAction.route === '/study'} />
              <ThrottleButton icon={Zap} label="Exam" sub={`${activeCert.examFormat?.questions ?? 90}Q sim`} onClick={() => navigate('/exam')} />
              <ThrottleButton icon={Bot} label="Agent" sub={`${stats.pendingCount} leads`} onClick={() => navigate('/agent')} pulse={stats.pendingCount > 0} />
              <ThrottleButton icon={Radar} label="Intel" sub="Daily traps" onClick={() => navigate('/intel')} />
              {showStudio && (
                <ThrottleButton icon={PenLine} label="Studio" sub="Create posts" onClick={() => navigate('/studio')} />
              )}
            </div>
          </InstrumentPanel>

          <InstrumentPanel title="Intel Snapshot" icon={TrendingUp} accent="cyan"
            action={
              <button onClick={() => navigate('/intel')} className="text-[10px] text-accent-cyan hover:opacity-80 flex items-center gap-0.5">
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
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-cockpit truncate">{topic.topic}</div>
                    <div className="text-[9px] text-cockpit-subtle">D{topic.domain} · Heat {topic.heat}</div>
                  </div>
                  <div className="w-10 h-1 rounded-full bg-cockpit-track">
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
                  className="hud-ring-fill"
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
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 tracking-widest uppercase">Readiness</div>
                <div className="text-5xl font-bold text-cockpit tabular-nums">{hudValue}%</div>
                <div className="text-xs text-cockpit-muted mt-1">{currentLevel.title}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-cockpit-subtle">
                    {readinessConfidence.method}
                  </span>
                  <ConfidenceBadge confidence={readinessConfidence} compact />
                </div>
                {examCountdown !== null && (
                  <div className="mt-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                    T-{examCountdown}d EXAM
                  </div>
                )}
                {hudValue === 0 && (
                  <button
                    onClick={() => navigate('/study')}
                    className="mt-3 text-[10px] px-3 py-1.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Quick start → 5-question quiz
                  </button>
                )}
              </div>
            </div>

            {/* HUD readouts */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-md mt-4 relative z-10">
              <HudReadout icon={Flame} label="Streak" value={`${gameState.currentStreak}d`} color="text-orange-600 dark:text-orange-400" />
              <HudReadout icon={Crosshair} label="Avg Quiz" value={`${avgScore}%`} color="text-blue-600 dark:text-blue-400" />
              <HudReadout icon={Target} label="Domains" value={`${domainReadiness}%`} color="text-violet-600 dark:text-violet-400" />
              <HudReadout icon={Bot} label="Leads" value={`${stats.pendingCount}`} color="text-cyan-700 dark:text-cyan-400" />
              <HudReadout icon={Shield} label="XP" value={gameState.xp >= 1000 ? `${(gameState.xp / 1000).toFixed(1)}k` : `${gameState.xp}`} color="text-emerald-700 dark:text-emerald-400" />
            </div>

            <div className="w-full max-w-md mt-3 relative z-10">
              <div className="flex justify-between text-[9px] text-cockpit-muted font-mono mb-1">
                <span>LVL {currentLevel.level}</span>
                <span>{xpProgress.current}/{xpProgress.required} XP</span>
              </div>
              <div className="h-1.5 bg-cockpit-track rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all" style={{ width: `${xpProgress.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Secondary quick actions row */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {jobSeekerMode ? (
              <button onClick={() => navigate('/career')} className="cockpit-throttle rounded-xl p-3 text-left">
                <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400 mb-1" />
                <div className="text-xs font-bold text-cockpit">Career Intel</div>
                <div className="text-[10px] text-cockpit-subtle">Company & job OSINT</div>
              </button>
            ) : (
              <button onClick={() => navigate('/ops')} className="cockpit-throttle rounded-xl p-3 text-left">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-cockpit">Ops Lab</div>
                <div className="text-[10px] text-cockpit-subtle">Hands-on drills</div>
              </button>
            )}
          </div>
          <div className={`grid gap-2 mt-2 ${jobSeekerMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {jobSeekerMode && (
              <button onClick={() => navigate('/ops')} className="cockpit-throttle rounded-xl p-3 text-left">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-cockpit">Ops Lab</div>
                <div className="text-[10px] text-cockpit-subtle">Hands-on drills</div>
              </button>
            )}
            <button onClick={() => navigate('/playbooks')} className="cockpit-throttle rounded-xl p-3 text-left">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
              <div className="text-xs font-bold text-cockpit">Playbooks</div>
              <div className="text-[10px] text-cockpit-subtle">{PLAYBOOKS.length} guides</div>
            </button>
          </div>
        </div>

        {/* Right instrument panel */}
        <div className="lg:col-span-3 space-y-3 order-3">
          <InstrumentPanel title={`${activeCert.shortName} Domain Readiness`} icon={Target} accent="emerald">
            {activeCert.domains.map(certDomain => {
              const scores = gameState.domainScores[certDomain.id] || [];
              const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              return (
                <button
                  key={certDomain.id}
                  onClick={() => {
                    if (avg > 0 && avg < WEAK_THRESHOLD) {
                      navigate(`/ops?domain=${certDomain.id}`);
                    } else {
                      navigate('/study', { state: { startQuiz: true, domainId: certDomain.id } });
                    }
                  }}
                  className="w-full mb-2 group last:mb-0"
                  title={avg > 0 && avg < WEAK_THRESHOLD ? 'Practice in Ops Lab' : undefined}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="truncate text-cockpit-muted">D{certDomain.id}: {certDomain.shortName}</span>
                    <span className={`font-bold font-mono ${avg >= 80 ? 'text-emerald-700 dark:text-emerald-400' : avg >= 60 ? 'text-amber-700 dark:text-amber-400' : avg > 0 ? 'text-red-600 dark:text-red-400' : 'text-cockpit-subtle'}`}>
                      {avg > 0 ? `${avg}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1 bg-cockpit-track rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${avg >= 80 ? 'bg-emerald-500' : avg >= 60 ? 'bg-amber-500' : avg > 0 ? 'bg-red-500' : 'bg-gray-700'}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </InstrumentPanel>

          {showOsintArsenal && (
          <InstrumentPanel title="OSINT Arsenal" icon={Globe} accent="cyan"
            action={
              <button onClick={() => navigate('/osint')} className="text-[10px] text-accent-cyan hover:opacity-80 flex items-center gap-0.5">
                Browse <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <p className="text-[10px] text-cockpit-subtle mb-2">
              {OSINT_SOURCES.length} curated sources — MITRE ATLAS, OWASP LLM, NIST AI RMF
            </p>
            <button
              onClick={() => navigate('/osint')}
              className="w-full text-left p-2 rounded-lg hover:bg-cyan-500/10 transition-colors text-[11px] text-accent-cyan font-medium"
            >
              Open OSINT Arsenal →
            </button>
          </InstrumentPanel>
          )}

          <InstrumentPanel title="What's Next" icon={Sparkles} accent="violet" compact
            action={
              PHASE_2_ITEMS.length > 0 ? (
                <button onClick={() => setShowRoadmap(!showRoadmap)} className="text-[10px] text-cockpit-subtle hover:text-cockpit-muted flex items-center gap-0.5">
                  {showRoadmap ? 'Less' : 'All'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showRoadmap ? 'rotate-180' : ''}`} />
                </button>
              ) : undefined
            }
          >
            {PHASE_2_ITEMS.length === 0 ? (
              <p className="text-[10px] text-cockpit-subtle leading-snug">
                Core platform features are live. Track updates in My Updates.
              </p>
            ) : (
              <div className="space-y-1.5">
                {(showRoadmap ? PHASE_2_ITEMS : PHASE_2_ITEMS.slice(0, 3)).map(item => (
                  <div key={item.id} className="p-2 rounded-lg bg-cockpit-track/80 dark:bg-gray-800/50 border border-theme/80 dark:border-gray-700/40">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[10px] font-medium text-cockpit">{item.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        item.status === 'partial'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                          : item.status === 'in-progress'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400'
                            : 'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-400'
                      }`}>
                        {ROADMAP_STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <p className="text-[9px] text-cockpit-subtle leading-snug">{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </InstrumentPanel>
        </div>
      </div>

      {/* Mission log strip */}
      <div className="cockpit-glass-cyan rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-200/60 dark:border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 tracking-widest uppercase">Mission Log</span>
          </div>
          <Link
            to={digestStudioUrl}
            className="text-[10px] font-mono text-violet-700 dark:text-violet-400 hover:opacity-80 flex items-center gap-1"
          >
            <PenLine className="w-3 h-3" /> Weekly Intel Digest
          </Link>
        </div>
        <div className="overflow-hidden py-2">
          <div className="flex gap-8 animate-mission-scroll whitespace-nowrap px-4" style={{ width: 'max-content' }}>
            {[...missionLog, ...missionLog].map((entry, i) => (
              <div key={`${entry.id}-${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-cockpit-subtle">{entry.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  entry.tag === 'INTEL' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                  entry.tag === 'DIGEST' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' :
                  entry.tag === 'MISSION' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' :
                  entry.tag === 'AGENT' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400' :
                  entry.tag === 'RELEASE' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' :
                  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                }`}>{entry.tag}</span>
                <span className="text-cockpit-muted">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsed secondary widgets */}
      <div className="border-t border-theme dark:border-gray-800 pt-4">
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm font-medium text-theme-muted hover:text-theme-secondary transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          {showMore ? 'Hide secondary instruments' : 'Expand — scenarios, playbooks, patterns'}
        </button>

        {showMore && (
          <div className="grid gap-4 mt-4 lg:grid-cols-3">
            <SecondaryCard title="Quick Scenarios" icon={Shield} iconColor="text-indigo-600 dark:text-indigo-400">
              <div className="space-y-2">
                {QUESTION_PATTERNS.filter(p => ['best', 'most', 'first'].includes(p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/scenarios?mode=drill&pattern=${p.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-500/10 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      {p.keyword}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-cockpit">{p.name} Drill</div>
                    </div>
                    <Play className="w-3 h-3 text-cockpit-subtle group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title={LEARNING_PATH_WIDGET.title} icon={Lightbulb} iconColor="text-amber-600 dark:text-yellow-400"
              action={
                <button onClick={() => navigate(LEARNING_PATH_WIDGET.ctaRoute)} className="text-xs text-accent-emerald hover:opacity-80">
                  {LEARNING_PATH_WIDGET.ctaLabel} →
                </button>
              }
            >
              <div className="space-y-2">
                {activeCert.domainGuides?.slice(0, 3).map(guide => (
                  <button
                    key={guide.id}
                    onClick={() => navigate(`/knowledge?domain=${guide.id}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      D{guide.id}
                    </div>
                    <span className="text-xs font-medium truncate text-cockpit-muted">{guide.shortName}</span>
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title="Playbooks" icon={Briefcase} iconColor="text-blue-600 dark:text-blue-400"
              action={
                <button onClick={() => navigate('/playbooks')} className="text-xs text-accent-emerald hover:opacity-80">
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
                    <div className="text-xs font-medium truncate text-cockpit">{pb.title}</div>
                    <div className="text-[10px] text-cockpit-subtle">{pb.phases.length} phases</div>
                  </button>
                ))}
              </div>
            </SecondaryCard>

            <SecondaryCard title="Question Pattern Analysis" icon={BarChart3} iconColor="text-purple-600 dark:text-purple-400" className="lg:col-span-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
                {Object.entries(patternAnalysis.patternDistribution).map(([pattern, count]) => (
                  <div key={pattern} className="text-center p-2 bg-cockpit-track/80 dark:bg-gray-800/50 rounded-lg border border-theme/80 dark:border-gray-700/40">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{count}</div>
                    <div className="text-[10px] text-cockpit-subtle">{pattern}</div>
                  </div>
                ))}
              </div>
              {patternAnalysis.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="text-xs text-cockpit-muted flex items-start gap-2 mb-1">
                  <Lightbulb className="w-3 h-3 text-amber-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  {rec}
                </div>
              ))}
              <button
                onClick={() => navigate('/intel')}
                className="mt-2 text-xs text-accent-emerald hover:opacity-80 flex items-center gap-1"
              >
                Full pattern intel in Intel Hub <Radar className="w-3 h-3" />
              </button>
            </SecondaryCard>
          </div>
        )}
      </div>

      <DomainMicroQuizModal
        open={microQuizDomain !== null}
        domainId={microQuizDomain?.id ?? null}
        domainName={microQuizDomain?.name ?? ''}
        onClose={() => setMicroQuizDomain(null)}
      />
    </div>
  );
}

function InstrumentPanel({ title, icon: Icon, accent, action, children, compact }: {
  title: string; icon: typeof Shield; accent: 'emerald' | 'cyan' | 'violet';
  action?: ReactNode; children: ReactNode; compact?: boolean;
}) {
  const iconClass = accent === 'cyan'
    ? 'text-cyan-700 dark:text-cyan-400'
    : accent === 'violet'
      ? 'text-violet-700 dark:text-violet-400'
      : 'text-emerald-700 dark:text-emerald-400';
  const borderClass = accent === 'cyan' ? 'cockpit-glass-cyan' : 'cockpit-glass';
  return (
    <div className={`${borderClass} rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconClass}`} />
          <span className="text-xs font-semibold text-cockpit">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ThrottleButton({ icon: Icon, label, sub, onClick, pulse, primary, highlight }: {
  icon: typeof Shield; label: string; sub: string; onClick: () => void;
  pulse?: boolean; primary?: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`cockpit-throttle rounded-xl p-3 text-left group ${primary ? 'cockpit-throttle-primary ring-2 ring-emerald-500/30' : ''} ${highlight ? 'ring-1 ring-emerald-400/40' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        {pulse && (
          <span className="relative flex h-1.5 w-1.5 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600 dark:bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="text-xs font-bold text-cockpit">{label}</div>
      <div className="text-[9px] text-cockpit-subtle">{sub}</div>
    </button>
  );
}

function HudReadout({ icon: Icon, label, value, color }: {
  icon: typeof Shield; label: string; value: string; color: string;
}) {
  return (
    <div
      className="text-center p-2 rounded-lg border"
      style={{
        backgroundColor: 'rgb(var(--cockpit-readout-bg) / 0.85)',
        borderColor: 'rgb(var(--cockpit-readout-border) / 0.8)',
      }}
    >
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color}`} />
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[8px] text-cockpit-muted uppercase tracking-wider">{label}</div>
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
          <span className="text-sm font-semibold text-cockpit">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
