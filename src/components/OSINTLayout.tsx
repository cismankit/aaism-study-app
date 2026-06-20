import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radar, Eye, Bot, Zap,
  Sun, Moon, Flame, ChevronRight, ChevronLeft, Settings, Menu,
  Activity, Map, Crosshair, PanelLeftClose,
  Terminal, Users, Target, Briefcase, Focus, Octagon,
} from 'lucide-react';
import Logo from './Logo';
import CertSwitcher from './CertSwitcher';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { CertProvider, useCert } from '../context/CertContext';
import { GamificationProvider, useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import { getLevelFromXP } from '../data/gamificationData';
import AchievementToast from './AchievementToast';
import AutoConfigToast from './AutoConfigToast';
import MatrixRain, { MatrixColor } from './MatrixRain';
import LiveIntelFeed from './LiveIntelFeed';
import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';
import OnboardingWizard, { useOnboarding } from './OnboardingWizard';
import PwaInstallBanner from './PwaInstallBanner';
import {
  checkSystemHealth,
  dismissSystemIssue,
  getConnectedBannerMessage,
  getPrimaryBannerIssue,
  startSystemHealthPolling,
  subscribeSystemHealth,
  type SystemHealthReport,
  type SystemIssue,
} from '../services/systemHealthService';
import { isAIReady, subscribeLLMHealth } from '../services/llmHealthService';
import { hasUnseenReleases } from '../data/releaseFeed';
import SidebarJourneyHint from './SidebarJourneyHint';
import FocusContextBar from './FocusContextBar';
import { useSidebarDock } from '../hooks/useSidebarDock';
import { useSessionContext } from '../hooks/useSessionContext';
import { getNextBestAction } from '../services/sidebarJourneyService';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../constants/platformBrand';
import { isFeatureUnlocked, type GatedFeatureId } from '../services/productTierService';
import { isJobSeekerModeEnabled } from '../services/integrationsConfigService';
import {
  engageKillSwitch,
  releaseKillSwitch,
  subscribeKillSwitch,
  type KillSwitchState,
} from '../services/killSwitchService';

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

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  shortLabel: string;
  subtitle: string;
  whyOpen: string;
  badge?: string;
  gatedFeature?: GatedFeatureId;
  jobSeekerOnly?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  secondary?: boolean;
}

