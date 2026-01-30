import { Badge, LevelInfo, XPRewards, GamificationState } from '../types';

// XP Rewards Configuration
export const XP_REWARDS: XPRewards = {
  quizComplete: 50,
  quizPerfect: 100,
  quizPerCorrectAnswer: 10,
  studySessionComplete: 30,
  studyPerMinute: 2,
  dailyStreak: 25,
  badgeUnlock: 50,
  dailyChallengeComplete: 75,
  levelUp: 100,
};

// Level Definitions
export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Novice', minXp: 0, maxXp: 100, color: '#9CA3AF' },
  { level: 2, title: 'Apprentice', minXp: 100, maxXp: 300, color: '#10B981' },
  { level: 3, title: 'Student', minXp: 300, maxXp: 600, color: '#3B82F6' },
  { level: 4, title: 'Scholar', minXp: 600, maxXp: 1000, color: '#8B5CF6' },
  { level: 5, title: 'Practitioner', minXp: 1000, maxXp: 1500, color: '#EC4899' },
  { level: 6, title: 'Expert', minXp: 1500, maxXp: 2200, color: '#F59E0B' },
  { level: 7, title: 'Specialist', minXp: 2200, maxXp: 3000, color: '#EF4444' },
  { level: 8, title: 'Master', minXp: 3000, maxXp: 4000, color: '#14B8A6' },
  { level: 9, title: 'Grandmaster', minXp: 4000, maxXp: 5500, color: '#6366F1' },
  { level: 10, title: 'AI Security Champion', minXp: 5500, maxXp: Infinity, color: '#F97316' },
];

// Badge Definitions
export const BADGES: Badge[] = [
  // Quiz Badges
  {
    id: 'first-quiz',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    category: 'quiz',
    requirement: { type: 'quiz_count', value: 1 },
    rarity: 'common',
    xpReward: 25,
  },
  {
    id: 'quiz-master-10',
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    icon: '📝',
    category: 'quiz',
    requirement: { type: 'quiz_count', value: 10 },
    rarity: 'uncommon',
    xpReward: 50,
  },
  {
    id: 'quiz-master-50',
    name: 'Quiz Master',
    description: 'Complete 50 quizzes',
    icon: '🏆',
    category: 'quiz',
    requirement: { type: 'quiz_count', value: 50 },
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'perfect-score',
    name: 'Perfectionist',
    description: 'Score 100% on a quiz',
    icon: '💯',
    category: 'quiz',
    requirement: { type: 'perfect_quiz', value: 1 },
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'perfect-5',
    name: 'Flawless',
    description: 'Score 100% on 5 quizzes',
    icon: '⭐',
    category: 'quiz',
    requirement: { type: 'perfect_quiz', value: 5 },
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'perfect-10',
    name: 'Legendary Mind',
    description: 'Score 100% on 10 quizzes',
    icon: '👑',
    category: 'quiz',
    requirement: { type: 'perfect_quiz', value: 10 },
    rarity: 'legendary',
    xpReward: 300,
  },

  // Streak Badges
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Maintain a 3-day study streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
    rarity: 'common',
    xpReward: 30,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'streak-14',
    name: 'Dedicated Learner',
    description: 'Maintain a 14-day study streak',
    icon: '💪',
    category: 'streak',
    requirement: { type: 'streak', value: 14 },
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day study streak',
    icon: '🌟',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    rarity: 'epic',
    xpReward: 300,
  },

  // Study Time Badges
  {
    id: 'study-60',
    name: 'Study Session',
    description: 'Study for 1 hour total',
    icon: '📚',
    category: 'study',
    requirement: { type: 'study_time', value: 60 },
    rarity: 'common',
    xpReward: 25,
  },
  {
    id: 'study-300',
    name: 'Bookworm',
    description: 'Study for 5 hours total',
    icon: '🐛',
    category: 'study',
    requirement: { type: 'study_time', value: 300 },
    rarity: 'uncommon',
    xpReward: 75,
  },
  {
    id: 'study-600',
    name: 'Knowledge Seeker',
    description: 'Study for 10 hours total',
    icon: '🧠',
    category: 'study',
    requirement: { type: 'study_time', value: 600 },
    rarity: 'rare',
    xpReward: 150,
  },
  {
    id: 'study-1200',
    name: 'Scholar Elite',
    description: 'Study for 20 hours total',
    icon: '🎓',
    category: 'study',
    requirement: { type: 'study_time', value: 1200 },
    rarity: 'epic',
    xpReward: 300,
  },

  // Domain Mastery Badges
  {
    id: 'governance-master',
    name: 'Governance Guardian',
    description: 'Score 90%+ on Domain 1 five times',
    icon: '🏛️',
    category: 'mastery',
    requirement: { type: 'domain_mastery', value: 5, domain: 1 },
    rarity: 'rare',
    xpReward: 100,
  },
  {
    id: 'risk-master',
    name: 'Risk Ranger',
    description: 'Score 90%+ on Domain 2 five times',
    icon: '⚠️',
    category: 'mastery',
    requirement: { type: 'domain_mastery', value: 5, domain: 2 },
    rarity: 'rare',
    xpReward: 100,
  },
  {
    id: 'development-master',
    name: 'Development Dynamo',
    description: 'Score 90%+ on Domain 3 five times',
    icon: '⚙️',
    category: 'mastery',
    requirement: { type: 'domain_mastery', value: 5, domain: 3 },
    rarity: 'rare',
    xpReward: 100,
  },
  {
    id: 'operations-master',
    name: 'Operations Oracle',
    description: 'Score 90%+ on Domain 4 five times',
    icon: '🔧',
    category: 'mastery',
    requirement: { type: 'domain_mastery', value: 5, domain: 4 },
    rarity: 'rare',
    xpReward: 100,
  },

  // Level Badges
  {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    category: 'special',
    requirement: { type: 'level', value: 5 },
    rarity: 'uncommon',
    xpReward: 100,
  },
  {
    id: 'level-10',
    name: 'AI Security Champion',
    description: 'Reach Level 10',
    icon: '🏅',
    category: 'special',
    requirement: { type: 'level', value: 10 },
    rarity: 'legendary',
    xpReward: 500,
  },

  // XP Milestones
  {
    id: 'xp-1000',
    name: 'XP Hunter',
    description: 'Earn 1,000 total XP',
    icon: '💎',
    category: 'special',
    requirement: { type: 'total_xp', value: 1000 },
    rarity: 'uncommon',
    xpReward: 50,
  },
  {
    id: 'xp-5000',
    name: 'XP Legend',
    description: 'Earn 5,000 total XP',
    icon: '💠',
    category: 'special',
    requirement: { type: 'total_xp', value: 5000 },
    rarity: 'epic',
    xpReward: 200,
  },
];

