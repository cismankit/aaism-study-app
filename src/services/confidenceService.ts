/**
 * Confidence scoring & provenance helpers — scores LLM output and source-backed claims.
 */

import type {
  ConfidenceLevel,
  ConfidenceScore,
  ProvenanceMeta,
  SourceRef,
  SourceType,
} from '../types/provenance';

const SOURCE_BASE_SCORE: Record<SourceType, number> = {
  official_doc: 95,
  registry: 90,
  user_pasted: 85,
  rss: 75,
  computed: 70,
  community: 55,
  llm_inferred: 45,
};

const LEVEL_THRESHOLDS: { min: number; level: ConfidenceLevel }[] = [
  { min: 90, level: 'verified' },
  { min: 75, level: 'high' },
  { min: 55, level: 'medium' },
  { min: 35, level: 'low' },
  { min: 0, level: 'unverified' },
];

export function scoreToLevel(score: number): ConfidenceLevel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return LEVEL_THRESHOLDS.find(t => clamped >= t.min)?.level ?? 'unverified';
}

export function createSourceRef(
  label: string,
  type: SourceType,
  url?: string,
): SourceRef {
  return { id: crypto.randomUUID(), label, type, url };
}

export function scoreFromSource(source: SourceRef): number {
  return SOURCE_BASE_SCORE[source.type] ?? 40;
}

export function aggregateConfidence(scores: ConfidenceScore[]): ConfidenceScore {
  if (scores.length === 0) {
    return {
      score: 0,
      level: 'unverified',
      method: 'No sources',
      sources: [],
    };
  }

  const totalWeight = scores.reduce((sum, s) => sum + s.score, 0);
  const avg = Math.round(totalWeight / scores.length);
  const sources = dedupeSources(scores.flatMap(s => s.sources));

  return {
    score: avg,
    level: scoreToLevel(avg),
    method: scores.length === 1 ? scores[0].method : `Aggregated (${scores.length} signals)`,
    sources,
  };
}

export function scoreLLMOutput(options: {
  sources: SourceRef[];
  fallbackUsed?: boolean;
  hasStructuredParse?: boolean;
}): ConfidenceScore {
  const { sources, fallbackUsed = false, hasStructuredParse = true } = options;

  if (sources.length === 0) {
    const base = fallbackUsed ? 25 : 35;
    return {
      score: base,
      level: scoreToLevel(base),
      method: fallbackUsed ? 'LLM fallback (no input)' : 'LLM inference only',
      sources: [createSourceRef('AI model output', 'llm_inferred')],
    };
  }

  const sourceScores = sources.map(s => scoreFromSource(s));
  const bestSource = Math.max(...sourceScores);
  const avgSource = sourceScores.reduce((a, b) => a + b, 0) / sourceScores.length;

  let score = avgSource * 0.6 + bestSource * 0.25;
  if (hasStructuredParse) score += 8;
  else score -= 10;
  if (fallbackUsed) score -= 20;

  score = Math.max(15, Math.min(92, Math.round(score)));

  const llmSource = createSourceRef('AI analysis', 'llm_inferred');
  const allSources = dedupeSources([...sources, llmSource]);

  return {
    score,
    level: scoreToLevel(score),
    method: fallbackUsed ? 'LLM with partial/fallback data' : 'LLM + source blend',
    sources: allSources,
  };
}

export function formatConfidenceLabel(score: ConfidenceScore): string {
  const labels: Record<ConfidenceLevel, string> = {
    verified: 'Verified',
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
    unverified: 'Unverified',
  };
  return `${labels[score.level]} · ${score.score}%`;
}

export function toProvenanceMeta(
  confidence: ConfidenceScore,
  label?: string,
): ProvenanceMeta {
  return {
    confidence,
    generatedAt: new Date().toISOString(),
    label,
  };
}

