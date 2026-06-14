import { useState } from 'react';
import { Cloud, Upload, Download, LogIn, LogOut, Shield, RefreshCw } from 'lucide-react';
import {
  getSessionLabel,
  isSignedIn,
  signInWithEmail,
  signOut,
  getOrCreateSession,
} from '../services/authService';
import {
  pushProgressToCloud,
  pullProgressFromCloud,
  getSyncMeta,
  exportCloudBlobJson,
} from '../services/syncService';

export default function SignInSyncSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signedIn = isSignedIn();
  const meta = getSyncMeta();

  getOrCreateSession(); // ensure session exists

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result = await signInWithEmail(email);
    setStatus(result.message);
    if (result.ok) {
      const push = await pushProgressToCloud();
      setStatus(`${result.message} ${push.message}`);
      setEmail('');
    }
    setBusy(false);
  }

  async function handlePush() {
    setBusy(true);
    const result = await pushProgressToCloud();
    setStatus(result.message);
    setBusy(false);
  }

  async function handlePull() {
    setBusy(true);
    const result = await pullProgressFromCloud();
    setStatus(result.message);
    if (result.merged) {
      setTimeout(() => window.location.reload(), 1200);
    }
    setBusy(false);
  }

  function handleSignOut() {
    signOut();
    setStatus('Signed out. New anonymous session created.');
  }

  function handleExportBlob() {
    const blob = new Blob([exportCloudBlobJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaism-cloud-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Cloud blob exported.');
  }

  return (
    <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
      <h3 className="font-semibold text-cockpit mb-1 flex items-center gap-2">
        <Cloud size={18} className="text-accent-cyan" />
        Sign in to Sync
      </h3>
      <p className="text-sm text-cockpit-muted mb-4">
        Progress stays in your browser by default. Sign in to back up and merge quiz scores, streaks, and domain readiness across sessions.
      </p>

      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-cockpit-track/50 border border-theme">
        <Shield className="w-4 h-4 text-accent-emerald flex-shrink-0" />
        <p className="text-xs text-cockpit-muted">
          <strong className="text-cockpit">Privacy:</strong> API keys never leave this device. Cloud sync stores progress only — not Groq/Ollama keys.
          Data lives in localStorage until you configure Supabase (<code className="text-[10px]">VITE_SUPABASE_URL</code>).
        </p>
      </div>

      <div className="text-xs text-cockpit-subtle mb-3 font-mono">
        Session: {getSessionLabel()}
        {meta.lastPushAt && (
          <span className="block mt-0.5">Last sync: {new Date(meta.lastPushAt).toLocaleString()}</span>
        )}
      </div>

      {!signedIn ? (
        <form onSubmit={handleSignIn} className="space-y-3">
          <div>
            <label htmlFor="sync-email" className="block text-sm text-theme-secondary mb-1">
              Email (local magic-link simulation)
            </label>
            <input
              id="sync-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-page text-cockpit focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <LogIn size={16} />
            {busy ? 'Signing in…' : 'Sign in & sync'}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePush}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Upload size={16} />
            Push to cloud
          </button>
          <button
            onClick={handlePull}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cockpit-track text-cockpit rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors border border-theme"
          >
            <Download size={16} />
            Pull & merge
          </button>
          <button
            onClick={handleExportBlob}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cockpit-track text-cockpit-muted rounded-lg text-sm font-medium hover:opacity-90 transition-colors border border-theme"
          >
            <RefreshCw size={16} />
            Export blob
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}

      {status && (
        <p className="mt-3 text-xs text-cockpit-muted">{status}</p>
      )}
    </div>
  );
}
