import { loadAIConfig, getModelCapability, getRecommendedFallbackModel, resolveAgentConfig, type AIConfig } from './aiService';
import { runMultiAgentDiscovery, type ParsedQuestion } from './multiAgentOrchestrator';
import { getAllQuestions, ALL_DOMAINS, getDomainsForCert } from '../data/examContent';
import { getActiveCertId } from './certContextService';
import { DEFAULT_CERT_ID } from '../data/certifications';
import {
  type QuestionLead,
  type DiscoveryStrategy,
  type CoverageGap,
  type AgentRun,
  startRun,
  updateRun,
  addLogEntry,
  addLeads,
  getApprovedQuestions,
  loadPipelineState,
} from './agentStore';

// ============ COVERAGE ANALYSIS ============

export function analyzeCoverage(certId?: string): {
  gaps: CoverageGap[];
  topicCounts: Record<string, number>;
  domainCounts: Record<number, number>;
  difficultyCounts: Record<string, number>;
  totalQuestions: number;
} {
  const id = certId ?? getActiveCertId();
  const domains = getDomainsForCert(id);
  const domainIds = domains.map(d => d.id);
  const existing = [...getAllQuestions(id), ...getApprovedQuestions()];

  const topicCounts: Record<string, number> = {};
  const domainCounts: Record<number, number> = {};
  domainIds.forEach(d => { domainCounts[d] = 0; });
  const difficultyCounts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const topicByDomainDifficulty: Record<string, { count: number; domain: number; difficulty: string }> = {};

  for (const q of existing) {
    const topic = q.topic || 'General';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;

    const key = `${q.domain}:${topic}:${q.difficulty}`;
    if (!topicByDomainDifficulty[key]) {
      topicByDomainDifficulty[key] = { count: 0, domain: q.domain, difficulty: q.difficulty };
    }
    topicByDomainDifficulty[key].count++;
  }

  const allTopics = new Set<string>();
  if (id === DEFAULT_CERT_ID) {
    ALL_DOMAINS.forEach(d => {
      d.chapters.forEach(ch => {
        ch.topics.forEach(t => allTopics.add(t.title));
      });
    });
  } else {
    domains.forEach(d => allTopics.add(d.name));
    existing.forEach(q => allTopics.add(q.topic || 'General'));
  }

  const gaps: CoverageGap[] = [];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  for (const topic of allTopics) {
    for (const domain of domainIds) {
      for (const diff of difficulties) {
        const key = `${domain}:${topic}:${diff}`;
        const entry = topicByDomainDifficulty[key];
        const count = entry?.count || 0;

        if (count < 3) {
          gaps.push({
            domain,
            topic,
            currentCount: count,
            difficulty: diff,
            priority: count === 0 ? 'high' : count === 1 ? 'medium' : 'low',
          });
        }
      }
    }
  }

  gaps.sort((a, b) => {
    const prio = { high: 0, medium: 1, low: 2 };
    return prio[a.priority] - prio[b.priority];
  });

  return { gaps, topicCounts, domainCounts, difficultyCounts, totalQuestions: existing.length };
}

// ============ CORE AGENT PIPELINE ============

export interface LiveLogEntry {
  timestamp: string;
  phase: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'thinking';
  agent?: string;
}

