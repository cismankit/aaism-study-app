import { chat, loadAIConfig, AAISM_CONTEXT, type AIConfig, type Message } from './aiService';
import { getAllQuestions, type ExamQuestion } from '../data/examContent';
import {
  QUESTION_PATTERNS,
  COMMUNITY_INSIGHTS,
  TRAP_PATTERNS,
  TOPIC_HEAT_MAP,
  SCENARIO_TEMPLATES,
  type ScenarioTemplate,
  type QuestionPattern,
} from '../data/communityIntelligence';

// ============ TYPES ============

export interface IntelligenceInsight {
  id: string;
  type: 'pattern_research' | 'trap_discovery' | 'scenario' | 'pattern_analysis' | 'hot_topic';
  title: string;
  content: string;
  domain?: number;
  createdAt: string;
  source: 'llm' | 'curated';
  confidence: number;
}

export interface PatternAnalysis {
  totalQuestions: number;
  patternDistribution: Record<string, number>;
  domainCoverage: Record<number, { count: number; percentage: number }>;
  difficultyDistribution: Record<string, number>;
  topicFrequency: Array<{ topic: string; count: number }>;
  recommendations: string[];
}

export interface ResearchCallbacks {
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'thinking') => void;
  onProgress: (phase: string, message: string) => void;
}

// ============ STORAGE ============

const INTEL_STORE_KEY = 'aaism_intelligence_insights';

