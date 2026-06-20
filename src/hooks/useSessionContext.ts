import { useEffect, useState } from 'react';
import { getSessionFocusLabel } from '../services/sidebarJourneyService';

const SESSION_START_KEY = 'aegis-session-start';
const FOCUS_MODE_KEY = 'aegis-sidebar-focus-mode';

export function getFocusModeEnabled(): boolean {
  return sessionStorage.getItem(FOCUS_MODE_KEY) === 'true';
}

export function setFocusModeEnabled(enabled: boolean): void {
  sessionStorage.setItem(FOCUS_MODE_KEY, enabled ? 'true' : 'false');
}

export function useSessionContext(activeCertId: string) {
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [focusLabel, setFocusLabel] = useState('Overview');
  const [focusMode, setFocusMode] = useState(getFocusModeEnabled);

  useEffect(() => {
    let start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) {
      start = String(Date.now());
      sessionStorage.setItem(SESSION_START_KEY, start);
    }
    const startMs = Number(start);

    const tick = () => {
      setSessionMinutes(Math.max(0, Math.floor((Date.now() - startMs) / 60_000)));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

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
