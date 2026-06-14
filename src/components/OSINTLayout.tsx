import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radar, Theater, Eye, Bot, Zap,
  Sun, Moon, Flame, ChevronRight, Settings, Menu,
  Activity, Map, Crosshair, Radio, Briefcase, PanelLeftClose,
  HelpCircle, LifeBuoy, Heart, Sparkles, ChevronDown, Globe, PenLine,
} from 'lucide-react';
import Logo from './Logo';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { GamificationProvider, useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import { getLevelFromXP } from '../data/gamificationData';
import AchievementToast from './AchievementToast';
import MatrixRain, { MatrixColor } from './MatrixRain';
import LiveIntelFeed from './LiveIntelFeed';
import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';
import OnboardingWizard, { useOnboarding } from './OnboardingWizard';
import PwaInstallBanner from './PwaInstallBanner';
import {
  checkSystemHealth,
  dismissSystemIssue,
  getPrimaryBannerIssue,
  subscribeSystemHealth,
  type SystemHealthReport,
  type SystemIssue,
} from '../services/systemHealthService';
import { startLLMHealthPolling } from '../services/llmHealthService';
import { hasUnseenReleases } from '../data/releaseFeed';

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
      { to: '/studio', icon: PenLine, label: 'Content Studio', badge: 'NEW' },
      { to: '/playbooks', icon: Briefcase, label: 'Playbooks' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/study', icon: Crosshair, label: 'Study Ops' },
      { to: '/exam', icon: Zap, label: 'Timed Exam', badge: 'NEW' },
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
  const [unseenUpdates, setUnseenUpdates] = useState(false);

  useEffect(() => {
    setUnseenUpdates(hasUnseenReleases());
  }, [location.pathname]);

  const isSupportMoreActive = navSections
    .find(s => s.label === 'SUPPORT')
    ?.moreItems?.some(item => location.pathname.startsWith(item.to)) ?? false;

  return (
    <aside
      className={`${collapsed ? 'w-[52px]' : 'w-56'} fixed lg:sticky inset-y-0 left-0 flex-shrink-0 bg-theme-elevated dark:bg-gray-950 border-r border-theme dark:border-gray-800 flex flex-col transition-all duration-200 h-screen z-50 group/sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 border-b border-theme dark:border-gray-800 relative`}>
        <div className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg overflow-hidden flex-shrink-0 shadow-lg shadow-emerald-500/15 transition-all group-hover/sidebar:shadow-emerald-500/25`}>
          <Logo size={collapsed ? 32 : 40} className="transition-transform duration-300 group-hover/sidebar:scale-[1.03]" />
        </div>
        {!collapsed && (
          <>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-bold text-cockpit leading-tight tracking-[0.12em] font-sans">AAISM</div>
              <div className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 leading-tight tracking-wide font-medium">
                Intelligence Platform
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-theme-faint hover:text-theme-secondary dark:hover:text-gray-300 hover:bg-cockpit-track dark:hover:bg-gray-800 transition-colors opacity-0 group-hover/sidebar:opacity-100"
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
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-theme-elevated border border-theme flex items-center justify-center text-theme-muted hover:text-cockpit dark:hover:text-white hover:bg-theme-muted dark:hover:bg-gray-700 transition-all shadow-md opacity-0 group-hover/sidebar:opacity-100 z-50"
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
              <div className="mx-2 my-2 border-t border-theme dark:border-gray-800" />
            )}
            {!collapsed && (
              <div className="text-[10px] font-semibold text-theme-muted tracking-widest px-2.5 mb-1 mt-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                const showUpdateDot = item.to === '/' && unseenUpdates;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    end={item.to === '/'}
                    className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0 py-2' : 'px-2.5 py-2'} rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'text-cockpit-muted hover:text-cockpit dark:hover:text-gray-200 hover:bg-cockpit-track dark:hover:bg-gray-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-theme-muted group-hover:text-theme-secondary dark:group-hover:text-gray-300'}`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && showUpdateDot && !item.badge && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 shrink-0" title="New platform updates" />
                    )}
                    {collapsed && showUpdateDot && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500" title="New platform updates" />
                    )}
                  </NavLink>
                );
              })}
              {section.moreItems && !collapsed && (
                <>
                  <button
                    onClick={() => setSupportExpanded(!supportExpanded)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSupportMoreActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-theme-muted hover:text-theme-secondary dark:hover:text-gray-300 hover:bg-cockpit-track dark:hover:bg-gray-800'
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
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'text-theme-muted hover:text-theme-secondary dark:hover:text-gray-300 hover:bg-cockpit-track dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-theme-faint group-hover:text-cockpit-muted dark:group-hover:text-gray-300'}`} />
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
      <div className={`border-t border-theme dark:border-gray-800 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
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
              <div className="text-xs font-medium text-theme-secondary truncate">{currentLevel.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-theme-muted">
                <span>{state.xp.toLocaleString()} XP</span>
                <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
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
  onOpenSearch,
}: {
  onToggleIntel: () => void;
  intelOpen: boolean;
  onToggleMobileNav: () => void;
  onOpenSearch: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentPage = navSections.flatMap(s => [...s.items, ...(s.moreItems ?? [])]).find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-theme-elevated border-b border-theme flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 rounded-lg hover:bg-cockpit-track transition-colors text-theme-muted"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-sm font-semibold text-theme-secondary dark:text-gray-200">
            {currentPage?.label || 'AAISM'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cockpit-muted bg-cockpit-track hover:text-cockpit dark:hover:text-gray-300 transition-colors"
          title="Search (⌘K)"
        >
          <span>Search</span>
          <kbd className="text-[10px] opacity-60">⌘K</kbd>
        </button>

        <button
          onClick={onToggleIntel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            intelOpen
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-cockpit-track text-theme-muted hover:text-theme-secondary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Feed</span>
          <Radio className="w-3 h-3 animate-pulse-dot text-emerald-500" />
        </button>

        <NavLink
          to="/settings"
          className="p-1.5 rounded-lg hover:bg-cockpit-track transition-colors text-theme-muted"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </NavLink>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-cockpit-track transition-colors"
          aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-theme-muted" /> : <Sun className="w-4 h-4 text-yellow-400" />}
        </button>
      </div>
    </header>
  );
}

// ============ SYSTEM HEALTH BANNER ============

function SystemHealthBanner() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);

  useEffect(() => {
    return subscribeSystemHealth(setReport);
  }, []);

  const issue = getPrimaryBannerIssue(report);
  if (!issue) return null;

  return (
    <SystemIssueBanner
      issue={issue}
      onDismiss={() => {
        dismissSystemIssue(issue.id);
        void checkSystemHealth();
      }}
    />
  );
}

function SystemIssueBanner({ issue, onDismiss }: { issue: SystemIssue; onDismiss: () => void }) {
  const isInfo = issue.severity === 'info';
  const border = isInfo ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-amber-500/30 bg-amber-500/10';
  const titleColor = isInfo ? 'text-cyan-700 dark:text-cyan-400' : 'text-amber-700 dark:text-amber-400';
  const textColor = isInfo ? 'text-cyan-600/80 dark:text-cyan-400/80' : 'text-amber-600/80 dark:text-amber-400/80';

  return (
    <div className={`mx-3 sm:mx-5 mt-2 rounded-lg border ${border} px-4 py-2.5 flex items-start gap-3 animate-fade-in`}>
      <Activity className={`w-4 h-4 shrink-0 mt-0.5 ${isInfo ? 'text-cyan-500' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0 text-xs">
        <span className={`font-semibold ${titleColor}`}>{issue.title}</span>
        <span className={`${textColor} ml-1`}>— {issue.message}</span>
        {issue.fixSteps.length > 0 && (
          <span className={`block ${textColor} mt-0.5 opacity-90`}>
            Fix: {issue.fixSteps.slice(0, 2).join(' · ')}
          </span>
        )}
        {issue.actionRoute && (
          <Link
            to={issue.actionRoute}
            className={`inline-flex items-center gap-1 mt-1.5 font-medium hover:underline ${titleColor}`}
          >
            {issue.actionLabel ?? 'Fix in Settings'}
          </Link>
        )}
      </div>
      {issue.dismissible && (
        <button
          onClick={onDismiss}
          className={`${isInfo ? 'text-cyan-500/60 hover:text-cyan-500' : 'text-amber-500/60 hover:text-amber-500'} text-lg leading-none`}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ============ MAIN LAYOUT ============

function LayoutContent() {
  const { theme } = useTheme();
  const { bgColor } = usePerformance();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOnboarding, dismissOnboarding] = useOnboarding();

  useGlobalSearchShortcut(() => setSearchOpen(true));

  useEffect(() => {
    void checkSystemHealth();
    return startLLMHealthPolling();
  }, []);

  return (
    <div className="flex h-screen bg-theme-muted relative overflow-hidden">
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
          onOpenSearch={() => setSearchOpen(true)}
        />

        <SystemHealthBanner />

        <PwaInstallBanner />

        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5">
            <Outlet />
          </main>

          {/* Live Intel Feed sidebar */}
          {intelOpen && (
            <>
              <aside className="hidden xl:block w-80 flex-shrink-0 bg-theme-elevated border-l border-theme overflow-hidden relative z-20 pointer-events-auto">
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
                <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-theme-elevated border-l border-theme overflow-hidden animate-slide-in pointer-events-auto">
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
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      {showOnboarding && <OnboardingWizard onComplete={dismissOnboarding} />}
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
