import { useEffect } from 'react';
import { SETTINGS_POLL_INTERVAL_MS } from '../services/llmHealthService';
import { checkSystemHealth } from '../services/systemHealthService';
import { refreshEnabledConnectorStatuses } from '../services/connectorRegistry';

/** Poll AI + connector health every 30s while Settings is open. */
export function useSettingsHealthPoll(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      window.dispatchEvent(new Event('aaism-connectors-poll-start'));
      await checkSystemHealth();
      await refreshEnabledConnectorStatuses();
      window.dispatchEvent(new Event('aaism-connectors-refreshed'));
    };

    void tick();
    const timer = setInterval(tick, SETTINGS_POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
}
