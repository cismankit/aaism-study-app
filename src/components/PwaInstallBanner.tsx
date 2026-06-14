import { useEffect, useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { isIosSafari, isStandalonePwa } from '../utils/pwa';

const DISMISS_KEY = 'aaism-pwa-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const iosSafari = isIosSafari();

  useEffect(() => {
    if (isStandalonePwa()) {
      setInstalled(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  const showChromeInstall = Boolean(deferredPrompt);
  const showIosBanner = iosSafari && !showChromeInstall;

  if (!showChromeInstall && !showIosBanner) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  if (showIosBanner) {
    return (
      <div className="mx-3 sm:mx-5 mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
        <div className="flex items-start gap-3">
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium mb-1">
              Install on iPhone — Add to Home Screen
            </p>
            <p className="text-emerald-700/90 dark:text-emerald-400/90 text-xs">
              Cached study content works offline. AI tutoring and intel feeds need a network connection.
            </p>
            {showIosGuide && (
              <ol className="mt-2.5 space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300 list-decimal list-inside">
                <li>Open this page in <strong>Safari</strong> (not Chrome or in-app browsers)</li>
                <li>Tap the <Share className="inline w-3.5 h-3.5 -mt-0.5" /> Share button at the bottom of Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> — launch AAISM from your home screen like a native app</li>
              </ol>
            )}
            <div className="flex flex-wrap gap-2 mt-2.5">
              <button
                onClick={() => setShowIosGuide(v => !v)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
              >
                {showIosGuide ? 'Hide steps' : 'Show steps'}
              </button>
              <button
                onClick={handleDismiss}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/15"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 sm:mx-5 mt-2 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm">
      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <p className="flex-1 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
        Install AAISM for offline study — cached content works without a connection.
      </p>
      <button
        onClick={handleInstall}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
        aria-label="Dismiss install prompt"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
