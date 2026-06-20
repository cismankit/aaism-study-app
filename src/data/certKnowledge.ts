// Derive searchable topics and glossary from cert domain guides (CISSP, Security+, etc.)

import type { DomainGuide } from './aaismDomainGuide';
import { getCertification } from './certifications/registry';
import type { Term, Topic } from './knowledgeBase';

type ExtendedGuide = DomainGuide & {
  keyTopics?: string[];
  examTraps?: Array<{ title: string; trap: string; correctApproach: string }>;
  studyPath?: string[];
};

export function getCertTopics(certId: string): Topic[] {
  const cert = getCertification(certId);
  if (!cert?.domainGuides?.length) return [];

  return cert.domainGuides.flatMap(guide =>
    guide.coreConcepts.map((concept, i) => ({
      id: `${certId}-d${guide.id}-c${i}`,
      domain: guide.id,
      title: concept.title,
      description: concept.summary,
      keyPoints: [concept.detail],
      relatedTerms: [],
      examTips: guide.trapAlerts.slice(0, 2).map(t => t.correctApproach),
    })),
  );
}

export function getCertGlossary(certId: string): Term[] {
  const cert = getCertification(certId);
  if (!cert?.domainGuides?.length) return [];

  const terms: Term[] = [];

  for (const guide of cert.domainGuides) {
    const ext = guide as ExtendedGuide;

    if (ext.keyTopics?.length) {
      for (const keyTopic of ext.keyTopics) {
        const match = guide.coreConcepts.find(
          c =>
            keyTopic.toLowerCase().includes(c.title.toLowerCase()) ||
            c.title.toLowerCase().includes(keyTopic.toLowerCase().slice(0, 12)),
        );
        terms.push({
          term: keyTopic,
          definition: match?.summary ?? `${guide.name} — see domain guide for detail.`,
          domain: guide.id,
          category: guide.shortName,
        });
      }
    } else {
      for (const concept of guide.coreConcepts) {
        terms.push({
          term: concept.title,
          definition: concept.summary,
          domain: guide.id,
          category: guide.shortName,
        });
      }
    }

    for (const trap of ext.examTraps ?? guide.trapAlerts) {
      terms.push({
        term: trap.title,
        definition: trap.correctApproach,
        domain: guide.id,
        category: `${guide.shortName} · Trap`,
      });
    }
  }

  return terms;
}

export function getKnowledgeTopicsForCert(certId: string, aaismTopics: Topic[]): Topic[] {
  return certId === 'aaism' ? aaismTopics : getCertTopics(certId);
}

export function getKnowledgeGlossaryForCert(certId: string, aaismGlossary: Term[]): Term[] {
  return certId === 'aaism' ? aaismGlossary : getCertGlossary(certId);
}
