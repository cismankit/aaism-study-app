import { topics } from '../data/knowledgeBase';
import { getCertification } from '../data/certifications/registry';
import type { ExamQuestion } from '../data/examContent';

export interface QuestionProvenance {
  topic: string;
  kbTopicId?: string;
  kbTopicTitle?: string;
  guideSection?: string;
  source: 'bank' | 'llm';
}

export interface ConfidenceInfo {
  score: number;
  sourceUrl?: string;
}

export function resolveQuestionProvenance(q: ExamQuestion, certId: string): QuestionProvenance {
  const lowerTopic = q.topic.toLowerCase();
  const kbTopic = topics.find(t =>
    t.domain === q.domain && (
      t.title.toLowerCase().includes(lowerTopic) ||
      lowerTopic.includes(t.title.toLowerCase()) ||
      t.relatedTerms.some(rt => lowerTopic.includes(rt.toLowerCase()))
    ),
  );
  const cert = getCertification(certId);
  const guide = cert?.domainGuides?.find(g => g.id === q.domain);
  const concept = guide?.coreConcepts.find(c =>
    c.title.toLowerCase().includes(lowerTopic) ||
    lowerTopic.includes(c.title.toLowerCase()) ||
    c.detail.toLowerCase().includes(lowerTopic),
  );
  const extended = q as ExamQuestion & { llmGenerated?: boolean };
  const isLlm = extended.llmGenerated === true || q.id.startsWith('llm-') || q.id.startsWith('gen-');
  return {
    topic: q.topic,
    kbTopicId: kbTopic?.id,
    kbTopicTitle: kbTopic?.title,
    guideSection: concept?.title ?? guide?.shortName,
    source: isLlm ? 'llm' : 'bank',
  };
}

export function formatExplanationCitation(provenance: QuestionProvenance): string {
  const parts: string[] = [`Topic: ${provenance.topic}`];
  if (provenance.guideSection) parts.push(`Domain guide § ${provenance.guideSection}`);
  if (provenance.kbTopicTitle) parts.push(`KB: ${provenance.kbTopicTitle}`);
  return parts.join(' · ');
}

export function relevanceToConfidence(relevanceScore?: number, isLive?: boolean): number {
  const base = Math.min(100, Math.round(((relevanceScore ?? 0) / 25) * 100));
  return isLive ? Math.max(base, 40) : Math.max(base, 20);
}
