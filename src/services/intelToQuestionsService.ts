/**
 * RSS intel → AAISM exam question generation.
 * Uses configured LLM via aiService; stores leads in agent pipeline.
 */

import {
  chatJson,
  loadAIConfig,
  resolveAgentConfig,
  AAISM_CONTEXT,
  type AIConfig,
} from './aiService';
import { addLeads, type QuestionLead } from './agentStore';
import type { IntelFeedItem } from './rssFeedService';
import type { ExamQuestion } from '../data/examContent';

export interface IntelQuestionResult {
  success: boolean;
  leads: QuestionLead[];
  error?: string;
  rawCount?: number;
}

function sanitizeJsonString(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const firstBracket = Math.min(
    s.indexOf('[') === -1 ? Infinity : s.indexOf('['),
    s.indexOf('{') === -1 ? Infinity : s.indexOf('{'),
  );
  if (firstBracket !== Infinity && firstBracket > 0) s = s.slice(firstBracket);
  const lastClose = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (lastClose !== -1) s = s.slice(0, lastClose + 1);
  s = s.replace(/,\s*([}\]])/g, '$1');
  return s;
}

function tryParseQuestions(raw: string, fallbackCategory: string): ExamQuestion[] {
  const cleaned = sanitizeJsonString(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const results: ExamQuestion[] = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const q = row as Record<string, unknown>;
    const question = String(q.question || q.Question || '').trim();
    if (question.length < 15) continue;

    let options: string[] = [];
    if (Array.isArray(q.options)) options = q.options.map(String);
    else if (Array.isArray(q.Options)) options = (q.Options as unknown[]).map(String);
    if (options.length < 4) continue;
    options = options.slice(0, 4);

    let correctAnswer = 0;
    const ca = q.correctAnswer ?? q.correct_answer ?? q.answer;
    if (typeof ca === 'number') correctAnswer = ca;
    else if (typeof ca === 'string') {
      const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      correctAnswer = letterMap[ca.trim().toUpperCase().charAt(0)] ?? 0;
    }

    const rawDiff = String(q.difficulty || 'medium').toLowerCase();
    const difficulty = (['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium') as ExamQuestion['difficulty'];

    results.push({
      id: `rss_q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      domain: Math.min(4, Math.max(1, Number(q.domain) || inferDomainFromItem(fallbackCategory))),
      question,
      options,
      correctAnswer: Math.min(3, Math.max(0, correctAnswer)),
      explanation: String(q.explanation || 'Generated from live RSS intel.'),
      difficulty,
      topic: String(q.topic || 'RSS Intel'),
    });
  }

  return results;
}

function inferDomainFromItem(category: string): number {
  const map: Record<string, number> = {
    threat: 2,
    governance: 1,
    exam: 1,
    community: 4,
    framework: 3,
  };
  return map[category] ?? 2;
}

function buildIntelPrompt(item: IntelFeedItem): string {
  return `Based on this live security/AI governance news item, generate exactly 3 ISACA AAISM exam-style multiple-choice questions.

Headline: ${item.title}
Source: ${item.source}
Summary: ${item.summary}
Category: ${item.category}

Each question must test conceptual understanding tied to this news (governance, risk, development, or operations).
Return a JSON array of 3 objects with: domain (1-4), question, options (4 strings labeled A-D), correctAnswer (0-3), explanation, difficulty (easy/medium/hard), topic.

JSON array only — no markdown.`;
}

function questionsToLeads(questions: ExamQuestion[], item: IntelFeedItem): QuestionLead[] {
  const now = new Date().toISOString();
  const runId = `rss-intel-${item.id}`;

  return questions.map((q, i) => ({
    id: `lead_rss_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
    question: q,
    status: 'pending_review' as const,
    confidence: 72,
    similarityScore: 0,
    source: runId,
    discoveredAt: now,
    tags: ['rss-intel', item.category, item.source.toLowerCase().replace(/\s+/g, '-')],
    reasoning: `Generated from RSS: "${item.title}" (${item.source}). Review for exam alignment before approving.`,
  }));
}

export async function generateQuestionsFromIntel(
  item: IntelFeedItem,
  config?: AIConfig,
): Promise<IntelQuestionResult> {
  const aiConfig = config ?? await resolveAgentConfig(loadAIConfig());

  const messages = [
    { role: 'system' as const, content: `${AAISM_CONTEXT}\n\nReturn ONLY a valid JSON array of exam questions.` },
    { role: 'user' as const, content: buildIntelPrompt(item) },
  ];

  const response = await chatJson(aiConfig, messages);
  if (response.error) {
    return { success: false, leads: [], error: response.error };
  }

  const questions = tryParseQuestions(response.content, item.category).slice(0, 3);
  if (questions.length === 0) {
    return {
      success: false,
      leads: [],
      error: 'Could not parse valid questions from LLM response. Try a larger model or Groq.',
      rawCount: 0,
    };
  }

  const leads = questionsToLeads(questions, item);
  addLeads(leads);

  return { success: true, leads, rawCount: questions.length };
}
