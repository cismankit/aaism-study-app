import type { DonationRegionId } from '../data/donations';
import type { FeatureTierId } from '../data/featureTiers';
import { buildPaymentNote } from '../data/featureTiers';

export type FeatureRequestPriority = 'nice' | 'important' | 'exam_blocker';
export type FeatureRequestStatus =
  | 'submitted'
  | 'payment_pending'
  | 'in_progress'
  | 'shipped';

export interface FeatureRequest {
  id: string;
  description: string;
  priority: FeatureRequestPriority;
  email?: string;
  tierId: FeatureTierId;
  region: DonationRegionId;
  status: FeatureRequestStatus;
  paymentNote: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'aaism_feature_requests';

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}`;
}

function deriveTags(description: string, tierId: FeatureTierId): string[] {
  const tags: string[] = [tierId];
  const lower = description.toLowerCase();
  if (lower.includes('quiz') || lower.includes('question')) tags.push('study');
  if (lower.includes('scenario')) tags.push('scenarios');
  if (lower.includes('dark') || lower.includes('theme')) tags.push('ui');
  if (lower.includes('export') || lower.includes('pdf')) tags.push('export');
  if (lower.includes('mobile')) tags.push('mobile');
  return tags;
}

export function loadFeatureRequests(): FeatureRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeatureRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeatureRequests(requests: FeatureRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function createFeatureRequest(input: {
  description: string;
  priority: FeatureRequestPriority;
  email?: string;
  tierId: FeatureTierId;
  region: DonationRegionId;
}): FeatureRequest {
  const id = generateId();
  const now = new Date().toISOString();
  const paymentNote = buildPaymentNote(id);
  const tags = deriveTags(input.description, input.tierId);

  const request: FeatureRequest = {
    id,
    description: input.description.trim(),
    priority: input.priority,
    email: input.email?.trim() || undefined,
    tierId: input.tierId,
    region: input.region,
    status: 'payment_pending',
    paymentNote,
    tags,
    createdAt: now,
    updatedAt: now,
  };

  const existing = loadFeatureRequests();
  existing.unshift(request);
  saveFeatureRequests(existing);
  return request;
}

export function updateRequestStatus(id: string, status: FeatureRequestStatus): void {
  const requests = loadFeatureRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return;
  requests[idx] = {
    ...requests[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  saveFeatureRequests(requests);
}

export function markPaymentSent(id: string): void {
  updateRequestStatus(id, 'in_progress');
}

export function buildGitHubIssueUrl(request: FeatureRequest): string {
  const title = `[Feature Request] ${request.description.slice(0, 80)}`;
  const body = [
    `## Request`,
    request.description,
    '',
    `## Details`,
    `- **Priority:** ${request.priority}`,
    `- **Tier:** ${request.tierId}`,
    `- **Payment ref:** ${request.paymentNote}`,
    `- **Region:** ${request.region}`,
    request.email ? `- **Email:** ${request.email}` : '',
    `- **Request ID:** ${request.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const base = 'https://github.com/cismankit/aaism-study-app/issues/new';
  const params = new URLSearchParams({
    labels: 'enhancement',
    title,
    body,
  });
  return `${base}?${params.toString()}`;
}

export const priorityLabels: Record<FeatureRequestPriority, string> = {
  nice: 'Nice to have',
  important: 'Important',
  exam_blocker: 'Exam blocker',
};

export const statusLabels: Record<FeatureRequestStatus, string> = {
  submitted: 'Submitted',
  payment_pending: 'Awaiting payment',
  in_progress: 'In progress',
  shipped: 'Shipped ✨',
};

export const statusColors: Record<FeatureRequestStatus, string> = {
  submitted: 'bg-gray-500/20 text-gray-600 dark:text-gray-300',
  payment_pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  shipped: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
};
