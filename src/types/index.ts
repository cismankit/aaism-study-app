// Types for AAISM Study App

// ============ DOCUMENT MANAGEMENT (for AI Tutor) ============

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'text' | 'markdown';
  content: string; // Extracted text content
  uploadedAt: string;
  size: number; // bytes
  domainId?: number; // Optional association with a domain
}

// ============ FLASHCARD / CMS TYPES ============

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  domainId: number;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  easeFactor: number; // For spaced repetition (SM-2 algorithm)
  interval: number; // Days until next review
  repetitions: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  domainId?: number;
  cardIds: string[];
  createdAt: string;
}

// ============ TEST MANAGEMENT (TMS) ============

export interface TestSession {
  id: string;
  date: string;
  domainId: number | 'all';
  mode: 'practice' | 'exam' | 'review';
  questions: TestQuestion[];
  duration: number; // seconds
  score: number;
  completed: boolean;
}

export interface TestQuestion {
  questionId: string;
  userAnswer: number | null;
  correct: boolean;
  timeSpent: number; // seconds
  flagged: boolean;
}

export interface WeakArea {
  domainId: number;
  topicId: string;
  incorrectCount: number;
  totalAttempts: number;
  lastAttempt: string;
}

// ============ SCHEDULE MANAGEMENT ============

export interface ScheduledStudy {
  id: string;
  date: string;
  startTime: string;
  duration: number; // minutes
  domainId?: number;
  activity: 'quiz' | 'review' | 'flashcards' | 'notes' | 'video';
  completed: boolean;
  notes?: string;
}

export interface StudyGoal {
  id: string;
  type: 'daily_quizzes' | 'daily_minutes' | 'weekly_domains' | 'score_target';
  target: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

// ============ CORE STUDY TYPES ============

export interface StudyResource {
  id: string;
  name: string;
  totalPasses: number;
  currentPass: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  completed: boolean[];  // One boolean per pass
}

export interface Domain {
  id: number;
  name: string;
  icon: string;
  notes: Note[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  domain: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  date: string;
  domain: number | 'all';
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  xpEarned?: number;
}

export interface StudySession {
  id: string;
  date: string;
  duration: number; // minutes
  activity: string;
  notes: string;
  xpEarned?: number;
}

export interface AppState {
  resources: StudyResource[];
  domains: Domain[];
  /** Per-cert note isolation — domains array holds notes for active cert only */
  notesByCert?: Record<string, Domain[]>;
  quizAttempts: QuizAttempt[];
  studySessions: StudySession[];
  examDate: string | null;
}

// ============ GAMIFICATION TYPES ============

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'quiz' | 'study' | 'streak' | 'mastery' | 'special';
  requirement: BadgeRequirement;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface BadgeRequirement {
  type: 'quiz_score' | 'quiz_count' | 'study_time' | 'streak' | 'domain_mastery' | 'perfect_quiz' | 'level' | 'total_xp';
  value: number;
  domain?: number; // For domain-specific badges
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  notified: boolean;
}

export interface DailyChallenge {
  id: string;
  date: string;
  type: 'quiz' | 'study' | 'review';
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  unlockedBadges: UnlockedBadge[];
  dailyChallenges: DailyChallenge[];
  totalQuizzesTaken: number;
  totalStudyMinutes: number;
  perfectQuizzes: number;
  domainScores: { [domainId: number]: number[] }; // Track scores per domain
}

// XP Rewards configuration
export interface XPRewards {
  quizComplete: number;
  quizPerfect: number;
  quizPerCorrectAnswer: number;
  studySessionComplete: number;
  studyPerMinute: number;
  dailyStreak: number;
  badgeUnlock: number;
  dailyChallengeComplete: number;
  levelUp: number;
}

// Notification for achievements
export interface AchievementNotification {
  id: string;
  type: 'badge' | 'level_up' | 'streak' | 'xp_gain' | 'challenge_complete';
  title: string;
  description: string;
  icon: string;
  xpAmount?: number;
  timestamp: string;
}
