import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { 
  GamificationState, 
  UnlockedBadge, 
  AchievementNotification,
  DailyChallenge 
} from '../types';
import { 
  initialGamificationState, 
  BADGES, 
  XP_REWARDS,
  getLevelFromXP,
  generateDailyChallenge 
} from '../data/gamificationData';
import { loadProgress, updateProgressFields, loadCertIntoContexts } from '../services/progressService';
import { useCert } from './CertContext';

// Actions
type GamificationAction =
  | { type: 'ADD_XP'; payload: { amount: number; source: string } }
  | { type: 'COMPLETE_QUIZ'; payload: { score: number; totalQuestions: number; correctAnswers: number; domain: number | 'all'; isPerfect: boolean } }
  | { type: 'COMPLETE_STUDY_SESSION'; payload: { duration: number } }
  | { type: 'UNLOCK_BADGE'; payload: { badgeId: string } }
  | { type: 'UPDATE_STREAK' }
  | { type: 'ADD_DAILY_CHALLENGE'; payload: DailyChallenge }
  | { type: 'UPDATE_CHALLENGE_PROGRESS'; payload: { challengeId: string; progress: number } }
  | { type: 'DISMISS_NOTIFICATION'; payload: { id: string } }
  | { type: 'LOAD_STATE'; payload: GamificationState };

interface GamificationContextType {
  state: GamificationState;
  notifications: AchievementNotification[];
  addXP: (amount: number, source: string) => void;
  completeQuiz: (score: number, totalQuestions: number, correctAnswers: number, domain: number | 'all') => number;
  completeStudySession: (duration: number) => number;
  dismissNotification: (id: string) => void;
  checkAndUnlockBadges: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'aaism-gamification';
const NOTIFICATIONS_KEY = 'aaism-notifications';

// Reducer
function gamificationReducer(state: GamificationState, action: GamificationAction): GamificationState {
  switch (action.type) {
    case 'ADD_XP': {
      const newXP = state.xp + action.payload.amount;
      const newLevel = getLevelFromXP(newXP);
      
      return {
        ...state,
        xp: newXP,
        level: newLevel.level,
      };
    }

    case 'COMPLETE_QUIZ': {
      const { score, domain, isPerfect } = action.payload;
      const newDomainScores = { ...state.domainScores };
      
      if (typeof domain === 'number') {
        newDomainScores[domain] = [...(newDomainScores[domain] || []), score];
      }
      
      return {
        ...state,
        totalQuizzesTaken: state.totalQuizzesTaken + 1,
        perfectQuizzes: isPerfect ? state.perfectQuizzes + 1 : state.perfectQuizzes,
        domainScores: newDomainScores,
      };
    }

    case 'COMPLETE_STUDY_SESSION': {
      return {
        ...state,
        totalStudyMinutes: state.totalStudyMinutes + action.payload.duration,
      };
    }

    case 'UNLOCK_BADGE': {
      const alreadyUnlocked = state.unlockedBadges.some(b => b.badgeId === action.payload.badgeId);
      if (alreadyUnlocked) return state;

      const newBadge: UnlockedBadge = {
        badgeId: action.payload.badgeId,
        unlockedAt: new Date().toISOString(),
        notified: false,
      };

      return {
        ...state,
        unlockedBadges: [...state.unlockedBadges, newBadge],
      };
    }

    case 'UPDATE_STREAK': {
      const today = new Date().toDateString();
      const lastActivity = state.lastActivityDate ? new Date(state.lastActivityDate).toDateString() : null;
      
      if (lastActivity === today) {
        return state; // Already active today
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      let newStreak = 1;
      if (lastActivity === yesterdayStr) {
        newStreak = state.currentStreak + 1;
      }
      
      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        lastActivityDate: new Date().toISOString(),
      };
    }

    case 'ADD_DAILY_CHALLENGE': {
      return {
        ...state,
        dailyChallenges: [...state.dailyChallenges.slice(-2), action.payload],
      };
    }

    case 'UPDATE_CHALLENGE_PROGRESS': {
      return {
        ...state,
        dailyChallenges: state.dailyChallenges.map(c => 
          c.id === action.payload.challengeId
            ? { ...c, progress: action.payload.progress, completed: action.payload.progress >= c.target }
            : c
        ),
      };
    }

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// Provider
export function GamificationProvider({ children }: { children: ReactNode }) {
  const { activeCertId } = useCert();
  const prevCertRef = useRef(activeCertId);
  const [state, dispatch] = useReducer(gamificationReducer, initialGamificationState);
  const [notifications, setNotifications] = React.useState<AchievementNotification[]>([]);

  // Load state from localStorage
  useEffect(() => {
    loadProgress(); // ensure unified store is initialized
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to load gamification state:', e);
      }
    }

    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }

    // Check for daily challenge
    const today = new Date().toDateString();
    const hasToday = state.dailyChallenges.some(c => new Date(c.date).toDateString() === today);
    if (!hasToday) {
      const challenge = generateDailyChallenge();
      const newChallenge: DailyChallenge = {
        id: `challenge-${Date.now()}`,
        date: new Date().toISOString(),
        ...challenge,
        progress: 0,
        completed: false,
      };
      dispatch({ type: 'ADD_DAILY_CHALLENGE', payload: newChallenge });
    }
  }, []);