// Initial Gamification State
export const initialGamificationState: GamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  unlockedBadges: [],
  dailyChallenges: [],
  totalQuizzesTaken: 0,
  totalStudyMinutes: 0,
  perfectQuizzes: 0,
  domainScores: { 1: [], 2: [], 3: [], 4: [] },
};

// Helper Functions
export function getLevelFromXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): { current: number; required: number; percentage: number } {
  const currentLevel = getLevelFromXP(xp);
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= LEVELS.length) {
    return { current: xp - currentLevel.minXp, required: 1, percentage: 100 };
  }
  
  const nextLevel = LEVELS[nextLevelIndex];
  const current = xp - currentLevel.minXp;
  const required = nextLevel.minXp - currentLevel.minXp;
  const percentage = Math.min(100, Math.round((current / required) * 100));
  
  return { current, required, percentage };
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return '#9CA3AF';
    case 'uncommon': return '#10B981';
    case 'rare': return '#3B82F6';
    case 'epic': return '#8B5CF6';
    case 'legendary': return '#F59E0B';
    default: return '#9CA3AF';
  }
}

// Daily Challenge Generators
export function generateDailyChallenge(): {
  type: 'quiz' | 'study' | 'review';
  description: string;
  target: number;
  xpReward: number;
} {
  const challenges = [
    { type: 'quiz' as const, description: 'Complete 3 quizzes today', target: 3, xpReward: 75 },
    { type: 'quiz' as const, description: 'Score 80%+ on a quiz', target: 80, xpReward: 50 },
    { type: 'study' as const, description: 'Study for 30 minutes', target: 30, xpReward: 60 },
    { type: 'study' as const, description: 'Study for 1 hour', target: 60, xpReward: 100 },
    { type: 'review' as const, description: 'Review 2 different domains', target: 2, xpReward: 50 },
    { type: 'quiz' as const, description: 'Answer 20 questions correctly', target: 20, xpReward: 80 },
  ];
  
  return challenges[Math.floor(Math.random() * challenges.length)];
}
