import {
  checkLLMHealth,
  getFixSteps,
  getLastHealthReport,
  type LLMHealthReport,
} from './llmHealthService';
import {
  getEffectiveStripeUrl,
  getEffectiveRazorpayUrl,
  isSupabaseConfigured,
  testSupabaseConnection,
} from './integrationsConfigService';
import { getSyncMeta } from './syncService';

export type SystemIssueId =
  | 'ollama-offline'
  | 'groq-unavailable'
  | 'sync-error'
  | 'payment-missing'
  | 'supabase-unreachable';

export type SystemIssueSeverity = 'info' | 'warning' | 'error';

export interface SystemIssue {
  id: SystemIssueId;
  severity: SystemIssueSeverity;
  title: string;
  message: string;
  fixSteps: string[];
  dismissible: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

const DISMISS_KEY = 'aaism-system-issues-dismissed';

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function dismissSystemIssue(id: SystemIssueId): void {
  const dismissed = getDismissedIds();
  dismissed.add(id);
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed]));
}

/** Clear a dismissed issue when the underlying problem is resolved (e.g. Ollama back online). */
export function clearDismissedIssue(id: SystemIssueId): void {
  const dismissed = getDismissedIds();
  if (!dismissed.has(id)) return;
  dismissed.delete(id);
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed]));
}

export function isIssueDismissed(id: SystemIssueId): boolean {
  return getDismissedIds().has(id);
}

function issuesFromLLM(report: LLMHealthReport | null): SystemIssue[] {
  if (!report || report.overallHealthy) return [];

  const active = report.providers[report.activeProvider];
  const steps = getFixSteps(report);
  const isOllama = report.activeProvider === 'ollama';

  return [
    {
      id: isOllama ? 'ollama-offline' : 'groq-unavailable',
      severity: 'warning',
      title: isOllama ? 'Ollama offline' : 'LLM provider unavailable',
      message: active?.message ?? 'AI features may be limited until the provider is ready.',
      fixSteps: steps.length > 0 ? steps : ['Open Settings → AI Provider and configure a provider'],
      dismissible: true,
      actionRoute: '/settings',
      actionLabel: 'Open Settings',
    },
  ];
}

function paymentIssue(): SystemIssue | null {
  if (hasAnyPaymentConfigured()) return null;

  return {
    id: 'payment-missing',
    severity: 'info',
    title: 'Payments not configured',
    message: 'Stripe/Razorpay checkout URLs are not set — donations use placeholder links.',
    fixSteps: [
      'Open Settings → Integrations',
      'Add Stripe hosted checkout URL and/or Razorpay payment link',
      'Only hosted URLs — never secret keys',
    ],
    dismissible: true,
    actionRoute: '/settings',
    actionLabel: 'Configure payments',
  };
}

function hasAnyPaymentConfigured(): boolean {
  return Boolean(getEffectiveStripeUrl() || getEffectiveRazorpayUrl());
}

let lastSyncError: string | null = null;

export function reportSyncError(message: string): void {
  lastSyncError = message;
}

export function clearSyncError(): void {
  lastSyncError = null;
}

function syncIssue(): SystemIssue | null {
  if (!lastSyncError) return null;
  return {
    id: 'sync-error',
    severity: 'warning',
    title: 'Cloud sync failed',
    message: lastSyncError,
    fixSteps: [
      'Check Supabase URL and anon key in Settings → Integrations',
      'Click "Test sync connection"',
      'Ensure you are signed in before push/pull',
    ],
    dismissible: true,
    actionRoute: '/settings',
    actionLabel: 'Fix sync',
  };
}

export interface SystemHealthReport {
  issues: SystemIssue[];
  llm: LLMHealthReport | null;
  supabaseConfigured: boolean;
  paymentsConfigured: boolean;
  lastSyncAt: string | null;
  checkedAt: string;
}

let lastReport: SystemHealthReport | null = null;
const listeners = new Set<(report: SystemHealthReport) => void>();

export async function checkSystemHealth(): Promise<SystemHealthReport> {
  const llm = await checkLLMHealth();

  if (llm?.overallHealthy && llm.activeProvider === 'ollama') {
    clearDismissedIssue('ollama-offline');
  }

  const issues: SystemIssue[] = [
    ...issuesFromLLM(llm),
    ...([syncIssue(), paymentIssue()].filter(Boolean) as SystemIssue[]),
  ];

  if (isSupabaseConfigured()) {
    const test = await testSupabaseConnection();
    if (!test.ok) {
      issues.push({
        id: 'supabase-unreachable',
        severity: 'warning',
        title: 'Supabase unreachable',
        message: test.message,
        fixSteps: [
          'Verify project URL in Settings → Integrations',
          'Use the anon (public) key, not service role',
          'Check network / project status in Supabase dashboard',
        ],
        dismissible: true,
        actionRoute: '/settings',
        actionLabel: 'Check config',
      });
    }
  }

  const meta = getSyncMeta();
  const report: SystemHealthReport = {
    issues: issues.filter(i => !isIssueDismissed(i.id)),
    llm,
    supabaseConfigured: isSupabaseConfigured(),
    paymentsConfigured: hasAnyPaymentConfigured(),
    lastSyncAt: meta.lastPushAt ?? meta.lastPullAt,
    checkedAt: new Date().toISOString(),
  };

  lastReport = report;
  listeners.forEach(fn => fn(report));
  return report;
}

export function getLastSystemHealth(): SystemHealthReport | null {
  if (lastReport) return lastReport;
  const llm = getLastHealthReport();
  if (!llm) return null;
  return {
    issues: issuesFromLLM(llm),
    llm,
    supabaseConfigured: isSupabaseConfigured(),
    paymentsConfigured: hasAnyPaymentConfigured(),
    lastSyncAt: getSyncMeta().lastPushAt,
    checkedAt: new Date().toISOString(),
  };
}

export function subscribeSystemHealth(listener: (report: SystemHealthReport) => void): () => void {
  listeners.add(listener);
  const cached = getLastSystemHealth();
  if (cached) listener(cached);
  return () => listeners.delete(listener);
}

export function getPrimaryBannerIssue(report: SystemHealthReport | null): SystemIssue | null {
  if (!report || report.issues.length === 0) return null;
  const priority: SystemIssueId[] = [
    'ollama-offline',
    'groq-unavailable',
    'supabase-unreachable',
    'sync-error',
    'payment-missing',
  ];
  for (const id of priority) {
    const issue = report.issues.find(i => i.id === id);
    if (issue) return issue;
  }
  return report.issues[0];
}
