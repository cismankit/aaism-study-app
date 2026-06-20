import { useState } from 'react';
import { Activity, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  runAllSmokeTests,
  type SmokeTestRunSummary,
} from '../services/aiSmokeTest';

export default function AISmokeTestPanel() {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<SmokeTestRunSummary | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setSummary(null);
    try {
      const result = await runAllSmokeTests();
      setSummary(result);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-theme-elevated rounded-xl p-6 border border-theme">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-cockpit flex items-center gap-2">
            <Activity size={18} className="text-primary-500" />
            Verify all AI
          </h3>
          <p className="text-sm text-cockpit-muted mt-1">
            Runs chat, Ops Copilot, mission orchestrator, and Agent Discovery against Ollama
            (gemma4:latest). Each test fails within 15s if Ollama is down.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 flex items-center gap-2 shrink-0"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running…
            </>
          ) : (
            'Verify all AI'
          )}
        </button>
      </div>

      {summary && (
        <div className="space-y-3">
          <div
            className={`text-sm font-medium ${
              summary.allPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {summary.allPassed ? 'All tests passed' : 'Some tests failed'} · {summary.provider} / {summary.model}
          </div>
          <div className="overflow-x-auto rounded-lg border border-theme">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cockpit-track text-left text-xs text-cockpit-muted">
                  <th className="px-3 py-2 font-medium">Feature</th>
                  <th className="px-3 py-2 font-medium w-20">Status</th>
                  <th className="px-3 py-2 font-medium w-16">Time</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {summary.results.map(row => (
                  <tr key={row.id} className="border-t border-theme">
                    <td className="px-3 py-2 text-cockpit">{row.label}</td>
                    <td className="px-3 py-2">
                      {row.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Fail
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-cockpit-muted tabular-nums">
                      {(row.durationMs / 1000).toFixed(1)}s
                    </td>
                    <td className="px-3 py-2 text-cockpit-muted text-xs">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-cockpit-muted">
            Ran at {new Date(summary.ranAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
