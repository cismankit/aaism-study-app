import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { 
  BADGES, 
  LEVELS, 
  getLevelFromXP, 
  getXPProgress, 
  getRarityColor
} from '../data/gamificationData';
import { 
  getDomainAnalytics,
  getStudyRecommendations,
  generateInsights
} from '../services/testAnalytics';
import { 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  Star,
  Medal,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Zap
} from 'lucide-react';
import { 
  AIConfig, 
  loadAIConfig, 
  saveAIConfig,
  defaultConfigs,
  AIProvider
} from '../services/aiService';

type Tab = 'achievements' | 'analytics' | 'settings';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('achievements');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'achievements'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Trophy size={18} />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp size={18} />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {activeTab === 'achievements' && <AchievementsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'settings' && <SettingsTab />}
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
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <Flame className="text-orange-500 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{state.currentStreak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <Target className="text-blue-500 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{state.totalQuizzesTaken}</div>
          <div className="text-xs text-gray-500">Quizzes</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <Clock className="text-green-500 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{Math.floor(state.totalStudyMinutes / 60)}h</div>
          <div className="text-xs text-gray-500">Study Time</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <Star className="text-purple-500 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{state.perfectQuizzes}</div>
          <div className="text-xs text-gray-500">Perfect</div>
        </div>
      </div>

      {/* Badges Summary */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Badges Earned: {state.unlockedBadges.length} / {BADGES.length}
          </h3>
          <div className="text-sm text-gray-500">
            {Math.round((state.unlockedBadges.length / BADGES.length) * 100)}% complete
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 rounded-full"
            style={{ width: `${(state.unlockedBadges.length / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge Categories */}
      {Object.entries(badgesByCategory).map(([category, badges]) => {
        const info = categoryInfo[category] || { name: category, icon: '🏆' };
        const unlockedCount = badges.filter(b => unlockedBadgeIds.has(b.id)).length;
        const isExpanded = expandedCategory === category;

        return (
          <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{info.name}</div>
                  <div className="text-sm text-gray-500">{unlockedCount} / {badges.length} unlocked</div>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                {badges.map(badge => {
                  const isUnlocked = unlockedBadgeIds.has(badge.id);
                  return (
                    <div 
                      key={badge.id}
                      className={`p-3 rounded-lg border flex items-center gap-3 ${
                        isUnlocked 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-100 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className={`text-2xl ${!isUnlocked && 'grayscale'}`}>{badge.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{badge.name}</span>
                          {isUnlocked && <Medal className="text-green-500 flex-shrink-0" size={14} />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{badge.description}</p>
                      </div>
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ backgroundColor: getRarityColor(badge.rarity) }}
                      >
                        {badge.rarity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Level Progression */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Level Progression</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LEVELS.map(level => {
            const isUnlocked = state.xp >= level.minXp;
            const isCurrent = level.level === currentLevel.level;
            
            return (
              <div 
                key={level.level}
                className={`flex-shrink-0 w-16 text-center ${!isUnlocked && 'opacity-40'}`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1 ${
                    isCurrent ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                  }`}
                  style={{ backgroundColor: isUnlocked ? level.color : '#9CA3AF' }}
                >
                  {level.level}
                </div>
                <div className="text-xs text-gray-600 truncate">{level.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab() {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [saved, setSaved] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    checking: boolean;
    running: boolean;
    models: string[];
    error?: string;
  }>({ checking: false, running: false, models: [] });

  const checkOllama = async () => {
    setOllamaStatus({ checking: true, running: false, models: [] });
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        const modelNames = (data.models || []).map((m: { name: string }) => m.name);
        setOllamaStatus({ checking: false, running: true, models: modelNames });
      } else {
        setOllamaStatus({ checking: false, running: false, models: [], error: 'Ollama not responding' });
      }
    } catch {
      setOllamaStatus({ checking: false, running: false, models: [], error: 'Ollama is not running' });
    }
  };

  const handleSave = (newConfig: AIConfig) => {
    setConfig(newConfig);
    saveAIConfig(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* AI Provider Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">AI Provider</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['groq', 'ollama', 'claude', 'openai'] as AIProvider[]).map(provider => (
              <button
                key={provider}
                onClick={() => {
                  handleSave({ ...config, provider, ...defaultConfigs[provider] });
                  if (provider === 'ollama') checkOllama();
                }}
                className={`p-3 rounded-lg border text-center transition-all ${
                  config.provider === provider
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 capitalize">{provider}</div>
                {provider === 'groq' && <div className="text-xs text-green-600">Free ⭐</div>}
                {provider === 'ollama' && <div className="text-xs text-blue-600">Offline</div>}
              </button>
            ))}
          </div>

          {config.provider !== 'ollama' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => handleSave({ ...config, apiKey: e.target.value })}
                placeholder={config.provider === 'groq' ? 'gsk_...' : 'sk-...'}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {config.provider === 'groq' && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">
                🎉 <strong>Groq is completely FREE!</strong> Get your API key at{' '}
                <a 
                  href="https://console.groq.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline inline-flex items-center gap-1"
                >
                  console.groq.com <ExternalLink size={12} />
                </a>
              </p>
            </div>
          )}

          {config.provider === 'ollama' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${ollamaStatus.running ? 'bg-green-50' : 'bg-blue-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-medium ${ollamaStatus.running ? 'text-green-800' : 'text-blue-800'}`}>
                    {ollamaStatus.running ? '✓ Ollama is running' : '🖥️ Ollama Setup (Offline AI)'}
                  </span>
                  <button
                    onClick={checkOllama}
                    disabled={ollamaStatus.checking}
                    className="px-3 py-1 text-sm bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    {ollamaStatus.checking ? 'Checking...' : 'Check Status'}
                  </button>
                </div>
                
                {ollamaStatus.running && ollamaStatus.models.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm text-green-700 mb-1">Select Model:</label>
                    <select
                      value={config.model}
                      onChange={e => handleSave({ ...config, model: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white text-sm"
                    >
                      {ollamaStatus.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {!ollamaStatus.running && (
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>To use AI offline:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline">ollama.com</a></li>
                      <li>Open Terminal and run: <code className="bg-blue-100 px-1 rounded">ollama serve</code></li>
                      <li>Download a model: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2</code></li>
                      <li>Click "Check Status" above</li>
                    </ol>
                    <p className="text-xs mt-2 text-blue-600">
                      Recommended models: llama3.2 (fast), mistral (quality), phi3 (lightweight)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {saved && (
          <div className="mt-4 text-green-600 text-sm font-medium">
            ✓ Settings saved
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
        <p className="text-gray-600 text-sm mb-4">
          Your progress and achievements are stored locally in your browser.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
        >
          Reset All Progress
        </button>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">About</h3>
        <div className="flex items-start gap-4">
          <img src="/logo.svg" alt="AAISM Logo" className="w-16 h-16" />
          <div>
            <p className="text-gray-600 text-sm">
              AAISM Study App helps you prepare for the ISACA AI Security Manager certification exam through gamified learning, practice quizzes, and AI-powered tutoring.
            </p>
            <p className="text-gray-400 text-xs mt-2">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
