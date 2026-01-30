import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookOpen, Flame, Sun, Moon } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { GamificationProvider, useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import { getLevelFromXP } from '../data/gamificationData';
import AchievementToast from './AchievementToast';
import MatrixRain, { MatrixColor } from './MatrixRain';

// Performance Context for dynamic background
interface PerformanceContextType {
  bgColor: MatrixColor;
  setBgColor: (color: MatrixColor) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    return { bgColor: 'white' as MatrixColor, setBgColor: () => {} };
  }
  return context;
}

function PerformanceProvider({ children }: { children: ReactNode }) {
  const [bgColor, setBgColor] = useState<MatrixColor>('white');
  return (
    <PerformanceContext.Provider value={{ bgColor, setBgColor }}>
      {children}
    </PerformanceContext.Provider>
  );
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/study', icon: BookOpen, label: 'Study' },
];

function Header() {
  const { state } = useGamification();
  const { theme, toggleTheme } = useTheme();
  const currentLevel = getLevelFromXP(state.xp);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">AAISM</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Study App</div>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              <Icon size={18} />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Stats + Theme */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            state.currentStreak > 0 
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
          }`}>
            <Flame size={12} />
            <span className="font-bold">{state.currentStreak || 0}</span>
          </div>

          {/* Level Badge */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
            style={{ backgroundColor: currentLevel.color }}
            title={`Level ${currentLevel.level}: ${currentLevel.title} • ${state.xp} XP`}
          >
            {currentLevel.level}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <Moon size={16} className="text-gray-500" />
            ) : (
              <Sun size={16} className="text-yellow-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function LayoutContent() {
  const { theme } = useTheme();
  const { bgColor } = usePerformance();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* Matrix Rain Background - only in dark mode */}
      {theme === 'dark' && <MatrixRain color={bgColor} />}
      
      <Header />
      <main className="flex-1 overflow-auto p-4 relative z-10">
        <Outlet />
      </main>
      <AchievementToast />
    </div>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <GamificationProvider>
        <PerformanceProvider>
          <LayoutContent />
        </PerformanceProvider>
      </GamificationProvider>
    </AppProvider>
  );
}