export function loadInsights(): IntelligenceInsight[] {
  try {
    const saved = localStorage.getItem(INTEL_STORE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

export function saveInsight(insight: IntelligenceInsight): void {
  const insights = loadInsights();
  insights.unshift(insight);
  if (insights.length > 100) insights.length = 100;
  try {
    localStorage.setItem(INTEL_STORE_KEY, JSON.stringify(insights));
  } catch { /* ignore */ }
}

export function clearInsights(): void {
  localStorage.removeItem(INTEL_STORE_KEY);
}

// ============ PATTERN ANALYSIS (local, no AI) ============

export function analyzeQuestionPatterns(): PatternAnalysis {
  const questions = getAllQuestions();

  const patternKeywords = ['BEST', 'MOST', 'FIRST', 'PRIMARY', 'NOT'];
  const patternDistribution: Record<string, number> = {};
  for (const kw of patternKeywords) {
    patternDistribution[kw] = 0;
  }
  patternDistribution['OTHER'] = 0;

  const domainCoverage: Record<number, { count: number; percentage: number }> = {};
  const difficultyDistribution: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const topicCounts: Record<string, number> = {};

  for (const q of questions) {
    const upper = q.question.toUpperCase();
    let matched = false;
    for (const kw of patternKeywords) {
      if (upper.includes(kw)) {
        patternDistribution[kw]++;
        matched = true;
        break;
      }
    }
    if (!matched) patternDistribution['OTHER']++;

    domainCoverage[q.domain] = domainCoverage[q.domain] || { count: 0, percentage: 0 };
    domainCoverage[q.domain].count++;

    difficultyDistribution[q.difficulty]++;

    const topic = q.topic || 'General';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  const total = questions.length;
  for (const d of [1, 2, 3, 4]) {
    if (domainCoverage[d]) {
      domainCoverage[d].percentage = Math.round((domainCoverage[d].count / total) * 100);
    } else {
      domainCoverage[d] = { count: 0, percentage: 0 };
    }
  }

  const topicFrequency = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  const recommendations = generateRecommendations(patternDistribution, domainCoverage, difficultyDistribution, total);

  return {
    totalQuestions: total,
    patternDistribution,
    domainCoverage,
    difficultyDistribution,
    topicFrequency,
    recommendations,
  };
}

function generateRecommendations(
  patterns: Record<string, number>,
  domains: Record<number, { count: number; percentage: number }>,
  difficulty: Record<string, number>,
  total: number,
): string[] {
  const recs: string[] = [];

  const bestMostRatio = ((patterns['BEST'] + patterns['MOST']) / total) * 100;
  if (bestMostRatio < 30) {
    recs.push(`Only ${bestMostRatio.toFixed(0)}% of questions use BEST/MOST patterns. Community reports suggest 40-50% of exam questions use these. Generate more BEST/MOST questions.`);
  }

  const examWeights: Record<number, number> = { 1: 25, 2: 25, 3: 25, 4: 25 };
  for (const [d, weight] of Object.entries(examWeights)) {
    const domain = Number(d);
    const actual = domains[domain]?.percentage || 0;
    if (Math.abs(actual - weight) > 10) {
      recs.push(`Domain ${domain} has ${actual}% of questions but should be ~${weight}%. ${actual < weight ? 'Add more' : 'Consider reducing'} Domain ${domain} questions.`);
    }
  }

  const hardPct = (difficulty['hard'] / total) * 100;
  if (hardPct < 20) {
    recs.push(`Only ${hardPct.toFixed(0)}% hard questions. Community reports suggest the exam has 30-40% hard questions. Generate more hard questions.`);
  }

  const hotTopics = TOPIC_HEAT_MAP.filter(t => t.heat >= 85);
  for (const ht of hotTopics) {
    recs.push(`"${ht.topic}" is a high-heat topic (${ht.heat}/100, ${ht.trend}). Ensure sufficient coverage.`);
  }

  if (recs.length === 0) {
    recs.push('Your question bank looks well-balanced! Keep adding scenario-based and cross-domain questions for variety.');
  }

  return recs;
}

// ============ LLM RESEARCH FUNCTIONS ============

export async function researchExamPatterns(
  callbacks: ResearchCallbacks,
  focus?: string,
  config?: AIConfig,
): Promise<IntelligenceInsight> {
  const aiConfig = config || loadAIConfig();
  callbacks.onProgress('research', 'Synthesizing community exam pattern knowledge...');
  callbacks.onLog('Starting exam pattern research via LLM', 'info');

  const focusInstruction = focus
    ? `Focus specifically on: ${focus}`
    : 'Cover all major question patterns and exam preparation strategies.';

  const knownPatterns = QUESTION_PATTERNS.map(p => `- ${p.name}: ${p.description}`).join('\n');
  const knownInsights = COMMUNITY_INSIGHTS.slice(0, 5).map(i => `- ${i.title}: ${i.content.slice(0, 100)}...`).join('\n');

  const prompt = `You are an expert ISACA AAISM exam preparation researcher. Based on your knowledge of what communities on Reddit (r/ISACA), LinkedIn, YouTube, and Quora discuss about the AAISM certification exam, provide a detailed research report.

${focusInstruction}

Known patterns we've already documented:
${knownPatterns}

Known insights:
${knownInsights}

Provide NEW insights beyond what's listed above. Structure your response as:

1. **Emerging Exam Patterns**: Any new question patterns or styles being reported
2. **Under-studied Topics**: Topics that communities say are tested more than expected
3. **Study Strategy Insights**: What successful candidates recommend
4. **Common Mistakes**: What communities report as the most frequent errors
5. **Prediction for Future Exams**: Topics likely to gain more prominence

Be specific, actionable, and cite the type of community source (Reddit, LinkedIn, etc.) for credibility.`;

  callbacks.onLog(`Sending research request to ${aiConfig.provider}...`, 'thinking');

  const messages: Message[] = [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ];

  const response = await chat(aiConfig, messages);

  if (response.error) {
    callbacks.onLog(`Research failed: ${response.error}`, 'warning');
    throw new Error(response.error);
  }

  callbacks.onLog('Research complete — processing results', 'success');

  const insight: IntelligenceInsight = {
    id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'pattern_research',
    title: focus ? `Pattern Research: ${focus}` : 'Comprehensive Exam Pattern Research',
    content: response.content,
    createdAt: new Date().toISOString(),
    source: 'llm',
    confidence: 75,
  };

  saveInsight(insight);
  callbacks.onLog('Insight saved to intelligence store', 'success');

  return insight;
}

export async function discoverTrapPatterns(
  callbacks: ResearchCallbacks,
  domain?: number,
  config?: AIConfig,
): Promise<IntelligenceInsight> {
  const aiConfig = config || loadAIConfig();
  const domainLabel = domain ? `Domain ${domain}` : 'all domains';
  callbacks.onProgress('traps', `Discovering exam traps for ${domainLabel}...`);
  callbacks.onLog(`Starting trap discovery for ${domainLabel}`, 'info');

  const existingTraps = TRAP_PATTERNS
    .filter(t => !domain || t.domains.includes(domain))
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const prompt = `You are an ISACA AAISM exam trap analyst. Based on community reports from Reddit, LinkedIn, YouTube, and Quora, identify common exam traps and pitfalls${domain ? ` specifically for Domain ${domain}` : ''}.

Already documented traps:
${existingTraps}

Provide 5-8 NEW trap patterns not listed above. For each:

1. **Trap Name**: Short descriptive name
2. **What Happens**: How the trap works in the question
3. **Why Students Fall For It**: The psychological or knowledge gap
4. **Example**: A simplified example question showing the trap
5. **How to Beat It**: Specific strategy to avoid this trap
6. **Frequency**: How often this appears (Very Common / Common / Occasional)

Focus on traps specific to AI security management, not generic exam-taking traps.`;

  callbacks.onLog(`Sending trap discovery request to ${aiConfig.provider}...`, 'thinking');

  const messages: Message[] = [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ];

  const response = await chat(aiConfig, messages);

  if (response.error) {
    callbacks.onLog(`Trap discovery failed: ${response.error}`, 'warning');
    throw new Error(response.error);
  }

  callbacks.onLog('Trap discovery complete', 'success');

  const insight: IntelligenceInsight = {
    id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'trap_discovery',
    title: `Trap Patterns: ${domainLabel}`,
    content: response.content,
    domain,
    createdAt: new Date().toISOString(),
    source: 'llm',
    confidence: 70,
  };

  saveInsight(insight);
  return insight;
}

export async function buildScenarioContext(
  callbacks: ResearchCallbacks,
  topic: string,
  domain: number,
  config?: AIConfig,
): Promise<ScenarioTemplate> {
  const aiConfig = config || loadAIConfig();
  callbacks.onProgress('scenario', `Building scenario for "${topic}"...`);
  callbacks.onLog(`Generating interactive scenario for "${topic}" (Domain ${domain})`, 'info');

  const exampleScenario = SCENARIO_TEMPLATES[0];
  const exampleAct = exampleScenario.acts[0];

  const prompt = `You are an expert ISACA AAISM exam scenario designer. Create an interactive case study scenario for the topic "${topic}" in Domain ${domain}.

The scenario should teach concepts through a realistic workplace narrative with 3 acts.

Example format for one act:
{
  "situation": "${exampleAct.situation.slice(0, 100)}...",
  "question": "${exampleAct.question}",
  "options": ${JSON.stringify(exampleAct.options)},
  "correctAnswer": ${exampleAct.correctAnswer},
  "conceptExplanation": "Explains the concept...",
  "examConnection": "How this appears on the real exam..."
}

Return a JSON object with this exact structure:
{
  "title": "Scenario title",
  "context": "2-3 sentences setting up the scenario and the user's role",
  "topics": ["topic1", "topic2"],
  "difficulty": "medium",
  "acts": [
    {
      "situation": "What is happening in this act",
      "question": "The decision question (use BEST/MOST/FIRST/PRIMARY patterns)",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "conceptExplanation": "Detailed explanation of the concept being taught",
      "examConnection": "How ISACA tests this on the real exam"
    }
  ]
}

Requirements:
- Make it realistic and engaging — the user should feel like they're making real decisions
- Each act should teach a different concept related to the topic
- Use ISACA question patterns (BEST, MOST, FIRST, PRIMARY)
- Explanations should teach the concept AND connect it to exam questions
- Return ONLY valid JSON, no markdown fences or extra text`;

  callbacks.onLog(`Sending scenario request to ${aiConfig.provider}...`, 'thinking');

  const messages: Message[] = [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ];

  const response = await chat(aiConfig, messages);

  if (response.error) {
    callbacks.onLog(`Scenario generation failed: ${response.error}`, 'warning');
    throw new Error(response.error);
  }

  callbacks.onLog('Scenario generated — parsing response', 'info');

  try {
    let cleaned = response.content.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);

    const parsed = JSON.parse(cleaned);

    const scenario: ScenarioTemplate = {
      id: `scenario_gen_${Date.now()}`,
      title: parsed.title || `${topic} Scenario`,
      domain,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [topic],
      difficulty: parsed.difficulty || 'medium',
      context: parsed.context || `You are facing a challenge related to ${topic}.`,
      acts: (parsed.acts || []).map((act: Record<string, unknown>) => ({
        situation: String(act.situation || ''),
        question: String(act.question || ''),
        options: Array.isArray(act.options) ? act.options.map(String) : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correctAnswer: typeof act.correctAnswer === 'number' ? act.correctAnswer : 0,
        conceptExplanation: String(act.conceptExplanation || ''),
        examConnection: String(act.examConnection || ''),
      })),
    };

    if (scenario.acts.length === 0) throw new Error('No acts parsed');

    callbacks.onLog(`Scenario "${scenario.title}" created with ${scenario.acts.length} acts`, 'success');

    const insight: IntelligenceInsight = {
      id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'scenario',
      title: `Scenario: ${scenario.title}`,
      content: JSON.stringify(scenario),
      domain,
      createdAt: new Date().toISOString(),
      source: 'llm',
      confidence: 72,
    };
    saveInsight(insight);

    return scenario;
  } catch (e) {
    callbacks.onLog(`Failed to parse scenario: ${e}`, 'warning');
    throw new Error(`Could not parse scenario from AI response. Try again or use a more capable model.`);
  }
}

export async function generatePatternDrillQuestions(
  callbacks: ResearchCallbacks,
  pattern: QuestionPattern,
  count: number = 5,
  domain?: number,
  config?: AIConfig,
): Promise<ExamQuestion[]> {
  const aiConfig = config || loadAIConfig();
  callbacks.onProgress('drill', `Generating ${pattern.name} drill questions...`);
  callbacks.onLog(`Creating ${count} "${pattern.keyword}" pattern questions`, 'info');

  const domainFocus = domain
    ? `Focus on Domain ${domain}.`
    : 'Cover domains 1-4 evenly.';

  const prompt = `Generate ${count} ISACA AAISM exam practice questions that use the "${pattern.keyword}" question pattern.

Pattern description: ${pattern.description}
Strategy tip: ${pattern.strategy}

${domainFocus}

Each question MUST contain the word "${pattern.keyword}" in the question stem.

Return a JSON array. Each object needs:
- "domain": number (1-4)
- "question": string (MUST contain "${pattern.keyword}")
- "options": ["A) ...", "B) ...", "C) ...", "D) ..."] (4 options)
- "correctAnswer": number (0-3)
- "explanation": string (explain WHY this is the correct answer using the ${pattern.keyword} pattern logic, and why each wrong answer is wrong)
- "difficulty": "easy" | "medium" | "hard"
- "topic": string

Return ONLY a valid JSON array. No markdown, no extra text.`;

  callbacks.onLog(`Requesting from ${aiConfig.provider}...`, 'thinking');

  const messages: Message[] = [
    { role: 'system', content: 'You are an ISACA AAISM exam question writer. Return only valid JSON arrays.' },
    { role: 'user', content: prompt },
  ];

  const response = await chat(aiConfig, messages);

  if (response.error) {
    callbacks.onLog(`Generation failed: ${response.error}`, 'warning');
    throw new Error(response.error);
  }

  try {
    let cleaned = response.content.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const firstBracket = cleaned.indexOf('[');
    if (firstBracket > 0) cleaned = cleaned.slice(firstBracket);
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) cleaned = cleaned.slice(0, lastBracket + 1);

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Not an array');

    const questions: ExamQuestion[] = parsed
      .filter((q: Record<string, unknown>) => q.question && Array.isArray(q.options))
      .map((q: Record<string, unknown>) => ({
        id: `drill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        domain: Math.min(4, Math.max(1, Number(q.domain) || 1)),
        question: String(q.question),
        options: (q.options as unknown[]).map(String).slice(0, 4),
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: String(q.explanation || 'See correct answer.'),
        difficulty: (['easy', 'medium', 'hard'].includes(String(q.difficulty)) ? String(q.difficulty) : 'medium') as 'easy' | 'medium' | 'hard',
        topic: String(q.topic || 'General'),
      }));

    callbacks.onLog(`Generated ${questions.length} ${pattern.keyword} pattern questions`, 'success');
    return questions;
  } catch (e) {
    callbacks.onLog(`Parse failed: ${e}. Trying simplified approach...`, 'warning');

    const simplePrompt = `Write ${Math.min(count, 3)} AAISM exam questions with "${pattern.keyword}" in the question. JSON array: [{"domain":1,"question":"What is the ${pattern.keyword}...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":0,"explanation":"...","difficulty":"medium","topic":"..."}]`;

    const retry = await chat(aiConfig, [
      { role: 'system', content: 'Return only JSON.' },
      { role: 'user', content: simplePrompt },
    ]);

    if (retry.error) throw new Error(retry.error);

    let cleaned = retry.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const fb = cleaned.indexOf('[');
    if (fb > 0) cleaned = cleaned.slice(fb);
    const lb = cleaned.lastIndexOf(']');
    if (lb !== -1) cleaned = cleaned.slice(0, lb + 1);

    const parsed = JSON.parse(cleaned);
    return (Array.isArray(parsed) ? parsed : []).map((q: Record<string, unknown>) => ({
      id: `drill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      domain: Math.min(4, Math.max(1, Number(q.domain) || 1)),
      question: String(q.question || ''),
      options: (Array.isArray(q.options) ? q.options : []).map(String).slice(0, 4),
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: String(q.explanation || ''),
      difficulty: 'medium' as const,
      topic: String(q.topic || 'General'),
    }));
  }
}

export async function generatePatternInsights(
  callbacks: ResearchCallbacks,
  quizHistory: Array<{ domain: number; score: number; pattern?: string }>,
  config?: AIConfig,
): Promise<IntelligenceInsight> {
  const aiConfig = config || loadAIConfig();
  callbacks.onProgress('insights', 'Cross-referencing performance with community data...');
  callbacks.onLog('Analyzing quiz performance against community intelligence', 'info');

  const analysis = analyzeQuestionPatterns();
  const hotTopics = TOPIC_HEAT_MAP.filter(t => t.heat >= 80).map(t => t.topic);

  const prompt = `Analyze this student's quiz performance and cross-reference with known ISACA AAISM exam patterns.

Student Performance:
${JSON.stringify(quizHistory.slice(0, 20), null, 2)}

Question Bank Analysis:
- Total questions: ${analysis.totalQuestions}
- Pattern distribution: ${JSON.stringify(analysis.patternDistribution)}
- Domain coverage: ${JSON.stringify(analysis.domainCoverage)}
- Difficulty: ${JSON.stringify(analysis.difficultyDistribution)}

Community Hot Topics (highest exam frequency):
${hotTopics.join(', ')}

Known common traps:
${TRAP_PATTERNS.slice(0, 5).map(t => `- ${t.name}`).join('\n')}

Provide:
1. **Weak Areas**: Where the student struggles most (be specific — which patterns, domains, topics)
2. **Community-Informed Recommendations**: What communities say about these weak areas
3. **Targeted Study Plan**: Specific actions mapped to community insights
4. **Pattern-Specific Advice**: Which question patterns to practice and why
5. **Trap Alerts**: Which traps this student is most likely to fall for based on their performance

Be specific and actionable. Reference community data where relevant.`;

  callbacks.onLog(`Generating personalized insights via ${aiConfig.provider}...`, 'thinking');

  const messages: Message[] = [
    { role: 'system', content: AAISM_CONTEXT },
    { role: 'user', content: prompt },
  ];

  const response = await chat(aiConfig, messages);

  if (response.error) {
    callbacks.onLog(`Insight generation failed: ${response.error}`, 'warning');
    throw new Error(response.error);
  }

  callbacks.onLog('Personalized insights generated', 'success');

  const insight: IntelligenceInsight = {
    id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'pattern_analysis',
    title: 'Personalized Performance Analysis',
    content: response.content,
    createdAt: new Date().toISOString(),
    source: 'llm',
    confidence: 70,
  };

  saveInsight(insight);
  return insight;
}
