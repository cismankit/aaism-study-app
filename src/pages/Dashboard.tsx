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
} from 'lucide-react';

type Tab = 'home' | 'analytics' | 'achievements' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
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
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Today's Goal</span>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{todayQuizzes}/{dailyGoal}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${dailyProgress >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{domain.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Domain {idx + 1}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{domain.name}</div>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Target className="text-blue-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{gameState.totalQuizzesTaken}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Quizzes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <TrendingUp className="text-green-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{avgScore}%</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Avg Score</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Clock className="text-purple-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{Math.floor(gameState.totalStudyMinutes / 60)}h</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Study Time</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Trophy className="text-yellow-500 mx-auto mb-1" size={18} />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{gameState.unlockedBadges.length}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Badges</div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentBadges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white text-sm">Recent Achievements</div>
              <div className="flex items-center gap-2 mt-0.5">
                {recentBadges.map(badge => badge && (
                  <span key={badge.id} className="text-lg" title={badge.name}>{badge.icon}</span>
                ))}
                {gameState.unlockedBadges.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <Target className="text-primary-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{gameState.totalQuizzesTaken}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Quizzes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-green-600">{gameState.perfectQuizzes}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Perfect</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <TrendingUp className="text-blue-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {state.quizAttempts.length > 0 
              ? Math.round(state.quizAttempts.reduce((sum, a) => sum + a.score, 0) / state.quizAttempts.length) 
              : 0}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <Zap className="text-yellow-500 mx-auto mb-1" size={20} />
          <div className="text-2xl font-bold text-primary-600">
            {Math.floor(gameState.totalStudyMinutes / 60)}h
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Study Time</div>
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
                <span className="text-gray-700 dark:text-gray-300">{rec.action}: {rec.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Target size={18} className="text-primary-500" />
          Domain Performance
        </h3>
        <div className="space-y-3">
          {analytics.map((domain) => (
            <div key={domain.domainId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">Domain {domain.domainId}</span>
                <span className="text-gray-600 dark:text-gray-400">
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
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Take some quizzes to see your domain performance!
            </p>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
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
                  <p className="font-medium text-gray-800 dark:text-gray-200">{insight.title}</p>
                  <p className="text-gray-600 dark:text-gray-400">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Quiz History</h3>
        {recentAttempts.length > 0 ? (
          <div className="space-y-2">
            {recentAttempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {attempt.domain === 'all' ? 'All Domains' : `Domain ${attempt.domain}`}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
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
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Flame className="text-orange-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-gray-900 dark:text-white">{state.currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Flame className="text-red-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-gray-900 dark:text-white">{state.longestStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Best</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Trophy className="text-yellow-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-gray-900 dark:text-white">{state.unlockedBadges.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
          <Target className="text-green-500 mx-auto mb-1" size={20} />
          <div className="text-xl font-bold text-gray-900 dark:text-white">{state.perfectQuizzes}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Perfect</div>
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
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{info.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
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
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{badge.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
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

// ============ SETTINGS TAB ============
function SettingsTab() {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [saved, setSaved] = useState(false);
  const modelCap = getModelCapability(config.model);
  const modelWarning = config.provider === 'ollama' ? getModelWarning(config.model) : null;

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* AI Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings size={18} className="text-primary-500" />
          AI Provider Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Provider</label>
            <select
              value={config.provider}
              onChange={e => {
                const provider = e.target.value as AIProvider;
                setConfig({ ...config, provider, ...defaultConfigs[provider] });
              }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="groq">Groq (Free) — Best for Agent Discovery</option>
              <option value="ollama">Ollama (Local / Offline)</option>
              <option value="claude">Claude</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {config.provider !== 'ollama' && (
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={`Enter your ${config.provider} API key`}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Model</label>
            {config.provider === 'ollama' ? (
              <select
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {AAISM_OFFLINE_MODELS.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name}{m.recommended ? ' ★ Recommended' : ''}{m.fallbackOnly ? ' (fallback)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.model}
                onChange={e => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
            {config.provider === 'ollama' && (
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
            )}
          </div>

          {modelWarning && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">{modelWarning}</p>
            </div>
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

      {config.provider === 'ollama' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Offline Model Manager</h3>
          <OllamaModelManager
            baseUrl={config.baseUrl}
            selectedModel={config.model}
            onSelectModel={model => setConfig({ ...config, model })}
          />
        </div>
      )}

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>AAISM Exam Prep</strong> v1.0.0</p>
          <p>Prepare for the ISACA AI Security Manager certification exam with AI-powered study tools, flashcards, quizzes, and progress tracking.</p>
        </div>
      </div>

      {/* Clear Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-900">
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
    </div>
  );
}
