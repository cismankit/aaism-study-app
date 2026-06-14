import { ExamQuestion } from '../data/examContent';

// ============ TYPES ============

export type LeadStatus = 'discovered' | 'pending_review' | 'approved' | 'rejected' | 'auto_approved';

export interface QuestionLead {
  id: string;
  question: ExamQuestion;
  status: LeadStatus;
  confidence: number; // 0-100, how closely it matches ISACA patterns
  similarityScore: number; // 0-100, how similar to existing questions (lower = more unique)
  source: string; // which agent run discovered it
  discoveredAt: string;
  reviewedAt?: string;
  tags: string[];
  reasoning: string; // why the agent thinks this is a good lead
}

export interface AgentRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  strategy: DiscoveryStrategy;
  leadsFound: number;
  leadsApproved: number;
  leadsRejected: number;
  error?: string;
  log: AgentLogEntry[];
}

export interface AgentLogEntry {
  timestamp: string;
  phase: 'analyze' | 'discover' | 'deduplicate' | 'score' | 'populate';
  message: string;
  data?: Record<string, unknown>;
}

export interface DiscoveryStrategy {
  type: 'gap_fill' | 'topic_deep_dive' | 'difficulty_balance' | 'cross_domain' | 'scenario_based' | 'full_sweep' | 'community_pattern' | 'trap_buster' | 'forum_hot_topics';
  targetDomain?: number;
  targetDifficulty?: 'easy' | 'medium' | 'hard';
  targetTopic?: string;
  questionCount: number;
  autoApproveThreshold: number;
}

export interface CoverageGap {
  domain: number;
  topic: string;
  currentCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

export interface AgentPipelineState {
  leads: QuestionLead[];
  runs: AgentRun[];
  lastRunAt?: string;
  totalDiscovered: number;
  totalApproved: number;
  totalRejected: number;
  totalAutoApproved: number;
  approvedQuestions: ExamQuestion[]; // questions added to the bank
}

// ============ STORAGE ============

const PIPELINE_KEY = 'aaism_agent_pipeline';

const initialState: AgentPipelineState = {
  leads: [],
  runs: [],
  totalDiscovered: 0,
  totalApproved: 0,
  totalRejected: 0,
  totalAutoApproved: 0,
  approvedQuestions: [],
};

export function loadPipelineState(): AgentPipelineState {
  try {
    const saved = localStorage.getItem(PIPELINE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load agent pipeline state:', e);
  }
  return { ...initialState };
}

export function savePipelineState(state: AgentPipelineState): void {
  try {
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save agent pipeline state:', e);
  }
}

// ============ LEAD MANAGEMENT ============

export function addLeads(leads: QuestionLead[]): AgentPipelineState {
  const state = loadPipelineState();
  state.leads.push(...leads);
  state.totalDiscovered += leads.length;

  const autoApproved = leads.filter(l => l.status === 'auto_approved');
  state.totalAutoApproved += autoApproved.length;
  state.approvedQuestions.push(...autoApproved.map(l => l.question));

  savePipelineState(state);
  return state;
}

export function updateLeadStatus(leadId: string, status: LeadStatus): AgentPipelineState {
  const state = loadPipelineState();
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return state;

  const prevStatus = lead.status;
  lead.status = status;
  lead.reviewedAt = new Date().toISOString();

  if (status === 'approved' && prevStatus !== 'approved') {
    state.totalApproved++;
    state.approvedQuestions.push(lead.question);
  } else if (status === 'rejected' && prevStatus !== 'rejected') {
    state.totalRejected++;
    if (prevStatus === 'approved') {
      state.totalApproved--;
      state.approvedQuestions = state.approvedQuestions.filter(q => q.id !== lead.question.id);
    }
  }

  savePipelineState(state);
  return state;
}

export function bulkUpdateLeads(leadIds: string[], status: LeadStatus): AgentPipelineState {
  let state = loadPipelineState();
  for (const id of leadIds) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead || lead.status === status) continue;

    const prevStatus = lead.status;
    lead.status = status;
    lead.reviewedAt = new Date().toISOString();

    if (status === 'approved' && prevStatus !== 'approved') {
      state.totalApproved++;
      state.approvedQuestions.push(lead.question);
    } else if (status === 'rejected' && prevStatus !== 'rejected') {
      state.totalRejected++;
      if (prevStatus === 'approved') {
        state.totalApproved--;
        state.approvedQuestions = state.approvedQuestions.filter(q => q.id !== lead.question.id);
      }
    }
  }
  savePipelineState(state);
  return state;
}

