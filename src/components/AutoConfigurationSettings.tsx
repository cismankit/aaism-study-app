import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Zap, ScrollText } from 'lucide-react';
import {
  loadAutoConfigSettings,
  saveAutoConfigSettings,
  getAutoConfigLog,
  subscribeAutoConfigLog,
  runAutoConfig,
  type AutoConfigLogEntry,
  type AutoConfigLogLevel,
} from '../services/autoConfigService';

const LEVEL_STYLES: Record<AutoConfigLogLevel, string> = {
  info: 'text-cockpit-muted',
  success: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
};

function LogRow({ entry }: { entry: AutoConfigLogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return (
    <div className="flex gap-2 text-xs font-mono py-1 border-b border-theme/50 last:border-0">
      <span className="text-theme-faint shrink-0">{time}</span>
      <span className={`shrink-0 uppercase w-14 ${LEVEL_STYLES[entry.level]}`}>{entry.level}</span>
      <span className="text-cockpit break-words">{entry.message}</span>
    </div>
  );
}

export default function AutoConfigurationSettings() {
  const [enabled, setEnabled] = useState(() => loadAutoConfigSettings().enabledOnStartup);
  const [log, setLog] = useState<AutoConfigLogEntry[]>(() => getAutoConfigLog());
  const [running, setRunning] = useState(false);

  useEffect(() => subscribeAutoConfigLog(setLog), []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    saveAutoConfigSettings({ enabledOnStartup: checked });
  };

  const handleRunNow = async () => {
    setRunning(true);
    await runAutoConfig('manual');
    setLog(getAutoConfigLog());
    setRunning(false);
  };

  return (
    <div className="bg-theme-elevated rounded-xl p-6 border border-theme space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-cockpit">Auto-Configuration</h3>
          <p className="text-sm text-cockpit-muted mt-1">
            On startup, detect Ollama, pick the best installed model, sync connectors, and run health
            checks. Falls back to Groq when Ollama is unavailable.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-cockpit cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => handleToggle(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        Auto-configure on startup
      </label>

      <button
        type="button"
        onClick={handleRunNow}
        disabled={running}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {running ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        Run auto-config now
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="w-4 h-4 text-cockpit-muted" />
          <span className="text-sm font-medium text-cockpit">Configuration log</span>
          <span className="text-xs text-theme-faint">(last 20 entries)</span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-theme bg-cockpit-track/50 p-3">
          {log.length === 0 ? (
            <p className="text-xs text-theme-faint text-center py-4">No auto-config runs yet.</p>
          ) : (
            [...log].reverse().map((entry, i) => <LogRow key={`${entry.timestamp}-${i}`} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
