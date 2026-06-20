import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { 
  BADGES, 
  getLevelFromXP, 
  getXPProgress, 
  getBadgeById,
  getRarityColor
} from '../data/gamificationData';
import { 
  getDomainAnalytics,
  getStudyRecommendations,
  generateInsights
} from '../services/testAnalytics';
import {
  exportProgressJson,
  importProgressJson,
  getPassThreshold,
  setPassThreshold,
  getExamAttempts,
} from '../services/progressService';
import { 
  AIConfig, 
  loadAIConfig, 
  saveAIConfig,
  defaultConfigs,
  AIProvider,
  getModelCapability,
  getModelWarning,
  AAISM_OFFLINE_MODELS,
} from '../services/aiService';
import OllamaModelManager from '../components/OllamaModelManager';
import AISmokeTestPanel from '../components/AISmokeTestPanel';
import GroqApiKeySection from '../components/GroqApiKeySection';
import SignInSyncSection from '../components/SignInSyncSection';
import IntegrationsSettings from '../components/IntegrationsSettings';
import ConnectorsSettings from '../components/ConnectorsSettings';
import AIConnectionStatusPill from '../components/AIConnectionStatusPill';
import { useSettingsHealthPoll } from '../hooks/useSettingsHealthPoll';
import AboutPanel from '../components/AboutPanel';
import ProTierStrip from '../components/ProTierStrip';
import {
  getShowAllToolsOverride,
  setShowAllToolsOverride,
  getUnlockProgress,
  isFullCatalogUnlocked,
} from '../services/productTierService';
import { useCert } from '../context/CertContext';
import { CERTIFICATIONS } from '../data/certifications';
import { 
  Play,
  Target, 
  Trophy,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
  CheckCircle2,
  Settings,
  Home,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Star,
  Sparkles,
  Server,
  Cloud,
  Download,
  Upload,
  Link2,
} from 'lucide-react';

type AISettingsTab = 'groq' | 'ollama' | 'cloud';

function providerToTab(provider: AIProvider): AISettingsTab {
  if (provider === 'groq') return 'groq';
  if (provider === 'ollama') return 'ollama';
  return 'cloud';
}

