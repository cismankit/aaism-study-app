// Test Analytics Service - Track performance and identify weak areas
import { TestSession, WeakArea, QuizAttempt } from '../types';

const SESSIONS_KEY = 'aaism_test_sessions';
const WEAK_AREAS_KEY = 'aaism_weak_areas';

// ============ STORAGE ============

export function loadTestSessions(): TestSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTestSessions(sessions: TestSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadWeakAreas(): WeakArea[] {
  try {
    const stored = localStorage.getItem(WEAK_AREAS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWeakAreas(areas: WeakArea[]): void {
  localStorage.setItem(WEAK_AREAS_KEY, JSON.stringify(areas));
}

// ============ TEST SESSION MANAGEMENT ============

export function addTestSession(session: Omit<TestSession, 'id'>): TestSession {
  const sessions = loadTestSessions();
  const newSession: TestSession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  sessions.push(newSession);
  saveTestSessions(sessions);
  
  // Update weak areas based on results
  updateWeakAreas(newSession);
  
  return newSession;
}

function updateWeakAreas(session: TestSession): void {
  const weakAreas = loadWeakAreas();
  
  session.questions.forEach(q => {
    if (!q.correct) {
      // Find or create weak area entry
      const existingIndex = weakAreas.findIndex(
        wa => wa.topicId === q.questionId // Using questionId as proxy for topic
      );
      
      if (existingIndex >= 0) {
        weakAreas[existingIndex].incorrectCount += 1;
        weakAreas[existingIndex].totalAttempts += 1;
        weakAreas[existingIndex].lastAttempt = new Date().toISOString();
      } else {
        weakAreas.push({
          domainId: typeof session.domainId === 'number' ? session.domainId : 0,
          topicId: q.questionId,
          incorrectCount: 1,
          totalAttempts: 1,
          lastAttempt: new Date().toISOString(),
        });
      }
    }
  });
  
  saveWeakAreas(weakAreas);
}

// ============ ANALYTICS ============

export interface DomainAnalytics {
  domainId: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number; // seconds per question
  trend: 'improving' | 'stable' | 'declining';
  recentScores: number[];
}

export function getDomainAnalytics(quizAttempts: QuizAttempt[]): DomainAnalytics[] {
  const domainMap = new Map<number, QuizAttempt[]>();
  
  // Group by domain
  quizAttempts.forEach(attempt => {
    if (typeof attempt.domain === 'number') {
      const existing = domainMap.get(attempt.domain) || [];
      existing.push(attempt);
      domainMap.set(attempt.domain, existing);
    }
  });
  
  const analytics: DomainAnalytics[] = [];
  
  domainMap.forEach((attempts, domainId) => {
    const sorted = attempts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const correctAnswers = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const recentScores = sorted.slice(0, 5).map(a => a.score);
    
    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentScores.length >= 3) {
      const recent = recentScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const older = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
      if (recent > older + 5) trend = 'improving';
      else if (recent < older - 5) trend = 'declining';
    }
    
    analytics.push({
      domainId,
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      averageTime: 0, // Would need timing data
      trend,
      recentScores,
    });
  });
  
  return analytics.sort((a, b) => a.domainId - b.domainId);
}

export interface WeeklyProgress {
  week: string; // e.g., "Jan 20-26"
  quizzes: number;
  avgScore: number;
  studyMinutes: number;
}

export function getWeeklyProgress(quizAttempts: QuizAttempt[], weeks: number = 4): WeeklyProgress[] {
  const progress: WeeklyProgress[] = [];
  const now = new Date();
  
  for (let i = 0; i < weeks; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekAttempts = quizAttempts.filter(a => {
      const date = new Date(a.date);
      return date >= weekStart && date <= weekEnd;
    });
    
    const avgScore = weekAttempts.length > 0
      ? Math.round(weekAttempts.reduce((sum, a) => sum + a.score, 0) / weekAttempts.length)
      : 0;
    
    progress.push({
      week: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.getDate()}`,
      quizzes: weekAttempts.length,
      avgScore,
      studyMinutes: weekAttempts.length * 10, // Estimate
    });
  }
  
  return progress.reverse();
}

export interface PerformanceInsight {
  type: 'strength' | 'weakness' | 'tip' | 'milestone';
  title: string;
  description: string;
  actionable?: string;
}

export function generateInsights(quizAttempts: QuizAttempt[]): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const analytics = getDomainAnalytics(quizAttempts);
  
  // Find strengths
  const strongDomains = analytics.filter(a => a.accuracy >= 80 && a.totalQuestions >= 10);
  strongDomains.forEach(d => {
    insights.push({
      type: 'strength',
      title: `Strong in Domain ${d.domainId}`,
      description: `${d.accuracy}% accuracy across ${d.totalQuestions} questions`,
    });
  });
  
  // Find weaknesses
  const weakDomains = analytics.filter(a => a.accuracy < 60 && a.totalQuestions >= 5);
  weakDomains.forEach(d => {
    insights.push({
      type: 'weakness',
      title: `Focus on Domain ${d.domainId}`,
      description: `${d.accuracy}% accuracy - needs improvement`,
      actionable: 'Review the study material and take more practice quizzes',
    });
  });
  
  // Improving domains
  const improving = analytics.filter(a => a.trend === 'improving');
  improving.forEach(d => {
    insights.push({
      type: 'tip',
      title: `Domain ${d.domainId} is improving! 📈`,
      description: 'Keep up the momentum with your current study approach',
    });
  });
  
  // Milestones
  const totalQuizzes = quizAttempts.length;
  if (totalQuizzes >= 50) {
    insights.push({
      type: 'milestone',
      title: '50+ Quizzes Completed! 🎉',
      description: 'You\'re building strong exam preparation habits',
    });
  } else if (totalQuizzes >= 25) {
    insights.push({
      type: 'milestone',
      title: '25+ Quizzes Completed!',
      description: 'Great progress! Keep practicing for best results',
    });
  }
  
  return insights;
}

// ============ RECOMMENDATIONS ============

export interface StudyRecommendation {
  priority: 'high' | 'medium' | 'low';
  domainId: number;
  action: string;
  reason: string;
}

export function getStudyRecommendations(quizAttempts: QuizAttempt[]): StudyRecommendation[] {
  const analytics = getDomainAnalytics(quizAttempts);
  const recommendations: StudyRecommendation[] = [];
  
  // Recommend weakest domains first
  analytics
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2)
    .forEach((domain, index) => {
      if (domain.totalQuestions >= 3 && domain.accuracy < 75) {
        recommendations.push({
          priority: index === 0 ? 'high' : 'medium',
          domainId: domain.domainId,
          action: `Review Domain ${domain.domainId} concepts`,
          reason: `Current accuracy: ${domain.accuracy}%`,
        });
      }
    });
  
  // Recommend domains with declining trend
  analytics
    .filter(a => a.trend === 'declining')
    .forEach(domain => {
      recommendations.push({
        priority: 'high',
        domainId: domain.domainId,
        action: `Practice Domain ${domain.domainId} - scores declining`,
        reason: 'Recent scores show a downward trend',
      });
    });
  
  // Recommend untouched domains
  const touchedDomains = new Set(analytics.map(a => a.domainId));
  [1, 2, 3, 4].forEach(domainId => {
    if (!touchedDomains.has(domainId)) {
      recommendations.push({
        priority: 'medium',
        domainId,
        action: `Start practicing Domain ${domainId}`,
        reason: 'No quiz attempts recorded yet',
      });
    }
  });
  
  return recommendations.slice(0, 5);
}
