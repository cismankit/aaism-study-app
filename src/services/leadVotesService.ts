/**
 * Community lead voting — stored in browser localStorage (aaism-lead-votes).
 */

import type { QuestionLead } from './agentStore';

export const LEAD_VOTES_STORAGE_KEY = 'aaism-lead-votes';

export interface LeadVoteRecord {
  up: number;
  down: number;
  /** ISO timestamp of last vote */
  lastVotedAt?: string;
}

export type LeadVotesStore = Record<string, LeadVoteRecord>;

function loadVotes(): LeadVotesStore {
  try {
    const raw = localStorage.getItem(LEAD_VOTES_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LeadVotesStore;
  } catch {
    // corrupt storage — reset
  }
  return {};
}

function saveVotes(store: LeadVotesStore): void {
  try {
    localStorage.setItem(LEAD_VOTES_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

export function getLeadVoteRecord(leadId: string): LeadVoteRecord {
  const store = loadVotes();
  return store[leadId] ?? { up: 0, down: 0 };
}

/** Net community score: upvotes minus downvotes */
export function getLeadCommunityScore(leadId: string): number {
  const { up, down } = getLeadVoteRecord(leadId);
  return up - down;
}

export function voteLead(leadId: string, direction: 'up' | 'down'): LeadVoteRecord {
  const store = loadVotes();
  const current = store[leadId] ?? { up: 0, down: 0 };
  const updated: LeadVoteRecord = {
    ...current,
    [direction === 'up' ? 'up' : 'down']: current[direction === 'up' ? 'up' : 'down'] + 1,
    lastVotedAt: new Date().toISOString(),
  };
  store[leadId] = updated;
  saveVotes(store);
  return updated;
}

export function sortLeadsByCommunityScore(leads: QuestionLead[]): QuestionLead[] {
  return [...leads].sort((a, b) => {
    const scoreDiff = getLeadCommunityScore(b.id) - getLeadCommunityScore(a.id);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
  });
}

export function getTotalVotes(): number {
  const store = loadVotes();
  return Object.values(store).reduce((sum, r) => sum + r.up + r.down, 0);
}