// ============ RUN MANAGEMENT ============

export function startRun(strategy: DiscoveryStrategy): AgentRun {
  const run: AgentRun = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    status: 'running',
    strategy,
    leadsFound: 0,
    leadsApproved: 0,
    leadsRejected: 0,
    log: [],
  };

  const state = loadPipelineState();
  state.runs.unshift(run);
  state.lastRunAt = run.startedAt;
  savePipelineState(state);
  return run;
}

export function updateRun(runId: string, updates: Partial<AgentRun>): void {
  const state = loadPipelineState();
  const run = state.runs.find(r => r.id === runId);
  if (run) {
    Object.assign(run, updates);
    savePipelineState(state);
  }
}

export function addLogEntry(runId: string, entry: Omit<AgentLogEntry, 'timestamp'>): void {
  const state = loadPipelineState();
  const run = state.runs.find(r => r.id === runId);
  if (run) {
    run.log.push({ ...entry, timestamp: new Date().toISOString() });
    savePipelineState(state);
  }
}

export function getLeadsByStatus(status: LeadStatus): QuestionLead[] {
  return loadPipelineState().leads.filter(l => l.status === status);
}

export function getPendingLeads(): QuestionLead[] {
  const state = loadPipelineState();
  return state.leads.filter(l => l.status === 'discovered' || l.status === 'pending_review');
}

export function getApprovedQuestions(): ExamQuestion[] {
  return loadPipelineState().approvedQuestions;
}

export function cancelRun(runId: string): void {
  const state = loadPipelineState();
  const run = state.runs.find(r => r.id === runId);
  if (run) {
    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
    run.error = 'Cancelled by user';
    savePipelineState(state);
  }
}

export function deleteRun(runId: string): void {
  const state = loadPipelineState();
  state.runs = state.runs.filter(r => r.id !== runId);
  savePipelineState(state);
}

export function cleanupStaleRuns(): number {
  const state = loadPipelineState();
  let cleaned = 0;
  for (const run of state.runs) {
    if (run.status === 'running') {
      const startedMs = new Date(run.startedAt).getTime();
      const staleAfterMs = 5 * 60 * 1000; // 5 minutes without completion = stale
      if (Date.now() - startedMs > staleAfterMs) {
        run.status = 'failed';
        run.completedAt = new Date().toISOString();
        run.error = 'Stale run — process ended unexpectedly';
        cleaned++;
      }
    }
  }
  if (cleaned > 0) savePipelineState(state);
  return cleaned;
}

export function clearPipeline(): void {
  savePipelineState({ ...initialState });
}

// ============ STUDY QUEUE ============

const STUDY_QUEUE_KEY = 'aaism-agent-study-queue';

export function getStudyQueue(): string[] {
  try {
    const raw = localStorage.getItem(STUDY_QUEUE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

export function addLeadToStudyQueue(leadId: string): boolean {
  const state = loadPipelineState();
  if (!state.leads.some(l => l.id === leadId)) return false;
  const queue = getStudyQueue();
  if (!queue.includes(leadId)) {
    queue.push(leadId);
    localStorage.setItem(STUDY_QUEUE_KEY, JSON.stringify(queue));
  }
  return true;
}

export function removeLeadFromStudyQueue(leadId: string): void {
  const queue = getStudyQueue().filter(id => id !== leadId);
  localStorage.setItem(STUDY_QUEUE_KEY, JSON.stringify(queue));
}

export function isLeadInStudyQueue(leadId: string): boolean {
  return getStudyQueue().includes(leadId);
}

export function getStudyQueueLeads(): QuestionLead[] {
  const ids = new Set(getStudyQueue());
  return loadPipelineState().leads.filter(l => ids.has(l.id));
}
