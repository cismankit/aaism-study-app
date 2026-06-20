/**
 * Global emergency kill switch — halts all in-flight AI/agent runs and blocks new calls.
 */

import {
  AI_KILL_SWITCH_PERSIST_KEY,
  AI_KILL_SWITCH_SESSION_KEY,
} from '../data/securityPolicy';

export const KILL_SWITCH_SESSION_KEY = AI_KILL_SWITCH_SESSION_KEY;
export const KILL_SWITCH_PERSIST_KEY = AI_KILL_SWITCH_PERSIST_KEY;

export const KILL_SWITCH_CHANGED_EVENT = 'aaism-kill-switch-changed';

export const KILL_SWITCH_HALT_MESSAGE =
  'Emergency kill switch active — all AI actions halted. Release the kill switch to resume.';

export interface KillSwitchState {
  active: boolean;
  reason?: string;
  engagedAt?: string;
}

type KillSwitchListener = (state: KillSwitchState) => void;

const runControllers = new Set<AbortController>();
const listeners = new Set<KillSwitchListener>();

let masterController = new AbortController();

function readSessionState(): KillSwitchState {
  if (typeof sessionStorage === 'undefined') return { active: false };
  try {
    const raw = sessionStorage.getItem(KILL_SWITCH_SESSION_KEY);
    if (!raw) return { active: false };
    const parsed = JSON.parse(raw) as KillSwitchState;
    return { active: Boolean(parsed.active), reason: parsed.reason, engagedAt: parsed.engagedAt };
  } catch {
    return { active: false };
  }
}

function readPersistFlag(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(KILL_SWITCH_PERSIST_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSessionState(state: KillSwitchState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (state.active) {
      sessionStorage.setItem(KILL_SWITCH_SESSION_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(KILL_SWITCH_SESSION_KEY);
    }
  } catch { /* quota / private mode */ }
}

function writePersistFlag(active: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem(KILL_SWITCH_PERSIST_KEY, '1');
    } else {
      localStorage.removeItem(KILL_SWITCH_PERSIST_KEY);
    }
  } catch { /* ignore */ }
}

function notifyListeners(): void {
  const state = getKillSwitchState();
  listeners.forEach(l => l(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(KILL_SWITCH_CHANGED_EVENT, { detail: state }));
  }
}

function abortAllRuns(): void {
  for (const controller of runControllers) {
    controller.abort();
  }
  runControllers.clear();
}

/** Register an in-flight run controller — aborted immediately if kill switch is already active. */
export function registerRunAbortController(controller: AbortController): () => void {
  if (isKillSwitchActive()) {
    controller.abort();
  }
  runControllers.add(controller);
  const onAbort = () => {
    runControllers.delete(controller);
  };
  controller.signal.addEventListener('abort', onAbort, { once: true });
  return () => {
    controller.signal.removeEventListener('abort', onAbort);
    runControllers.delete(controller);
  };
}

/** Create a tracked AbortController for agent runs, missions, team packs, ops copilot. */
export function createTrackedAbortController(): AbortController {
  const controller = new AbortController();
  registerRunAbortController(controller);
  return controller;
}

/**
 * Link an optional external signal to a tracked controller.
 * Kill-switch abort propagates to the returned signal; external abort also stops the run.
 */
export function linkAbortSignal(externalSignal?: AbortSignal): AbortSignal {
  const controller = createTrackedAbortController();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return controller.signal;
}

export function getKillSwitchAbortSignal(): AbortSignal {
  return masterController.signal;
}

export function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();

  for (const signal of signals) {
    if (signal.aborted) {
      abort();
      break;
    }
    signal.addEventListener('abort', abort, { once: true });
  }

  return controller.signal;
}

export function getKillSwitchState(): KillSwitchState {
  const session = readSessionState();
  if (session.active) return session;
  if (readPersistFlag()) {
    return {
      active: true,
      reason: 'Persisted from previous session',
      engagedAt: undefined,
    };
  }
  return { active: false };
}

export function isKillSwitchActive(): boolean {
  return getKillSwitchState().active;
}

export function subscribeKillSwitch(listener: KillSwitchListener): () => void {
  listeners.add(listener);
  listener(getKillSwitchState());
  return () => listeners.delete(listener);
}

/** Engage kill switch — aborts all registered runs and blocks new AI calls. */
export function engageKillSwitch(reason = 'Manual emergency stop'): void {
  const state: KillSwitchState = {
    active: true,
    reason,
    engagedAt: new Date().toISOString(),
  };
  writeSessionState(state);
  writePersistFlag(true);
  abortAllRuns();
  if (!masterController.signal.aborted) {
    masterController.abort();
  }
  notifyListeners();
}

/**
 * Release kill switch — requires explicit confirmation.
 * Pass `confirmed: true` after user confirms in UI.
 */
export function releaseKillSwitch(confirmed: boolean): boolean {
  if (!confirmed) return false;

  writeSessionState({ active: false });
  writePersistFlag(false);
  masterController = new AbortController();
  notifyListeners();
  return true;
}

export function initKillSwitchFromStorage(): void {
  if (isKillSwitchActive() && !masterController.signal.aborted) {
    masterController.abort();
  }
}
