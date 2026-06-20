import { FolderOpen, Info, Shield, Trash2 } from 'lucide-react';
import Logo from './Logo';
import {
  APP_NAME,
  APP_VERSION,
  APP_BUILD,
  BUNDLE_ID,
  APP_WINDOW_TITLE,
} from '../constants/appMeta';
import { isTauri } from '../utils/tauriEnv';

async function openApplicationsFolder() {
  if (!isTauri()) {
    window.alert('Open Finder → Applications to remove old desktop copies.');
    return;
  }
  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open('/Applications');
  } catch {
    window.alert('Could not open /Applications. Open Finder → Applications manually.');
  }
}

export default function AboutPanel() {
  return (
    <div className="bg-theme-elevated rounded-xl p-6 border border-theme space-y-5">
      <div className="flex items-start gap-4">
        <Logo size={64} className="shrink-0" />
        <div className="min-w-0">
          <h3 className="font-semibold text-cockpit flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-500" />
            About {APP_NAME}
          </h3>
          <p className="text-sm text-cockpit-muted mt-1">
            Multi-cert study, ops drills, intel feeds, and AI-assisted exam prep — one command
            center for certification and security operations practice.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-theme bg-cockpit-track/40 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-cockpit-muted">Version</dt>
          <dd className="font-mono text-cockpit">{APP_VERSION}</dd>
        </div>
        <div className="rounded-lg border border-theme bg-cockpit-track/40 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-cockpit-muted">Build</dt>
          <dd className="font-mono text-cockpit">{APP_BUILD}</dd>
        </div>
        <div className="rounded-lg border border-theme bg-cockpit-track/40 px-3 py-2 sm:col-span-2">
          <dt className="text-[10px] uppercase tracking-wide text-cockpit-muted">Bundle ID</dt>
          <dd className="font-mono text-cockpit text-xs break-all">{BUNDLE_ID}</dd>
        </div>
        {isTauri() && (
          <div className="rounded-lg border border-theme bg-cockpit-track/40 px-3 py-2 sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-wide text-cockpit-muted">Window</dt>
            <dd className="font-mono text-cockpit text-xs break-all">{APP_WINDOW_TITLE}</dd>
          </div>
        )}
      </dl>

      {isTauri() && (
        <button
          type="button"
          onClick={() => void openApplicationsFolder()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-theme hover:bg-cockpit-track transition-colors text-cockpit"
        >
          <FolderOpen className="w-4 h-4" />
          Open Applications folder
        </button>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-cockpit-muted">
        <p className="flex items-start gap-2">
          <Trash2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-cockpit">One app only.</strong> Delete older copies from
            Launchpad / Applications — especially <strong>AAISM Intelligence</strong> and any
            duplicate <strong>Aegis</strong> icons from past builds. Install only{' '}
            <code className="text-xs">dist-mac/Aegis.app</code> (dev builds show an amber version
            badge on the icon; App Store releases use a clean shield).
          </span>
        </p>
      </div>

      <p className="text-xs text-cockpit-muted flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        Canonical Mac identity: <code className="text-[10px]">{BUNDLE_ID}</code> · See{' '}
        <code className="text-[10px]">docs/APP_STORE.md</code> in the repo for App Store steps.
      </p>
    </div>
  );
}