  useEffect(() => {
    if (prevCertRef.current === activeCertId) return;
    const outgoingCert = prevCertRef.current;
    updateProgressFields({
      domainScores: state.domainScores,
      totalQuizzesTaken: state.totalQuizzesTaken,
      perfectQuizzes: state.perfectQuizzes,
    }, outgoingCert);
    const loaded = loadCertIntoContexts(activeCertId);
    dispatch({
      type: 'LOAD_STATE',
      payload: {
        ...state,
        domainScores: loaded.domainScores,
        totalQuizzesTaken: loaded.gamificationPartial.totalQuizzesTaken,
        perfectQuizzes: loaded.gamificationPartial.perfectQuizzes,
      },
    });
    prevCertRef.current = activeCertId;
  }, [activeCertId]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateProgressFields({
      domainScores: state.domainScores,
      streak: {
        current: state.currentStreak,
        longest: state.longestStreak,
        lastActivityDate: state.lastActivityDate,
      },
      xp: state.xp,
      level: state.level,
      totalQuizzesTaken: state.totalQuizzesTaken,
      perfectQuizzes: state.perfectQuizzes,
      totalStudyMinutes: state.totalStudyMinutes,
    }, activeCertId);
  }, [state, activeCertId]);

  // Save notifications
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Add notification helper
  const addNotification = (notification: Omit<AchievementNotification, 'id' | 'timestamp'>) => {
    const newNotification: AchievementNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Add XP
  const addXP = (amount: number, source: string) => {
    const oldLevel = getLevelFromXP(state.xp);
    dispatch({ type: 'ADD_XP', payload: { amount, source } });
    dispatch({ type: 'UPDATE_STREAK' });
    
    const newLevel = getLevelFromXP(state.xp + amount);
    
    // Check for level up
    if (newLevel.level > oldLevel.level) {
      addNotification({
        type: 'level_up',
        title: 'Level Up!',
        description: `You reached Level ${newLevel.level}: ${newLevel.title}`,
        icon: '🎉',
        xpAmount: XP_REWARDS.levelUp,
      });
    }
    
    // XP gain notification
    addNotification({
      type: 'xp_gain',
      title: `+${amount} XP`,
      description: source,
      icon: '✨',
      xpAmount: amount,
    });
  };

  // Complete Quiz
  const completeQuiz = (score: number, totalQuestions: number, correctAnswers: number, domain: number | 'all'): number => {
    const isPerfect = score === 100;
    
    dispatch({ type: 'COMPLETE_QUIZ', payload: { score, totalQuestions, correctAnswers, domain, isPerfect } });
    
    // Calculate XP
    let xpEarned = XP_REWARDS.quizComplete;
    xpEarned += correctAnswers * XP_REWARDS.quizPerCorrectAnswer;
    if (isPerfect) {
      xpEarned += XP_REWARDS.quizPerfect;
    }
    
    addXP(xpEarned, `Quiz completed: ${score}%`);
    checkAndUnlockBadges();
    
    return xpEarned;
  };

  // Complete Study Session
  const completeStudySession = (duration: number): number => {
    dispatch({ type: 'COMPLETE_STUDY_SESSION', payload: { duration } });
    
    const xpEarned = XP_REWARDS.studySessionComplete + (duration * XP_REWARDS.studyPerMinute);
    addXP(xpEarned, `Studied for ${duration} minutes`);
    checkAndUnlockBadges();
    
    return xpEarned;
  };

  // Dismiss notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Check and unlock badges
  const checkAndUnlockBadges = () => {
    const unlockedIds = new Set(state.unlockedBadges.map(b => b.badgeId));

    BADGES.forEach(badge => {
      if (unlockedIds.has(badge.id)) return;

      let shouldUnlock = false;
      const req = badge.requirement;

      switch (req.type) {
        case 'quiz_count':
          shouldUnlock = state.totalQuizzesTaken >= req.value;
          break;
        case 'perfect_quiz':
          shouldUnlock = state.perfectQuizzes >= req.value;
          break;
        case 'streak':
          shouldUnlock = state.currentStreak >= req.value;
          break;
        case 'study_time':
          shouldUnlock = state.totalStudyMinutes >= req.value;
          break;
        case 'level':
          shouldUnlock = state.level >= req.value;
          break;
        case 'total_xp':
          shouldUnlock = state.xp >= req.value;
          break;
        case 'domain_mastery':
          if (req.domain) {
            const scores = state.domainScores[req.domain] || [];
            const highScores = scores.filter(s => s >= 90);
            shouldUnlock = highScores.length >= req.value;
          }
          break;
      }

      if (shouldUnlock) {
        dispatch({ type: 'UNLOCK_BADGE', payload: { badgeId: badge.id } });
        addNotification({
          type: 'badge',
          title: 'Badge Unlocked!',
          description: `${badge.icon} ${badge.name}: ${badge.description}`,
          icon: badge.icon,
          xpAmount: badge.xpReward,
        });
        // Add badge XP reward
        dispatch({ type: 'ADD_XP', payload: { amount: badge.xpReward, source: `Badge: ${badge.name}` } });
      }
    });
  };

  return (
    <GamificationContext.Provider 
      value={{ 
        state, 
        notifications,
        addXP, 
        completeQuiz, 
        completeStudySession, 
        dismissNotification,
        checkAndUnlockBadges,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}
