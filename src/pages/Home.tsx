import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { getLevelFromXP, getXPProgress, getBadgeById } from '../data/gamificationData';
import { 
  Play,
  Target, 
  Bot, 
  Trophy,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { state: gameState } = useGamification();
  const currentLevel = getLevelFromXP(gameState.xp);
  const xpProgress = getXPProgress(gameState.xp);
  
  // Get today's date for daily tracking
  const today = new Date().toDateString();
  const todayQuizzes = state.quizAttempts.filter(q => 
    new Date(q.date).toDateString() === today
  ).length;
  const dailyGoal = 3;
  const dailyProgress = Math.min(todayQuizzes / dailyGoal * 100, 100);

  // Recent quiz stats
  const recentQuizzes = state.quizAttempts.slice(-10);
  const avgScore = recentQuizzes.length > 0 
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
    : 0;

  // Find weakest domain for recommendation - use domains from state
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

  // Recent badges
  const recentBadges = gameState.unlockedBadges.slice(-2).map(ub => getBadgeById(ub.badgeId)).filter(Boolean);

  // Handle starting quiz for a domain
  const startDomainQuiz = (domainId: number) => {
    navigate('/study', { state: { startQuiz: true, domainId } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Row: Level + Streak + Daily Goal */}
      <div className="grid grid-cols-3 gap-3">
        {/* Level Card */}
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

        {/* Streak Card */}
        <NavLink 
          to="/profile"
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white hover:from-orange-600 hover:to-red-600 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Flame size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{gameState.currentStreak}</div>
              <div className="text-xs text-orange-100">Day Streak</div>
            </div>
          </div>
        </NavLink>

        {/* Daily Goal Card */}
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
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 size={12} /> Goal Complete!</span>
            ) : (
              `${dailyGoal - todayQuizzes} more quiz${dailyGoal - todayQuizzes !== 1 ? 'zes' : ''} to go`
            )}
          </div>
        </div>
      </div>

      {/* Start Studying CTA */}
      <button
        onClick={() => navigate('/study', { state: { startQuiz: true } })}
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
                {avgScore > 0 ? (
                  weakestDomain.quizCount > 0 && weakestDomain.avgScore < 80 
                    ? `Focus on: ${weakestDomain.name} (${weakestDomain.avgScore}%)`
                    : 'Practice all domains'
                ) : (
                  'Begin with Domain 1: AI Governance'
                )}
              </div>
            </div>
          </div>
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Domain Cards - Clickable */}
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
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats + AI Tutor Row */}
      <div className="grid grid-cols-5 gap-3">
        {/* Stats */}
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

        {/* AI Tutor Quick Access */}
        <NavLink 
          to="/tutor"
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-3 text-white hover:from-purple-600 hover:to-indigo-700 transition-all text-center"
        >
          <Bot className="mx-auto mb-1" size={18} />
          <div className="text-xs font-semibold">AI Tutor</div>
          <Sparkles className="mx-auto mt-0.5 opacity-70" size={10} />
        </NavLink>
      </div>

      {/* Recent Achievements */}
      {recentBadges.length > 0 && (
        <NavLink 
          to="/profile"
          className="block bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">Recent Achievements</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {recentBadges.map(badge => badge && (
                    <span key={badge.id} className="text-lg" title={badge.name}>{badge.icon}</span>
                  ))}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{gameState.unlockedBadges.length - recentBadges.length} more
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </div>
        </NavLink>
      )}
    </div>
  );
}
