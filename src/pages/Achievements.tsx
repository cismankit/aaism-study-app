import { useGamification } from '../context/GamificationContext';
import { 
  BADGES, 
  LEVELS, 
  getLevelFromXP, 
  getXPProgress, 
  getRarityColor,
  getBadgeById 
} from '../data/gamificationData';
import { 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  Star, 
  Zap,
  Medal,
  TrendingUp
} from 'lucide-react';

export default function Achievements() {
  const { state } = useGamification();
  const currentLevel = getLevelFromXP(state.xp);
  const xpProgress = getXPProgress(state.xp);
  const unlockedBadgeIds = new Set(state.unlockedBadges.map(b => b.badgeId));

  // Group badges by category
  const badgesByCategory = BADGES.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof BADGES>);

  const categoryNames: Record<string, string> = {
    quiz: '📝 Quiz Achievements',
    study: '📚 Study Achievements',
    streak: '🔥 Streak Achievements',
    mastery: '🎯 Domain Mastery',
    special: '⭐ Special Achievements',
  };

  return (
    <div className="space-y-8">
      {/* Header with Level & XP */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-8">
          {/* Level Badge */}
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg"
            style={{ backgroundColor: currentLevel.color }}
          >
            {currentLevel.level}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{currentLevel.title}</h1>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Level {currentLevel.level}
              </span>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{state.xp.toLocaleString()} XP Total</span>
                {currentLevel.level < 10 && (
                  <span>{xpProgress.current} / {xpProgress.required} to next level</span>
                )}
              </div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
            </div>
            
            {currentLevel.level < 10 && (
              <p className="text-primary-100 text-sm">
                Next: Level {currentLevel.level + 1} - {LEVELS[currentLevel.level]?.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Flame className="text-orange-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{state.currentStreak}</div>
          <div className="text-gray-500 text-sm">Day Streak</div>
          {state.longestStreak > state.currentStreak && (
            <div className="text-xs text-gray-400 mt-1">Best: {state.longestStreak}</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="text-blue-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{state.totalQuizzesTaken}</div>
          <div className="text-gray-500 text-sm">Quizzes Taken</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="text-green-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor(state.totalStudyMinutes / 60)}h
          </div>
          <div className="text-gray-500 text-sm">Study Time</div>
          <div className="text-xs text-gray-400 mt-1">{state.totalStudyMinutes % 60}m</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="text-purple-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{state.perfectQuizzes}</div>
          <div className="text-gray-500 text-sm">Perfect Scores</div>
        </div>
      </div>

      {/* Unlocked Badges Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-xl font-semibold">
            Badges Earned: {state.unlockedBadges.length} / {BADGES.length}
          </h2>
        </div>
        
        {state.unlockedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {state.unlockedBadges.map(unlocked => {
              const badge = getBadgeById(unlocked.badgeId);
              if (!badge) return null;
              return (
                <div 
                  key={unlocked.badgeId}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: getRarityColor(badge.rarity) }}
                  title={badge.description}
                >
                  <span className="text-lg">{badge.icon}</span>
                  {badge.name}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">Complete activities to earn badges!</p>
        )}
      </div>

      {/* All Badges by Category */}
      {Object.entries(badgesByCategory).map(([category, badges]) => (
        <div key={category} className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">{categoryNames[category] || category}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map(badge => {
              const isUnlocked = unlockedBadgeIds.has(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isUnlocked 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        isUnlocked ? 'bg-white shadow' : 'bg-gray-200 grayscale'
                      }`}
                    >
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{badge.name}</span>
                        {isUnlocked && (
                          <Medal className="text-green-500" size={16} />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full text-white capitalize"
                          style={{ backgroundColor: getRarityColor(badge.rarity) }}
                        >
                          {badge.rarity}
                        </span>
                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                          <Zap size={12} />
                          +{badge.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Level Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-primary-500" size={24} />
          <h2 className="text-xl font-semibold">Level Progression</h2>
        </div>
        
        <div className="space-y-3">
          {LEVELS.map((level, index) => {
            const isCurrentLevel = level.level === currentLevel.level;
            const isUnlocked = state.xp >= level.minXp;
            
            return (
              <div 
                key={level.level}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  isCurrentLevel 
                    ? 'bg-primary-50 border-2 border-primary-500' 
                    : isUnlocked 
                      ? 'bg-green-50' 
                      : 'bg-gray-50 opacity-60'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: isUnlocked ? level.color : '#9CA3AF' }}
                >
                  {level.level}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{level.title}</div>
                  <div className="text-sm text-gray-500">
                    {level.minXp.toLocaleString()} XP required
                  </div>
                </div>
                {isCurrentLevel && (
                  <span className="text-xs bg-primary-500 text-white px-3 py-1 rounded-full">
                    Current
                  </span>
                )}
                {isUnlocked && !isCurrentLevel && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