/** Build provenance bundle for company profile LLM output. */
export function buildCompanyProfileProvenance(input: {
  companyName: string;
  careersUrl?: string;
  jobText?: string;
  jobUrl?: string;
  fetchedFromUrl: boolean;
  llmParsed: boolean;
}): { overall: ProvenanceMeta; sections: Record<string, ProvenanceMeta> } {
  const sources: SourceRef[] = [
    createSourceRef(`Company: ${input.companyName}`, 'user_pasted'),
  ];
  if (input.careersUrl) {
    sources.push(createSourceRef('Careers page URL', 'user_pasted', input.careersUrl));
  }
  if (input.jobText?.trim()) {
    sources.push(createSourceRef('Pasted job posting', 'user_pasted'));
  }
  if (input.jobUrl && input.fetchedFromUrl) {
    sources.push(createSourceRef('Fetched job URL', 'rss', input.jobUrl));
  } else if (input.jobUrl) {
    sources.push(createSourceRef('Job URL (not fetched)', 'user_pasted', input.jobUrl));
  }

  const computedSource = createSourceRef('Tech stack keyword match', 'computed');
  const base = scoreLLMOutput({
    sources,
    fallbackUsed: !input.llmParsed || (!input.jobText?.trim() && !input.fetchedFromUrl),
    hasStructuredParse: input.llmParsed,
  });

  const techStack = aggregateConfidence([
    base,
    {
      score: 72,
      level: scoreToLevel(72),
      method: 'Taxonomy keyword extraction',
      sources: [...sources.filter(s => s.type === 'user_pasted'), computedSource],
    },
  ]);

  const certAlign = { ...base, score: Math.min(base.score, 68), level: scoreToLevel(Math.min(base.score, 68)) };

  return {
    overall: toProvenanceMeta(base, 'Company profile'),
    sections: {
      openRolesSummary: toProvenanceMeta(base, 'Open roles summary'),
      techStack: toProvenanceMeta({ ...techStack, level: scoreToLevel(techStack.score) }, 'Tech stack'),
      hiringThemes: toProvenanceMeta(base, 'Hiring themes'),
      certAlignment: toProvenanceMeta({ ...certAlign, method: 'Cert mapping (heuristic)' }, 'Cert alignment'),
      cultureSignals: toProvenanceMeta(
        scoreLLMOutput({ sources, fallbackUsed: true, hasStructuredParse: input.llmParsed }),
        'Culture signals',
      ),
    },
  };
}

/** Build provenance bundle for job posting analysis. */
export function buildJobAnalysisProvenance(input: {
  jobText: string;
  jobUrl?: string;
  fetchedFromUrl: boolean;
  llmParsed: boolean;
}): { overall: ProvenanceMeta; sections: Record<string, ProvenanceMeta> } {
  const sources: SourceRef[] = [];
  if (input.jobText.trim()) {
    sources.push(createSourceRef('Pasted job description', 'user_pasted'));
  }
  if (input.jobUrl && input.fetchedFromUrl) {
    sources.push(createSourceRef('Fetched job URL', 'rss', input.jobUrl));
  } else if (input.jobUrl) {
    sources.push(createSourceRef('Job URL (not fetched)', 'user_pasted', input.jobUrl));
  }

  const base = scoreLLMOutput({
    sources,
    fallbackUsed: !input.llmParsed,
    hasStructuredParse: input.llmParsed,
  });

  const skills = toProvenanceMeta(
    scoreLLMOutput({ sources, fallbackUsed: !input.llmParsed, hasStructuredParse: input.llmParsed }),
    'Skills extraction',
  );

  const computedTech = toProvenanceMeta(
    {
      score: 74,
      level: scoreToLevel(74),
      method: 'Keyword taxonomy match',
      sources: [...sources, createSourceRef('Tech stack taxonomy', 'computed')],
    },
    'Tech stack tags',
  );

  const interviewPrep = toProvenanceMeta(
    scoreLLMOutput({
      sources: [...sources, createSourceRef('Active cert curriculum', 'official_doc')],
      hasStructuredParse: input.llmParsed,
    }),
    'Interview prep',
  );

  return {
    overall: toProvenanceMeta(base, 'Job analysis'),
    sections: {
      requiredSkills: skills,
      niceToHaveSkills: skills,
      techStack: computedTech,
      teamHints: toProvenanceMeta(base, 'Team hints'),
      interviewPrep,
      certTieIns: interviewPrep,
      questionsForHumans: toProvenanceMeta(
        { ...base, score: Math.max(base.score - 5, 40), level: scoreToLevel(Math.max(base.score - 5, 40)), method: 'LLM suggestions' },
        'Questions for humans',
      ),
      seniorityLevel: toProvenanceMeta(base, 'Seniority level'),
    },
  };
}