type Tab = 'home' | 'analytics' | 'achievements' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-theme-elevated p-1.5 rounded-xl border border-theme">
        {[
          { id: 'home' as Tab, label: 'Dashboard', icon: Home },
          { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
          { id: 'achievements' as Tab, label: 'Achievements', icon: Award },
          { id: 'settings' as Tab, label: 'Settings', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-cockpit-muted hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ============ HOME TAB ============
function HomeTab() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { state: gameState } = useGamification();
  const currentLevel = getLevelFromXP(gameState.xp);
  const xpProgress = getXPProgress(gameState.xp);
  
  const today = new Date().toDateString();
  const todayQuizzes = state.quizAttempts.filter(q => 
    new Date(q.date).toDateString() === today
  ).length;
  const dailyGoal = 3;
  const dailyProgress = Math.min(todayQuizzes / dailyGoal * 100, 100);

  const recentQuizzes = state.quizAttempts.slice(-10);
  const avgScore = recentQuizzes.length > 0 
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
    : 0;

  const domainStats = state.domains.map(domain => {
    const scores = gameState.domainScores[domain.id] || [];
    return {
      ...domain,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
      quizCount: scores.length
    };
  });
  
  type DomainStat = typeof domainStats[0];
  const weakestDomain = domainStats.reduce((min: DomainStat, d: DomainStat) => 
    d.quizCount > 0 && (d.avgScore < min.avgScore || min.quizCount === 0) ? d : min, 
    domainStats[0]
  );

  const recentBadges = gameState.unlockedBadges.slice(-3).map(ub => getBadgeById(ub.badgeId)).filter(Boolean);

  const startDomainQuiz = (domainId: number) => {
    navigate('/study', { state: { startQuiz: true, domainId } });
  };

  return (
    <div className="space-y-4">
      {/* Top Row: Level + Streak + Daily Goal */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30"
              style={{ backgroundColor: currentLevel.color }}
            >
              {currentLevel.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{currentLevel.title}</div>
              <div className="text-xs text-primary-200">{gameState.xp.toLocaleString()} XP</div>
              <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Flame size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{gameState.currentStreak}</div>
              <div className="text-xs text-orange-100">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-cockpit-muted">Today's Goal</span>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{todayQuizzes}/{dailyGoal}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${dailyProgress >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-theme-muted">
            {dailyProgress >= 100 ? (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 size={12} /> Complete!</span>
            ) : (
              `${dailyGoal - todayQuizzes} more to go`
            )}
          </div>
        </div>
      </div>

      {/* Start Studying CTA */}
      <button
        onClick={() => navigate('/study')}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl p-5 text-white text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={28} fill="white" />
            </div>
            <div>
              <div className="text-lg font-bold">Start Today's Study</div>
              <div className="text-green-100 text-sm">
                {avgScore > 0 && weakestDomain.quizCount > 0 && weakestDomain.avgScore < 80 
                  ? `Focus on: ${weakestDomain.name} (${weakestDomain.avgScore}%)`
                  : 'Practice all domains'}
              </div>
            </div>
          </div>
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Domain Cards */}
      <div className="grid grid-cols-2 gap-3">
        {domainStats.map((domain, idx) => (
          <button
            key={domain.id}
            onClick={() => startDomainQuiz(domain.id)}
            className="bg-theme-elevated rounded-xl p-4 border border-theme hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{domain.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-theme-muted font-medium">Domain {idx + 1}</div>
                <div className="font-semibold text-cockpit text-sm truncate">{domain.name}</div>
                <div className="mt-2 flex items-center gap-2">
                  {domain.quizCount > 0 ? (
                    <>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            domain.avgScore >= 80 ? 'bg-green-500' : 
                            domain.avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${domain.avgScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${
                        domain.avgScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                        domain.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'
                      }`}>{domain.avgScore}%</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Not started</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-all mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-theme-elevated rounded-lg p-3 border border-theme text-center">
          <Target className="text-blue-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-cockpit">{gameState.totalQuizzesTaken}</div>
          <div className="text-[10px] text-theme-muted">Quizzes</div>
        </div>
        <div className="bg-theme-elevated rounded-lg p-3 border border-theme text-center">
          <TrendingUp className="text-green-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-cockpit">{avgScore}%</div>
          <div className="text-[10px] text-theme-muted">Avg Score</div>
        </div>
        <div className="bg-theme-elevated rounded-lg p-3 border border-theme text-center">
          <Clock className="text-purple-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-cockpit">{Math.floor(gameState.totalStudyMinutes / 60)}h</div>
          <div className="text-[10px] text-theme-muted">Study Time</div>
        </div>
        <div className="bg-theme-elevated rounded-lg p-3 border border-theme text-center">
          <Trophy className="text-yellow-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-cockpit">{gameState.unlockedBadges.length}</div>
          <div className="text-[10px] text-theme-muted">Badges</div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentBadges.length > 0 && (
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-cockpit text-sm">Recent Achievements</div>
              <div className="flex items-center gap-2 mt-0.5">
                {recentBadges.map(badge => badge && (
                  <span key={badge.id} className="text-lg" title={badge.name}>{badge.icon}</span>
                ))}
                {gameState.unlockedBadges.length > 3 && (
                  <span className="text-xs text-theme-muted">
                    +{gameState.unlockedBadges.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ANALYTICS TAB ============
function AnalyticsTab() {
  const { state } = useApp();
  const { state: gameState } = useGamification();

  const recentAttempts = state.quizAttempts.slice(-10).reverse();
  const analytics = getDomainAnalytics(state.quizAttempts);
  const recommendations = getStudyRecommendations(state.quizAttempts);
  const insights = generateInsights(state.quizAttempts);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
          <Target className="text-primary-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-cockpit">{gameState.totalQuizzesTaken}</div>
          <div className="text-xs text-theme-muted">Quizzes</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
          <CheckCircle className="text-green-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-green-600">{gameState.perfectQuizzes}</div>
          <div className="text-xs text-theme-muted">Perfect</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
          <TrendingUp className="text-blue-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-cockpit">
            {state.quizAttempts.length > 0 
              ? Math.round(state.quizAttempts.reduce((sum, a) => sum + a.score, 0) / state.quizAttempts.length) 
              : 0}%
          </div>
          <div className="text-xs text-theme-muted">Avg Score</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme text-center">
          <Zap className="text-yellow-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-primary-600">
            {Math.floor(gameState.totalStudyMinutes / 60)}h
          </div>
          <div className="text-xs text-theme-muted">Study Time</div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={18} />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Study Recommendations</h3>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-theme-secondary">{rec.action}: {rec.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Performance */}
      <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
        <h3 className="font-semibold text-cockpit mb-3 flex items-center gap-2">
          <Target size={18} className="text-primary-500" />
          Domain Performance
        </h3>
        <div className="space-y-3">
          {analytics.map((domain) => (
            <div key={domain.domainId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-theme-secondary">Domain {domain.domainId}</span>
                <span className="text-cockpit-muted">
                  {domain.accuracy}% ({domain.totalQuestions} questions)
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className={`h-full rounded-full transition-all ${
                    domain.accuracy >= 80 ? 'bg-green-500' :
                    domain.accuracy >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${domain.accuracy}%` }}
                />
              </div>
            </div>
          ))}
          {analytics.length === 0 && (
            <p className="text-theme-muted text-sm text-center py-4">
              Take some quizzes to see your domain performance!
            </p>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
          <h3 className="font-semibold text-cockpit mb-3 flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-500" />
            Learning Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lg mt-0.5">
                  {insight.type === 'strength' ? '💪' : 
                   insight.type === 'weakness' ? '📚' : 
                   insight.type === 'milestone' ? '🏆' : '💡'}
                </span>
                <div>
                  <p className="font-medium text-cockpit">{insight.title}</p>
                  <p className="text-cockpit-muted">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      <div className="bg-theme-elevated rounded-xl p-4 border border-theme">
        <h3 className="font-semibold text-cockpit mb-3">Recent Quiz History</h3>
        {recentAttempts.length > 0 ? (
          <div className="space-y-2">
            {recentAttempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-theme last:border-0">
                <div>
                  <span className="text-sm text-theme-secondary">
                    {attempt.domain === 'all' ? 'All Domains' : `Domain ${attempt.domain}`}
                  </span>
                  <div className="text-xs text-theme-muted">
                    {new Date(attempt.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={`font-bold ${
                  attempt.score >= 80 ? 'text-green-600' :
                  attempt.score >= 65 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {attempt.score}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-theme-muted text-sm text-center py-4">
            No quiz attempts yet. Start a quiz to track your progress!
          </p>
        )}
      </div>
    </div>
  );
}

// ============ ACHIEVEMENTS TAB ============
function AchievementsTab() {
  const { state } = useGamification();
  const currentLevel = getLevelFromXP(state.xp);
  const xpProgress = getXPProgress(state.xp);
  const unlockedBadgeIds = new Set(state.unlockedBadges.map(b => b.badgeId));
  const [expandedCategory, setExpandedCategory] = useState<string | null>('quiz');

  const badgesByCategory = BADGES.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof BADGES>);

  const categoryInfo: Record<string, { name: string; icon: string }> = {
    quiz: { name: 'Quiz Achievements', icon: '📝' },
    study: { name: 'Study Achievements', icon: '📚' },
    streak: { name: 'Streak Achievements', icon: '🔥' },
    mastery: { name: 'Domain Mastery', icon: '🎯' },
    special: { name: 'Special Achievements', icon: '⭐' },
  };

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
            style={{ backgroundColor: currentLevel.color }}
          >
            {currentLevel.level}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{currentLevel.title}</h2>
            <p className="text-primary-200 text-sm">Level {currentLevel.level}</p>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{state.xp.toLocaleString()} XP</span>
                <span>{xpProgress.current} / {xpProgress.required}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-theme-elevated rounded-xl p-3 border border-theme text-center">
          <Flame className="text-orange-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-cockpit">{state.currentStreak}</div>
          <div className="text-xs text-theme-muted">Current</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-3 border border-theme text-center">
          <Flame className="text-red-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-cockpit">{state.longestStreak}</div>
          <div className="text-xs text-theme-muted">Best</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-3 border border-theme text-center">
          <Trophy className="text-yellow-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-cockpit">{state.unlockedBadges.length}</div>
          <div className="text-xs text-theme-muted">Badges</div>
        </div>
        <div className="bg-theme-elevated rounded-xl p-3 border border-theme text-center">
          <Target className="text-green-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-cockpit">{state.perfectQuizzes}</div>
          <div className="text-xs text-theme-muted">Perfect</div>
        </div>
      </div>

      {/* Badges by Category */}
      <div className="space-y-3">
        {Object.entries(badgesByCategory).map(([category, badges]) => {
          const info = categoryInfo[category] || { name: category, icon: '🏅' };
          const isExpanded = expandedCategory === category;
          const unlockedCount = badges.filter(b => unlockedBadgeIds.has(b.id)).length;

          return (
            <div 
              key={category}
              className="bg-theme-elevated rounded-xl border border-theme overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium text-cockpit">{info.name}</span>
                  <span className="text-xs text-theme-muted bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {unlockedCount}/{badges.length}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {badges.map(badge => {
                    const unlocked = unlockedBadgeIds.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border ${
                          unlocked 
                            ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            : 'bg-gray-50 dark:bg-gray-800 border-theme opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{badge.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${unlocked ? 'text-cockpit' : 'text-gray-500'}`}>
                              {badge.name}
                            </div>
                            <div className={`text-[10px] ${getRarityColor(badge.rarity)}`}>
                              {badge.rarity}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ PROGRESS BACKUP ============
function ProgressBackupSection() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [passThreshold, setPassThresholdLocal] = useState(getPassThreshold());
  const examAttempts = getExamAttempts();

  const handleExport = () => {
    const blob = new Blob([exportProgressJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaism-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgressJson(reader.result as string);
      if (result.ok) {
        setImportStatus('Progress restored! Reloading…');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus(result.error ?? 'Import failed');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
      <h3 className="font-semibold text-cockpit mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-emerald-500" />
        Progress
      </h3>
      <p className="text-sm text-cockpit-muted mb-4">
        Unified progress store — domain scores, quiz history, exam attempts, streak, and XP.
        {examAttempts.length > 0 && (
          <span className="block mt-1 text-xs">
            Latest exam: {examAttempts[examAttempts.length - 1].score}% ({examAttempts[examAttempts.length - 1].passed ? 'PASS' : 'FAIL'})
          </span>
        )}
      </p>

      <div className="mb-4">
        <label className="block text-sm text-theme-secondary mb-1">
          Exam pass threshold (%)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={50}
            max={80}
            value={passThreshold}
            onChange={e => {
              const v = Number(e.target.value);
              setPassThresholdLocal(v);
              setPassThreshold(v);
            }}
            className="flex-1"
          />
          <span className="text-sm font-mono font-bold text-cockpit w-10">{passThreshold}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download size={16} /> Export JSON
        </button>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-theme-secondary rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
          <Upload size={16} /> Import JSON
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
      {importStatus && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{importStatus}</p>
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============
type SettingsSection = 'ai' | 'connectors' | 'integrations' | 'sync' | 'progress' | 'about';

function ProductTierSettings() {
  const [showAll, setShowAll] = useState(getShowAllToolsOverride);
  const progress = getUnlockProgress();
  const unlocked = isFullCatalogUnlocked();

  return (
    <div className="bg-theme-elevated rounded-xl p-5 border border-theme">
      <h3 className="font-semibold text-cockpit mb-2">Explore tools</h3>
      <p className="text-sm text-cockpit-muted mb-3">
        Team Packs, Content Studio, OSINT Arsenal, and more unlock after{' '}
        {progress.missionsNeeded} missions or {progress.daysNeeded} days.
        {unlocked && !showAll && ' You qualify — tools are available.'}
      </p>
      <p className="text-xs text-theme-faint mb-3">
        Progress: {progress.missions}/{progress.missionsNeeded} missions · day {progress.days + 1}/{progress.daysNeeded}
      </p>
      <label className="flex items-center gap-2 text-sm text-cockpit cursor-pointer">
        <input
          type="checkbox"
          checked={showAll}
          onChange={e => {
            setShowAll(e.target.checked);
            setShowAllToolsOverride(e.target.checked);
            window.location.reload();
          }}
          className="rounded border-gray-300"
        />
        Show all tools (skip unlock gate)
      </label>
    </div>
  );
}

function SettingsTab() {
  const [section, setSection] = useState<SettingsSection>('ai');
  useSettingsHealthPoll(true);
  const { defaultCertId, setDefaultCert, activeCert } = useCert();
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [saved, setSaved] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState(() => loadAIConfig().apiKey);
  const [aiTab, setAiTab] = useState<AISettingsTab>(() => providerToTab(loadAIConfig().provider));
  const modelCap = getModelCapability(config.model);
  const modelWarning = config.provider === 'ollama' ? getModelWarning(config.model) : null;

  const handleSave = () => {
    saveAIConfig(config);
    setSavedApiKey(config.apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAiTabChange = (tab: AISettingsTab) => {
    setAiTab(tab);
    if (tab === 'groq') {
      setConfig(prev => ({
        ...prev,
        provider: 'groq',
        baseUrl: defaultConfigs.groq.baseUrl,
        model: prev.provider === 'groq' ? prev.model : (defaultConfigs.groq.model ?? prev.model),
      }));
    } else if (tab === 'ollama') {
      setConfig(prev => ({
        ...prev,
        provider: 'ollama',
        baseUrl: defaultConfigs.ollama.baseUrl,
        model: prev.provider === 'ollama' ? prev.model : (defaultConfigs.ollama.model ?? prev.model),
      }));
    } else if (config.provider !== 'claude' && config.provider !== 'openai') {
      setConfig(prev => ({
        ...prev,
        provider: 'claude',
        model: defaultConfigs.claude.model ?? prev.model,
        baseUrl: defaultConfigs.claude.baseUrl,
      }));
    }
  };

  const aiTabs: { id: AISettingsTab; label: string; icon: typeof Sparkles; hint: string }[] = [
    { id: 'groq', label: 'Groq', icon: Sparkles, hint: 'Free cloud · fast inference' },
    { id: 'ollama', label: 'Ollama', icon: Server, hint: 'Local · Gemma 4 & Qwen' },
    { id: 'cloud', label: 'Cloud', icon: Cloud, hint: 'Claude & OpenAI' },
  ];

  const settingsSections: { id: SettingsSection; label: string; icon: typeof Settings }[] = [
    { id: 'ai', label: 'AI Provider', icon: Sparkles },
    { id: 'connectors', label: 'Connectors', icon: Link2 },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'sync', label: 'Cloud Sync', icon: Cloud },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Home },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-cockpit-track border border-theme overflow-x-auto">
        {settingsSections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              section === id
                ? 'bg-theme-elevated text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-cockpit-muted hover:text-cockpit'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {section === 'connectors' && (
        <div className="space-y-4">
          <ProTierStrip />
          <ConnectorsSettings />
        </div>
      )}

      {section === 'integrations' && (
        <div className="space-y-4">
          <ProTierStrip />
          <ProductTierSettings />
          <IntegrationsSettings />
        </div>
      )}

      {section === 'sync' && <SignInSyncSection />}

      {section === 'progress' && <ProgressBackupSection />}

      {section === 'about' && (
        <>
          <AboutPanel />
          <div className="bg-theme-elevated rounded-xl p-6 border border-red-200 dark:border-red-900">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all study data? This cannot be undone.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </>
      )}

      {section === 'ai' && (
      <>
      <AIConnectionStatusPill className="mb-4" />

      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        <h3 className="font-semibold text-cockpit mb-2">Default certification track</h3>
        <p className="text-sm text-cockpit-muted mb-4">
          Certification loaded on startup. Active track: {activeCert.shortName}.
        </p>
        <select
          value={defaultCertId}
          onChange={e => setDefaultCert(e.target.value)}
          className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-elevated text-cockpit text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {CERTIFICATIONS.map(c => (
            <option key={c.id} value={c.id}>
              {c.shortName} — {c.vendor} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {/* AI Settings */}
      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        <h3 className="font-semibold text-cockpit mb-4 flex items-center gap-2">
          <Settings size={18} className="text-primary-500" />
          AI Provider Settings
        </h3>

        <div className="flex gap-1 p-1 mb-4 rounded-lg bg-gray-100 dark:bg-gray-900/50">
          {aiTabs.map(({ id, label, icon: Icon, hint }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAiTabChange(id)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${
                aiTab === id
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-cockpit-muted hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {label}
              </span>
              <span className="text-[10px] font-normal opacity-70 hidden sm:block">{hint}</span>
            </button>
          ))}
        </div>
        
        <div className="space-y-4">
          {aiTab === 'groq' && (
            <GroqApiKeySection
              config={config}
              onChange={setConfig}
              savedKey={savedApiKey}
            />
          )}

          {aiTab === 'ollama' && (
            <>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                <p className="text-xs text-violet-800 dark:text-violet-300">
                  <strong>Ollama</strong> runs models locally — ideal for Gemma 4, Qwen 3.5, and offline study.
                  Install from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a>, then pull models below.
                </p>
              </div>

              <div>
                <label className="block text-sm text-theme-secondary mb-1">Model</label>
                <select
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-cockpit focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {AAISM_OFFLINE_MODELS.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name}{m.recommended ? ' ★ Recommended' : ''}{m.fallbackOnly ? ' (fallback)' : ''}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    modelCap.tier === 'small'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : modelCap.tier === 'large'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {modelCap.tier} tier · JSON {modelCap.jsonReliability}%
                  </span>
                  {modelCap.recommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" /> Recommended
                    </span>
                  )}
                </div>
              </div>

              {modelWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">{modelWarning}</p>
                </div>
              )}

              <div className="pt-2 border-t border-theme">
                <h4 className="font-medium text-cockpit mb-3 text-sm">Offline Model Manager</h4>
                <OllamaModelManager
                  baseUrl={config.baseUrl}
                  selectedModel={config.model}
                  onSelectModel={model => setConfig({ ...config, model })}
                />
              </div>
            </>
          )}

          {aiTab === 'cloud' && (
            <>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">Cloud Provider</label>
                <select
                  value={config.provider === 'openai' ? 'openai' : 'claude'}
                  onChange={e => {
                    const provider = e.target.value as 'claude' | 'openai';
                    setConfig({ ...config, provider, ...defaultConfigs[provider] });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-cockpit focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">OpenAI (GPT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-theme-secondary mb-1">API Key</label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={`Enter your ${config.provider} API key`}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-cockpit focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-theme-secondary mb-1">Model</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-cockpit focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            className={`w-full py-2 rounded-lg font-medium transition-all ${
              saved 
                ? 'bg-green-500 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <AISmokeTestPanel />
      </>
      )}
    </div>
  );
}
