export type LabType = 'command' | 'analysis' | 'decision';

export interface LabStep {
  id: string;
  title: string;
  instruction: string;
  command?: string;
  expectedOutcome?: string;
  validationHint?: string;
}

export interface AnalysisQuestion {
  id: string;
  question: string;
  expectedKeywords?: string[];
  sampleAnswer?: string;
}

export interface DecisionNode {
  id: string;
  situation: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LabDefinition {
  id: string;
  certId: string;
  domainId: number;
  title: string;
  description: string;
  type: LabType;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  steps?: LabStep[];
  sampleData?: string;
  analysisQuestions?: AnalysisQuestion[];
  decisions?: DecisionNode[];
  mitreTechniques?: string[];
  tags?: string[];
}

export interface LabProgressRecord {
  labId: string;
  completedAt: string;
  stepsCompleted: string[];
  score: number;
}