/** Build provenance bundle for people map LLM output. */
export function buildPeopleMapProvenance(input: {
  companyName: string;
  roleTitle: string;
  profileUrls?: string;
  llmParsed: boolean;
}): { overall: ProvenanceMeta; sections: Record<string, ProvenanceMeta> } {
  const sources: SourceRef[] = [
    createSourceRef(`Target: ${input.roleTitle} @ ${input.companyName}`, 'user_pasted'),
  ];
  if (input.profileUrls?.trim()) {
    sources.push(createSourceRef('User-provided public profile URLs', 'user_pasted'));
  }

  const base = scoreLLMOutput({
    sources,
    fallbackUsed: !input.llmParsed,
    hasStructuredParse: input.llmParsed,
  });

  const hypothesis = toProvenanceMeta(
    { ...base, score: Math.min(base.score, 55), level: scoreToLevel(Math.min(base.score, 55)), method: 'Org archetype inference' },
    'Org hypothesis',
  );

  return {
    overall: toProvenanceMeta(base, 'People map'),
    sections: {
      orgHypothesis: hypothesis,
      contactsToReach: hypothesis,
      outreachDraft: toProvenanceMeta(base, 'Outreach draft'),
      publicFootprintTips: toProvenanceMeta(
        {
          score: 65,
          level: 'medium',
          method: 'OSINT playbook (static + LLM)',
          sources: [createSourceRef('Public OSINT guidance', 'community'), createSourceRef('AI synthesis', 'llm_inferred')],
        },
        'Public footprint tips',
      ),
    },
  };
}

function dedupeSources(sources: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  return sources.filter(s => {
    const key = `${s.type}:${s.label}:${s.url ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Verified when RSS item has a live HTTP article link. */
export function buildRssItemConfidence(input: {
  title: string;
  source: string;
  sourceUrl: string;
  link: string;
  isLive: boolean;
}): ConfidenceScore {
  const hasArticleLink = input.isLive && input.link.startsWith('http');
  const sources: SourceRef[] = [
    createSourceRef(input.source, 'rss', input.sourceUrl),
  ];
  if (hasArticleLink) {
    sources.push(createSourceRef('Article at source', 'rss', input.link));
  }

  if (hasArticleLink) {
    return {
      score: 92,
      level: 'verified',
      method: 'Live RSS with source URL',
      sources,
    };
  }

  const score = input.isLive ? 72 : 45;
  return {
    score,
    level: scoreToLevel(score),
    method: input.isLive ? 'RSS feed (no article link)' : 'Curated intel (offline)',
    sources,
  };
}

/** Readiness score derived from quiz attempt history. */
export function buildReadinessConfidence(quizAttemptCount: number): ConfidenceScore {
  const sources: SourceRef[] = [
    createSourceRef(
      quizAttemptCount > 0
        ? `${quizAttemptCount} quiz attempt${quizAttemptCount !== 1 ? 's' : ''}`
        : 'No quiz attempts yet',
      'computed',
    ),
  ];

  if (quizAttemptCount === 0) {
    return {
      score: 0,
      level: 'unverified',
      method: 'No quiz data — take a practice quiz',
      sources,
    };
  }

  const score = Math.min(88, 55 + Math.min(quizAttemptCount, 20) * 1.5);
  return {
    score: Math.round(score),
    level: scoreToLevel(score),
    method: `Computed from ${quizAttemptCount} quiz attempt${quizAttemptCount !== 1 ? 's' : ''}`,
    sources,
  };
}

/** Framework claim: verified when linked to official doc, medium for summary text only. */
export function buildFrameworkConfidence(input: {
  name: string;
  docUrl?: string;
  publisher?: string;
}): { linked: ConfidenceScore; summary: ConfidenceScore } {
  const linked = input.docUrl
    ? {
        score: 95,
        level: 'verified' as const,
        method: 'Official framework documentation',
        sources: [
          createSourceRef(
            input.name,
            'official_doc',
            input.docUrl,
          ),
        ],
      }
    : {
        score: 40,
        level: 'unverified' as const,
        method: 'No official doc link mapped',
        sources: [createSourceRef(input.name, 'community')],
      };

  const summary: ConfidenceScore = {
    score: input.docUrl ? 62 : 48,
    level: 'medium',
    method: 'Curated study summary (not verbatim from source)',
    sources: [
      ...(input.docUrl
        ? [createSourceRef(`${input.publisher ?? 'Official'} summary crosswalk`, 'official_doc', input.docUrl)]
        : []),
      createSourceRef('AAISM domain guide editorial', 'community'),
    ],
  };

  return { linked, summary };
}
