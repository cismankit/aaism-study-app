/**
 * Content Studio queue — draft → approved → exported workflow.
 * Stored in browser localStorage (aaism-content-queue).
 */

import type { ContentFormatId } from '../data/contentTemplates';
import type { ContentSource } from './contentStudioService';

export const CONTENT_QUEUE_STORAGE_KEY = 'aaism-content-queue';

export type ContentQueueStatus = 'draft' | 'approved' | 'exported';

export interface ContentQueueItem {
  id: string;
  status: ContentQueueStatus;
  formatId: ContentFormatId;
  formatLabel: string;
  content: string;
  source: ContentSource;
  createdAt: string;
  updatedAt: string;
}

function loadQueue(): ContentQueueItem[] {
  try {
    const raw = localStorage.getItem(CONTENT_QUEUE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ContentQueueItem[];
  } catch {
    // corrupt storage — reset
  }
  return [];
}

function saveQueue(items: ContentQueueItem[]): void {
  try {
    localStorage.setItem(CONTENT_QUEUE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota / private mode
  }
}

export function getContentQueue(): ContentQueueItem[] {
  return loadQueue().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function addToContentQueue(
  item: Omit<ContentQueueItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): ContentQueueItem {
  const now = new Date().toISOString();
  const entry: ContentQueueItem = {
    ...item,
    id: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  const queue = loadQueue();
  queue.unshift(entry);
  saveQueue(queue);
  return entry;
}

export function updateQueueItemStatus(
  id: string,
  status: ContentQueueStatus,
): ContentQueueItem | null {
  const queue = loadQueue();
  const idx = queue.findIndex(i => i.id === id);
  if (idx === -1) return null;
  queue[idx] = { ...queue[idx], status, updatedAt: new Date().toISOString() };
  saveQueue(queue);
  return queue[idx];
}

export function removeFromContentQueue(id: string): void {
  saveQueue(loadQueue().filter(i => i.id !== id));
}

export function getQueueCounts(): Record<ContentQueueStatus, number> {
  const counts: Record<ContentQueueStatus, number> = { draft: 0, approved: 0, exported: 0 };
  for (const item of loadQueue()) counts[item.status]++;
  return counts;
}
