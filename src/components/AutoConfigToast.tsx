import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import {
  AUTOCONFIG_TOAST_EVENT,
  type AutoConfigToastDetail,
} from '../services/autoConfigService';

const VARIANT_STYLES: Record<
  AutoConfigToastDetail['variant'],
  { border: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    border: 'border-emerald-500/40 bg-emerald-500/10',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    border: 'border-amber-500/40 bg-amber-500/10',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    border: 'border-red-500/40 bg-red-500/10',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  info: {
    border: 'border-cyan-500/40 bg-cyan-500/10',
    icon: Info,
    iconClass: 'text-cyan-600 dark:text-cyan-400',
  },
};

const AUTO_DISMISS_MS = 6_000;

/** Single status toast for auto-configuration results. */
export default function AutoConfigToast() {
  const [toast, setToast] = useState<AutoConfigToastDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AutoConfigToastDetail>).detail;
      if (!detail?.message) return;
      setToast(detail);
    };
    window.addEventListener(AUTOCONFIG_TOAST_EVENT, handler);
    return () => window.removeEventListener(AUTOCONFIG_TOAST_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const styles = VARIANT_STYLES[toast.variant];
  const Icon = styles.icon;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,28rem)] animate-fade-in">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${styles.border}`}
        role="status"
      >
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${styles.iconClass}`} />
        <p className="flex-1 text-sm font-medium text-cockpit">{toast.message}</p>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-cockpit-muted hover:text-cockpit p-0.5 rounded"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