const navSections: NavSection[] = [
  {
    id: 'path',
    label: 'Your path',
    items: [
      {
        to: '/',
        icon: Target,
        label: 'Mission',
        shortLabel: 'Home',
        subtitle: 'Learn · 25-min daily loop',
        whyOpen: 'Read → quiz → lab → intel in one guided flow',
        badge: 'Start here',
      },
      {
        to: '/command',
        icon: LayoutDashboard,
        label: 'Command',
        shortLabel: 'Command',
        subtitle: 'Learn · Work · Earn overview',
        whyOpen: 'Readiness HUD, streak, and your full ops picture',
      },
      {
        to: '/study',
        icon: Crosshair,
        label: 'Practice',
        shortLabel: 'Drill',
        subtitle: 'Work · Questions by domain',
        whyOpen: 'Build recall where it matters — domain drills',
      },
      {
        to: '/exam',
        icon: Zap,
        label: 'Exam',
        shortLabel: 'Exam',
        subtitle: 'Earn · Timed simulation',
        whyOpen: 'Test pacing and judgment under exam conditions',
      },
      {
        to: '/intel',
        icon: Radar,
        label: 'Intel',
        shortLabel: 'Intel',
        subtitle: 'Work · Live threat feeds',
        whyOpen: 'Stay sharp on traps and real-world context',
      },
      {
        to: '/knowledge',
        icon: Eye,
        label: 'Knowledge',
        shortLabel: 'Learn',
        subtitle: 'Learn · Deep reference docs',
        whyOpen: 'Fill gaps with guides and frameworks',
      },
      {
        to: '/agent',
        icon: Bot,
        label: 'Agent',
        shortLabel: 'Agent',
        subtitle: 'Work · Gap analysis & ops',
        whyOpen: 'Ask, explore, and automate study workflows',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Explore',
    secondary: true,
    items: [
      {
        to: '/packs',
        icon: Users,
        label: 'Team Packs',
        shortLabel: 'Packs',
        subtitle: 'Agent missions & workflows',
        whyOpen: 'Multi-agent ops playbooks for cert scenarios',
        gatedFeature: 'team-packs',
      },
      {
        to: '/ops',
        icon: Terminal,
        label: 'Ops Lab',
        shortLabel: 'Ops',
        subtitle: 'Work · Hands-on command drills',
        whyOpen: 'Practice analysis and response in the lab',
      },
      {
        to: '/cheatsheet',
        icon: Map,
        label: 'Quick Ref',
        shortLabel: 'Ref',
        subtitle: 'Cert-aware cheat sheets',
        whyOpen: 'Fast lookup during study or on exam day',
      },
      {
        to: '/career',
        icon: Briefcase,
        label: 'Career',
        shortLabel: 'Jobs',
        subtitle: 'Earn · Job seeker OSINT',
        whyOpen: 'Map skills to roles with public career intel',
        jobSeekerOnly: true,
      },
    ],
  },
];

const SIDEBAR_SESSION_KEY = 'aaism-sidebar-open';

function isNavRouteActive(pathname: string, to: string): boolean {
  if (to === '/') {
    return pathname === '/' || pathname === '/mission';
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function readSidebarCollapsed(): boolean {
  const stored = sessionStorage.getItem(SIDEBAR_SESSION_KEY);
  if (stored === 'true') return false;
  return true;
}

function SidebarUserCluster({
  collapsed,
  onCloseMobile,
}: {
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const { state } = useGamification();
  const { activeCert, activeCertId } = useCert();
  const { theme, toggleTheme } = useTheme();
  const currentLevel = getLevelFromXP(state.xp);
  const { sessionMinutes, focusLabel, focusMode, toggleFocusMode, sessionProgress } =
    useSessionContext(activeCertId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeLLMHealth(report => setAiReady(isAIReady(report))), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const formatSessionTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div
      ref={menuRef}
      className={`sidebar-user-cluster relative border-t border-sidebar/70 shrink-0 ${collapsed ? 'px-1 py-2' : 'p-2'}`}
      style={{ borderTopColor: `${activeCert.color}33` }}
    >
      <button
        type="button"
        onClick={() => setMenuOpen(open => !open)}
        className={`sidebar-user-trigger w-full flex items-center rounded-lg transition-colors hover:bg-cockpit-track/80 dark:hover:bg-gray-800/80 ${
          collapsed ? 'py-2 justify-center' : 'gap-2.5 px-2 py-2'
        } ${menuOpen ? 'bg-cockpit-track/80 dark:bg-gray-800/80' : ''}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title="Account, settings, and session"
      >
        <div className="relative shrink-0 w-7 h-7 flex items-center justify-center">
          <SessionRing progress={sessionProgress} color={activeCert.color} />
          <div
            className="absolute w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px]"
            style={{
              backgroundColor: currentLevel.color,
              boxShadow: `0 0 0 1px rgb(var(--sidebar-bg)), 0 0 0 2px ${activeCert.color}66`,
            }}
          >
            {currentLevel.level}
          </div>
        </div>
        {!collapsed && (
          <>
            <div className="sidebar-label overflow-hidden flex-1 min-w-0 text-left">
              <div className="text-xs font-medium text-theme-secondary truncate">{currentLevel.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-theme-muted">
                <span>{state.xp.toLocaleString()} XP</span>
                <span className="flex items-center gap-0.5 font-medium" style={{ color: activeCert.color }}>
                  <Flame className="w-3 h-3" />
                  {state.currentStreak}
                </span>
              </div>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 text-theme-faint shrink-0 transition-transform ${menuOpen ? 'rotate-90' : ''}`}
            />
          </>
        )}
        {collapsed && (
          <span
            className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-sidebar ${aiReady ? '' : 'hidden'}`}
            title="AI connected"
            aria-hidden
          />
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={`sidebar-user-menu ${collapsed ? 'sidebar-user-menu-collapsed' : ''}`}
        >
          <div className="px-3 py-2 border-b border-sidebar/60">
            <div className="text-xs font-semibold text-theme-secondary">{currentLevel.title}</div>
            <div className="text-[10px] text-theme-muted mt-0.5">
              Level {currentLevel.level} · {state.xp.toLocaleString()} XP · {state.currentStreak} day streak
            </div>
          </div>

          <div className="px-3 py-2 border-b border-sidebar/60 text-[10px] text-theme-muted">
            <div className="font-medium text-theme-secondary">Session {formatSessionTime(sessionMinutes)}</div>
            <div className="truncate mt-0.5" style={{ color: activeCert.color }}>{focusLabel}</div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleFocusMode();
            }}
            className="sidebar-user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs text-theme-secondary hover:bg-cockpit-track dark:hover:bg-gray-800"
          >
            <Focus className={`w-3.5 h-3.5 ${focusMode ? 'text-emerald-500' : 'text-theme-muted'}`} />
            <span>{focusMode ? 'Focus mode on' : 'Focus mode off'}</span>
          </button>

          <NavLink
            to="/settings"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onCloseMobile();
            }}
            className="sidebar-user-menu-item flex items-center gap-2.5 px-3 py-2 text-xs text-theme-secondary hover:bg-cockpit-track dark:hover:bg-gray-800"
          >
            <Settings className="w-3.5 h-3.5 text-theme-muted" />
            <span>Settings</span>
            {aiReady && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />}
          </NavLink>

          <button
            type="button"
            role="menuitem"
            onClick={() => toggleTheme()}
            className="sidebar-user-menu-item w-full flex items-center gap-2.5 px-3 py-2 text-xs text-theme-secondary hover:bg-cockpit-track dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-theme-muted" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SessionRing({ progress, color }: { progress: number; color: string }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgb(var(--sidebar-border))" strokeWidth="2" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 12 12)"
        className="sidebar-session-ring-fill"
      />
    </svg>
  );
}

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
  const { activeCert, activeCertId } = useCert();
  const location = useLocation();
  const [unseenUpdates, setUnseenUpdates] = useState(false);
  const { focusMode } = useSessionContext(activeCertId);

  const nextAction = getNextBestAction(activeCertId);
  const nextActionPath = nextAction.to.split('?')[0];
  const jobSeekerMode = isJobSeekerModeEnabled();

  const visibleSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.jobSeekerOnly && !jobSeekerMode) return false;
      if (item.gatedFeature && !isFeatureUnlocked(item.gatedFeature)) return false;
      return true;
    }),
  })).filter(section => section.items.length > 0);

  useEffect(() => {
    setUnseenUpdates(hasUnseenReleases());
  }, [location.pathname]);

  const { getDockStyle, dockHandlers, navRef } = useSidebarDock(collapsed, location.pathname);

  const isNavItemActive = (to: string) => isNavRouteActive(location.pathname, to);

  const activeSection = visibleSections.find(section =>
    section.items.some(item => isNavItemActive(item.to)),
  );

  return (
    <aside
      className={`sidebar-panel sidebar-panel-seamless ${collapsed ? 'sidebar-collapsed' : 'w-56'} fixed lg:sticky inset-y-0 left-0 flex-shrink-0 bg-sidebar flex flex-col h-screen z-50 group/sidebar ${mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:opacity-100'} lg:translate-x-0 ${focusMode ? 'sidebar-focus-mode' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="sidebar-edge-toggle"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Brand + cert track */}
      <div className={`sidebar-brand-header flex flex-col ${collapsed ? 'items-center px-1.5 py-3' : 'px-3 py-3'} relative shrink-0`}>
        <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          {collapsed ? (
            <CertSwitcher rail integrated>
              <div
                className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-lg transition-all"
                style={{ boxShadow: `0 4px 14px ${activeCert.color}22` }}
              >
                <Logo size={36} className="transition-transform duration-300 group-hover/sidebar:scale-[1.03]" />
              </div>
            </CertSwitcher>
          ) : (
            <>
              <div
                className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-lg transition-all"
                style={{ boxShadow: `0 4px 14px ${activeCert.color}22` }}
              >
                <Logo size={36} className="transition-transform duration-300 group-hover/sidebar:scale-[1.03]" />
              </div>
              <div className="sidebar-label overflow-hidden flex-1 min-w-0">
                <div className="text-sm font-bold text-cockpit leading-tight tracking-[0.08em] font-sans">
                  {PLATFORM_NAME}
                </div>
                <div className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 leading-tight tracking-wide font-medium truncate">
                  {PLATFORM_TAGLINE}
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-1 rounded-md text-theme-faint hover:text-theme-secondary dark:hover:text-gray-300 hover:bg-cockpit-track dark:hover:bg-gray-800 transition-colors opacity-0 group-hover/sidebar:opacity-100 shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {!collapsed && (
          <div className="sidebar-label mt-2 w-full">
            <CertSwitcher integrated />
          </div>
        )}
      </div>

      {/* Wayfinding — active section when expanded */}
      {!collapsed && activeSection && (
        <div className="sidebar-wayfinding px-3 py-1.5 text-[11px] text-theme-muted border-b border-sidebar/60">
          <span className="text-theme-faint">You are in</span>{' '}
          <span className="font-medium text-theme-secondary">{activeSection.label}</span>
          <span className="text-theme-faint mx-1">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {navSections.flatMap(s => s.items).find(item =>
              isNavRouteActive(location.pathname, item.to),
            )?.label}
          </span>
        </div>
      )}

      {/* Nav sections */}
      <nav ref={navRef} className="sidebar-dock-nav flex-1 min-h-0 py-2 px-1 space-y-1" {...dockHandlers}>
        {visibleSections.map((section, sIdx) => (
          <div
            key={section.id}
            className={`sidebar-nav-section ${section.secondary ? 'sidebar-nav-secondary' : ''}`}
            data-section={section.id}
          >
            {sIdx > 0 && (
              <div className={`${collapsed ? 'mx-2 my-1' : 'mx-2 my-2'} border-t border-sidebar/70`} />
            )}
            {!collapsed && (
              <div className="sidebar-section-label text-[10px] font-medium text-theme-muted tracking-wide px-2.5 mb-1 mt-2">
                {section.label}
              </div>
            )}
            <div className={`space-y-0.5 ${collapsed ? 'sidebar-dock-items' : ''}`}>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.to);
                const showUpdateDot = item.to === '/command' && unseenUpdates && !collapsed;
                const isNextAction = nextActionPath === item.to && !isActive && !collapsed;
                const dockStyle = collapsed ? getDockStyle(item.to) : undefined;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    end={item.to === '/' || item.to === '/command'}
                    data-dock-item={collapsed ? item.to : undefined}
                    data-dock-active={collapsed ? String(isActive) : undefined}
                    title={collapsed ? `${item.label} — ${item.subtitle}` : item.whyOpen}
                    className={`sidebar-dock-item relative flex items-center ${collapsed ? 'justify-center py-1.5' : 'gap-3 px-2.5 py-2'} rounded-lg text-sm font-medium group ${
                      isActive
                        ? 'bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 sidebar-dock-active'
                        : 'text-cockpit-muted hover:text-cockpit dark:hover:text-gray-200 hover:bg-cockpit-track/80 dark:hover:bg-gray-800/80'
                    } ${item.to === '/' ? 'sidebar-home-nav' : ''}`}
                  >
                    <span
                      className={`sidebar-dock-icon-wrap inline-flex items-center justify-center ${collapsed ? 'origin-bottom' : ''}`}
                      style={dockStyle}
                    >
                      <Icon className={`${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'} flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-theme-muted group-hover:text-theme-secondary dark:group-hover:text-gray-300'}`} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-label truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && showUpdateDot && !item.badge && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 shrink-0" title="New platform updates" />
                    )}
                    {isNextAction && (
                      <span
                        className="ml-auto w-2 h-2 rounded-full bg-emerald-500 sidebar-next-action-dot shrink-0"
                        title={`Suggested next: ${nextAction.label}`}
                      />
                    )}
                    {collapsed && (
                      <div className="sidebar-dock-tooltip" role="tooltip">
                        <span className="sidebar-dock-tooltip-section">{section.label}</span>
                        <span className="sidebar-dock-tooltip-title">{item.label}</span>
                        <span className="sidebar-dock-tooltip-sub">{item.subtitle}</span>
                        <span className="sidebar-dock-tooltip-why">{item.whyOpen}</span>
                        {item.badge && (
                          <span className="sidebar-dock-tooltip-badge">{item.badge}</span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <SidebarUserCluster collapsed={collapsed} onCloseMobile={onCloseMobile} />
    </aside>
  );
}

// ============ KILL SWITCH ============

function KillSwitchBanner() {
  const [state, setState] = useState<KillSwitchState>({ active: false });

  useEffect(() => subscribeKillSwitch(setState), []);

  if (!state.active) return null;

  const handleRelease = () => {
    const ok = window.confirm(
      'Release the emergency kill switch and resume all AI actions?\n\nConfirm you intentionally want to re-enable agent runs.',
    );
    if (ok) releaseKillSwitch(true);
  };

  return (
    <div
      role="alert"
      className="w-full bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shrink-0 animate-fade-in"
    >
      <Octagon className="w-4 h-4 shrink-0" aria-hidden />
      <span>
        All AI actions halted
        {state.reason ? ` — ${state.reason}` : ''}
      </span>
      <button
        type="button"
        onClick={handleRelease}
        className="ml-2 px-3 py-0.5 rounded bg-white/20 hover:bg-white/30 underline-offset-2 hover:underline transition-colors"
      >
        Release
      </button>
    </div>
  );
}

function EmergencyStopButton() {
  const [active, setActive] = useState(false);

  useEffect(() => subscribeKillSwitch(s => setActive(s.active)), []);

  const handleEngage = () => {
    if (active) return;
    const ok = window.confirm(
      'EMERGENCY STOP — halt ALL in-flight AI agent runs immediately?\n\nThis blocks new AI calls until you release the kill switch.',
    );
    if (ok) engageKillSwitch('Manual emergency stop');
  };

  return (
    <button
      type="button"
      onClick={handleEngage}
      disabled={active}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-red-900/40 text-red-300 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30'
      }`}
      title={active ? 'Kill switch active' : 'Emergency stop — halt all AI (⌘⇧.)'}
      aria-label="Emergency stop — halt all AI actions"
    >
      <Octagon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">EMERGENCY STOP</span>
    </button>
  );
}

function useKillSwitchShortcuts(onEngage: () => void) {
  const lastEscRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
        e.preventDefault();
        onEngage();
        return;
      }
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscRef.current < 500) {
          e.preventDefault();
          onEngage();
        }
        lastEscRef.current = now;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onEngage]);
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
  const location = useLocation();
  const [hasUnseen, setHasUnseen] = useState(false);
  const [killActive, setKillActive] = useState(false);

  useEffect(() => {
    setHasUnseen(hasUnseenReleases());
  }, [location.pathname]);

  useEffect(() => subscribeKillSwitch(s => setKillActive(s.active)), []);

  const handleEmergencyEngage = useCallback(() => {
    if (killActive) return;
    const ok = window.confirm(
      'EMERGENCY STOP — halt ALL in-flight AI agent runs immediately?\n\nThis blocks new AI calls until you release the kill switch.',
    );
    if (ok) engageKillSwitch('Manual emergency stop');
  }, [killActive]);

  useKillSwitchShortcuts(handleEmergencyEngage);

  const currentPage = navSections.flatMap(s => s.items).find(item =>
    isNavRouteActive(location.pathname, item.to),
  );

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-theme-elevated/95 backdrop-blur-sm border-b border-theme/80 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 rounded-lg hover:bg-cockpit-track transition-colors text-theme-muted"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-emerald-500 ${hasUnseen ? 'animate-pulse-dot' : ''}`} />
          <span className="text-sm font-semibold text-theme-secondary dark:text-gray-200">
            {currentPage?.label || PLATFORM_NAME}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <EmergencyStopButton />

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
  const connectedMessage = getConnectedBannerMessage(report);

  if (connectedMessage) {
    return (
      <div className="mx-3 sm:mx-5 mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 flex items-center gap-3 animate-fade-in">
        <span className="text-sm leading-none" aria-hidden>🟢</span>
        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{connectedMessage}</p>
      </div>
    );
  }

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [intelOpen, setIntelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOnboarding, dismissOnboarding] = useOnboarding();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      sessionStorage.setItem(SIDEBAR_SESSION_KEY, next ? 'false' : 'true');
      return next;
    });
  };

  useGlobalSearchShortcut(() => setSearchOpen(true));

  useEffect(() => {
    return startSystemHealthPolling();
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
        onToggle={handleSidebarToggle}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <SidebarJourneyHint collapsed={sidebarCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 sidebar-content-canvas">
        <TopBar
          onToggleIntel={() => setIntelOpen(!intelOpen)}
          intelOpen={intelOpen}
          onToggleMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <KillSwitchBanner />

        <SystemHealthBanner />

        <PwaInstallBanner />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-3 sm:p-5">
            <FocusContextBar />
            <Outlet />
          </main>

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
      <AutoConfigToast />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      {showOnboarding && <OnboardingWizard onComplete={dismissOnboarding} />}
    </div>
  );
}

export default function OSINTLayout() {
  return (
    <CertProvider>
      <AppProvider>
        <GamificationProvider>
          <PerformanceProvider>
            <LayoutContent />
          </PerformanceProvider>
        </GamificationProvider>
      </AppProvider>
    </CertProvider>
  );
}
