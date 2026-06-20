import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud, CreditCard, Shield, CheckCircle2, XCircle, Loader2, ExternalLink, Settings,
} from 'lucide-react';
import {
  loadIntegrationsConfig,
  saveIntegrationsConfig,
  sanitizeIntegrationsConfig,
  validateCheckoutUrl,
  testSupabaseConnection,
  isSupabaseConfigured,
  getEffectiveStripeUrl,
  getEffectiveRazorpayUrl,
  type IntegrationsConfig,
} from '../services/integrationsConfigService';
import { checkSystemHealth, type SystemHealthReport } from '../services/systemHealthService';

type SyncStatus = 'connected' | 'not-configured' | 'failed' | 'checking';

function StatusBadge({ status, label }: { status: SyncStatus; label: string }) {
  const styles: Record<SyncStatus, string> = {
    connected: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    'not-configured': 'bg-cockpit-track text-cockpit-muted border-theme',
    failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
    checking: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}

export default function IntegrationsSettings() {
  const [config, setConfig] = useState<IntegrationsConfig>(() => loadIntegrationsConfig());
  const [saved, setSaved] = useState(false);
  const [rejections, setRejections] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured() ? 'connected' : 'not-configured',
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [stripeTest, setStripeTest] = useState<string | null>(null);
  const [razorpayTest, setRazorpayTest] = useState<string | null>(null);
  const [healthIssues, setHealthIssues] = useState<SystemHealthReport | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void checkSystemHealth().then(setHealthIssues);
  }, [config]);

  function handleSave() {
    const { config: clean, rejected } = sanitizeIntegrationsConfig(config);
    setRejections(rejected);
    if (rejected.length > 0) return;
    saveIntegrationsConfig(clean);
    setConfig(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSyncStatus(isSupabaseConfigured() ? 'connected' : 'not-configured');
  }

  async function handleTestSync() {
    setTesting(true);
    setSyncStatus('checking');
    setSyncMessage(null);
    const result = await testSupabaseConnection(config.supabaseUrl, config.supabaseAnonKey);
    setSyncMessage(result.message);
    setSyncStatus(result.ok ? 'connected' : 'failed');
    setTesting(false);
  }

  function handleValidateStripe() {
    const url = config.stripeCheckoutUrl ?? '';
    const result = validateCheckoutUrl(url, 'stripe');
    setStripeTest(result.message);
  }

  function handleValidateRazorpay() {
    const url = config.razorpayPaymentLink ?? '';
    const result = validateCheckoutUrl(url, 'razorpay');
    setRazorpayTest(result.message);
  }

  const inputClass =
    'w-full px-3 py-2 border border-theme rounded-lg bg-theme-page text-cockpit focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono';

  const inlineIssues = healthIssues?.issues.filter(i =>
    ['supabase-unreachable', 'sync-error', 'payment-missing'].includes(i.id),
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* Profile / job seeker */}
      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        <h3 className="font-semibold text-cockpit mb-2">Profile preferences</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.jobSeekerMode === true}
            onChange={e => setConfig({ ...config, jobSeekerMode: e.target.checked })}
            className="mt-1 rounded border-theme text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <span className="text-sm font-medium text-cockpit">Job seeker mode</span>
            <p className="text-xs text-cockpit-muted mt-0.5">
              Show Career Intel on Command Center and suggest study missions aligned with target roles.
              Career research uses public pasted data only — no automated profile scraping.
            </p>
          </div>
        </label>
      </div>

      {/* Security callout */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-cockpit">Security — what stays safe in your browser</p>
            <ul className="space-y-1 text-xs text-cockpit-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cockpit">Safe:</strong> hosted checkout URLs (buy.stripe.com, razorpay.me),
                  Stripe publishable key, Razorpay key_id
                </span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cockpit">Never enter:</strong> Stripe secret key (sk_…), Razorpay key_secret,
                  webhook signing secrets, Supabase service role key
                </span>
              </li>
            </ul>
            <p className="text-xs text-cockpit-subtle pt-1 border-t border-theme">
              Your config stays in this browser only — stored in localStorage, not uploaded to GitHub or shared with
              other users. The public repo never contains your payment or sync settings.
            </p>
          </div>
        </div>
      </div>

      {inlineIssues.length > 0 && (
        <div className="space-y-2">
          {inlineIssues.map(issue => (
            <div
              key={issue.id}
              className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs"
            >
              <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">{issue.title}</p>
                <p className="text-amber-700/80 dark:text-amber-400/80 mt-0.5">{issue.message}</p>
                {issue.fixSteps.length > 0 && (
                  <ol className="mt-1.5 list-decimal list-inside text-amber-600/70 dark:text-amber-400/70 space-y-0.5">
                    {issue.fixSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cloud Sync */}
      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-cockpit flex items-center gap-2">
            <Cloud size={18} className="text-accent-cyan" />
            Cloud Sync (Supabase)
          </h3>
          <StatusBadge
            status={syncStatus}
            label={
              syncStatus === 'connected'
                ? 'Connected'
                : syncStatus === 'failed'
                  ? 'Sync failed'
                  : syncStatus === 'checking'
                    ? 'Checking…'
                    : 'Not configured'
            }
          />
        </div>
        <p className="text-sm text-cockpit-muted mb-4">
          Optional Supabase project for cross-device progress sync. Overrides{' '}
          <code className="text-[10px]">VITE_SUPABASE_*</code> env vars when set here.
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="supabase-url" className="block text-sm text-theme-secondary mb-1">
              Supabase URL
            </label>
            <input
              id="supabase-url"
              type="url"
              value={config.supabaseUrl ?? ''}
              onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
              placeholder="https://your-project.supabase.co"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="supabase-anon" className="block text-sm text-theme-secondary mb-1">
              Supabase anon key (public)
            </label>
            <input
              id="supabase-anon"
              type="password"
              value={config.supabaseAnonKey ?? ''}
              onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIs…"
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestSync}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cockpit-track text-cockpit rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 border border-theme"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
              Test sync connection
            </button>
          </div>
          {syncMessage && (
            <p className={`text-xs ${syncStatus === 'connected' ? 'text-emerald-600' : 'text-red-600'}`}>
              {syncMessage}
            </p>
          )}
        </div>
      </div>

      {/* Payments */}
      <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-cockpit flex items-center gap-2">
            <CreditCard size={18} className="text-amber-500" />
            Payments
          </h3>
          {(getEffectiveStripeUrl() || getEffectiveRazorpayUrl()) && (
            <StatusBadge status="connected" label="Configured" />
          )}
        </div>
        <p className="text-sm text-cockpit-muted mb-4">
          Hosted checkout links for donations. Overrides <code className="text-[10px]">VITE_DONATE_*</code> env vars.
          See{' '}
          <a
            href="https://github.com/cismankit/aaism-study-app/blob/main/PAYMENTS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-emerald hover:underline inline-flex items-center gap-0.5"
          >
            PAYMENTS.md <ExternalLink className="w-3 h-3" />
          </a>
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="stripe-url" className="block text-sm text-theme-secondary mb-1">
              Stripe hosted checkout URL
            </label>
            <input
              id="stripe-url"
              type="url"
              value={config.stripeCheckoutUrl ?? ''}
              onChange={e => setConfig({ ...config, stripeCheckoutUrl: e.target.value })}
              placeholder="https://buy.stripe.com/…"
              className={inputClass}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleValidateStripe}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
              >
                Validate checkout URL format
              </button>
              {stripeTest && (
                <span className={`text-xs ${stripeTest.includes('Valid') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stripeTest}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="razorpay-url" className="block text-sm text-theme-secondary mb-1">
              Razorpay payment link
            </label>
            <input
              id="razorpay-url"
              type="url"
              value={config.razorpayPaymentLink ?? ''}
              onChange={e => setConfig({ ...config, razorpayPaymentLink: e.target.value })}
              placeholder="https://razorpay.me/@yourname"
              className={inputClass}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleValidateRazorpay}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
              >
                Validate checkout URL format
              </button>
              {razorpayTest && (
                <span className={`text-xs ${razorpayTest.includes('Valid') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {razorpayTest}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="razorpay-key-id" className="block text-sm text-theme-secondary mb-1">
              Razorpay key_id (optional, publishable only)
            </label>
            <input
              id="razorpay-key-id"
              type="text"
              value={config.razorpayKeyId ?? ''}
              onChange={e => setConfig({ ...config, razorpayKeyId: e.target.value })}
              placeholder="rzp_live_… or rzp_test_…"
              autoComplete="off"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {rejections.length > 0 && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-400 space-y-1">
          {rejections.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        className={`w-full py-2.5 rounded-lg font-medium transition-all ${
          saved ? 'bg-emerald-500 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
      >
        {saved ? '✓ Integrations saved' : 'Save integrations'}
      </button>

      <p className="text-xs text-cockpit-subtle text-center">
        After saving, visit{' '}
        <Link to="/donate" className="text-accent-emerald hover:underline">
          Donate
        </Link>{' '}
        to verify checkout links, or use{' '}
        <Link to="/" className="text-accent-emerald hover:underline inline-flex items-center gap-0.5">
          <Settings className="w-3 h-3" /> Command Center
        </Link>{' '}
        to confirm system alerts clear.
      </p>
    </div>
  );
}
