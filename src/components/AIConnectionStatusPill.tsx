import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Wrench } from 'lucide-react';
import {
  checkLLMHealth,
  formatConnectedStatusLabel,
  getFixAction,
  subscribeLLMHealth,
  type LLMHealthReport,
} from '../services/llmHealthService';
import { openOllamaApp } from '../services/ollamaAppService';
import { isConnectionVerified, getConnectionVerification } from '../services/connectionVerificationService';

interface AIConnectionStatusPillProps {
  /** Show "Connection verified ✓" badge when a recent wizard test passed. */
  showVerificationBadge?: boolean;
  className?: string;
}

export default function AIConnectionStatusPill({
  showVerificationBadge = true,
  className = '',
}: AIConnectionStatusPillProps) {
  const [report, setReport] = useState<LLMHealthReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [verification, setVerification] = useState(() => getConnectionVerification());

  useEffect(() => {
    return subscribeLLMHealth(setReport);
  }, []);

  useEffect(() => {
    setVerification(getConnectionVerification());
  }, [report?.overallHealthy]);

  const connected = report?.overallHealthy ?? false;
  const label = report ? formatConnectedStatusLabel(report) : 'Checking connection…';
  const fixAction = report ? getFixAction(report) : null;
  const verified =
    showVerificationBadge &&
    connected &&
    isConnectionVerified(report?.activeProvider === 'groq' ? 'groq' : 'ollama');

  const handleFix = async () => {
    if (!fixAction) return;
    if (fixAction.type === 'open-ollama') {
      setFixing(true);
      await openOllamaApp();
      setFixing(false);
      setChecking(true);
      await checkLLMHealth();
      setChecking(false);
      return;
    }
    if (fixAction.type === 'navigate') {
      window.location.hash = '';
    }
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
        connected
          ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/5'
          : 'border-red-500/40 bg-red-500/10 dark:bg-red-500/5'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg leading-none" aria-hidden>
            {connected ? '🟢' : '🔴'}
          </span>
          <span
            className={`text-sm sm:text-base font-semibold ${
              connected
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-red-800 dark:text-red-300'
            }`}
          >
            {connected ? label : 'Not connected'}
          </span>
          {(checking || !report) && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cockpit-muted" aria-label="Checking" />
          )}
        </div>
        {!connected && report && (
          <p className="text-xs text-red-700/90 dark:text-red-400/90 mt-1 pl-7">
            {report.providers[report.activeProvider]?.message ?? 'Configure your AI provider below.'}
          </p>
        )}
        {verified && verification && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1 pl-7">
            Connection verified ✓ · tested {new Date(verification.verifiedAt).toLocaleString()}
          </p>
        )}
      </div>

      {!connected && fixAction && (
        fixAction.type === 'navigate' ? (
          <Link
            to={fixAction.href}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            {fixAction.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void handleFix()}
            disabled={fixing}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shrink-0"
          >
            {fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
            {fixAction.label}
          </button>
        )
      )}
    </div>
  );
}
