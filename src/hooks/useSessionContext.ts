import { useEffect, useState, useCallback } from 'react';
import { getSessionFocusLabel } from '../services/sidebarJourneyService';
import { isFullCatalogUnlocked } from '../services/productTierService';
import { PROGRESS_CHANGED_EVENT } from '../services/progressService';

const SESSION_START_KEY = 'aegis-session-start';
const FOCUS_MODE_KEY = 'aegis-sidebar-focus-mode';

export function getFocusModeEnabled(): boolean {
  const stored = sessionStorage.getItem(FOCUS_MODE_KEY);
  if (stored !== null) return stored === 'true';
  return !isFullCatalogUnlocked();
}

export function setFocusModeEnabled(enabled: boolean): void {
  sessionStorage.setItem(FOCUS_MODE_KEY, enabled ? 'true' : 'false');
}

export function useSessionContext(activeCertId: string) {
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [focusLabel, setFocusLabel] = useState('Overview');
  const [focusMode, setFocusMode] = useState(getFocusModeEnabled);

  const tickSession = useCallback(() => {
    const start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) {
      const now = String(Date.now());
      sessionStorage.setItem(SESSION_START_KEY, now);
      setSessionMinutes(0);
      return;
    }
    const startMs = Number(start);
    setSessionMinutes(Math.max(0, Math.floor((Date.now() - startMs) / 60_000)));
  }, []);

  useEffect(() => {
    tickSession();
    const id = window.setInterval(tickSession, 10_000);
    window.addEventListener(PROGRESS_CHANGED_EVENT, tickSession);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(PROGRESS_CHANGED_EVENT, tickSession);
    };
  }, [tickSession]);

  useEffect(() => {
    setFocusLabel(getSessionFocusLabel(activeCertId));
  }, [activeCertId]);

  const toggleFocusMode = () => {
    setFocusMode(prev => {
      const next = !prev;
      setFocusModeEnabled(next);
      return next;
    });
  };

  /** Ring fill 0–1 for a soft 90-minute session reference */
  const sessionProgress = Math.min(sessionMinutes / 90, 1);

  return { sessionMinutes, focusLabel, focusMode, toggleFocusMode, sessionProgress };
}
