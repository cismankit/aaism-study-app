/** Confidence & provenance types — foundation for platform-wide audit trails. */

export type SourceType =
  | 'user_pasted'
  | 'rss'
  | 'registry'
  | 'llm_inferred'
  | 'official_doc'
  | 'community'
  | 'computed';

export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'low' | 'unverified';

export interface SourceRef {
  id: string;
  label: string;
  url?: string;
  type: SourceType;
}

export interface ConfidenceScore {
  score: number; // 0–100
  level: ConfidenceLevel;
  method: string;
  sources: SourceRef[];
}

export interface ProvenanceMeta {
  confidence: ConfidenceScore;
  generatedAt?: string;
  label?: string;
}

export interface ProvenancedResult {
  provenance: {
    overall: ProvenanceMeta;
    sections: Record<string, ProvenanceMeta>;
  };
}
