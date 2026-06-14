import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radar, Theater, Eye, Bot, Zap,
  Sun, Moon, Flame, ChevronRight, Settings, Menu,
  Activity, Shield, Map, Crosshair, Radio, Briefcase, PanelLeftClose,
  HelpCircle, LifeBuoy, Heart, Sparkles, ChevronDown, Globe,
} from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { GamificationProvider, useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import { getLevelFromXP } from '../data/gamificationData';
import AchievementToast from './AchievementToast';
import MatrixRain, { MatrixColor } from './MatrixRain';
import LiveIntelFeed from './LiveIntelFeed';

interface PerformanceContextType {
  bgColor: MatrixColor;
  setBgColor: (color: MatrixColor) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) return { bgColor: 'white' as MatrixColor, setBgColor: () => {} };
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

// ============ NAV STRUCTURE ============

interface NavSection {
  label: string;
  items: Array<{ to: string; icon: typeof LayoutDashboard; label: string; badge?: string }>;
  moreItems?: Array<{ to: string; icon: typeof LayoutDashboard; label: string }>;
}

const navSections: NavSection[] = [
  {
    label: 'COMMAND',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Command Center' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/intel', icon: Radar, label: 'Intel Hub' },
      { to: '/osint', icon: Globe, label: 'OSINT Arsenal' },
      { to: '/scenarios', icon: Theater, label: 'Scenario Lab' },
      { to: '/agent', icon: Bot, label: 'Agent Discovery' },
      { to: '/playbooks', icon: Briefcase, label: 'Playbooks' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/study', icon: Crosshair, label: 'Study Ops' },
      { to: '/knowledge', icon: Eye, label: 'Knowledge Base' },
      { to: '/cheatsheet', icon: Map, label: 'Quick Ref' },
      { to: '/cram', icon: Zap, label: '24h Cram Mode' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { to: '/help', icon: HelpCircle, label: 'Help & Support' },
      { to: '/feature-request', icon: Sparkles, label: 'Feature Request' },
      { to: '/donate', icon: Heart, label: 'Donate' },
    ],
    moreItems: [
      { to: '/support', icon: LifeBuoy, label: 'Bug Reports' },
      { to: '/my-updates', icon: Radio, label: 'My Updates' },
    ],
  },
];

// ============ SIDEBAR ============

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { state } = useGamification();
  const currentLevel = getLevelFromXP(state.xp);
  const location = useLocation();
  const [supportExpanded, setSupportExpanded] = useState(false);

  const isSupportMoreActive = navSections
    .find(s => s.label === 'SUPPORT')
    ?.moreItems?.some(item => location.pathname.startsWith(item.to)) ?? false;

  return (
    <aside
      className={`${collapsed ? 'w-[52px]' : 'w-56'} fixed lg:sticky inset-y-0 left-0 flex-shrink-0 bg-gray-900 dark:bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-200 h-screen z-50 group/sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 border-b border-gray-800 relative`}>
        <div className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 transition-all`}>
          <Shield className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
        </div>
        {!collapsed && (
          <>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-bold text-white leading-tight tracking-wide">AAISM</div>
              <div className="text-[10px] text-emerald-400 leading-tight">Intelligence Platform</div>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors opacity-0 group-hover/sidebar:opacity-100"
              title="Collapse sidebar"
            aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all shadow-md opacity-0 group-hover/sidebar:opacity-100 z-50"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
        {navSections.map((section, sIdx) => (
          <div key={section.label}>
            {sIdx > 0 && collapsed && (
              <div className="mx-2 my-2 border-t border-gray-800" />
            )}
            {!collapsed && (
              <div className="text-[10px] font-semibold text-gray-500 tracking-widest px-2.5 mb-1 mt-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    end={item.to === '/'}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0 py-2' : 'px-2.5 py-2'} rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              {section.moreItems && !collapsed && (
                <>
                  <button
                    onClick={() => setSupportExpanded(!supportExpanded)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSupportMoreActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <ChevronDown className={`w-[18px] h-[18px] transition-transform ${supportExpanded || isSupportMoreActive ? 'rotate-180' : ''}`} />
                    <span className="truncate text-xs">More</span>
                  </button>
                  {(supportExpanded || isSupportMoreActive) && section.moreItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Level */}
      <div className={`border-t border-gray-800 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
            style={{ backgroundColor: currentLevel.color }}
            title={`Level ${currentLevel.level}: ${currentLevel.title} · ${state.xp} XP`}
          >
            {currentLevel.level}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-medium text-gray-300 truncate">{currentLevel.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>{state.xp.toLocaleString()} XP</span>
                <span className="flex items-center gap-0.5 text-orange-400">
                  <Flame className="w-3 h-3" />{state.currentStreak}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============ TOP BAR ============

function TopBar({
  onToggleIntel,
  intelOpen,
  onToggleMobileNav,
}: {
  onToggleIntel: () => void;
  intelOpen: boolean;
  onToggleMobileNav: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentPage = navSections.flatMap(s => [...s.items, ...(s.moreItems ?? [])]).find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {currentPage?.label || 'AAISM'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleIntel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            intelOpen
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Feed</span>
          <Radio className="w-3 h-3 animate-pulse-dot text-emerald-500" />
        </button>

        <NavLink
          to="/settings"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </NavLink>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-gray-500" /> : <Sun className="w-4 h-4 text-yellow-400" />}
        </button>
      </div>
    </header>
  );
}

// ============ MAIN LAYOUT ============

function LayoutContent() {
  const { theme } = useTheme();
  const { bgColor } = usePerformance();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {theme === 'dark' && <MatrixRain color={bgColor} />}

      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopBar
          onToggleIntel={() => setIntelOpen(!intelOpen)}
          intelOpen={intelOpen}
          onToggleMobileNav={() => setMobileNavOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5">
            <Outlet />
          </main>

          {/* Live Intel Feed sidebar */}
          {intelOpen && (
            <>
              <aside className="hidden xl:block w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden relative z-20 pointer-events-auto">
                <LiveIntelFeed
                  onClose={() => setIntelOpen(false)}
                  showCloseButton
                />
              </aside>
              <div className="xl:hidden fixed inset-0 z-[60] pointer-events-auto">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setIntelOpen(false)}
                  aria-hidden
                />
                <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-in pointer-events-auto">
                  <LiveIntelFeed
                    onClose={() => setIntelOpen(false)}
                    showCloseButton
                  />
                </aside>
              </div>
            </>
          )}
        </div>
      </div>

      <AchievementToast />
    </div>
  );
}

export default function OSINTLayout() {
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