export interface AgentCallbacks {
  onPhaseChange: (phase: string, message: string) => void;
  onLog: (entry: LiveLogEntry) => void;
  onLeadsFound: (leads: QuestionLead[]) => void;
  onComplete: (run: AgentRun) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

class AgentAbortError extends Error {
  constructor() { super('Agent stopped by user'); this.name = 'AgentAbortError'; }
}

function checkAbort(callbacks: AgentCallbacks) {
  if (callbacks.signal?.aborted) throw new AgentAbortError();
}

function emitLog(callbacks: AgentCallbacks, phase: string, message: string, type: LiveLogEntry['type'] = 'info') {
  callbacks.onLog({
    timestamp: new Date().toISOString(),
    phase,
    message,
    type,
  });
}

export async function runDiscoveryAgent(
  strategy: DiscoveryStrategy,
  callbacks: AgentCallbacks,
  config?: AIConfig,
): Promise<AgentRun> {
  const aiConfig = config || await resolveAgentConfig(loadAIConfig());
  const run = startRun(strategy);

  try {
    checkAbort(callbacks);
    addLogEntry(run.id, { phase: 'analyze', message: 'Starting multi-agent discovery pipeline' });

    const modelCap = getModelCapability(aiConfig.model);
    emitLog(callbacks, 'analyze', `Multi-agent pipeline init (model: ${aiConfig.model}, tier: ${modelCap.tier})`, 'info');

    let deduped: Array<ParsedQuestion & { similarityScore: number }>;
    try {
      const result = await runMultiAgentDiscovery(strategy, callbacks, aiConfig, callbacks.signal);
      deduped = result.discovered;
    } catch (discoverError) {
      if (discoverError instanceof AgentAbortError ||
          (discoverError instanceof Error && discoverError.name === 'AgentAbortError')) throw discoverError;
      const errMsg = discoverError instanceof Error ? discoverError.message : String(discoverError);
      if (aiConfig.provider === 'ollama' && modelCap.tier === 'small') {
        emitLog(callbacks, 'discover', `TIP: Switch to ${getRecommendedFallbackModel()} for reliable JSON output`, 'warning');
        emitLog(callbacks, 'discover', 'Groq is FREE and excellent for structured JSON — https://console.groq.com', 'warning');
      }
      throw new Error(errMsg);
    }

    if (deduped.length === 0) {
      throw new Error('No valid questions after multi-agent pipeline');
    }

    const unique = deduped.filter(q => q.similarityScore < 60);
    const duplicates = deduped.filter(q => q.similarityScore >= 60);

    emitLog(callbacks, 'deduplicate', `Pipeline result: ${unique.length} unique, ${duplicates.length} duplicates filtered`, 'success');

    addLogEntry(run.id, {
      phase: 'deduplicate',
      message: `${unique.length} unique questions, ${duplicates.length} too similar to existing`,
    });

    // Phase 4: Score
    checkAbort(callbacks);
    callbacks.onPhaseChange('score', `Scoring ${unique.length} unique questions...`);
    emitLog(callbacks, 'score', `Classifying ${unique.length} leads (auto-approve threshold: ${strategy.autoApproveThreshold}%)`, 'info');
    addLogEntry(run.id, { phase: 'score', message: 'Scoring and classifying leads' });

    const leads: QuestionLead[] = unique.map((q, i) => {
      const isAutoApprove = q.confidence >= strategy.autoApproveThreshold && q.similarityScore < 30;
      const status = isAutoApprove ? 'auto_approved' : 'pending_review';
      emitLog(callbacks, 'score',
        `  Q${i + 1}: confidence ${q.confidence}% / similarity ${q.similarityScore}% → ${status === 'auto_approved' ? 'AUTO-APPROVED' : 'pending review'}`,
        isAutoApprove ? 'success' : 'info'
      );

      return {
        id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        question: {
          id: q.id,
          domain: q.domain,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
        },
        status,
        confidence: q.confidence,
        similarityScore: q.similarityScore,
        source: run.id,
        discoveredAt: new Date().toISOString(),
        tags: [
          `domain-${q.domain}`,
          q.difficulty,
          strategy.type,
          ...(q.confidence >= 80 ? ['high-quality'] : []),
          ...(q.similarityScore < 15 ? ['highly-unique'] : []),
        ],
        reasoning: q.reasoning,
      } satisfies QuestionLead;
    });

    // Phase 5: Populate
    checkAbort(callbacks);
    callbacks.onPhaseChange('populate', `Adding ${leads.length} leads to pipeline...`);
    emitLog(callbacks, 'populate', `Writing ${leads.length} leads to pipeline store`, 'info');
    addLogEntry(run.id, { phase: 'populate', message: `Populating ${leads.length} leads` });

    const updatedState = addLeads(leads);

    const autoApproved = leads.filter(l => l.status === 'auto_approved').length;
    const pendingReview = leads.filter(l => l.status === 'pending_review').length;

    emitLog(callbacks, 'populate', `${autoApproved} auto-approved → added to question bank`, 'success');
    emitLog(callbacks, 'populate', `${pendingReview} pending your review`, 'info');
    emitLog(callbacks, 'populate', `Total in pipeline: ${updatedState.leads.length} leads`, 'success');

    addLogEntry(run.id, {
      phase: 'populate',
      message: `Pipeline updated: ${autoApproved} auto-approved, ${pendingReview} pending review`,
      data: { autoApproved, pendingReview, totalInPipeline: updatedState.leads.length },
    });

    emitLog(callbacks, 'populate', 'Agent run completed successfully', 'success');

    const completedRun: Partial<AgentRun> = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      leadsFound: leads.length,
      leadsApproved: autoApproved,
    };
    updateRun(run.id, completedRun);

    callbacks.onLeadsFound(leads);
    callbacks.onComplete({ ...run, ...completedRun } as AgentRun);

    return { ...run, ...completedRun } as AgentRun;
  } catch (error) {
    if (error instanceof AgentAbortError) {
      emitLog(callbacks, 'populate', 'Agent stopped by user', 'warning');
      updateRun(run.id, { status: 'failed', completedAt: new Date().toISOString(), error: 'Stopped by user' });
      addLogEntry(run.id, { phase: 'populate', message: 'Agent stopped by user' });
      callbacks.onComplete({ ...run, status: 'failed', completedAt: new Date().toISOString(), leadsFound: 0, leadsApproved: 0 } as AgentRun);
      return { ...run, status: 'failed', error: 'Stopped by user' };
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    emitLog(callbacks, 'error', `Agent failed: ${errMsg}`, 'warning');
    updateRun(run.id, { status: 'failed', completedAt: new Date().toISOString(), error: errMsg });
    addLogEntry(run.id, { phase: 'discover', message: `Agent failed: ${errMsg}` });
    callbacks.onError(errMsg);
    return { ...run, status: 'failed', error: errMsg };
  }
}

// ============ PRESET STRATEGIES ============

export const PRESET_STRATEGIES: Array<{ name: string; description: string; strategy: DiscoveryStrategy }> = [
  {
    name: 'Smart Gap Fill',
    description: 'Finds coverage gaps in your question bank and generates questions to fill them',
    strategy: { type: 'gap_fill', questionCount: 10, autoApproveThreshold: 85 },
  },
  {
    name: 'Hard Questions Blitz',
    description: 'Generates challenging questions that test deep understanding and synthesis',
    strategy: { type: 'difficulty_balance', targetDifficulty: 'hard', questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Scenario Builder',
    description: 'Creates realistic workplace scenarios matching ISACA exam patterns',
    strategy: { type: 'scenario_based', questionCount: 6, autoApproveThreshold: 75 },
  },
  {
    name: 'Cross-Domain Mixer',
    description: 'Generates questions spanning multiple domains to test integrated knowledge',
    strategy: { type: 'cross_domain', questionCount: 6, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 1 Deep Dive',
    description: 'Deep dive into AI Governance — policies, ethics, compliance',
    strategy: { type: 'topic_deep_dive', targetDomain: 1, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 2 Deep Dive',
    description: 'Deep dive into AI Risk — threats, controls, OWASP, MITRE ATLAS',
    strategy: { type: 'topic_deep_dive', targetDomain: 2, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 3 Deep Dive',
    description: 'Deep dive into AI Technologies — CRISP-DM, MLOps, deployment, testing',
    strategy: { type: 'topic_deep_dive', targetDomain: 3, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Full Sweep',
    description: 'Comprehensive sweep across all domains, topics, and difficulties',
    strategy: { type: 'full_sweep', questionCount: 15, autoApproveThreshold: 85 },
  },
  {
    name: 'Community Pattern Match',
    description: 'Generates BEST/MOST/FIRST/PRIMARY/NOT questions using community-sourced exam patterns',
    strategy: { type: 'community_pattern', questionCount: 10, autoApproveThreshold: 80 },
  },
  {
    name: 'Trap Buster',
    description: 'Questions targeting known exam traps — practice the pitfalls before the real exam',
    strategy: { type: 'trap_buster', questionCount: 8, autoApproveThreshold: 75 },
  },
  {
    name: 'Forum Hot Topics',
    description: 'Questions on the most frequently reported exam topics from Reddit, LinkedIn, and YouTube',
    strategy: { type: 'forum_hot_topics', questionCount: 10, autoApproveThreshold: 80 },
  },
];

// ============ PIPELINE STATS ============

export function getPipelineStats() {
  const state = loadPipelineState();
  const coverage = analyzeCoverage();

  const pendingCount = state.leads.filter(l => l.status === 'pending_review' || l.status === 'discovered').length;
  const approvedCount = state.leads.filter(l => l.status === 'approved' || l.status === 'auto_approved').length;
  const rejectedCount = state.leads.filter(l => l.status === 'rejected').length;

  const avgConfidence = state.leads.length > 0
    ? Math.round(state.leads.reduce((sum, l) => sum + l.confidence, 0) / state.leads.length)
    : 0;

  const domainDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  state.leads.forEach(l => {
    domainDistribution[l.question.domain] = (domainDistribution[l.question.domain] || 0) + 1;
  });

  return {
    totalLeads: state.leads.length,
    pendingCount,
    approvedCount,
    rejectedCount,
    avgConfidence,
    totalRuns: state.runs.length,
    lastRunAt: state.lastRunAt,
    domainDistribution,
    coverageGaps: coverage.gaps.filter(g => g.priority === 'high').length,
    totalQuestions: coverage.totalQuestions,
    approvedQuestions: state.approvedQuestions.length,
  };
}
